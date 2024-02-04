import { Link } from "react-router-dom";
import { useState } from "react";
//import { useNavigate, useContext, useLocation } from "react";
//import useAuth from "../../hooks/auth";
import axios from "axios";
import Cookies from 'js-cookie';

const Login = ({setUser}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    //console.log("Creating axios API connection");
    const API = axios.create({
        baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
    });

    const handleUsernameChange = (event) => {
        setUsername(event.target.value);
    }

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    }

    const handleLoginFormSubmit =  (event, err) => {
        //console.log("Event: " + event.data);
        if (err) {
            console.log("Error in handling form submit: " + err);
        }
        //console.log("Handling form submit event...");
        event.preventDefault();
        //console.log("Endpoint address: " + process.env.REACT_APP_BACKEND_BASE_URL);
        try {
            const res =  API.post("/auth/login", {
                username,
                password,
            }).then((res) => {
                console.log(res);
                if (res?.data.user.username) {
                    const role = res?.data.user.roles[0].name;
                    setUser({username: res?.data.user.username, role: role, token: res?.data.token });
                    //Cookies.set('vttless-token', res?.data.token, { expires: 7, secure: true});
                    setUsername("");
                    setPassword("");
                } else {
                    console.log("incorrect submission");
                    setError(res.message);
                }
            });
        } catch (err) {
            if (!err?.response) {
                setError("no server responded");
            } else {
                setError("user signin failed");
            }
        }
    };

    return (
        <div className="login">
            <div className="loginDiv">
                <div className="loginTitle"><p className="text-center">Get In Here! The game is starting!</p></div>
                <div>
                    <form className="loginForm" onSubmit={handleLoginFormSubmit}>
                        <div className="centeredDiv">
                            <input className="loginInput" id="username" name="username" type="text" onChange={handleUsernameChange} />
                        </div>
                        <div className="centeredDiv">
                            <input className="loginInput" id="password" name="password" type="password" onChange={handlePasswordChange} />
                        </div>
                        <div className="centeredDiv">
                            <button className="standardButton" type="submit">Enter the Realm</button>
                        </div>
                        <div>
                            <Link className="link" to="/signup">Don't have an account?  Sign up here.</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;