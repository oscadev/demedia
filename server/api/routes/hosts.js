const express = require('express');
const router = express.Router();
const q = require('../../models/query')

router.get('/', (req,res,next) => 
{
    q.query(`SELECT * FROM directedgemedia.hosts;`)
    .then(d=>
        {
            res.status(200).json({
                message: 'Hosts fetched',
                results:d.results,
            })
        })
    
})

router.get('/:', (req,res,next) => 
{
    res.status(200).json({
        message: 'Hosts fetched'
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