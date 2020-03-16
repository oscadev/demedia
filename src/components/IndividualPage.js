import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { useParams } from 'react-router-dom'
import { Header } from './Header'

//Individual Supervisor Form
export const IndividualPage = (props) => {
    const [items, setItems] = useState([])
    const [surroundingItems, setSurroundingItems] = useState([])
    const [userData, setUserData] = useState(null)
    const [storeData, setStoreData] = useState(null)
    const [name, setName] = useState('')
    const [region, setRegion] = useState('')
    const [chosen, setChosen] = useState(null)
    const [chosenName, setChosenName] = useState(null)
    const [options, setOptions] = useState([])
    const [inputVal, setInputVal] = useState('')
    const [dic, setDic] = useState(null);
    const [dicFlipped, setDicFlipped] = useState(null);
    let { userID } = useParams();

  

    //Get data for specific supervisor
    const getData = () => 
    {
        Axios.get(`/supervisor/${userID}`)
        .then(res=>{
            setUserData(res.data)
        })
        .catch(err=>console.log(err))
    }

    const getStoreData = (reg) =>
    {
        Axios.get(`/stores/${reg}`)
        .then(res=>
            {
                if(res.data.length)
                setStoreData(res.data)
            })
        .catch(err=>console.log(err))
    }

    //Fetch host that is currently selected by the supervisor, if there is one, and update state.
    const getCurrentChosen = () => 
    {
        Axios.get( `/userstore/${userID}`)
        .then(res=>
            {
                if(res.data.length)
                {
                    setChosen(res.data[0].store_id);
                    
                    
                }
                else
                {
                    setChosen(res.data);
                }
            });
    };

    //Create and render the list of stores
    const makeItems = (d) => 
    {
        let temp = [];
        let tempOpts = [];
        let currName = null;
        let dictionary = {};
        let dictionaryFlipped = {};
        d.forEach((e,i)=>
        {
            //Make dictionaries to convert ids to names and vice-versa
            dictionary[e.name] = e.id;
            dictionaryFlipped[e.id] = e.name;
            if(e.id===chosen)
            {
                currName = e.name;
            }
            temp.push
            (
                <div className="flex-row item store" key={i} onClick={()=>{chooseStore(e.id)}} style={{backgroundColor:e.id===chosen?'green':'white'}}>
                    <div className="id">
                        {e.id}
                    </div>
                    <div className="name flex">
                        {e.name}
                    </div>
                    <div className="region">
                        {e.ship_city}
                    </div>
                </div>
            )
            tempOpts.push(
                <option value={e.name} key={i}/>
            );
        })
        setDic(dictionary);
        setDicFlipped(dictionaryFlipped);
        setChosenName(currName);
        setItems(temp);
        setOptions(tempOpts);
    }

    //Select a store as host and remove a store and validate that it exists, and is in same region as supervisor
    const chooseStore = (storeID, regi) => 
    {
        //On either an empty string, or when explicitly sent "remove", remove the chosen store
        if (storeID==='' || storeID==="remove")
        {
            storeID="remove";
            Axios.post(`/removehost/${userID}/${regi}`)
            .then(d=>
                {
                    getCurrentChosen()
                    setSurroundingItems([])
                    getData()
                    return
                })
        }
        //If the id passed is a string rather than number, convert to number with dictionary
        else if (isNaN(storeID))
        {
            if(dic[storeID])
            {
                storeID = dic[storeID];
                Axios.post(`/chosenstore/${userID}/${storeID}`)
                .then(res=>
                    {
                        getData()
                    })
            }
            //If it is a string, but not a valid string, or not a string in region
            else
            {
                alert(`${storeID} doesn't exist.`)
                setInputVal('')
                return
            }
        }
        // All remaining & dont run when "remove" is explicit
        else if(storeID!=="remove")
        {

            Axios.post(`/chosenstore/${userID}/${storeID}`)
            .then(res=>
                {
                    getCurrentChosen();
                    getData();
                })
        }
    }

    const getSurrounding = (hostid) => 
    {
        Axios.get(`/surrounding/${hostid}`).then(d=>
            {
                makeSurrounding(d.data);
            })
            .catch(err=>console.log(err));
    }

    const makeSurrounding = (arr) =>
    {
        let temp = [];
        arr.forEach((e,i)=>
        {
            if(e.store_type==="surrounding")
            {
                temp.push
                (
                    <div className="surrounding flex-row item" key={i}>
                        <div className="name">
                            {dicFlipped[e.store_id]}
                        </div>
                        <div className="region">
                            {e.distance} miles away
                        </div>
                    </div>
                );
            };
            
        });
        setSurroundingItems(temp);
    }

    useEffect(() => 
    {
        getData();
        
    }, []);

    useEffect(()=>
    {
        if(userData)
        {
            setName(userData[0].firstname + " " + userData[0].lastname );
            setRegion(userData[0].region);
            getStoreData(userData[0].region);
            getCurrentChosen();
            
        }
     
    },[userData]);

    useEffect(()=>{
        if(storeData && chosen){
            makeItems(storeData)

        
        }
        
    },[storeData, chosen]);

    useEffect(() => {
        if(dic)
        getSurrounding(chosen)
    }, [dic])



    return (
        <div className="flex">
            <Header isAdmin={props.isAdmin} loginAdmin={props.loginAdmin}/>
            <h3 className="title">
                Hello, {name}
            </h3>
            {items.length>0?
            <div>
                <h4 className="text">
                    Please pick a store (these are {region})
                    <br/>
                    You may click an option from the list below, or type it in the input field
                </h4>
            <h4 className="text" style={{color:chosenName?"green":"red"}}>
                Current host selected: {chosenName?chosenName:"none"} {chosenName?<button onClick={()=>chooseStore('remove', region)}>Remove</button>:null}
            </h4>
            <form onSubmit={(e)=>{e.preventDefault(); chooseStore(inputVal);}} className="flex-row">
                <input list="names" name="names" value={inputVal} onChange={(e)=>setInputVal(e.currentTarget.value)} className="textinput" autoComplete="off"/>
                <datalist id="names">
                    {options}
                </datalist>
                <input type="submit" className="btn"/>
            </form>
            <div className="surroundings flex" style={{display:surroundingItems.length>0?"":"none"}}>
                <h3>Stores within 15 miles of {chosenName}</h3>
                {surroundingItems}
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
                        CITY
                    </div>
                </div>
                    {items}
            </div>
            </div>
            :
            <div>
                There are no stores in your region ({region}) at this time.
            </div>}
        </div>
    )
}
