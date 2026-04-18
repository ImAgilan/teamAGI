/**
 * Socket.io Client Service
 * Singleton socket connection with event management
 */
import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (accessToken) => {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || '', {
    auth: { token: accessToken },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const emitTyping = (recipientId, isTyping) => {
  socket?.emit('message:typing', { recipientId, isTyping });
};

export const emitMessage = (data) => {
  socket?.emit('message:send', data);
};
