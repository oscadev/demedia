import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from './Header'

//Create Home Page with Login Text Field
export const Home = (props) => {
    const [value, setValue] = useState('')

    React.useEffect(() => {
        setValue('')
        
    }, [])

    return (
        <div className={'flex'}>
            <Header isAdmin={props.isAdmin} loginAdmin={props.loginAdmin}/>
            <h2 className="">
                Home Page
            </h2>
            <h3 className="">
                As intended, links work even when not logged in as Admin. Here is a sample link (but any of the links would work). The format in this example is "/individual/[supervisor id]"
            </h3>
            <Link to='/individual/113554'>
                Supervisor Page for Alaina Ramsay
            </Link>
            <form onSubmit={(e)=>{e.preventDefault(); props.login(value)}}>
                <input type="text" value={value} onChange={(e)=>setValue(e.currentTarget.value)} className="textinput"/>
                <input type="submit" value="Login" className="btn"/>
                <h3>
                    The password is "password"
                </h3>
            </form>
        </div>
    )
}
