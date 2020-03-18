import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import { Link } from 'react-router-dom';
import { Header } from './Header';

//Supervisor Report Page
export const SupervisorsPage = (props) => {
    const [items, setItems] = useState([]);
    const [data, setData] = useState([]);
    const [totalHosts, setTotalHosts] = useState(null);
    const [totalUsersWithHost, setTotalUsersWithHost] = useState(0);
    const [participation, setParticipation] = useState(0);

    // Get supervisors DB data
    const getAllSupervisors = () => {
        let tkn = localStorage.getItem('token')
        const headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + tkn
        }
        
        console.log("TOKEN IS: ", tkn )
        Axios.get('/supervisors', {headers:headers}).then((res) => {
        setData(res.data.results);
        })
        .catch((err) => console.log(err));
    };

    //Count supervisors that have chosen hosts and where host isnt null
    const getTotalHosts = () => {
        Axios.get('/hosts').then((d) => 
        {
            let notNull = 0;
            console.log(d.data.results)
            d.data.results.forEach((e) => {
                if (e.store_id) {
                notNull++;
                }
            });
            setTotalHosts(notNull);
        });
    };

    const getParticipation = (arr) => 
    {
        Axios.get('/supervisorstore')
        .then((d) => 
        {

            // Find not null in case a user is in the user_store db, but has a store_id of null
            let notNull = 0;
            d.data.results.forEach((e) => 
            {
                if (e.store_id) 
                {
                    notNull++;
                }
            });
            setTotalUsersWithHost(d.data.length);
        });
    };

    // Create and Render the visible list items
    const makeItems = (d) => {
        const temp = [];
        d.forEach((e, i) => {
        temp.push(
            <div className="flex-row item" key={i}>
                <div className="id">
                    {e.id}
                </div>
                <div className="name flex">
                    {e.firstname} {e.lastname}
                </div>
                <div className="region">{e.region}</div>
                <Link to={`/individual/${e.id}`} style={{ textDecoration: 'none' }}>
                    <button className="btn">
                        View
                    </button>
                </Link>
            </div>,
        );
        });
        setItems(temp);
    };

    // Get initial data when component mounts
    useEffect(() => {
        getAllSupervisors();
    },[]);

  // Run these functions that require data to be fetched first
    useEffect(() => {
        makeItems(data);
        getTotalHosts();
        getParticipation(data);
    },[data]);

  // Make participation percentage after we have needed values
    useEffect(() => {
        if (totalHosts) {
            setParticipation((totalHosts / data.length * 100).toFixed(2));
        }
    },[totalHosts]);

return  (
            <div className="flex">
                <Header isAdmin={props.isAdmin} loginAdmin={props.loginAdmin}/>
                <h3 className="">
                    Supervisor's Report
                </h3>
                <div className="flex">
                    <div className="name">
                        Total Stores Hosting: {totalHosts}
                    </div>
                    <div className="name">
                        Total Supervisors With Host: {totalUsersWithHost}
                    </div>
                    <div className="name">
                        Supervisor Participation: {participation}
                    </div>
                </div>
                <div className="flex">
                    <div className="flex-row item bar">
                        <div className="id">
                            ID
                        </div>
                        <div className="name flex">
                            NAME
                        </div>
                        <div className="region">
                            REGION
                        </div>
                        <div className="gap"/>
                    </div>
                    {items}
                </div>
            </div>
        );
};
