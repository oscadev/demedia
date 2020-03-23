import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { useParams } from 'react-router-dom'
import { Header } from './Header'

//Individual Supervisor Form
export const IndividualPage = (props) => {
    const [items, setItems] = useState([])
    const [surroundingItems, setSurroundingItems] = useState([])
    const [supervisorNameAndRegion, setSupervisorNameAndRegion] = useState(null)
    const [storesInRegion, setStoresInRegion] = useState(null)
    const [region, setRegion] = useState('')
    const [chosenHost, setChosenHost] = useState(null)
    const [viewSurrounding, setViewSurrounding] = useState(false)

    const [options, setOptions] = useState([])
    const [inputVal, setInputVal] = useState('')
    const [dic, setDic] = useState(null);

    let { userID } = useParams();

/*  
First render setup:

Get supervisor name and region
Get chosen host if any
Get stores in same region 
*/
    const makeDictionary = (storesInRegionArray) =>
    {
        let tempDic = {}
        
        storesInRegionArray.forEach(e=>
            {
                tempDic[e.name] = e.id
                tempDic[e.id] = e.name
            })
        
        setDic(tempDic)
    }
  
    const getSupervisorNameAndRegion = () => 
    {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem('token')
        }
        Axios.get(`/supervisors/bysupervisorid/${userID}`)
        .then(res=>{
            
            setSupervisorNameAndRegion({
                name: res.data.results[0].firstname + " " + res.data.results[0].lastname,
                region: res.data.results[0].region
            })
        })
        .catch(err=>console.log(err))
    }

    const getStoreChosenAsHost = () => 
    {
        return new Promise ((resolve, reject)=>
        {
            Axios.get( `/supervisorstore/bysupervisorid/${userID}`)
            .then(res=>
                {
                    
                    if(res.data.results.length == 1)
                    {
                        resolve(setChosenHost(res.data.results[0].store_id));

                        
                        
                    }
                    else
                    {
                        resolve(setChosenHost(null))
                    }
                });
        })

        
    };

    const getStoresInRegion = (reg) =>
    {

        Axios.get(`/stores/byregion/${reg}`)
        .then(res=>
            {
                setStoresInRegion(res.data.results)
            })
        .catch(err=>console.log(err))
    }

    

    //Create and render the list of stores
    const makeStoresInRegion = (storesInRegion) => 
    {
        let temp = [];
        let tempOpts = [];
        let currName = null;

        storesInRegion.forEach((e,i)=>
        {



            let bgColor = ''
            if(chosenHost){
                if(e.id===chosenHost)
                {
                    currName = e.name;
                    bgColor = 'green'
                }
            }
            

            
            temp.push
            (
                <div className="flex-row item store" key={i} onClick={()=>{chooseHost(e.id)}} style={{backgroundColor:bgColor}}>
                    <div className="id">
                        {e.id}
                    </div>
                    <div className="name flex">
                        {e.name}
                    </div>
                    <div className="region">
                        {e.ship_city}
                    </div>
                </div>
            )
            tempOpts.push(
                <option value={e.name} key={i}/>
            );
        })


        setItems(temp);
        setOptions(tempOpts);
    }

    //Select a store as host and remove a store and validate that it exists, and is in same region as supervisor
    const postStoreToUserStore = (storeID) => 
    {
        return new Promise ((resolve, reject)=>
        {
            console.log("getSelectedStoreAsHost() Ran" )
            const headers = {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem('token')
            }
        //Add store as host in database
        Axios.post(`/supervisorstore/supervisorid/${userID}/storeid/${storeID}`)
        .then(d=>{
            console.log("@)@)@)@)@)@)@))@)@)@)@)@)@)@): 1")
            resolve('Success')
        })
        })
        
    }


    /* GET / POST / MAKE surrounding stores ************************************ */

    const getSurrounding = () =>
    {
        console.log("GET SURROUNDING RAN: Chosen host is: ", chosenHost)
        return new Promise((resolve, reject)=>
        {
            let query = `/stores/open/surrounding/${chosenHost}`
            Axios.get(query).then(f=>
            {
                console.log("THIS SHOULD NOT BE AN EMPTY ARRAY: ", f)
                console.log("THIS SHOULD NOT BE AN EMPTY ARRAY WUERY IS: ", query)
                resolve(makeSurrounding(f.data.results));
            })
        })
        
    }

    //Needs supervisorNameAndRegion, chosenHost, and dic
    const postSurroundingToHosts = (hostID) => 
    {
        return new Promise((resolve, reject)=>
        {

            Axios.post(`/stores/open/surrounding/${userID}/${hostID}/${supervisorNameAndRegion.region}`).then(d=>
            {
                resolve('success')
            })
            .catch(err=>console.log(err));
        })

        
    }

    
    const makeSurrounding = (arr) =>
    {
        console.log("this hsould happen second")
        
        let temp = [];
        arr.forEach((e,i)=>
        {
            console.log(e)

                temp.push
                (
                    <div className="flex-row item surrounding" key={i}>
                        <div className="name">
                            {dic[e.store_id]}
                        </div>
                        <div className="region">
                            {e.distance} mi away
                        </div>
                    </div>
                );
            
            
        });
        console.log("MAKING SURROUNDING ITEMS TEMP: ", temp)
        setSurroundingItems(temp);
    }

/*     CLICK TO ADD A STORE ***********************************************************************
 */

    const chooseHost = async (hostID) =>
    {
        //reset text input value
        setInputVal('')
        //check if empty or null
        if(hostID==="" || hostID === null || hostID =="null")
        {
            await removeHost()
            return
        }

        //Check if is valid

        if(!dic[hostID]){
            alert("This ID or Store name does not exist in your region")
            return
        }
        

        //Check if is string rather than ID

        if(isNaN(hostID))
        {
            hostID = dic[hostID]
        }
        //Post to user_store table
        await postStoreToUserStore(hostID)
        //Post to hosts table
        console.log("@)@)@)@)@)@)@))@)@)@)@)@)@)@): 2")
        await postSurroundingToHosts(hostID)
        //Get new chosen storeß
        await getStoreChosenAsHost(userID)
        //Get new surrounding stores
        // await getSurrounding()
    }

    const removeHost = async () =>
    {
        //exit if already empty
        if(chosenHost===null)
        {
            return
        }
        await Axios.delete(`/stores/${userID}/${supervisorNameAndRegion.region}`)

        await getStoreChosenAsHost()



        

    }
    /* USE EFFECTS surrounding stores ************************************/

    useEffect(() => 
    {
        getSupervisorNameAndRegion();
        
        
        
        
    },[]);

    useEffect(()=>
    {
        
        if(supervisorNameAndRegion)

        {
            getStoresInRegion(supervisorNameAndRegion.region)


        }
            
        
    },[supervisorNameAndRegion]);



    useEffect(()=>{
        
        if(storesInRegion){
            makeDictionary(storesInRegion)
        }
    }, [storesInRegion])

    useEffect(()=>
    {
        if(dic)
        {
            makeStoresInRegion(storesInRegion)
            getStoreChosenAsHost()
            
        }
    },[dic])

    useEffect(()=>
    {

        if(chosenHost)
        {
            makeStoresInRegion(storesInRegion)
            getSurrounding()
        }else if (storesInRegion)
        {   makeStoresInRegion(storesInRegion)
            getSurrounding()
        }
    },[chosenHost])







    return (
        <div className="flex">
            {/* <Header isAdmin={props.isAdmin} loginAdmin={props.loginAdmin}/> */}


            <h3 className="title">
                Hello, {supervisorNameAndRegion?supervisorNameAndRegion.name:""}
            </h3>
            {items.length>0?
            <div>
                <h4 className="text">
                    Please pick a store (these are {supervisorNameAndRegion.region})
                    <br/>
                    You may click an option from the list below, or type it in the input field
                </h4>
            <h4 className="text" style={{color:chosenHost?"green":"red"}}>
                Current host selected: {chosenHost && dic?dic[chosenHost]:"none"} {chosenHost?<button className="btn neumorph" onClick={()=>removeHost()}>Remove</button>:<button className="btn neumorph" onClick={()=>removeHost()}>Remove</button>}
            </h4>
            <form onSubmit={(e)=>
                {
                    e.preventDefault(); 
                    console.log(e.currentTarget)
                    chooseHost(inputVal);
                    }} className="flex-row">
                <input list="names" name="names" value={inputVal} onChange={(e)=>setInputVal(e.currentTarget.value)} className="textinput" autoComplete="off"/>
                <datalist id="names">
                    {options}
                </datalist>
                <input type="submit" className="btn neumorph"/>
            </form>
            <div className="content flex">
                <div className="surroundings flex" style={{display:surroundingItems.length>0?"":"none"}}>
                    {viewSurrounding?<h3 className="btn neumorph" onClick={()=>setViewSurrounding(!viewSurrounding)}>Hide stores surrounding {dic[chosenHost]}</h3>:<h3 className="btn neumorph" onClick={()=>setViewSurrounding(!viewSurrounding)}>View stores surrounding {dic[chosenHost]}</h3>}
                    <div style = {{display:viewSurrounding?"":"none", margin: "32px 0"}}> 
                        {surroundingItems}
                    </div> 
                </div>
                
                <div className="flex in-region neumorph" >
                <div className="flex-row item bar">
                    <div className="id">
                        ID
                    </div>
                    <div className="name flex">
                        NAME
                    </div>
                    <div className="region">
                        CITY
                    </div>
                </div>
                    {items}
                </div>
            </div>
            
            
            </div>
            :
            <div>
                There are no stores in your region ({region}) at this time.
            </div>}
        </div>
    )
}
