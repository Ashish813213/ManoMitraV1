const express = require('express');
const { Notification } = require('../models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Get user notifications
 * GET /api/notifications?limit=20&unreadOnly=false
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const filter = { userId };
    if (unreadOnly) filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', verifyToken, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
router.put('/read-all', verifyToken, async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
