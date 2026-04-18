/**
 * NEXUS Social Media Platform
 * Main Server Entry Point (PRODUCTION READY)
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Internal imports
const connectDB = require('./config/database');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const followRoutes = require('./routes/follows');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');

// Connect DB
connectDB();

// App + Server
const app = express();
const server = http.createServer(app);

// Socket setup
initSocket(server);

/* ─────────────────────────────
   SECURITY MIDDLEWARE
───────────────────────────── */
app.use(helmet());
app.use(mongoSanitize());

/* ─────────────────────────────
   CORS CONFIG (PRODUCTION SAFE)
───────────────────────────── */
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ─────────────────────────────
   BODY PARSER
───────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ─────────────────────────────
   LOGGING (DEV ONLY)
───────────────────────────── */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ─────────────────────────────
   RATE LIMITING
───────────────────────────── */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

/* ─────────────────────────────
   AUTH RATE LIMIT (STRICT)
───────────────────────────── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many auth attempts, try again later.'
  }
});

/* ─────────────────────────────
   API ROUTES
───────────────────────────── */
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

/* ─────────────────────────────
   HEALTH CHECK
───────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'NEXUS API is running 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/* ─────────────────────────────
   SERVE FRONTEND (REACT BUILD)
───────────────────────────── */
app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

/* ─────────────────────────────
   API 404 HANDLER ONLY
───────────────────────────── */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`
  });
});

/* ─────────────────────────────
   GLOBAL ERROR HANDLER
───────────────────────────── */
app.use(errorHandler);

/* ─────────────────────────────
   START SERVER
───────────────────────────── */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 NEXUS Server running on port ${PORT}`);
  console.log(`📡 API Base: /api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

/* ─────────────────────────────
   ERROR HANDLING
───────────────────────────── */
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = { app, server };