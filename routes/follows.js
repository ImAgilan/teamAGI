// routes/follows.js
const express = require('express');
const followRouter = express.Router();
const followController = require('../controllers/followController');
const { protect } = require('../middleware/auth');
followRouter.post('/:userId', protect, followController.toggleFollow);
module.exports = followRouter;
