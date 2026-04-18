/**
 * Message Controller
 * One-to-one conversations and real-time messaging
 */
const { Conversation, Message } = require('../models/Message');
const { getIO } = require('../config/socket');

// ── @GET /api/messages/conversations ─────────────────────────
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id, isActive: true })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username displayName avatar avatarUrl lastSeen')
      .populate('lastMessage');

    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
};

// ── @GET /api/messages/:conversationId ───────────────────────
exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId,
      isDeleted: false,
      deletedFor: { $ne: req.user.id },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'username displayName avatar avatarUrl');

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.conversationId, recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count
    conversation.unreadCounts.set(req.user.id, 0);
    await conversation.save();

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
};

// ── @POST /api/messages/send ──────────────────────────────────
exports.sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content, messageType = 'text', sharedPost } = req.body;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      recipient: recipientId,
      content,
      messageType,
      sharedPost,
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    const currentCount = conversation.unreadCounts.get(recipientId) || 0;
    conversation.unreadCounts.set(recipientId, currentCount + 1);
    await conversation.save();

    const populated = await message.populate('sender', 'username displayName avatar avatarUrl');

    // Emit via Socket.io
    try {
      const io = getIO();
      io.to(`user:${recipientId}`).emit('message:receive', {
        message: populated,
        conversationId: conversation._id,
      });
    } catch {}

    res.status(201).json({ success: true, message: populated, conversationId: conversation._id });
  } catch (err) {
    next(err);
  }
};

// ── @DELETE /api/messages/:id ─────────────────────────────────
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    // "Delete for me" only
    message.deletedFor.push(req.user.id);

    // If both parties deleted, fully remove
    if (message.deletedFor.length >= 2) message.isDeleted = true;
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};
