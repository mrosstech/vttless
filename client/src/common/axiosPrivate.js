// Respond to 401 Unauthorized error globally to redirect to login page if user is unauthorized.
import axios from 'axios';


// Set default parameters for axios operation.
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_BASE_URL;
axios.defaults.headers = {'Content-Type': 'application/json'};
axios.defaults.withCredentials = true;

// axios.interceptors.response.use( (res) => {
//     // if there was no error, then just return the response.
//     return Promise.resolve(res);
// }, (error) => {
//     console.log('Got a 401 response back. Axios automatically edirecting to login page');
//     // If there was error, do something
//     if (error != null && error.status == 401) {

//     }
//     return Promise.reject(error);
// });
