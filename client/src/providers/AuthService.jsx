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
    return api.post("/auth/login", {
        username,
        password,
    })
    .then((response) => {
        if (response.data.user) {
            localStorage.setItem("vttless-user", JSON.stringify(response.data));
        }

        return response.data;
    });
}

const logout = () => {
    localStorage.removeItem("vttless-user");
    
    return api.get("/auth/logout").then((response) => {
        return response.data;
    });
}

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("vttless-user"));
}

const AuthService = {
    register,
    login,
    logout,
    getCurrentUser
}

export default AuthService;
