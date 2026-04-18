/**
 * Socket.io Configuration
 * Handles real-time messaging and notifications
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

// Map: userId => Set of socketIds (supports multiple tabs)
const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Auth Middleware ──────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌 Socket connected: ${socket.id} [user: ${userId}]`);

    // Track online users
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId });

    // Join personal room for targeted events
    socket.join(`user:${userId}`);

    // ── Messaging ──────────────────────────────────────────
    socket.on('message:send', (data) => {
      // Emit to recipient's personal room
      io.to(`user:${data.recipientId}`).emit('message:receive', data);
    });

    socket.on('message:typing', ({ recipientId, isTyping }) => {
      io.to(`user:${recipientId}`).emit('message:typing', {
        senderId: userId,
        isTyping,
      });
    });

    // ── Disconnect ─────────────────────────────────────────
    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Send real-time notification to a user
const sendNotification = (recipientId, notification) => {
  if (io) {
    io.to(`user:${recipientId}`).emit('notification:new', notification);
  }
};

// Check if user is online
const isUserOnline = (userId) => onlineUsers.has(userId);

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, sendNotification, isUserOnline, getIO };
