import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Header } from './Header'

export const StorePage = (props) => {
    const [items, setItems] = useState([])
    const [data, setData] = useState([])
    const [stores, setStores] = useState([])
    const [completeStores, setCompleteStores] = useState([])
    const [totals, setTotals] = useState({hosts:0,surrounding:0,general:0})


    const getData = () => {
        Axios.get('/supervisors').then(res=>{
            setData(res.data)
        }).catch(err=>console.log(err))
    }

    const getStoreData = () =>{
        
         Axios.get(`/stores`)
        .then(res=>{
            if(res.data.length)
            setStores(res.data)
        })
        .catch(err=>console.log(err))
    }

    const getHosts = () =>{
        let tempComplete = {}

         Axios.get(`/gethosts`)
        .then(res=>{
            
            
            stores.forEach(e=>{

                tempComplete[e.id] = {
                    id: e.id,
                    store_type: 'general',
                    closest_host_id: 'none',
                    distance: 'none',
                    
                    name: e.name,
                    region: e.region


                }
            })
            res.data.forEach(e=>{

                tempComplete[e.store_id].id = e.store_id
                tempComplete[e.store_id].store_type= e.store_type
                tempComplete[e.store_id].closest_host_id = e.closest_host_id
                tempComplete[e.store_id].distance = e.distance

                // tempComplete[e.store_id] = {
                //     id:e.store_id,
                //     store_type: e.store_type,
                //     closest_host_id: e.closest_host_id,
                //     distance: e.distance,

                // }
            })
            setCompleteStores(tempComplete)
        })
        .catch(err=>console.log("der was err"))
    }

    const makeItems = (d) => {
        //Total hosts, surrounding, general
        let tH = 0;
        let tS = 0;
        let tG = 0;

        let temp = [];
        let arr = Object.keys(d)
        arr.forEach((e,i)=>{
            let arrayOfSurr = []
            if(d[e].store_type==="surrounding"){
                tS++
            }
            if(d[e].store_type==="host"){
                tH++
                arr.forEach((f,i)=>{
                    if(d[f].closest_host_id===d[e].id){
                        
                        arrayOfSurr.push(`${d[f].id}, `)
                    }
                })
            }
            temp.push(
                <div className="item flex-row" key={i} style={{backgroundColor:d[e].store_type==="host"?'green':(d[e].store_type==="surrounding"?'orange':'')}}>
                    <div className="id">{d[e].id}</div>
                    <div className="name">{d[e].name}</div>
                    <div className="region">{d[e].store_type}</div>
                    <div className="id">{d[e].region}</div>
                    <div className="id">{d[e].store_type==="surrounding"?`${d[e].distance}mi`:""}</div>
                    <div className="id">{d[e].store_type==="surrounding"?d[e].closest_host_id:""}</div>
            <div className="name" style={{textAlign:'left', justifyContent:'flex-start', alignItems:'flex-start', overflowY:'scroll'}}><span style={{backgroundColor:'black', margin:'4px', color:'white'}}>{arrayOfSurr.length>0?arrayOfSurr.length:""} </span>{arrayOfSurr.length>0?arrayOfSurr.splice(1):null}</div>
                </div>
            )
        })
        setTotals({
            hosts:tH,
            surrounding:tS,
            general:temp.length - tH - tS
        })
        setItems(temp)
    }

    useEffect(() => {
        getData()
        getStoreData()
    }, [])

    useEffect(()=>{
        if(stores){
            getHosts()
        }
    },[stores])

    useEffect(()=>{
        makeItems(completeStores)
    },[completeStores])

    return (
        <div className="flex">
            <Header isAdmin={props.isAdmin} loginAdmin={props.loginAdmin}/>

            <h3 className="title">Store Report Page</h3>
            <div className="stats flex-row">
                <div className="name">Total Hosts: {totals.hosts}</div>
                <div className="name">Total Surrounding Stores: {totals.surrounding}</div>
                <div className="name">Total General Stores: {totals.general}</div>
            </div>
            
            <div className="item flex-row bar">
                <div className="id">Store ID</div>
                <div className="name">Store Name</div>
                <div className="region">Type</div>
                <div className="id">Region</div>
                <div className="id">Distance</div>
                <div className="id">Host ID</div>
                <div className="name">Surrounding IDs</div>
            </div>
            {items}
        </div>
    )
}
