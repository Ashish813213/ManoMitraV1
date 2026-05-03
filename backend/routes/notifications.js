const express = require('express');
const { Notification } = require('../models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Get user notifications
 * GET /api/notifications
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;
    const filter = { userId: req.user.userId };

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      userId: req.user.userId,
      isRead: false,
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', verifyToken, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      notification,
    });
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
    await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', verifyToken, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.userId,
      isRead: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create notification (internal use)
 * POST /api/notifications/create
 */
router.post('/create', async (req, res, next) => {
  try {
    const { userId, type, title, message, link, data } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, type, title, and message are required',
      });
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      link,
      data,
    });

    await notification.save();

    req.app.get('io')?.to(`user:${userId}`).emit('notification', notification);

    res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;