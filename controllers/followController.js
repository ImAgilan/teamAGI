/**
 * Follow Controller
 */
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendNotification } = require('../config/socket');

// ── @POST /api/follows/:userId ────────────────────────────────
exports.toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.userId;
    const currentId = req.user.id;

    if (targetId === currentId) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentId),
      User.findById(targetId),
    ]);

    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    const isFollowing = currentUser.following.some((id) => id.toString() === targetId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetId);
      targetUser.followers.pull(currentId);
      currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
      targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
    } else {
      // Follow
      currentUser.following.push(targetId);
      targetUser.followers.push(currentId);
      currentUser.followingCount += 1;
      targetUser.followersCount += 1;

      // Send notification
      const notif = await Notification.create({
        recipient: targetId,
        sender: currentId,
        type: 'follow',
        text: 'started following you',
      });
      sendNotification(targetId, notif);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);
    res.json({ success: true, isFollowing: !isFollowing, followersCount: targetUser.followersCount });
  } catch (err) {
    next(err);
  }
};
