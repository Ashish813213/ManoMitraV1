const express = require('express');
const { User, Therapist, Session } = require('../models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all therapists
 * GET /api/therapists
 */
router.get('/', async (req, res, next) => {
  try {
    const { specialization, minRating, verified, language, limit = 20, offset = 0 } = req.query;
    const filter = { isActive: true };

    if (specialization) filter.specialization = specialization;
    if (verified === 'true') filter.isVerified = true;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (language) filter.languages = language;

    const therapists = await Therapist.find(filter)
      .populate('userId', 'fullName email profile')
      .sort({ rating: -1, totalSessions: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const total = await Therapist.countDocuments(filter);

    res.json({
      success: true,
      count: therapists.length,
      total,
      therapists,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get therapist by ID
 * GET /api/therapists/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.id)
      .populate('userId', 'fullName email profile');

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    res.json({
      success: true,
      therapist,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get therapist availability
 * GET /api/therapists/:id/availability
 */
router.get('/:id/availability', async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.id).select('availability');

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

    const dayAvailability = therapist.availability.find(
      (a) => a.day === dayName
    );

    if (!dayAvailability) {
      return res.json({
        success: true,
        available: false,
        slots: [],
        day: dayName,
      });
    }

    const startHour = parseInt(dayAvailability.startTime.split(':')[0]);
    const endHour = parseInt(dayAvailability.endTime.split(':')[0]);

    const existingSessions = await Session.find({
      therapistId: req.params.id,
      status: { $in: ['scheduled', 'completed'] },
      scheduledAt: {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      },
    }).select('scheduledAt durationMinutes');

    const bookedSlots = existingSessions.map((s) => {
      const hour = s.scheduledAt.getHours();
      return { hour, duration: s.durationMinutes };
    });

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      const isBooked = bookedSlots.some(
        (b) => b.hour === hour
      );
      if (!isBooked) {
        slots.push({
          time: `${hour}:00`,
          available: true,
        });
      }
    }

    res.json({
      success: true,
      available: slots.length > 0,
      day: dayName,
      slots,
      workingHours: {
        start: dayAvailability.startTime,
        end: dayAvailability.endTime,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get therapist reviews
 * GET /api/therapists/:id/reviews
 */
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const sessions = await Session.find({
      therapistId: req.params.id,
      rating: { $exists: true },
      feedback: { $exists: true },
    })
      .populate('userId', 'fullName profile.avatar')
      .sort({ updatedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const reviews = sessions.map((s) => ({
      _id: s._id,
      rating: s.rating,
      feedback: s.feedback,
      userName: s.userId?.fullName || 'Anonymous',
      userAvatar: s.userId?.profile?.avatar,
      date: s.updatedAt,
    }));

    const total = await Session.countDocuments({
      therapistId: req.params.id,
      rating: { $exists: true },
    });

    res.json({
      success: true,
      count: reviews.length,
      total,
      reviews,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get therapist stats
 * GET /api/therapists/:id/stats
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    const totalSessions = await Session.countDocuments({
      therapistId: req.params.id,
      status: { $in: ['scheduled', 'completed'] },
    });

    const completedSessions = await Session.countDocuments({
      therapistId: req.params.id,
      status: 'completed',
    });

    const totalReviews = await Session.countDocuments({
      therapistId: req.params.id,
      rating: { $exists: true },
    });

    const sessionsThisMonth = await Session.find({
      therapistId: req.params.id,
      status: 'completed',
      createdAt: {
        $gte: new Date(new Date().setDate(1)),
      },
    });

    const avgRating = await Session.aggregate([
      { $match: { therapistId: therapist._id, rating: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalSessions,
        completedSessions,
        totalReviews,
        sessionsThisMonth: sessionsThisMonth.length,
        rating: therapist.rating || 0,
        averageRating: avgRating[0]?.avg || 0,
        experienceYears: therapist.experienceYears,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get therapist sessions (therapist view)
 * GET /api/therapists/:id/sessions
 */
router.get('/:id/sessions', verifyToken, async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    const therapistUserId = therapist.userId?.toString();
    if (therapistUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { status, type, limit = 20, offset = 0 } = req.query;
    const filter = { therapistId: req.params.id };

    if (status) filter.status = status;

    if (type === 'upcoming') {
      filter.scheduledAt = { $gte: new Date() };
      filter.status = 'scheduled';
    } else if (type === 'past') {
      filter.scheduledAt = { $lt: new Date() };
    }

    const sessions = await Session.find(filter)
      .populate('userId', 'fullName email profile')
      .sort({ scheduledAt: type === 'past' ? -1 : 1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

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
 * Book therapy session (redirects to sessions API)
 * POST /api/therapists/:id/book
 */
router.post('/:id/book', verifyToken, async (req, res, next) => {
  try {
    const { scheduledAt, durationMinutes = 60, notes } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'scheduledAt is required',
      });
    }

    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    const sessionTime = new Date(scheduledAt);
    const conflict = await Session.findOne({
      therapistId: req.params.id,
      status: { $in: ['scheduled', 'completed'] },
      scheduledAt: {
        $gte: new Date(sessionTime.getTime() - durationMinutes * 60000),
        $lt: new Date(sessionTime.getTime() + durationMinutes * 60000),
      },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'Time slot not available',
      });
    }

    const crypto = require('crypto');
    const meetingLink = `https://meet.manomitra.in/${crypto.randomUUID()}`;

    const session = new Session({
      userId: req.user.userId,
      therapistId: req.params.id,
      scheduledAt: sessionTime,
      durationMinutes,
      meetingLink,
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
 * Update therapist profile (therapist only)
 * PUT /api/therapists/:id
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    const therapistUserId = therapist.userId?.toString();
    if (therapistUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const allowedUpdates = [
      'bio',
      'availability',
      'languages',
      'hourlyRate',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        therapist[field] = req.body[field];
      }
    });

    await therapist.save();

    res.json({
      success: true,
      message: 'Profile updated',
      therapist,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get therapist availability slots for a date range
 * GET /api/therapists/:id/slots?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/:id/slots', async (req, res, next) => {
  try {
    const { startDate, endDate, duration = 60 } = req.query;
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const existingSessions = await Session.find({
      therapistId: req.params.id,
      status: 'scheduled',
      scheduledAt: { $gte: start, $lt: end },
    }).select('scheduledAt durationMinutes');

    const bookedMap = new Map();
    existingSessions.forEach((s) => {
      const dateKey = s.scheduledAt.toISOString().split('T')[0];
      if (!bookedMap.has(dateKey)) bookedMap.set(dateKey, []);
      bookedMap.get(dateKey).push(s.scheduledAt.getHours());
    });

    const availableSlots = [];
    const current = new Date(start);
    while (current < end) {
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
      const dayAvail = therapist.availability.find((a) => a.day === dayName);

      if (dayAvail) {
        const startHour = parseInt(dayAvail.startTime.split(':')[0]);
        const endHour = parseInt(dayAvail.endTime.split(':')[0]);
        const dateKey = current.toISOString().split('T')[0];
        const bookedHours = bookedMap.get(dateKey) || [];

        for (let hour = startHour; hour < endHour; hour++) {
          if (!bookedHours.includes(hour)) {
            availableSlots.push({
              date: dateKey,
              time: `${hour}:00`,
              datetime: new Date(current.setHours(hour, 0, 0, 0)).toISOString(),
            });
          }
        }
      }
      current.setDate(current.getDate() + 1);
    }

    res.json({
      success: true,
      count: availableSlots.length,
      slots: availableSlots.slice(0, 50),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
