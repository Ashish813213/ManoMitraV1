const express = require('express');
const { Journal, JournalAnalysis } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { analyzeSentiment } = require('../utils/nlpService');
const { checkSafety } = require('../utils/safetyCheck');

const router = express.Router();

/**
 * Create journal entry
 * POST /api/journals
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { title, content, moodScore, tags } = req.body;

    if (!title || !content || !moodScore) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and mood score are required',
      });
    }

    // Analyze sentiment
    const sentimentData = await analyzeSentiment(content);

    // Check for safety concerns
    await checkSafety(req.user.userId, content, 'journal');

    const journal = new Journal({
      userId: req.user.userId,
      title,
      content,
      moodScore,
      detectedEmotion: sentimentData.emotionLabel,
      sentimentScore: sentimentData.sentimentScore,
      tags: tags || [],
    });

    await journal.save();

    res.status(201).json({
      success: true,
      message: 'Journal entry created',
      journal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user's journals
 * GET /api/journals
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { limit = 20, skip = 0, sortBy = 'createdAt' } = req.query;

    const journals = await Journal.find({ userId: req.user.userId })
      .sort({ [sortBy]: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Journal.countDocuments({ userId: req.user.userId });

    res.json({
      success: true,
      count: journals.length,
      total,
      journals,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get specific journal
 * GET /api/journals/:id
 */
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const journal = await Journal.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
    }

    res.json({
      success: true,
      journal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update journal
 * PUT /api/journals/:id
 */
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    const { title, content, moodScore, tags, triggers, coping } = req.body;

    const journal = await Journal.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
    }

    // Update fields
    if (title) journal.title = title;
    if (content) journal.content = content;
    if (moodScore) journal.moodScore = moodScore;
    if (tags) journal.tags = tags;
    if (triggers) journal.triggers = triggers;
    if (coping) journal.coping = coping;

    // Re-analyze if content changed
    if (content) {
      const sentimentData = await analyzeSentiment(content);
      journal.sentimentScore = sentimentData.sentimentScore;
      journal.detectedEmotion = sentimentData.emotionLabel;
    }

    await journal.save();

    res.json({
      success: true,
      message: 'Journal updated',
      journal,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete journal
 * DELETE /api/journals/:id
 */
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const journal = await Journal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal not found',
      });
    }

    res.json({
      success: true,
      message: 'Journal deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get mood analytics
 * GET /api/journals/analytics/mood-trend
 */
router.get('/analytics/mood-trend', verifyToken, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const journals = await Journal.find({
      userId: req.user.userId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    if (journals.length === 0) {
      return res.json({
        success: true,
        message: 'No journals found for the period',
        data: {
          journalCount: 0,
          averageMood: 0,
          trend: [],
        },
      });
    }

    const scores = journals.map((j) => j.moodScore);
    const averageMood = Math.round((scores.reduce((a, b) => a + b) / scores.length) * 100) / 100;

    res.json({
      success: true,
      data: {
        journalCount: journals.length,
        averageMood,
        lowestMood: Math.min(...scores),
        highestMood: Math.max(...scores),
        journals,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
