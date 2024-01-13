import { Link } from "react-router-dom";
import vttlessicon from "../../assets/vttless_orange.jpg";

const Navbar = ({user}) => {
    return (
        <div className="navbar">
            <span className="logo">
                <Link className="link" to="/">vttLess</Link>
            </span>{
                user ? (
            
            <ul className="list">
                <li className="listItem">
                    <img src={vttlessicon} alt="" className="avatar" />
                </li>
                <li className="listItem">John Doe</li>
                <li className="listItem">Logout</li>
            </ul>
        ) : (<Link className="link" to="login">Login</Link>)  
    }
        </div>
    );
};
export default Navbar