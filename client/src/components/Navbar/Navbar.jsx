import { Link } from "react-router-dom";
import vttlessicon from "../../assets/vttless_orange.jpg";

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
                <input type="checkbox" id="checkbox_toggle" />
                <label for="checkbox_toggle" className="hamburger">&#9776</label>

                <div className="menu">
                    <li className="block py-2 px-3 text-white">
                        <img src={vttlessicon} alt="" className="avatarImage" />
                    </li>
                    <li className="block py-2 px-3 text-white">{user.username}</li>
                    <li className="block py-2 px-3 text-white"><Link className="menuLink" to="logout">Logout</Link></li>
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