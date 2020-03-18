import React from 'react';

import { BrowserRouter, Route, Switch, Link, Redirect } from "react-router-dom";
import './App.css';
import { Home } from './components/Home';
import { SupervisorsPage } from './components/SupervisorsPage';
import { StorePage } from './components/StorePage';
import { IndividualPage } from './components/IndividualPage';
import Axios from 'axios';


function App() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [auth, setAuth] = React.useState(false);
  const [token, setToken] = React.useState('')
  let tkn = localStorage.getItem('token')

  const login = str => 
  {
    Axios.post(`/supervisors/login`, {"id":10000, "password":str})
    .then(d=>{
      let jwt = d.data.token
      localStorage.setItem('token', jwt)
      setToken(jwt)
      
    })
    .catch(err=>console.log('which?',err))
  }


  React.useEffect(()=>{
    //check if logged in
    
    if(tkn){
      setToken(tkn)
    }
    
  },[])

  React.useEffect(()=>{
    if(tkn){
      setAuth(true)
    }
    
  },[token])




  return (
    <div className="App">
      
      {/* //Router for navigation and auth */}
      <BrowserRouter>
        <Switch>
          <Route path="/" exact>
            <Home login={login} isAdmin={isAdmin}/>
          </Route>
          <Route path="/supervisor_report" exact>
            {auth?<SupervisorsPage auth={auth}/>:<Redirect to="/"/>}
          </Route>
          <Route path="/individual/:userID" exact>
          {auth?<IndividualPage auth={auth}/>:<Redirect to="/"/>}
          </Route>
          <Route path="/store_report" exact>
          {auth?<StorePage auth={auth}/>:<Redirect to="/"/>}
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
