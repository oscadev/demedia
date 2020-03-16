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


app.listen(3001, () => console.log('Listening'));

// Create tables on first run
const makeTables = () => {
  connection.changeUser({ database: 'directedgemedia' }, (err) => {
    if (err) {
      throw err;
    } else {
      connection.query(q.tableSupervisor, (err, res) => {
        connection.query(q.supervisor);
      });
      connection.query(q.tableStorelist, (err, res) => {
        connection.query(q.storelist);
      });
      connection.query(q.tableSupervisorStore, (err, res) => {

      });
      connection.query(q.tableHosts, (err, res) => {

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

app.post('/removehost/:userId/:region', (req, res) => {
  checkIfShouldAddToHostOnRemove(req.params.userId)
    .then((d) => {

      res.send(d);
    });
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
    }
    res.send(results);
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

app.post('/chosenstore/:userid/:storeid', (req, res) => {
  let stoid = req.params.storeid;
  if (req.params.storeid === 'null') {
    stoid = null;
    connection.query(`UPDATE directedgemedia.user_store SET store_id = ${stoid} WHERE (user_id = '${req.params.userid}');`,
      (err2, results2, fields2) => {
        res.send('SET TO NULL');
      });
    return;
  }

  // SETTING TO NULL


  // ADD TO USER_STORE
  connection.query(`INSERT INTO directedgemedia.user_store (user_id, store_id) VALUES (${req.params.userid}, '${stoid}');
    `, (err, results, fields) => {
    if (stoid && !err) {
      findAllWithin15(stoid).then((d) => {
        connection.query(`UPDATE directedgemedia.hosts SET store_type = 'host' WHERE (store_id = '${stoid}');
`);

        res.send('completed');
      });
    }


    // If duplicate and need to update
    if (err) {
      connection.query(`UPDATE directedgemedia.user_store SET store_id = ${stoid} WHERE (user_id = '${req.params.userid}');`,
        (err2, results2, fields2) => {
          if (stoid) {
            findAllWithin15(stoid).then((d) => {
              connection.query(`UPDATE directedgemedia.hosts SET store_type = 'host' WHERE (store_id = '${stoid}');
    `);

              res.send('completed');
            });
          }
        });
    } else {

    }
  });
});

const findAllWithin15 = (hostid) => new Promise((resolve, reject) => {
  let hostCoord = {};
  connection.query(`SELECT * FROM directedgemedia.sample_storelist WHERE id = ${hostid};`, (err, results, fields) => {
    hostCoord = {
      lat: results[0].latitude,
      lon: results[0].longitude,
    };
    connection.query(`SELECT * FROM directedgemedia.sample_storelist WHERE region = '${results[0].region}';`, (e, res, f) => {
      const list = [];
      res.forEach((e, i) => {
        const dist = geodist(hostCoord, { lat: e.latitude, lon: e.longitude });
        if (dist < 15) {
          list.push({ id: e.id, distance: dist });
        }
      });
      list.forEach((e, i) => {
        checkIfAlreadyHasHost(e.id, hostid, e.distance).then((d) => {
          if (i === list.length - 1) {
            resolve('done');
          }
        });
      });
    });
  });
});


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

const checkIfShouldAddToHostOnRemove = (userId, region) => {
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
