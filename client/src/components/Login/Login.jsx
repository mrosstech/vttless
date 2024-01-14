import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate, useContext, useLocation } from "react";
//import useAuth from "../../hooks/auth";
import axios from "axios";

const Login = (setUser) => {
    //const navigate = useNavigate();
    //const location = useLocation();
    //const from = location.state?.from?.pathname || "/linkpage";
    //const {auth, setAuth} = useAuth();
    const [username, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const API = axios.create({
        baseURL: process.env.REACT_APP_BACKEND_BASE_URL,
    });


    //const backendUrlLogin = process.env.REACT_APP_BACKEND_BASE_URL + "/auth/login";
    const handleLoginFormSubmit =  (event, err) => {
        console.log("Handling form submit event...");
        event.preventDefault();
        
        try {
            const res =  API.post("/auth/login", {
                username,
                password,
            }).then((res) => {
                if (res?.data.username) {
                    const role = res?.data.role[0].name;
                    setUser({username: res.data.username, role: role });
                    setName("");
                    setPassword("");
                    //navigate(from, { replace: true });

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
            <div className="wrapper">
                <div className="left">
                    <h1 className="loginTitle">Login</h1>
                    <form onSubmit={handleLoginFormSubmit}>
                        <div>
                            <input className="w-56" id="username" name="username" type="text" />
                        </div>
                        <div>
                            <input className="w-56" id="password" name="password" type="password" />
                        </div>
                        <div>
                            <button onClick={(e) => {e.stopPropagation()}} className="btn bg-btn-color w-56 h-14 shadow-btn text-2xl mb-5 font-mono" type="submit">Login</button>
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