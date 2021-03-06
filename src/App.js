import React from 'react';

import { BrowserRouter, Route, Switch, Link } from "react-router-dom";
import './App.css';
import { Home } from './components/Home';
import { SupervisorsPage } from './components/SupervisorsPage';
import { StorePage } from './components/StorePage';
import { IndividualPage } from './components/IndividualPage';
import Axios from 'axios';


function App() {
  const [isAdmin, setIsAdmin] = React.useState(false);


  //Attempt to login with a given string from input field
  const loginAdmin = (str) =>{
    if(str==='')
    {
      alert('wrong password')
        setIsAdmin(false)
        localStorage.setItem('admin', "false")
        return
    }
    else if(str==="wrong")
    {
      setIsAdmin(false)
      localStorage.setItem('admin', "false")
      alert("you logged out")
    }
    else
    {
      Axios.get(`/admin/${str}`)
      .then(d=>
        {
      console.log(d)
      if(d.data===true)
      {
        setIsAdmin(true)
        localStorage.setItem('admin', "true")
      }
      else
      {
        alert('wrong password')
        setIsAdmin(false)
        localStorage.setItem('admin', "false")
      }
      
    })
    }


    
  }

  React.useEffect(()=>{
    //check localstorage for login status

      if(localStorage.getItem('admin')==="false"){

      }else{
        setIsAdmin(true)
      }
      

    
  },[])




  return (
    <div className="App">
      
      {/* //Router for navigation and auth */}
      <BrowserRouter>
        <Switch>
          <Route path="/" exact>
            <Home loginAdmin={loginAdmin} isAdmin={isAdmin}/>
          </Route>
          <Route path="/supervisor_report" exact>
            {isAdmin?<SupervisorsPage loginAdmin={loginAdmin} isAdmin={isAdmin}/>:<Home loginAdmin={loginAdmin} isAdmin={isAdmin}/>}
          </Route>
          <Route path="/individual/:userID" exact>
            <IndividualPage loginAdmin={loginAdmin} isAdmin={isAdmin}/>
          </Route>
          <Route path="/store_report" exact>
            {isAdmin?<StorePage loginAdmin={loginAdmin} isAdmin={isAdmin}/>:<Home loginAdmin={loginAdmin} isAdmin={isAdmin}/>}
          </Route>
          <Route>
            <div>
              <h3>
                PAGE NOT FOUND: 404
              </h3>
              <h4>
                Valid directories include:
                "domain/", "domain/store_report", "domain/supervisor_report", and for individual supervisor pages: "domain/individual/[supervisor id]"
              </h4>
              <Link to="/">
                HOME
              </Link>
            </div>
          </Route>
        </Switch>
      </BrowserRouter>

    </div>
  );
}

export default App;
