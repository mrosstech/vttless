import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';


const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
        return null;
    }
}

const validateJwt = () => {
    try {
        axios.get('/auth/verify');
    } catch (e) {

    }
}

const AuthVerify = (props) => {
    let location = useLocation();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("vttless-user"));

        if (user) {
            const decodedJwt = parseJwt(user.accessToken);

            if (decodedJwt.exp * 1000 < Date.now()) {
                props.logOut();
            }
        }
    }, [location, props]);
    return;
};

export default AuthVerify;