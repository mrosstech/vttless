// Respond to 401 Unauthorized error globally to redirect to login page if user is unauthorized.
import axios from 'axios';
import { withRouter } from 'react-router-dom';

// Set default parameters for axios operation.
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_BASE_URL;
axios.defaults.headers = {'Content-Type': 'application/json'};
axios.defaults.withCredentials = true;

export const api = axios.create({
    
});

api.interceptors.response.use( (res) => {
    console.log("Interceptor but nothings wrong");
    // if there was no error, then just return the response.
    return Promise.resolve(res);
}, (error) => {
    console.log(error);
    console.log('Got a 401 response back. Axios automatically redirecting to login page');
    // If there was error, do something
    if (error.response.status === 401) {
        //alert("Not logged in");
        window.location.href = '/logout';
    }
    return Promise.reject(error);
});
