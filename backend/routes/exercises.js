const express = require('express');
const { Exercise, UserExerciseProgress } = require('../models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all exercises
 * GET /api/exercises
 */
router.get('/', async (req, res, next) => {
  try {
    const { type, difficulty, limit = 50 } = req.query;

    let filter = { isActive: true };
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;

    const exercises = await Exercise.find(filter).limit(parseInt(limit));

    res.json({
      success: true,
      count: exercises.length,
      exercises,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get specific exercise
 * GET /api/exercises/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    res.json({
      success: true,
      exercise,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Log exercise completion
 * POST /api/exercises/:id/complete
 */
router.post('/:id/complete', verifyToken, async (req, res, next) => {
  try {
    const { moodBefore, moodAfter, feedback, duration } = req.body;

    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found',
      });
    }

    const moodImprovement = moodAfter - moodBefore;
    let efficiency = 'neutral';
    if (moodImprovement > 2) efficiency = 'very_effective';
    else if (moodImprovement > 0) efficiency = 'effective';
    else if (moodImprovement < -2) efficiency = 'not_effective';

    const progress = new UserExerciseProgress({
      userId: req.user.userId,
      exerciseId: req.params.id,
      completed: true,
      completedAt: new Date(),
      moodBefore,
      moodAfter,
      moodImprovement,
      feedback,
      duration,
      efficiency,
    });

    await progress.save();

    res.status(201).json({
      success: true,
      message: 'Exercise completed',
      progress,
      moodImprovement,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user's exercise history
 * GET /api/exercises/progress/history
 */
router.get('/progress/history', verifyToken, async (req, res, next) => {
  try {
    const { limit = 20, completed = true } = req.query;

    const progress = await UserExerciseProgress.find({
      userId: req.user.userId,
      completed: completed === 'true',
    })
      .sort({ completedAt: -1 })
      .limit(parseInt(limit));

    const stats = {
      totalCompleted: (
        await UserExerciseProgress.countDocuments({
          userId: req.user.userId,
          completed: true,
        })
      ),
      totalIncomplete: (
        await UserExerciseProgress.countDocuments({
          userId: req.user.userId,
          completed: false,
        })
      ),
    };

    res.json({
      success: true,
      stats,
      count: progress.length,
      progress,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
