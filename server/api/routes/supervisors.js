const express = require('express');
const router = express.Router();
const q = require('../../models/query');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/checkauth')

//Get all supervisors
router.get('/', checkAuth, (req,res,next) =>
{
    console.log("FETCHING ALL SUPERVISORS")
    q.query(`SELECT * FROM directedgemedia.supervisors;`)
    .then(d=>
        {
            q.res(res, d, 'Handling GET request to /supervisors', 200)
        })
    .catch(err=>
        {
            q.catch(res, err, 401)
        })
    

    
})

//Get one supervisor
router.get('/:supervisorid', (req,res,next) =>
{
    const id = req.params.supervisorid

    q.query(`SELECT * FROM directedgemedia.supervisors WHERE id = ${id};`)
    .then(d=>{
        q.res(res, d, 'You requested a specific supervisor by id: ' + id, 200)
    })
    .catch(err=>{
        q.catch(res, err, 404)
    })

    
})

router.post('/login', (req, res, next) => 
{
    const id = req.body.id
    const pass = req.body.password
    //Get saved password to compare
    q.query(`SELECT * FROM directedgemedia.admins where admin_id = ${id}`).then(d=>
        {
            if(d.results.length>0){
                //User id exists
                bcrypt.compare(pass, d.results[0].password, (err, res1)=>
                {
                    if(err)
                    {
                        return res.status(409).json({
                            message: "PAssword is wrong or user doesnt exist"
                        })
                    }

                    if(res1)
                    {
                        const token = jwt.sign(
                            {
                                adminId: id
                            }, 
                                process.env.JWT_KEY,
                            {
                                expiresIn: "1h"
                            })


                        res.status(200).json({
                            message: "PAssword is good",
                            token: token
                        })
                    }
                    else
                    {
                        res.status(409).json({
                            message: "PAssword is wrong or user doesnt exist"
                        })
                    }
                })
                
            }
            else
            {
                res.status(409).json({
                    message: "PAssword is wrong or user doesnt exist"
                })
                
            }

        })
})

module.exports = router;