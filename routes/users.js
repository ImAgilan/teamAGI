/**
 * User Routes — TeamAGI
 *
 * CRITICAL FIX: Route ordering matters in Express.
 * Specific named routes (e.g. /avatar, /cover, /profile, /suggestions)
 * MUST be defined BEFORE any wildcard param routes (e.g. /:username).
 *
 * If /:username is defined first, Express matches it for every request
 * including /avatar, /cover etc., treating "avatar" as a username.
 * This caused avatar/cover uploads to silently fail — multer never ran.
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { uploadAvatar, uploadCover } = require('../config/cloudinary');

// ── Named routes FIRST (before any /:param) ───────────────────

// Suggestions (must be before /:username)
router.get('/suggestions', protect, userController.getSuggestions);

// Profile update (must be before /:username)
router.put('/profile', protect, userController.updateProfile);

// Avatar upload — BEFORE /:username
router.post(
  '/avatar',
  protect,
  uploadAvatar.single('avatar'),
  userController.uploadAvatar
);

// Cover upload — BEFORE /:username
router.post(
  '/cover',
  protect,
  uploadCover.single('cover'),
  userController.uploadCover
);

// Password change — BEFORE /:username
router.put('/change-password', protect, userController.changePassword);

// Account delete — BEFORE /:username
router.delete('/account', protect, userController.deleteAccount);

// ── Wildcard param routes LAST ─────────────────────────────────

// Get followers / following by user ID
router.get('/:id/followers', protect, userController.getFollowers);
router.get('/:id/following', protect, userController.getFollowing);

// Get profile by username — MUST be last since it matches anything
router.get('/:username', protect, userController.getProfile);

module.exports = router;
