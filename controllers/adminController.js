/**
 * Admin Controller
 * Dashboard analytics, user/post management
 */
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// ── @GET /api/admin/analytics ─────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalPosts,
      postsToday,
      totalComments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isBanned: true }),
      Post.countDocuments({}, { includeDeleted: true }),
      Post.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Comment.countDocuments(),
    ]);

    // Users joined per day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const postGrowth = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top posts by engagement
    const topPosts = await Post.find()
      .sort({ likesCount: -1, commentsCount: -1 })
      .limit(5)
      .populate('author', 'username displayName avatar avatarUrl')
      .setOptions({ includeDeleted: true });

    res.json({
      success: true,
      analytics: {
        users: { total: totalUsers, active: activeUsers, banned: bannedUsers },
        posts: { total: totalPosts, today: postsToday },
        comments: { total: totalComments },
        charts: { userGrowth, postGrowth },
        topPosts,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/admin/users ─────────────────────────────────────
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const filter = {};
    if (search) filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) filter.role = role;
    if (status === 'banned') filter.isBanned = true;
    if (status === 'active') filter.isActive = true;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// ── @PUT /api/admin/users/:id/ban ────────────────────────────
exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot ban admin' });

    user.isBanned = true;
    user.bannedReason = reason || 'Violation of community guidelines';
    user.refreshToken = null;
    await user.save();

    res.json({ success: true, message: `User @${user.username} has been banned` });
  } catch (err) {
    next(err);
  }
};

// ── @PUT /api/admin/users/:id/unban ──────────────────────────
exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, bannedReason: null },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: `User @${user.username} has been unbanned` });
  } catch (err) {
    next(err);
  }
};

// ── @PUT /api/admin/users/:id/role ───────────────────────────
exports.changeRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/admin/posts ─────────────────────────────────────
exports.getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await Post.find({}, null, { includeDeleted: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'username displayName avatar avatarUrl');

    const total = await Post.countDocuments({}, { includeDeleted: true });
    res.json({ success: true, posts, total });
  } catch (err) {
    next(err);
  }
};

// ── @DELETE /api/admin/posts/:id ──────────────────────────────
exports.removePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, isModerated: true, moderationReason: req.body.reason },
      { new: true }
    ).setOptions({ includeDeleted: true });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, message: 'Post removed by admin' });
  } catch (err) {
    next(err);
  }
};
