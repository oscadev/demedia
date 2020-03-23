const mysql = require('mysql')
const q = require('../queries')
const bcrypt = require('bcrypt')


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    insecureAuth: true,
  
  });

  connection.connect();


  const query = (q) => {
    return new Promise((resolve, reject)=>
  {
      connection.query(q, (err, results, fields) => {
          if(err){
              reject(err.message)
          }else{
              resolve({
                  results: results,
                  fields: fields
              })
          }
      })
  })
  }

  const response = (res, data, msg, code) =>
{
    res.status(code).json({
        message: msg,
        results: data.results,
        fields: data.fields
    })
}

const error = (res, err, code) =>
{
    res.status(code).json({
        message: err,
    })
}

const makeDatabaseIfDoesntExist = async () =>
{
    let databaseAlreadyExists = false;
    const dbs = await query('SHOW DATABASES;');
    dbs.results.forEach((db) => 
    {
        const message = 'DIRECT EDGE DB DOESNT EXIST';
        if (db.Database === 'directedgemedia')
        {
          databaseAlreadyExists = true;
        }
    });

    if(databaseAlreadyExists)
    {
        //Done
        console.log("Ready")
        return
    }
    else
    {
        //Make database and switch to it
        console.log('Creating DB and tables for first time')
        await query('CREATE SCHEMA directedgemedia ;')
        connection.changeUser({database: 'directedgemedia'}, async ()=>
        {
            //Make tables
            await query(q.tableSupervisor)
            await query(q.tableStorelist)
            await query(q.tableSupervisorStore)
            await query(q.tableHosts)
            await query(q.tableAdmin)
            
            //Add supervisor and store starting data
            await query(q.supervisor)
            await query(q.storelist)
            await query(q.adminList)
            console.log("Ready")

        })

        


    }
}

// const hashPassword = (password) =>
// {
//     bcrypt.hash(password, 10, (err, hash)=>
//     {
//         if(err)
//         {

//         }else{

//         }
//     })
// }

// hashPassword('password')

makeDatabaseIfDoesntExist()

module.exports = {
      query:query,
      res:response,
      catch:error
  }