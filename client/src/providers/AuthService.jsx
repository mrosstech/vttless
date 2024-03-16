import axios from "axios";
import { api } from '../common/axiosPrivate'


const register = (username, email, password) => {
    return api.post("/auth/signup", {
        username,
        email,
        password
    });
}

const login = (username, password) => {
    console.log("Attempting login through AuthProvider");
    console.log("Using username: " + username);
    console.log("Using password: " + password);
    return api.post("/auth/login", {
        username,
        password,
    })
    .then((response) => {
        console.log("Got response back from API for login");
        console.log(response.data);
        if (response.data.user) {
            console.log("Detected username so setting the user object");
            localStorage.setItem("vttless-user", JSON.stringify(response.data));
        }

        return response.data;
    });
}

const logout = () => {
    console.log("Removing local user data");
    localStorage.removeItem("vttless-user");
    
    return api.get("/auth/logout").then((response) => {
        return response.data;
    });
}

const getCurrentUser = () => {
    console.log('AUTHSERVICE: Getting current user: ');
    console.log(localStorage.getItem("vttless-user"));
    return JSON.parse(localStorage.getItem("vttless-user"));
}

const AuthService = {
    register,
    login,
    logout,
    getCurrentUser
}

export default AuthService;
