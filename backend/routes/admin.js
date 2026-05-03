const express = require('express');
const { User, SafetyAlert, Session, MoodHistory, Journal } = require('../models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

router.use(verifyToken, requireAdmin);

/**
 * Platform statistics
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalSessions, openAlerts, totalMoodEntries, totalJournals] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Session.countDocuments(),
      SafetyAlert.countDocuments({ status: 'open' }),
      MoodHistory.countDocuments(),
      Journal.countDocuments(),
    ]);

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const [newUsersThisWeek, moodEntriesThisWeek] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: last7Days } }),
      MoodHistory.countDocuments({ date: { $gte: last7Days } }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSessions,
        openAlerts,
        totalMoodEntries,
        totalJournals,
        newUsersThisWeek,
        moodEntriesThisWeek,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * List all users
 * GET /api/admin/users?page=1&limit=20
 */
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('fullName email role isActive mentalHealthProfile createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({ success: true, users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

/**
 * Toggle user active status
 * PUT /api/admin/users/:id/toggle-active
 */
router.put('/users/:id/toggle-active', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
});

/**
 * List safety alerts
 * GET /api/admin/safety-alerts?status=open&riskLevel=high
 */
router.get('/safety-alerts', async (req, res, next) => {
  try {
    const { status, riskLevel, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const alerts = await SafetyAlert.find(filter)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SafetyAlert.countDocuments(filter);

    res.json({ success: true, alerts, total });
  } catch (error) {
    next(error);
  }
});

/**
 * Review / resolve a safety alert
 * PUT /api/admin/safety-alerts/:id/review
 * Body: { status, actionTaken, reviewNotes }
 */
router.put('/safety-alerts/:id/review', async (req, res, next) => {
  try {
    const { status, actionTaken, reviewNotes } = req.body;

    const alert = await SafetyAlert.findByIdAndUpdate(
      req.params.id,
      {
        status: status || 'resolved',
        actionTaken: actionTaken || 'pending_review',
        reviewNotes,
        reviewedByAdmin: true,
        reviewedAt: new Date(),
        reviewedBy: req.user.userId,
      },
      { new: true }
    ).populate('userId', 'fullName email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
