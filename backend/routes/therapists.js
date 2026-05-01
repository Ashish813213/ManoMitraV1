const express = require('express');
const { User, Therapist } = require('../models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all therapists
 * GET /api/therapists
 */
router.get('/', async (req, res, next) => {
  try {
    const { specialization, minRating, verified } = req.query;
    const filter = { isActive: true };

    if (specialization) filter.specialization = specialization;
    if (verified === 'true') filter.isVerified = true;
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    const therapists = await Therapist.find(filter)
      .populate('userId', 'fullName email')
      .sort({ rating: -1, totalSessions: -1 });

    res.json({
      success: true,
      count: therapists.length,
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
 * Book therapy session (placeholder)
 * POST /api/therapists/:id/book
 */
router.post('/:id/book', verifyToken, async (req, res, next) => {
  try {
    const therapist = await Therapist.findById(req.params.id);

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found',
      });
    }

    res.json({
      success: true,
      message: 'Therapy session booked successfully',
      booking: {
        therapistId: therapist._id,
        userId: req.user.userId,
        scheduledAt: req.body.scheduledAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
