import { Link } from "react-router-dom";
import vttlessicon from "../assets/vttless_orange.jpg";

const Navbar = ({user}) => {
    return (
        <nav className="navbarBase">
            <span className="navbarLogo">
                <img src={vttlessicon} alt="" className="homeLogoIcon" />
                <Link className="homeLogo" to="/">vttLess</Link>
            </span>
            
            {
                user ? (
            
            <ul className="navbarLinks">
                <div className="menu">
                    <li className="menuList">
                        <img src={vttlessicon} alt="" className="avatarImage" />
                    </li>
                    <li className="menuList">{user.username}</li>
                    <li className="menuList"><Link className="menuLink" to="logout">Logout</Link></li>
                </div>
            </ul>
        ) : (<ul className="navbarLinks">
                <li><Link className="menuLink" to="login">Login</Link></li>
            </ul>
                )  
    }
                
        </nav>
    );
};
export default Navbar