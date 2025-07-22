import { io } from 'socket.io-client';

// Use environment variable for socket URL, fallback to localhost for development
const URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4001';
export const socket = io(URL, {
    autoConnect: false
});