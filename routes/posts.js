// ─── routes/posts.js ──────────────────────────────────────────
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middleware/auth');
const { uploadPost } = require('../config/cloudinary');

router.get('/feed', protect, postController.getFeed);
router.get('/trending', protect, postController.getTrending);
router.get('/bookmarks', protect, postController.getBookmarks);
router.get('/user/:userId', protect, postController.getUserPosts);
router.post('/', protect, uploadPost.array('media', 10), postController.createPost);
router.get('/:id', protect, postController.getPost);
router.put('/:id', protect, postController.updatePost);
router.delete('/:id', protect, postController.deletePost);
router.post('/:id/like', protect, postController.toggleLike);
router.post('/:id/repost', protect, postController.repost);
router.post('/:id/bookmark', protect, postController.toggleBookmark);

module.exports = router;
