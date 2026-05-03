const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Session, Therapist, User, Notification } = require('../models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Create a new therapy session booking
 * POST /api/sessions
 * Body: { therapistId, scheduledAt, durationMinutes? }
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { therapistId, scheduledAt, durationMinutes = 60 } = req.body;
    const userId = req.user.userId;

    if (!therapistId || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'therapistId and scheduledAt are required' });
    }

    const therapist = await Therapist.findById(therapistId).populate('userId', 'fullName');
    if (!therapist || !therapist.isActive) {
      return res.status(404).json({ success: false, message: 'Therapist not found' });
    }

    const requestedTime = new Date(scheduledAt);
    if (isNaN(requestedTime.getTime()) || requestedTime < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or past scheduledAt time' });
    }

    // Conflict detection: check if therapist is already booked within the requested time window
    const sessionEnd = new Date(requestedTime.getTime() + durationMinutes * 60 * 1000);
    const conflict = await Session.findOne({
      therapistId,
      status: { $in: ['scheduled'] },
      $or: [
        { scheduledAt: { $lt: sessionEnd, $gte: requestedTime } },
        {
          $and: [
            { scheduledAt: { $lt: requestedTime } },
            {
              $expr: {
                $gt: [
                  { $add: ['$scheduledAt', { $multiply: ['$durationMinutes', 60000] }] },
                  requestedTime.getTime(),
                ],
              },
            },
          ],
        },
      ],
    });

    if (conflict) {
      return res.status(409).json({ success: false, message: 'Therapist is already booked at that time' });
    }

    const meetingLink = `https://meet.manomitra.app/session/${uuidv4()}`;

    const session = await Session.create({
      userId,
      therapistId,
      scheduledAt: requestedTime,
      durationMinutes,
      meetingLink,
      status: 'scheduled',
      paymentStatus: 'pending',
    });

    // Create notification for the user
    await Notification.create({
      userId,
      type: 'session_reminder',
      title: 'Session Booked!',
      message: `Your therapy session with ${therapist.userId?.fullName || 'your therapist'} is scheduled for ${requestedTime.toLocaleString()}.`,
      link: '/therapy/sessions',
    });

    res.status(201).json({
      success: true,
      message: 'Session booked successfully',
      session,
      meetingLink,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * List user's sessions
 * GET /api/sessions?status=scheduled
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const filter = { userId };
    if (status) filter.status = status;

    const sessions = await Session.find(filter)
      .populate({ path: 'therapistId', populate: { path: 'userId', select: 'fullName email profile' } })
      .sort({ scheduledAt: 1 });

    res.json({ success: true, sessions, count: sessions.length });
  } catch (error) {
    next(error);
  }
});

/**
 * Get a single session
 * GET /api/sessions/:id
 */
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user.userId })
      .populate({ path: 'therapistId', populate: { path: 'userId', select: 'fullName email profile' } });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel a session
 * POST /api/sessions/:id/cancel
 * Body: { reason? }
 */
router.post('/:id/cancel', verifyToken, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const session = await Session.findOne({ _id: req.params.id, userId: req.user.userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'Only scheduled sessions can be cancelled' });
    }

    session.status = 'cancelled';
    session.cancelledAt = new Date();
    session.cancelledBy = 'user';
    session.cancellationReason = reason || '';
    await session.save();

    res.json({ success: true, message: 'Session cancelled', session });
  } catch (error) {
    next(error);
  }
});

/**
 * Submit session rating & feedback
 * POST /api/sessions/:id/rate
 * Body: { rating: 1-5, feedback? }
 */
router.post('/:id/rate', verifyToken, async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const session = await Session.findOne({ _id: req.params.id, userId: req.user.userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed sessions can be rated' });
    }

    session.rating = rating;
    session.feedback = feedback || '';
    await session.save();

    // Update therapist aggregate rating
    const therapistSessions = await Session.find({
      therapistId: session.therapistId,
      rating: { $exists: true, $gt: 0 },
    });
    const avgRating = therapistSessions.reduce((s, s2) => s + (s2.rating || 0), 0) / therapistSessions.length;

    await Therapist.findByIdAndUpdate(session.therapistId, {
      rating: parseFloat(avgRating.toFixed(2)),
      totalReviews: therapistSessions.length,
    });

    res.json({ success: true, message: 'Rating submitted', session });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
