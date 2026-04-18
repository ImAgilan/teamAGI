const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const { messageValidation } = require('../middleware/validators');

router.get('/conversations', protect, messageController.getConversations);
router.get('/:conversationId', protect, messageController.getMessages);
router.post('/send', protect, messageValidation, messageController.sendMessage);
router.delete('/:id', protect, messageController.deleteMessage);

module.exports = router;
