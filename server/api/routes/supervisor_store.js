const express = require('express');
const router = express.Router();
const q = require('../../models/query')

router.get('/', (req,res,next) => 
{
    q.query(`SELECT * FROM directedgemedia.user_store`)
    .then(d=>{
        res.status(200).json({
        message: 'All Hosts fetched',
        results:d.results
    })
    })
    
})

router.get('/bysupervisor', (req,res,next) => 
{
    const id = req.body.id
    q.query(`SELECT * FROM directedgemedia.user_store where user_id = ${id};`)
    .then(d=>{
        res.status(200).json({
        message: 'Hosts fetched by supervisor id of: '+id,
        results:d.results

    })
    })
    
})

router.get('/bystore', (req,res,next) => 
{
    const id = req.body.id
    res.status(200).json({
        message: 'Hosts fetched by store id of: '+id
    })
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