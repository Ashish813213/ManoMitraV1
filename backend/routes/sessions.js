const express = require('express');
const { Session, Therapist } = require('../models');
const { verifyToken } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

function generateMeetingLink() {
  return `https://meet.manomitra.in/${crypto.randomUUID()}`;
}

function checkConflict(therapistId, scheduledAt, durationMinutes, excludeSessionId = null) {
  const filter = {
    therapistId,
    status: { $in: ['scheduled', 'completed'] },
    $or: [
      {
        scheduledAt: {
          $gte: new Date(new Date(scheduledAt).getTime() - durationMinutes * 60000),
          $lt: new Date(scheduledAt),
        },
      },
      {
        $and: [
          { scheduledAt: { $lte: new Date(scheduledAt) } },
          {
            scheduledAt: {
              $gt: new Date(new Date(scheduledAt).getTime() - durationMinutes * 60000),
            },
          },
        ],
      },
    ],
  };
  if (excludeSessionId) {
    filter._id = { $ne: excludeSessionId };
  }
  return Session.findOne(filter);
}

/**
 * Create a new session booking
 * POST /api/sessions
 * Body: { therapistId, scheduledAt, durationMinutes?, notes? }
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { therapistId, scheduledAt, durationMinutes = 60, notes } = req.body;

    if (!therapistId || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'therapistId and scheduledAt are required',
      });
    }

    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    const sessionTime = new Date(scheduledAt);
    const conflict = await checkConflict(therapistId, sessionTime, durationMinutes);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Time slot conflicts with existing session',
        conflictingSessionId: conflict._id,
      });
    }

    const session = new Session({
      userId: req.user.userId,
      therapistId,
      scheduledAt: sessionTime,
      durationMinutes,
      meetingLink: generateMeetingLink(),
      sessionNotes: notes,
      amount: therapist.hourlyRate * (durationMinutes / 60),
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Session booked successfully',
      session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user's sessions
 * GET /api/sessions
 * Query: status, upcoming, past
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filter = { userId: req.user.userId };

    if (status) {
      filter.status = status;
    }

    if (type === 'upcoming') {
      filter.scheduledAt = { $gte: new Date() };
      filter.status = 'scheduled';
    } else if (type === 'past') {
      filter.scheduledAt = { $lt: new Date() };
    }

    const sessions = await Session.find(filter)
      .populate('therapistId', 'specialization hourlyRate bio')
      .populate('therapistId.userId', 'fullName email profile')
      .sort({ scheduledAt: type === 'past' ? -1 : 1 });

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get single session
 * GET /api/sessions/:id
 */
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('therapistId')
      .populate('userId', 'fullName email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.userId.toString() !== req.user.userId && session.therapistId.userId?.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update session (cancel, complete, add rating/feedback)
 * PUT /api/sessions/:id
 * Body: { status?, rating?, feedback?, cancellationReason? }
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const { status, rating, feedback, cancellationReason } = req.body;

    if (session.userId.toString() !== req.user.userId && session.therapistId.userId?.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (status === 'cancelled') {
      session.status = 'cancelled';
      session.cancelledAt = new Date();
      session.cancelledBy = 'user';
      session.cancellationReason = cancellationReason;
    } else if (status === 'completed') {
      session.status = 'completed';
    } else if (rating !== undefined) {
      session.rating = rating;
      if (feedback) {
        session.feedback = feedback;
      }
      const Therapist = require('../models').Therapist;
      await Therapist.findByIdAndUpdate(session.therapistId, {
        $inc: { totalSessions: 1, totalReviews: 1 },
        $set: { rating: rating },
      });
    }

    await session.save();

    res.json({
      success: true,
      message: 'Session updated',
      session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel session
 * POST /api/sessions/:id/cancel
 * Body: { reason? }
 */
router.post('/:id/cancel', verifyToken, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled sessions can be cancelled',
      });
    }

    session.status = 'cancelled';
    session.cancelledAt = new Date();
    session.cancelledBy = 'user';
    session.cancellationReason = req.body.reason;

    await session.save();

    res.json({
      success: true,
      message: 'Session cancelled',
      session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark session as completed (therapist only)
 * POST /api/sessions/:id/complete
 */
router.post('/:id/complete', verifyToken, async (req, res, next) => {
  try {
    const { Session, Therapist } = require('../models');
    const session = await Session.findById(req.params.id).populate('therapistId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    const therapistUserId = session.therapistId.userId?._id || session.therapistId.userId;
    if (therapistUserId?.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the therapist can mark session as completed',
      });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled sessions can be completed',
      });
    }

    session.status = 'completed';
    await session.save();

    res.json({
      success: true,
      message: 'Session completed',
      session,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Add rating and feedback
 * POST /api/sessions/:id/rate
 * Body: { rating (1-5), feedback? }
 */
router.post('/:id/rate', verifyToken, async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed sessions',
      });
    }

    session.rating = rating;
    if (feedback) {
      session.feedback = feedback;
    }

    await session.save();

    const Therapist = require('../models').Therapist;
    const therapist = await Therapist.findById(session.therapistId);
    if (therapist) {
      const allRatings = await Session.find({
        therapistId: session.therapistId,
        rating: { $exists: true },
      });
      const avgRating = allRatings.reduce((sum, s) => sum + s.rating, 0) / allRatings.length;
      therapist.rating = Math.round(avgRating * 10) / 10;
      therapist.totalSessions += 1;
      therapist.totalReviews += 1;
      await therapist.save();
    }

    res.json({
      success: true,
      message: 'Rating submitted',
      session,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;