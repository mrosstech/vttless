// client/src/utils/axiosPrivate.js
import axios from 'axios';

const axiosPrivate = axios.create();

axiosPrivate.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosPrivate;