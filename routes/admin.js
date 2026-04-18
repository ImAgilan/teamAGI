const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const adminOnly = [protect, restrictTo('admin')];

router.get('/analytics', ...adminOnly, adminController.getAnalytics);
router.get('/users', ...adminOnly, adminController.getUsers);
router.put('/users/:id/ban', ...adminOnly, adminController.banUser);
router.put('/users/:id/unban', ...adminOnly, adminController.unbanUser);
router.put('/users/:id/role', ...adminOnly, adminController.changeRole);
router.get('/posts', ...adminOnly, adminController.getPosts);
router.delete('/posts/:id', ...adminOnly, adminController.removePost);

module.exports = router;
