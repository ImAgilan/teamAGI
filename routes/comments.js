const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { commentValidation } = require('../middleware/validators');

router.post('/:postId', protect, commentValidation, commentController.addComment);
router.get('/:postId', protect, commentController.getComments);
router.delete('/:id', protect, commentController.deleteComment);
router.post('/:id/like', protect, commentController.toggleLike);

module.exports = router;
