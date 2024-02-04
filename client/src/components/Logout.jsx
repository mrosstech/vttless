import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
//import { useNavigate, useContext, useLocation } from "react";
//import useAuth from "../../hooks/auth";
import axios from "axios";

const Logout = ({setUser}) => {

    const API = axios.create({
        baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
    });

    useEffect(() => {
        const res =  API.get("/auth/logout", {}).then((res) => {
            if (res.status == 202) {
                console.log("User logged out");
            } else {
                console.log("Problem logging out");
            }
        });
        setUser(null);
    }, []);

    

    // TODO: Add some logic to remove the local cookie for the JWT.

}

export default Logout;