const express = require('express');
const router = express.Router();
const q = require('../../models/query')
const checkAuth = require('../middleware/checkauth')

//Protect all post, delete, and 

router.get('/',checkAuth, (req,res,next) => 
{
    console.log("Authed !")
    q.query(`SELECT * FROM directedgemedia.user_store`)
    .then(d=>{
        res.status(200).json({
        message: 'All Hosts fetched',
        results:d.results
    })
    })
    
})

router.get('/bysupervisorid/:id', (req,res,next) => 
{
    const id = req.params.id
    q.query(`SELECT * FROM directedgemedia.user_store where user_id = ${id};`)
    .then(d=>{
        res.status(200).json({
        message: 'Hosts fetched by supervisor id of: '+id,
        results:d.results

    })
    })
    
})

router.post('/supervisorid/:id/storeid/:storeid', (req,res,next) => 
{
    const {id,storeid }= req.params
    q.query(`INSERT INTO directedgemedia.user_store (user_id, store_id) VALUES 
    ('${id}', '${storeid}') ON DUPLICATE KEY UPDATE store_id = ${storeid};`)
    .then(d=>
        {
            res.status(200).json(
                {
                    message: 'Added store as host: '+id
                })
        }
        )
    .catch(err=>q.catch(res,err.message,409))

    
})

router.post('/', (req,res,next) => 
{
    res.status(201).json({
        message: 'Host created'
    })
})

router.delete('/:closesthostid', (req,res,next) => 
{
    res.status(201).json({
        message: 'Host created'
    })
})

module.exports = router;