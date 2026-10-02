import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || undefined, {
    path: '/socket.io',
    withCredentials: true,
    autoConnect: false, // We'll connect manually when needed
});

export default socket;
