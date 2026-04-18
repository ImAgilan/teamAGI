/**
 * Authentication & Authorization Middleware
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect: Require valid JWT ────────────────────────────────
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id).select('role isActive isBanned');
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });
    if (user.isBanned) return res.status(403).json({ success: false, message: 'Account is suspended' });

    req.user = { id: decoded.id, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

// ── Restrict to roles ─────────────────────────────────────────
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You do not have permission for this action' });
  }
  next();
};

// ── Optional auth (attach user if token present) ──────────────
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = { id: decoded.id };
      } catch {
        // Invalid token — proceed as unauthenticated
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
