const express = require('express');
const router = express.Router();
const q = require('../../models/query')

router.get('/', (req,res,next) => 
{
    q.query(`SELECT * FROM directedgemedia.stores`)
    .then(d=>{
        q.res(res, d, 'Fetched all stores', 200)
    })
})

router.get('/byregion', (req,res,next) => 
{
    const region = req.body.region
    console.log("REGION IS: ", region)
    q.query(`SELECT * FROM directedgemedia.stores WHERE region = 'GLA'`)
    .then(d=>{
        q.res(res, d, 'Fetched all stores', 200)
    })
})

router.post('/', (req,res,next) => 
{
    res.status(201).json({
        message: 'Store created'
    })
})

module.exports = router;