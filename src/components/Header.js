import React from 'react'
import {Link} from 'react-router-dom'

export const Header = (props) => {
    return (
        //Create header with navigation tabs and logged-in status
        <header className="header flex-row">
            <div className="flex">
                <Link to='/'>
                    <div className="tab flex">Home</div>
                </Link>
            </div>
            <div className="flex">
                <Link to='/supervisor_report'>
                    <div className="tab flex">Supervisor Reports</div>
                </Link>
            </div>
            <div className="flex">
                <Link to='/store_report'>
                    <div className="tab flex">Store Reports</div>
                </Link>
            </div>
            {props.auth?
                <div className="logged" onClick={()=>props.logout()}>
                    {"Log Out of Admin"}
                </div>
                :
                <Link to="/">
                    <div className="logged">
                        Click to Login
                    </div>
                </Link>
            }
        </header>
    )
}
