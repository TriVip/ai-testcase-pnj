import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://127.0.0.1:9999', {
    withCredentials: true,
    autoConnect: false, // We'll connect manually when needed
});

export default socket;
