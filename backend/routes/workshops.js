const express = require('express');
const { Workshop, User } = require('../models');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

/**
 * Get All Upcoming Workshops
 * GET /api/workshops
 * Query: ?limit=10&offset=0&category=anxiety
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category;

    const filter = {
      status: 'scheduled',
      scheduledAt: { $gte: new Date() },
      isPublished: true,
    };

    if (category) {
      filter.category = category;
    }

    const workshops = await Workshop.find(filter)
      .populate('facilitator', 'fullName specialization')
      .sort({ scheduledAt: 1 })
      .skip(offset)
      .limit(limit);

    const total = await Workshop.countDocuments(filter);

    res.json({
      success: true,
      workshops,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Single Workshop
 * GET /api/workshops/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('facilitator', 'fullName specialization bio')
      .populate('participants.userId', 'fullName profile.avatar');

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found',
      });
    }

    res.json({
      success: true,
      workshop,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Register for Workshop
 * POST /api/workshops/:id/register
 */
router.post('/:id/register', verifyToken, async (req, res, next) => {
  try {
    const workshopId = req.params.id;
    const userId = req.user.id;

    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found',
      });
    }

    if (workshop.isFull) {
      return res.status(400).json({
        success: false,
        message: 'Workshop is full',
      });
    }

    // Check if user already registered
    const alreadyRegistered = workshop.participants.some((p) =>
      p.userId.equals(userId)
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this workshop',
      });
    }

    workshop.participants.push({
      userId,
      joinedAt: new Date(),
      status: 'registered',
    });
    workshop.currentParticipants += 1;

    await workshop.save();

    res.json({
      success: true,
      message: 'Successfully registered for workshop',
      workshop,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Cancel Workshop Registration
 * POST /api/workshops/:id/cancel
 */
router.post('/:id/cancel', verifyToken, async (req, res, next) => {
  try {
    const workshopId = req.params.id;
    const userId = req.user.id;

    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found',
      });
    }

    const participantIndex = workshop.participants.findIndex((p) =>
      p.userId.equals(userId)
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Not registered for this workshop',
      });
    }

    workshop.participants.splice(participantIndex, 1);
    workshop.currentParticipants -= 1;

    await workshop.save();

    res.json({
      success: true,
      message: 'Successfully cancelled registration',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get User's Workshops
 * GET /api/workshops/user/my-workshops
 */
router.get('/user/my-workshops', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const workshops = await Workshop.find({
      'participants.userId': userId,
    })
      .populate('facilitator', 'fullName')
      .sort({ scheduledAt: -1 });

    res.json({
      success: true,
      workshops,
      count: workshops.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create Workshop (Admin/Therapist only)
 * POST /api/workshops
 */
router.post('/', verifyToken, authorize('therapist', 'admin'), async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      category,
      scheduledAt,
      duration,
      maxParticipants,
      meetingLink,
      facilitatorName,
      imageUrl,
      targetEmotions,
      benefits,
    } = req.body;

    if (!title || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Title and scheduledAt are required',
      });
    }

    const workshop = new Workshop({
      title,
      description,
      type: type || 'workshop',
      category,
      facilitator: req.user.id,
      facilitatorName: facilitatorName || req.user.fullName,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      maxParticipants: maxParticipants || 50,
      meetingLink,
      imageUrl,
      targetEmotions: targetEmotions || [],
      benefits: benefits || [],
    });

    await workshop.save();

    res.status(201).json({
      success: true,
      message: 'Workshop created successfully',
      workshop,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Rate Workshop
 * POST /api/workshops/:id/rate
 * Body: { rating: 1-5 }
 */
router.post('/:id/rate', verifyToken, async (req, res, next) => {
  try {
    const { rating } = req.body;
    const workshopId = req.params.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const workshop = await Workshop.findById(workshopId);

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found',
      });
    }

    workshop.rating =
      (workshop.rating * workshop.totalRatings + rating) /
      (workshop.totalRatings + 1);
    workshop.totalRatings += 1;

    await workshop.save();

    res.json({
      success: true,
      message: 'Rating submitted',
      workshop,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
