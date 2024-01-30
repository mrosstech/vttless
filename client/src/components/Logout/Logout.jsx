import { Link } from "react-router-dom";
import { useState } from "react";
//import { useNavigate, useContext, useLocation } from "react";
//import useAuth from "../../hooks/auth";
import axios from "axios";

const Logout = ({setUser}) => {
    setUser(null);
    // TODO: Add some logic to remove the local cookie for the JWT.

}

export default Logout;