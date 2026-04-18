/**
 * User Controller
 * Profile management, avatar/cover upload
 */
const User = require('../models/User');
const Post = require('../models/Post');
const { deleteFile, getFileUrl } = require('../config/cloudinary');

// ── @GET /api/users/:username ─────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -refreshToken -emailVerificationToken -passwordResetToken -passwordResetExpires');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isFollowing = user.followers.some((id) => id.toString() === req.user.id);
    const isOwn = user._id.toString() === req.user.id;

    res.json({ success: true, user: { ...user.toObject(), isFollowing, isOwn } });
  } catch (err) {
    next(err);
  }
};

// ── @PUT /api/users/profile ───────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['displayName', 'bio', 'website', 'location', 'dateOfBirth', 'isPrivate'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Handle preferences
    if (req.body.preferences) {
      updates['preferences'] = { ...req.body.preferences };
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toPublicProfile() });
  } catch (err) {
    next(err);
  }
};

// ── @POST /api/users/avatar ───────────────────────────────────
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Field name must be "avatar".' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete old avatar from Cloudinary (only if it was a real cloud URL)
    if (user.avatar?.publicId) await deleteFile(user.avatar.publicId);

    // Works for both Cloudinary (file.path = https URL) and memory storage (file.buffer)
    const fileData = getFileUrl(req.file);
    if (!fileData) {
      return res.status(400).json({ success: false, message: 'Could not process uploaded file' });
    }

    user.avatar = { url: fileData.url, publicId: fileData.publicId };
    await user.save();

    res.json({
      success: true,
      avatar: user.avatar,
      user: user.toPublicProfile(),
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadCover = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Field name must be "cover".' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.coverImage?.publicId) await deleteFile(user.coverImage.publicId);

    const fileData = getFileUrl(req.file);
    if (!fileData) {
      return res.status(400).json({ success: false, message: 'Could not process uploaded file' });
    }

    user.coverImage = { url: fileData.url, publicId: fileData.publicId };
    await user.save();

    res.json({
      success: true,
      coverImage: user.coverImage,
    });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/users/suggestions ──────────────────────────────
exports.getSuggestions = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const excluded = [...currentUser.following, req.user.id];

    const suggestions = await User.find({ _id: { $nin: excluded }, isActive: true, isBanned: false })
      .select('username displayName avatar avatarUrl bio followersCount')
      .sort({ followersCount: -1 })
      .limit(6);

    res.json({ success: true, suggestions });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/users/:id/followers ────────────────────────────
exports.getFollowers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.params.id)
      .populate({
        path: 'followers',
        select: 'username displayName avatar avatarUrl bio followersCount',
        options: { skip: (page - 1) * limit, limit: parseInt(limit) },
      });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, followers: user.followers, total: user.followersCount });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/users/:id/following ────────────────────────────
exports.getFollowing = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.params.id)
      .populate({
        path: 'following',
        select: 'username displayName avatar avatarUrl bio followersCount',
        options: { skip: (page - 1) * limit, limit: parseInt(limit) },
      });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, following: user.following, total: user.followingCount });
  } catch (err) {
    next(err);
  }
};

// ── @PUT /api/users/change-password ──────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    res.json({ success: true, message: 'Password changed. Please login again.' });
  } catch (err) {
    next(err);
  }
};

// ── @DELETE /api/users/account ────────────────────────────────
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Soft-delete
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.username = `deleted_${Date.now()}_${user.username}`;
    await user.save();

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};
