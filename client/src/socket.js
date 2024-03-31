import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:4001';
console.log("socket called");
export const socket = io(URL, {
    autoConnect: false
});