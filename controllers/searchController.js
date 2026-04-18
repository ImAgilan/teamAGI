/**
 * Search Controller
 * Users, posts, hashtags
 */
const User = require('../models/User');
const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');

// ── @GET /api/search?q=&type= ─────────────────────────────────
exports.search = async (req, res, next) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query required' });
    }

    const skip = (page - 1) * limit;
    const results = {};

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { displayName: { $regex: q, $options: 'i' } },
        ],
        isActive: true,
        isBanned: false,
      })
        .select('username displayName avatar avatarUrl bio followersCount')
        .limit(parseInt(limit))
        .skip(skip);
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        $text: { $search: q },
        visibility: 'public',
      })
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName avatar avatarUrl');
    }

    if (type === 'all' || type === 'hashtags') {
      // Search by hashtag (strip leading # if present)
      const tag = q.replace(/^#/, '').toLowerCase();
      results.hashtags = await Hashtag.find({ tag: { $regex: tag, $options: 'i' } })
        .sort({ postsCount: -1 })
        .limit(10);
    }

    res.json({ success: true, query: q, results });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/search/trending-hashtags ───────────────────────
exports.getTrendingHashtags = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
    const hashtags = await Hashtag.find({ lastUsed: { $gte: since } })
      .sort({ recentPosts: -1, postsCount: -1 })
      .limit(10);
    res.json({ success: true, hashtags });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/search/hashtag/:tag ────────────────────────────
exports.getPostsByHashtag = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const tag = req.params.tag.toLowerCase().replace(/^#/, '');

    const posts = await Post.find({ hashtags: tag, visibility: 'public' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'username displayName avatar avatarUrl');

    const total = await Post.countDocuments({ hashtags: tag, visibility: 'public' });
    res.json({ success: true, posts, total, tag });
  } catch (err) {
    next(err);
  }
};
