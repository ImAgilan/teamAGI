/**
 * Comment Controller
 */
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { sendNotification } = require('../config/socket');

// ── @POST /api/comments/:postId ───────────────────────────────
exports.addComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = await Comment.create({
      post: req.params.postId,
      author: req.user.id,
      content,
      parentComment: parentComment || null,
    });

    // Update counts
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentsCount: 1 } });
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, { $inc: { repliesCount: 1 } });
    }

    // Notification
    if (post.author.toString() !== req.user.id) {
      const notif = await Notification.create({
        recipient: post.author,
        sender: req.user.id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        text: 'commented on your post',
      });
      sendNotification(post.author.toString(), notif);
    }

    const populated = await comment.populate('author', 'username displayName avatar avatarUrl');
    res.status(201).json({ success: true, comment: populated });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/comments/:postId ────────────────────────────────
exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ post: req.params.postId, parentComment: null, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username displayName avatar avatarUrl');

    const total = await Comment.countDocuments({ post: req.params.postId, parentComment: null });

    res.json({ success: true, comments, total });
  } catch (err) {
    next(err);
  }
};

// ── @DELETE /api/comments/:id ─────────────────────────────────
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.isDeleted = true;
    await comment.save();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
};

// ── @POST /api/comments/:id/like ──────────────────────────────
exports.toggleLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const userId = req.user.id;
    const isLiked = comment.likes.some((id) => id.toString() === userId);

    if (isLiked) {
      comment.likes.pull(userId);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
    } else {
      comment.likes.push(userId);
      comment.likesCount += 1;
    }

    await comment.save();
    res.json({ success: true, isLiked: !isLiked, likesCount: comment.likesCount });
  } catch (err) {
    next(err);
  }
};
