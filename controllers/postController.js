/**
 * Post Controller
 * CRUD, feed, likes, shares, bookmarks
 */
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Hashtag = require('../models/Hashtag');
const Notification = require('../models/Notification');
const { deleteFile, getFileUrl } = require('../config/cloudinary');
const { sendNotification } = require('../config/socket');

// ── Helper: Update hashtag counts ────────────────────────────
const updateHashtags = async (tags) => {
  for (const tag of tags) {
    await Hashtag.findOneAndUpdate(
      { tag },
      { $inc: { postsCount: 1, recentPosts: 1 }, lastUsed: new Date() },
      { upsert: true, new: true }
    );
  }
};

// ── @POST /api/posts ──────────────────────────────────────────
exports.createPost = async (req, res, next) => {
  try {
    const { content, visibility, isDraft, location } = req.body;

    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: 'Post must have content or media' });
    }

    // Content moderation: basic keyword filter
    const banned = ['spam', 'xxx']; // extend as needed
    if (content && banned.some((w) => content.toLowerCase().includes(w))) {
      return res.status(400).json({ success: false, message: 'Content violates community guidelines' });
    }

    const hashtags = Post.extractHashtags(content);

    // getFileUrl works for both Cloudinary uploads (file.path) and memory storage (file.buffer)
    const media = (req.files || []).map((file) => {
      const fileData = getFileUrl(file);
      if (!fileData) return null;
      return {
        url:      fileData.url,
        publicId: fileData.publicId,
        type:     file.mimetype?.startsWith('video') ? 'video' : 'image',
      };
    }).filter(Boolean);

    const post = await Post.create({
      author: req.user.id,
      content,
      media,
      hashtags,
      visibility: visibility || 'public',
      isDraft: isDraft === 'true',
      location: location ? JSON.parse(location) : undefined,
    });

    // Update hashtag stats
    if (hashtags.length > 0) await updateHashtags(hashtags);

    // Increment user post count
    await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: 1 } });

    const populated = await post.populate('author', 'username displayName avatar avatarUrl');
    res.status(201).json({ success: true, post: populated });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/posts/feed ──────────────────────────────────────
exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user.id);
    const following = [...currentUser.following, req.user.id]; // Include own posts

    const posts = await Post.find({ author: { $in: following }, visibility: { $in: ['public', 'followers'] } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username displayName avatar avatarUrl isPrivate')
      .populate('originalPost', 'content author media')
      .lean();

    // Add isLiked flag
    const enriched = posts.map((p) => ({
      ...p,
      isLiked: p.likes.some((id) => id.toString() === req.user.id),
      isBookmarked: currentUser.bookmarks.some((id) => id.toString() === p._id.toString()),
    }));

    const total = await Post.countDocuments({ author: { $in: following } });

    res.json({
      success: true,
      posts: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/posts/trending ──────────────────────────────────
exports.getTrending = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000); // Last 48h

    const posts = await Post.find({ visibility: 'public', createdAt: { $gte: since } })
      .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username displayName avatar avatarUrl')
      .lean();

    const currentUser = await User.findById(req.user.id).select('bookmarks');
    const enriched = posts.map((p) => ({
      ...p,
      isLiked: p.likes.some((id) => id.toString() === req.user.id),
      isBookmarked: currentUser.bookmarks.some((id) => id.toString() === p._id.toString()),
    }));

    res.json({ success: true, posts: enriched });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/posts/:id ───────────────────────────────────────
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar avatarUrl followers')
      .populate('originalPost');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Increment view count
    await Post.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    res.json({
      success: true,
      post: {
        ...post.toObject(),
        isLiked: post.likes.some((id) => id.toString() === req.user.id),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── @PUT /api/posts/:id ───────────────────────────────────────
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { content, visibility, isDraft } = req.body;
    if (content) {
      post.hashtags = Post.extractHashtags(content);
      post.content = content;
    }
    if (visibility) post.visibility = visibility;
    if (isDraft !== undefined) post.isDraft = isDraft;

    await post.save();
    res.json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

// ── @DELETE /api/posts/:id ────────────────────────────────────
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const isOwner = post.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Soft delete + clean up media
    post.isDeleted = true;
    await post.save();
    for (const m of post.media) if (m.publicId) await deleteFile(m.publicId);

    await User.findByIdAndUpdate(post.author, { $inc: { postsCount: -1 } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

// ── @POST /api/posts/:id/like ─────────────────────────────────
exports.toggleLike = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const postId = req.params.id;
    const userId = req.user.id;
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Check current like state
    const post = await Post.findById(postId).select('likes likesCount author');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const isLiked = post.likes.some((id) => id.equals(userObjId));

    let updatedPost;
    if (isLiked) {
      // Unlike: atomic pull + decrement
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $pull: { likes: userObjId }, $inc: { likesCount: -1 } },
        { new: true, select: 'likesCount' }
      );
    } else {
      // Like: atomic addToSet + increment (addToSet prevents duplicates)
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: userObjId }, $inc: { likesCount: 1 } },
        { new: true, select: 'likesCount' }
      );

      // Notify post author (not self-likes)
      if (post.author.toString() !== userId) {
        try {
          const notif = await Notification.create({
            recipient: post.author,
            sender: userId,
            type: 'like',
            post: postId,
            text: 'liked your post',
          });
          sendNotification(post.author.toString(), notif);
        } catch {} // Non-critical
      }
    }

    const newLikesCount = Math.max(0, updatedPost?.likesCount ?? post.likesCount);
    res.json({ success: true, isLiked: !isLiked, likesCount: newLikesCount });
  } catch (err) {
    next(err);
  }
};

// ── @POST /api/posts/:id/repost ───────────────────────────────
exports.repost = async (req, res, next) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ success: false, message: 'Post not found' });

    const repost = await Post.create({
      author: req.user.id,
      content: req.body.content || '',
      isRepost: true,
      originalPost: originalPost._id,
      repostText: req.body.repostText,
    });

    await Post.findByIdAndUpdate(req.params.id, { $inc: { sharesCount: 1 } });
    await User.findByIdAndUpdate(req.user.id, { $inc: { postsCount: 1 } });

    res.status(201).json({ success: true, post: repost });
  } catch (err) {
    next(err);
  }
};

// ── @POST /api/posts/:id/bookmark ────────────────────────────
exports.toggleBookmark = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const postId = req.params.id;
    const isBookmarked = user.bookmarks.some((id) => id.toString() === postId);

    if (isBookmarked) {
      user.bookmarks.pull(postId);
      await Post.findByIdAndUpdate(postId, { $inc: { bookmarksCount: -1 } });
    } else {
      user.bookmarks.push(postId);
      await Post.findByIdAndUpdate(postId, { $inc: { bookmarksCount: 1 } });
    }

    await user.save();
    res.json({ success: true, isBookmarked: !isBookmarked });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/posts/user/:userId ──────────────────────────────
exports.getUserPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username displayName avatar avatarUrl');

    const total = await Post.countDocuments({ author: req.params.userId });
    res.json({ success: true, posts, pagination: { page: parseInt(page), total } });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/posts/bookmarks ─────────────────────────────────
exports.getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'bookmarks',
      options: { sort: { createdAt: -1 } },
      populate: { path: 'author', select: 'username displayName avatar avatarUrl' },
    });
    res.json({ success: true, posts: user.bookmarks });
  } catch (err) {
    next(err);
  }
};
