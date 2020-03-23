const express = require('express');
const router = express.Router();
const q = require('../../models/query')
const geodist = require('geodist');
const checkAuth = require('../middleware/checkauth')

router.get('/', checkAuth,(req,res,next) => 
{
    q.query(`SELECT * FROM directedgemedia.stores`)
    .then(d=>{
        q.res(res, d, 'Fetched all stores', 200)
    })
})

router.get('/open/surrounding/:hostid', (req,res,next) => 
{
    q.query(`SELECT * FROM directedgemedia.hosts WHERE closest_host_id = ${req.params.hostid} AND store_type = 'surrounding' ORDER BY distance;`)
    .then(d=>{
        q.res(res, d, 'Fetched all stores', 200)
    })
})

router.delete('/:userid/:region', async (req,res,next) =>
{
    const {userid, region} = req.params;

    //check if host being removed belongs to someone in remainin user_store list. If so, return since hosts should no tbe changed.

    

    let hostid = await q.query(`SELECT * FROM directedgemedia.user_store WHERE user_id = ${userid}; `)
    
    if(hostid.results[0]==[])
    {
        return res.status(200).json({message:"This user doesnt have a host chosen. Nothing to remove."})
    }

    hostid = hostid.results[0].store_id

    await q.query(`DELETE FROM directedgemedia.user_store WHERE user_id = ${userid};`)

    let newUserStore = (`SELECT * FROM directedgemedia.user_store;`)



    //Check new user_store list for other users with same host as removed. If another exists, exit without chaning hosts

    let allUsersWithStoreBeingRemovedAsHost = await q.query(`SELECT * FROM directedgemedia.user_store WHERE store_id = ${hostid};`)
    if(allUsersWithStoreBeingRemovedAsHost.results.length>0)
    {
        return res.status(200).json({message:"Another user also has this store as host, and so returning without changing hosts table."})
    }

    let entriesToCheck = await q.query(`SELECT * FROM directedgemedia.hosts WHERE closest_host_id = ${hostid}`)
    entriesToCheck = entriesToCheck.results
    
    //Use list of entries to find if they should be deleted or be moved as a surrounding to a differnt host
    await findClosestHostOrDelete(entriesToCheck, region)

    await deleteAllEntriesWithoutUserHost()

    res.status(200).json({message: "Removed host with ID: "+hostid})

})

router.post('/open/surrounding/:userid/:hostid/:region', async (req,res,next) => 
{
    const {userid, hostid, region} = req.params
    let otherUsersWithSameHost = []



    let AllUserStore = await q.query(`SELECT user_id, store_id, region FROM directedgemedia.user_store INNER JOIN directedgemedia.supervisors ON user_id = id;`)

    const userStoreRegionList = AllUserStore.results.filter((e,i)=>
    {

        if (e.region == region)
        {
            return e
        }
    })





/*  
If userStoreRegionList length is 0, exit. 
If 1, add to hosts without needing to compare existing surrounding. 
If more, see if other supervisors have the same host. If they do, exit.
If other superovisor in same region has a different host, make list of overlapping "surrounding" stores and connect to closest host  */


    if(userStoreRegionList.length == 0)
    {
        //How did you even get here? There are no stores in region asked, and so nothing to add or return from hosts
        res.status(200).json({message:"Returned without adding"})
        return
    }
    else if (userStoreRegionList.length == 1)
    {
        //Add the store as a host to hosts and add surrounding

        let allStoresInRegion = await q.query(`SELECT * FROM directedgemedia.stores WHERE region = '${region}'`)

        let finalListFinal = await getWithin15Miles(hostid, allStoresInRegion.results)


        await deleteAllEntriesWithoutUserHost()

        addNearbyToHosts(finalListFinal, hostid)



        await reAddHosts(userStoreRegionList)

        

        res.status(200).json({
            message: "We updated host the easy way without comparison"
        })

    }
    else 
    {
/*         
There is more than one supervisor in "user_store" with a host in same region. See if there are any supervisors that dont have the same host.
If other supervisors with same host exist, exit since that store would already be in hosts from previous addition.
Else if only 1 supervisor with the chosen host exists, it must be the new entry, and so add to hosts
 */    
        //Make list inluding only supervisors that have the same host
        otherUsersWithSameHost = userStoreRegionList.filter((e,i)=>
        {
            if(e.store_id == hostid)
            {
                return e
            }
        })

        if(otherUsersWithSameHost.length > 1)
        {
            //Already should exist in hosts
            await getWithin15AndAddToHosts(res,hostid, region)
            await reAddHosts(userStoreRegionList)
            res.status(200).json({message:"Returned without adding"})
            return
        }
        else
        {
            //Add with compare

            await getWithin15AndAddToHosts(res,hostid, region)
            await reAddHosts(userStoreRegionList)
            res.status(200).json({message:"Successfully added with comparison"})
            return
        }
        
     }

    
})

router.get('/byregion/:region', (req,res,next) => 
{
    const region = req.params.region
    q.query(`SELECT * FROM directedgemedia.stores WHERE region = '${region}';`)
    .then(d=>{
        q.res(res, d, 'Fetched all stores in region', 200)
    })
    .catch(err=>q.catch(res, "uh oh", 409));
    
})

router.post('/', (req,res,next) => 
{
    res.status(201).json({
        message: 'Store created'
    })
})

const getWithin15Miles = (hostid, storesInRegion) =>
{
    return new Promise( async (resolve, reject)=>
    {
        let hostCoordinates = {};
        //Get host store coordinates
        let d = await q.query(`SELECT * FROM directedgemedia.stores WHERE id = ${hostid};`)

        hostCoordinates = {
            lat: d.results[0].latitude,
            lon: d.results[0].longitude, 
        };
        const nearbyStores = [];
        storesInRegion.forEach((e, i) => 
        {
            if(hostid==e.id){
                //Skip. Dont add host as its own surrounding store
            }
            else
            {
                //Get distance between host store and nearby store
                const dist = geodist(hostCoordinates, { lat: e.latitude, lon: e.longitude });
                if (dist < 15) 
                {

                    nearbyStores.push({ id: e.id, distance: dist });
                }
            }
            
        })
        resolve(nearbyStores)
    })
}

const getClosestHostBetweenOldAndNew = (listWithin15, hostid) =>
{
    
    return new Promise((resolve, reject)=>
    {
        let finalList = []



        //Loop through list and compare
        listWithin15.forEach((e,i)=>
        {

  
            q.query(`SELECT * FROM directedgemedia.hosts WHERE store_id = ${e.id} AND store_type = 'surrounding';`)
            .then(old=>
                {   
                    
                    //Check if this nearby store is already a "surrounding" to another host
                    if(old.results[0] === [])
                    {
                        //If it is, see which of the two hosts h      as a shorter distance to this store

                        if(old.results[0].distance > e.distance)
                        {
                            //Store is closer to new host, and so switch it
                            //Replace test num 11111 with hostid
                            q.query(`UPDATE directedgemedia.hosts SET closest_host_id = ${hostid} WHERE store_id = ${e.id};`)
                            .then( f=>
                                {
                                    if(i===listWithin15.length - 1)
                                    {

                                        resolve(finalList)
                                        
                                    }
                                })
                        }
                        else 
                        {
                            //This store is closer to old host, so leave be
                            finalList.push(e);
                            if(i===listWithin15.length - 1)
                            {

                                resolve(finalList)
                                
                            }
                        }
                    }
                    else
                    {
                            q.query(`
                            INSERT INTO directedgemedia.hosts (store_id, store_type, closest_host_id, distance) 
                            VALUES ('${e.id}', 'surrounding', '${hostid}', '${e.distance}')
                            ON DUPLICATE KEY UPDATE closest_host_id = ${hostid}
                            ;`)
                        .then(re=>
                            {
                                finalList.push(e);
                                if(i===listWithin15.length - 1)
                                {

                                    resolve(finalList)
                                    
                                }
                            })
                        
                        
                    }
                })

        })
        
    })
}

const getWithin15AndAddToHosts = (res, id, region) =>
{
    //remove all where closest_store_id is not a store_id in user_store table
    return new Promise (async(resolve, reject)=>
    {
        await deleteAllEntriesWithoutUserHost()

        let allStoresInRegion = await q.query(`SELECT * FROM directedgemedia.stores WHERE region = '${region}'`)

        let listOfNearby = await getWithin15Miles(id, allStoresInRegion.results)

        let finalList = await getClosestHostBetweenOldAndNew(listOfNearby, id)

        resolve(finalList)
    })
}

const deleteAllEntriesWithoutUserHost = () =>
{
    return new Promise( async (resolve,reject)=>
    {
        
        let includedInUserStore = await q.query(`SELECT * FROM directedgemedia.user_store`)
        listOfStoreIDs = includedInUserStore.results.map((e)=>
        {
            return e.store_id
        })

        if (listOfStoreIDs.length===0)
        {
            await q.query(`TRUNCATE directedgemedia.hosts;`)
            return resolve('done')
        }
        else{

        await q.query(`DELETE FROM directedgemedia.hosts WHERE NOT closest_host_id IN (${listOfStoreIDs.join()})`)

        resolve("Done")
        }

        



    })
}

const reAddHosts = (userStoreRegionListArray) =>
{
    
    return new Promise (async (resolve, reject) =>
    {
        let i = 0;
        let len = userStoreRegionListArray.length


        for(i=0; i<len ; i++)
        {
            //userStoreRegionListArray[i].store_id
            await q.query(`
            INSERT INTO directedgemedia.hosts (store_id, store_type, closest_host_id, distance) 
            VALUES ('${userStoreRegionListArray[i].store_id}', 'host', '${userStoreRegionListArray[i].store_id}', 0)
            ON DUPLICATE KEY UPDATE store_type = 'host', closest_host_id = ${userStoreRegionListArray[i].store_id}, distance = 0
            ;`)
        }

        resolve ('done')

    })
}

const addNearbyToHosts = (nearL, hostid) =>
{
    
    return new Promise(async(resolve, reject)=>
    {
        let i = 0;
        let len = nearL.length
        for(i = 0; i<len; i++)

        {
            
            await q.query(`INSERT INTO directedgemedia.hosts 
            (store_id, store_type, closest_host_id, distance) 
            VALUES ('${nearL[i].id}', 'surrounding', '${hostid}', '${nearL[i].distance}')
            ON DUPLICATE KEY UPDATE 
            store_id = ${nearL[i].id}, store_type = 'surrounding', closest_host_id = ${hostid}, distance = ${nearL[i].distance}
            ;`)
        }
        resolve('success')
    })
}


const findClosestHostOrDelete = (entriesBeingRemoved, reg) =>
{
    return new Promise(async(resolve, reject)=>
    {
        //Will need list of host IDS in user_store, region, all stores in region (for coordinates)
        let i = 0;
        let len = entriesBeingRemoved.length

        let allStoresInRegion = await q.query(`SELECT * FROM directedgemedia.stores WHERE region = '${reg}';`)
        let storeDictionary = {}
        for(let i=0; i<allStoresInRegion.results.length;i++)
        {
            storeDictionary[allStoresInRegion.results[i].id] = allStoresInRegion.results[i]
        }

        let listOfHostIDs = await getAllDistinctStoreIDsInUserHostByRegion(reg)
        let glen = listOfHostIDs.length

        //Use closest if switching to a new host
        let closest = null

        if(entriesBeingRemoved.length === 0 || listOfHostIDs.length === 0)
        {
            return resolve("Yayt")
        }
        //Loop through entriesBeingRemoved
        for(i=0; i<len; i++)
        {
            
            let entryCoordinates = {
                lat: storeDictionary[entriesBeingRemoved[i].store_id].latitude,
                lon: storeDictionary[entriesBeingRemoved[i].store_id].longitude
            }
            
            for(let g =0; g<glen; g++)
            {
                //Get host ID that is within 15, and closest to entry. If none within 15, skip
                let hostCoordinates = {
                    lat: storeDictionary[listOfHostIDs[g]].latitude,
                    lon: storeDictionary[listOfHostIDs[g]].longitude
                }

                //Get distance between this host and entry
                const dist = geodist(hostCoordinates, entryCoordinates);
                
                if(g==0)
                {
                    closest = {
                        g:g,
                        distance: dist
                    }
                }
                else{
                    if(closest.distance>dist)
                    {
                        closest = {
                            g:g,
                            distance: dist
                        }
                    }
                }

                
            }
            if(closest.distance<15)
            {
                //Keep and switch host
                await q.query(`UPDATE directedgemedia.hosts SET closest_host_id = ${listOfHostIDs[closest.g]}, store_type = 'surrounding', distance = ${closest.distance} WHERE store_id = ${entriesBeingRemoved[i].store_id};`)
            }
            else{
                //Delete
                await q.query(`DELETE FROM directedgemedia.hosts WHERE store_id = ${entriesBeingRemoved[i].store_id};`)
            }
        }
        resolve('yay')
    })
}

const getAllDistinctStoreIDsInUserHostByRegion = (region) =>
{
    return new Promise(async(resolve, reject)=>
    {
        let allUserStore = await q.query(`SELECT user_id, store_id, region FROM directedgemedia.user_store INNER JOIN directedgemedia.supervisors ON user_id = id;`)

        const listFilteredToRegion = []
        allUserStore.results.forEach((e,i)=>
        {
            

            if (e.region == region)
            {
                
                listFilteredToRegion.push(e.store_id)
            }
        })
        
        
        let distinctList = [];
        listFilteredToRegion.forEach(e=>{
            if(!distinctList.includes(e))
            {
                distinctList.push(e)
            }
        } )
        
        resolve(distinctList)
    })
}



module.exports = router;