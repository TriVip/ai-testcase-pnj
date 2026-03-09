import { io } from 'socket.io-client';

const socket = io({
    path: '/socket.io',
    withCredentials: true,
    autoConnect: false, // We'll connect manually when needed
});

export default socket;
