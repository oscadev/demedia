import React from 'react'
import {Link} from 'react-router-dom'

export const Header = (props) => {
    return (
        //Create header with navigation tabs and logged-in status
        <header className="header flex-row">
            <div className="tab flex">
                <Link to='/supervisor_report'>
                    <div className="tab flex">Supervisor Reports</div>
                </Link>
            </div>
            <div className="tab flex">
                <Link to='/store_report'>
                    <div className="tab flex">Store Reports</div>
                </Link>
            </div>
            {props.isAdmin?
                <div className="logged" onClick={()=>props.loginAdmin('wrong')}>
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
