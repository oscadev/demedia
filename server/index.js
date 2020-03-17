const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const mysql = require('mysql');
const q = require('./queries');
const geodist = require('geodist');
const crypto = require('crypto');


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678',
  insecureAuth: true,

});

let allStores = [];
let allUsers = [];
const allHosts = [];

const checkAdmin = (pass) => {
  const hash = crypto.createHash('sha256');
  hash.update(`${pass}sdfkjhsdfhjksdfkjhsdfhjksdfkjhsdfhjksdfkjh`);
  const hex = hash.digest('hex');
  if (hex === '28dabeb4d1b9a94c19ccbcef6ddf0ac975a74fa78b321cd41370b99bcd90cdc2') {
    return true;
  }
  return false;
};


const checkIfFirstTime = () => {
  let exists = false;
  connection.query('SHOW DATABASES;', (error, results, fields) => {
    results.forEach((e) => {
      const message = 'DIRECT EDGE DB DOESNT EXIST';
      if (e.Database === 'directedgemedia') {
        exists = true;
      }
    });
    if (exists) {

    } else {
      connection.query('CREATE SCHEMA directedgemedia ;', (err, res, fie) => {
        if (res) {
          makeTables();
        }
      });
    }
  });
};


connection.connect();


// Check if the DB already exists, if not, create it and add tables etc
checkIfFirstTime();

app.use(bodyParser.json({ type: 'application/*+json' }));

//Show in console when any route is hit
app.use('/', (req, res, next) => {
    console.log("received request: " + req.originalUrl);
    next();
  });


app.listen(3001, () => console.log('Listening'));

// Create tables on first run
const makeTables = () => {
  connection.changeUser({ database: 'directedgemedia' }, (err) => {
    if (err) {
      throw err;
    } else {
      connection.query(q.tableSupervisor, (err2, res) => {
          if(err2){
              console.log(err2)
          }
        connection.query(q.supervisor);
      });
      connection.query(q.tableStorelist, (err2, res) => {
        if(err2){
            console.log(err2)
        }
        connection.query(q.storelist);
      });
      connection.query(q.tableSupervisorStore, (err2, res) => {
        if(err2){
            console.log(err2)
        }

      });
      connection.query(q.tableHosts, (err2, res) => {
        if(err2){
            console.log(err2)
        }

      });
    }
  });
};

app.get('/admin/:password', (req, res) => {
  if (checkAdmin(req.params.password)) {
    res.send(true);
  } else {
    res.send(false);
  }
});

app.post('/removehost/:userid/:region', async (req, res) => {
    //Get host of this user
    let hostToRemove = await qu(`SELECT * FROM directedgemedia.user_store WHERE (user_id = '${req.params.userid}');`)
    await qu(`DELETE FROM directedgemedia.user_store WHERE (user_id = '${req.params.userid}');`)
    console.log('THIS SHOULD NOT BE UNDEFINED: ', hostToRemove)
    await qu(`DELETE FROM directedgemedia.hosts WHERE (closest_host_id = '${hostToRemove[0].store_id}');`)

    res.send('done')



//   checkIfShouldAddToHostOnRemove(req.params.userid)
//     .then((d) => {
//         console.log(d)
//       res.send(d);
//     });
});

app.get('/getallhosts', (req, res) => {
  connection.query('SELECT DISTINCT store_id FROM directedgemedia.user_store;', (err, results, fields) => {
    res.send(results);
  });
});

app.get('/gethosts', (req, res) => {
  connection.query('SELECT * FROM directedgemedia.hosts;', (err, results, fields) => {
    res.send(results);
  });
});

app.get('/getalluserswithhost', (req, res) => {
  connection.query('SELECT * FROM directedgemedia.user_store;', (err, results, fields) => {
    res.send(results);
  });
});

app.get('/stores', (req, res) => {
  connection.query('SELECT * FROM directedgemedia.sample_storelist;', (err, results, fields) => {
    allStores = results;
    res.send(results);
  });
});

app.get('/supervisors', (req, res) => {
  connection.query('SELECT * FROM directedgemedia.sample_supervisor;', (err, results, fields) => {
    allUsers = results;
    res.send(results);
  });
});

app.get('/stores/:region', (req, res) => {
  connection.query(`SELECT * FROM directedgemedia.sample_storelist WHERE region = "${req.params.region}";`, (err, results, fields) => {
    allStores = results;
    res.send(results);
  });
});

app.get('/supervisor/:id', (req, res) => {
  connection.query(`SELECT * FROM directedgemedia.sample_supervisor WHERE id = ${req.params.id};`, (err, results, fields) => {
    res.send(results);
  });
});

app.get('/userstore/:userid', (req, res) => {
  connection.query(`SELECT * FROM directedgemedia.user_store WHERE user_id = '${req.params.userid}'`, (err, results, fields) => {
    if (err) {
        res.send(null);
    }else{
        res.send(results);
    }
    
  });
});

// GET SURROUNDING TO HOSTID
app.get('/surrounding/:hostid', (req, res) => {
  if (req.params.hostid === null) {
    res.send('no host id passed');
  } else {
    connection.query(`SELECT * FROM directedgemedia.hosts WHERE closest_host_id = '${req.params.hostid}'`, (e, r, f) => {
      res.send(r);
    });
  }
});

app.post('/removechosenstore/:storeid', (req, res) => {
  connection.query(`DELETE FROM directedgemedia.user_store WHERE (user_id = '${req.params.storeid}');
    `, (e, r, f) => {
    res.send(r);
  });
});

app.post('/choosehost/:userid/:hostid', async (req, res) => {
    let {userid, hostid} = req.params;
    let alreadyHadHost = false

//Get current host if any. Also exit if clicking existing host

    let oldHost = await qu(`SELECT * FROM directedgemedia.user_store WHERE user_id = ${userid};`)
    
    if(oldHost[0]){
        alreadyHadHost = true
        oldHost = oldHost[0].store_id
        console.log('old host:', oldHost)
        if(oldHost==hostid){
        res.send('done')
        return
    }
    }
    
    

    //SEE IF ANOTHER SUPERVISOR HAS THIS OLDHOST AS HOST
    peopleWithOldHost = null
    
    await qu(`SELECT * FROM directedgemedia.user_store WHERE store_id = ${oldHost};`).then(d=>{
        console.log("WTF AGAIN: ", d)
        peopleWithOldHost = d
    }).catch(error=>{
        peopleWithOldHost = 0
        console.log('nobody else had old host')
    })



    console.log("This should be 1 when i choose a secondf", peopleWithOldHost)

    //If another supervisor has the old store as host, do not remove from hosts
    
    if(peopleWithOldHost){
        console.log("IF peoplewithhost length is 1, it means only this user has it, so delete form hsots: ", peopleWithOldHost.length)
        if(peopleWithOldHost.length==1){
            console.log("THIS SHOULD BE DELETING RIGHT HERE: ", peopleWithOldHost.length)
            //Delete oldhost from hosts
        await qu(`DELETE FROM directedgemedia.hosts WHERE closest_host_id = ${oldHost};`)
        }
        
    }

    //ADD ENTRY TO USER_STORE TABLE

    let resp = await qu(`INSERT INTO directedgemedia.user_store (user_id, store_id) VALUES 
    ('${userid}', '${hostid}') ON DUPLICATE KEY UPDATE store_id = ${hostid};`)

    //Check if new host is already on hosts

    resp = await qu(`SELECT * FROM directedgemedia.hosts WHERE closest_host_id = ${hostid};`)

    if(resp.length>0){
        //New host is already in hosts, done
        res.send('success')
    }
    else{
        //Get within 15 miles
        await findAllWithin15(hostid)
        res.send('success')
    }
    

    
    




// ===================================================>
//     connection.query(`SELECT * FROM directedgemedia.user_store WHERE store_id = ${req.params.storeid};`, (e,r,f)=>{
//         if(r.length>0){
//             //DELETE STORE FROM HOSTS
//             connection.query(`DELETE FROM directedgemedia.hosts WHERE closest_host_id = ${req.params.storeid};`, (e1, r1, f1) => {
//                 console.log("REMOVED THE THING")
//                 connection.query(`INSERT INTO directedgemedia.user_store (user_id, store_id) VALUES (${req.params.userid}, '${stoid}');
//                 `, (err, results, fields) => {
//                 if (stoid && !err) {
//                   findAllWithin15(stoid).then((d) => {
//                     connection.query(`UPDATE directedgemedia.hosts SET store_type = 'host' WHERE (store_id = '${stoid}');
//             `);
            
//                     res.send('completed');
//                   });
//                 }
            
            
//                 // If duplicate and need to update
//                 if (err) {
//                   connection.query(`UPDATE directedgemedia.user_store SET store_id = ${stoid} WHERE (user_id = '${req.params.userid}');`,
//                     (err2, results2, fields2) => {
//                       if (stoid) {
//                         findAllWithin15(stoid).then((d) => {
//                           connection.query(`UPDATE directedgemedia.hosts SET store_type = 'host' WHERE (store_id = '${stoid}');
//                 `);
            
//                           res.send('completed');
//                         });
//                       }
//                     });
//                 } 
//               });
                
//             })
//         }else{
//             connection.query(`INSERT INTO directedgemedia.user_store (user_id, store_id) VALUES (${req.params.userid}, '${stoid}');
//     `, (err, results, fields) => {
//     if (stoid && !err) {
//       findAllWithin15(stoid).then((d) => {
//         connection.query(`UPDATE directedgemedia.hosts SET store_type = 'host' WHERE (store_id = '${stoid}');
// `);

//         res.send('completed');
//       });
//     }


//     // If duplicate and need to update
//     if (err) {
//       connection.query(`UPDATE directedgemedia.user_store SET store_id = ${stoid} WHERE (user_id = '${req.params.userid}');`,
//         (err2, results2, fields2) => {
//           if (stoid) {
//             findAllWithin15(stoid).then((d) => {
//               connection.query(`UPDATE directedgemedia.hosts SET store_type = 'host' WHERE (store_id = '${stoid}');
//     `);

//               res.send('completed');
//             });
//           }
//         });
//     } 
//   });
//         }
//     })
//     =================================================================>

        


      

  
});

const findAllWithin15 = (hostid) => {
    
    return new Promise((resolve, reject) => {
  let hostCoord = {};

  //Get host store coordinates
  connection.query(`SELECT * FROM directedgemedia.sample_storelist WHERE id = ${hostid};`, (err, results, fields) => {
    hostCoord = {
      lat: results[0].latitude,
      lon: results[0].longitude,
    };

    //Get all stores in same region as host and reduce to withing 15 miles
    connection.query(`SELECT * FROM directedgemedia.sample_storelist WHERE region = '${results[0].region}';`, (e, res, f) => {
      const nearbyStores = [];
      res.forEach((e, i) => {
        const dist = geodist(hostCoord, { lat: e.latitude, lon: e.longitude });
        if (dist < 15) {
          nearbyStores.push({ id: e.id, distance: dist });
        }
      });

      console.log("What in tarnation: ",nearbyStores)


      nearbyStores.forEach((e, i) => {
        
          //Check this "surrounding store" is the host itself. Make host if so
          if(e.id == hostid){
            console.log('check zero:', e, hostid)
            qu(`INSERT INTO directedgemedia.hosts (store_id, store_type, closest_host_id, distance) VALUES ('${e.id}', 'host', '${hostid}', '${e.distance}') 
                    ON DUPLICATE KEY UPDATE store_type = 'host', closest_host_id = '${hostid}';`)
          }else{
              console.log('check one')
              //Check if this nearby already belongs to another host
              qu(`SELECT * FROM directedgemedia.hosts WHERE store_id = ${e.id} AND store_type = 'surrounding'`).then(d=>{
                console.log('check two')

                  if(d.length===0){
                      //It doesnt already belong to another host, so just add it as surrounding to this host
                    qu(`INSERT INTO directedgemedia.hosts (store_id, store_type, closest_host_id, distance) VALUES ('${e.id}', 'surrounding', '${hostid}', '${e.distance}') 
                    ON DUPLICATE KEY UPDATE store_id = ${e.id};`)

                  }else{
                      //Since it does belong to another host, see which host is closer
                      if(e.distance<d[0].distance && false){
                        //New host is closer
                        qu(`INSERT INTO directedgemedia.hosts (store_id, store_type, closest_host_id, distance) VALUES ('${e.id}', 'surrounding', '${hostid}', '${e.distance}') 
                        ON DUPLICATE KEY UPDATE store_id = ${e.id};`)
                    }else{
                        //Old host is closer, so dont do anything
                    }

                  }
              })

          }

                      



          
          

          if(i==nearbyStores.length - 1){
            resolve('success')
          }
          


        // checkIfAlreadyHasHost(e.id, hostid, e.distance).then((d) => {
        //   if (i === list.length - 1) {
        //     resolve('done');
        //   }
        // });
      });
      //Change host store type from "surrounding" to "host" 

    });
  });
});
}



const checkIfAlreadyHasHost = (storeId, hostId, dista) => new Promise((resolve, reject) => {
  connection.query(`SELECT * FROM directedgemedia.hosts 
    WHERE store_id = ${storeId} 
    AND store_type = 'surrounding'`, (err, results, fields) => {
    if (results.length === 0) {
      // ADD SURROUNDING ELEMENT TO HOSTS BECAUSE IT DOESNT ALREADY HAVE A HOST ASSOCIATED
      connection.query(`INSERT INTO directedgemedia.hosts (store_id, store_type, closest_host_id, distance) VALUES ('${storeId}', 'surrounding', '${hostId}', '${dista}');
            `, () => {
        resolve('successfully added');
      });
    } else {
      // IT ALREADY HAS A HOST, SO SEE WHICH HOST IS CLOSER
      const currentHost = results[0].closest_host_id;
      const newHost = hostId;
      if (dista < results[0].distance) {
        connection.query(`UPDATE directedgemedia.hosts SET closest_host_id = '${newHost}' WHERE (store_id = '${storeId}');
                `, () => {
          connection.query(`UPDATE directedgemedia.hosts SET distance = '${dista}' WHERE (store_id = '${storeId}');
                `, () => {
            resolve('successfully added after comparing');
          });
        });
      } else {
        resolve(`successfully kept old host. Old host is ${results[0].distance} mi away, and new was ${dista} away.`);
      }
    }
  });
});

const checkIfShouldAddToHostOnRemove = (userId) => {
  return new Promise((resolve, reject) => {
    // get all hosts
    const closestDistance = null;
    const arrayOfHosts = [];
    let hostId = null;

    const count = [];
    // GET HOSTID
    connection.query(`SELECT * FROM directedgemedia.user_store WHERE user_id = ${userId}`, (e, r, f) => {
      // Get host store id
      r.forEach((e) => {
        if (e.user_id == userId) {
          hostId = e.store_id;
        }
      });
      // SEE IF OTHER USER STILL USING THAT HOST
      connection.query(`SELECT * FROM directedgemedia.user_store WHERE store_id = ${hostId}`, (er, re, fi) => {
        if (re.length > 1) {
          // ONLY REMOVE FROM USER STORE IF ANOTHER USER HAS SAME HOST
          connection.query(`DELETE FROM directedgemedia.user_store WHERE (user_id = '${userId}');
                    `, () => {

            resolve('Removed host from user store only');
          });
        } else if (re.length == 1) {
          // NO OTHER USER IS USING THAT HOST, SO DELETE HOST FROM HOSTS TABLE AND USER STORE TABLE
          connection.query(`DELETE FROM directedgemedia.user_store WHERE (user_id = '${userId}');
                    `, () => {
            connection.query(`DELETE FROM directedgemedia.hosts WHERE (closest_host_id = '${hostId}');
                        `, () => {
              resolve('Removed host from hosts');
            });
          });
        }
      });
    });


    // connection.query(`UPDATE directedgemedia.hosts SET store_type = 'general' WHERE (store_id = '${storeId}')`,
    // (e,r,f)=>{
    //     resolve("yeay")
    // });
  });
};


const removeAllOccurenceFromTable = (tablename, para, id) => {
    return new Promise ((resolve, reject) => {
        q(`DELETE FROM directedgemedia.${tablename} where ${para} = ${id};`)
        .then(d=>{
            resolve(d)
        })
        .catch(error=>
            {
                reject(error)
            })

    })
}

const qu = (sql) => {
    return new Promise ((resolve, reject)=>{
        connection.query(sql, (error , results, field)=>{
            if(error){
                reject(error)
            }else{
                resolve(results)
            }
        })
    })
}