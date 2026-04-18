const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

router.get('/', protect, searchController.search);
router.get('/trending-hashtags', protect, searchController.getTrendingHashtags);
router.get('/hashtag/:tag', protect, searchController.getPostsByHashtag);

module.exports = router;
