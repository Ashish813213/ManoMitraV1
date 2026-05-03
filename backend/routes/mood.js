const express = require('express');
const { MoodHistory, UserActivity } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { analyzeSentiment, assessRiskLevel } = require('../utils/nlpService');
const { checkSafety } = require('../utils/safetyCheck');

const router = express.Router();

/**
 * Get mood analytics
 * GET /api/mood/analytics?period=30
 */
router.get('/analytics', verifyToken, async (req, res, next) => {
  try {
    const period = parseInt(req.query.period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const moodEntries = await MoodHistory.find({
      userId: req.user.userId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    if (moodEntries.length === 0) {
      return res.json({
        success: true,
        analytics: {
          averageScore: null,
          emotionDistribution: {},
          streakData: { current: 0, longest: 0 },
          trend: [],
          bestDay: null,
          worstDay: null,
        },
      });
    }

    const totalScore = moodEntries.reduce((sum, e) => sum + e.moodScore, 0);
    const averageScore = totalScore / moodEntries.length;

    const emotionCounts = {};
    moodEntries.forEach((e) => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });

    const emotionDistribution = {};
    Object.keys(emotionCounts).forEach((emotion) => {
      emotionDistribution[emotion] = Math.round((emotionCounts[emotion] / moodEntries.length) * 100);
    });

    const userActivity = await UserActivity.find({
      userId: req.user.userId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (const activity of userActivity) {
      if (activity.streakCount > 0) {
        tempStreak = activity.streakCount;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterdayActivity = await UserActivity.findOne({
      userId: req.user.userId,
      date: { $gte: new Date(today.getTime() - 86400000) },
    });
    currentStreak = yesterdayActivity?.streakCount || 0;

    const dailyTrend = {};
    moodEntries.forEach((e) => {
      const dateKey = e.date.toISOString().split('T')[0];
      if (!dailyTrend[dateKey]) {
        dailyTrend[dateKey] = [];
      }
      dailyTrend[dateKey].push(e.moodScore);
    });

    const trend = Object.keys(dailyTrend).map((date) => {
      const scores = dailyTrend[date];
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = sum / scores.length;
      return {
        date,
        averageScore: Math.round(avg * 10) / 10,
        count: scores.length,
      };
    });

    let bestDay = null;
    let worstDay = null;
    let bestScore = 0;
    let worstScore = 11;

    Object.keys(dailyTrend).forEach((date) => {
      const scores = dailyTrend[date];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestScore) {
        bestScore = avg;
        bestDay = date;
      }
      if (avg < worstScore) {
        worstScore = avg;
        worstDay = date;
      }
    });

    res.json({
      success: true,
      analytics: {
        averageScore: Math.round(averageScore * 10) / 10,
        totalEntries: moodEntries.length,
        emotionDistribution,
        streakData: {
          current: currentStreak,
          longest: longestStreak,
        },
        trend,
        bestDay,
        worstDay,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Log a mood check-in with AI emotion analysis
 * POST /api/mood/log
 * Body: { moodScore: number, note?: string, activity?: string }
 */
router.post('/log', verifyToken, async (req, res, next) => {
  try {
    const { moodScore, note, activity } = req.body;

    if (!moodScore || moodScore < 1 || moodScore > 10) {
      return res.status(400).json({
        success: false,
        message: 'Mood score (1-10) is required',
      });
    }

    // AI emotion analysis if a note is provided
    let emotion = 'neutral';
    let sentimentScore = 0;
    let safetyAlert = null;

    if (note) {
      const sentimentData = await analyzeSentiment(note);
      emotion = sentimentData.emotion?.emotion || sentimentData.emotionLabel || 'neutral';
      sentimentScore = sentimentData.sentiment?.sentiment_score ?? sentimentData.sentimentScore ?? 0;

      // Safety check on the note
      safetyAlert = await checkSafety(req.user.userId, note, 'mood');
    }

    const moodEntry = new MoodHistory({
      userId: req.user.userId,
      date: new Date(),
      moodScore,
      emotion,
      source: 'manual_entry',
      activity: activity || null,
      notes: note || null,
    });

    await moodEntry.save();

    // Record activity in UserActivity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let userActivity = await UserActivity.findOne({ userId: req.user.userId, date: today });

    if (!userActivity) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayActivity = await UserActivity.findOne({ userId: req.user.userId, date: yesterday });

      let newStreak = 1;
      if (yesterdayActivity) {
        newStreak = (yesterdayActivity.streakCount || 0) + 1;
      }

      userActivity = new UserActivity({
        userId: req.user.userId,
        date: today,
        streakCount: newStreak,
      });
    }

    userActivity.moodCheckIns = (userActivity.moodCheckIns || 0) + 1;
    userActivity.sessionsCompleted = (userActivity.sessionsCompleted || 0) + 1;
    userActivity.minutesSpent = (userActivity.minutesSpent || 0) + 5;

    await userActivity.save();

    // Update user's mental health profile
    const { User } = require('../models');
    await User.findByIdAndUpdate(req.user.userId, {
      'mentalHealthProfile.lastSentimentScore': sentimentScore,
    });

    res.status(201).json({
      success: true,
      message: 'Mood logged successfully',
      mood: {
        score: moodEntry.moodScore,
        emotion,
        sentimentScore,
        date: moodEntry.date,
        note: moodEntry.notes,
      },
      aiInsight: generateInsight(emotion, moodScore, sentimentScore),
      safetyAlert: safetyAlert ? { triggered: true, level: safetyAlert.riskLevel } : null,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get recent mood history
 * GET /api/mood/recent?days=7
 */
router.get('/recent', verifyToken, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moodEntries = await MoodHistory.find({
      userId: req.user.userId,
      date: { $gte: startDate },
    }).sort({ date: -1 }).limit(30);

    const trend = moodEntries.map((entry) => ({
      date: entry.date,
      moodScore: entry.moodScore,
      emotion: entry.emotion,
      note: entry.notes,
      activity: entry.activity,
      source: entry.source,
    }));

    res.json({
      success: true,
      count: moodEntries.length,
      trend,
    });
  } catch (error) {
    next(error);
  }
});

function generateInsight(emotion, moodScore, sentimentScore) {
  const insights = {
    happy: [
      "You're radiating positivity! Keep nurturing this energy.",
      "Great to see you thriving. What's contributing to this joy?",
      "Your mood is wonderful today. Consider sharing this positivity with others.",
    ],
    calm: [
      "A peaceful state of mind. This balance is worth protecting.",
      "Feeling centered today. Take a moment to appreciate this calm.",
      "Your mindfulness is paying off. Keep honoring this peaceful space.",
    ],
    hopeful: [
      "Hope is a powerful force. Let this optimism guide your next steps.",
      "You're seeing the light ahead. What small actions can sustain this feeling?",
      "This hopeful outlook is a sign of inner strength.",
    ],
    neutral: [
      "A balanced day. Sometimes neutrality is exactly what you need.",
      "Feeling steady today. Use this calm energy for reflection.",
      "Neutrality is a reset point. It's okay to simply be.",
    ],
    confused: [
      "Uncertainty can be unsettling, but it often precedes growth.",
      "It's okay not to have all the answers. Let's explore what's on your mind.",
      "Confusion is part of processing. Take it one step at a time.",
    ],
    anxious: [
      "Anxiety is a signal, not a threat. Try grounding yourself with a few deep breaths.",
      "What you're feeling is real but temporary. Consider a short walk or meditation.",
      "Your nervous system needs reassurance right now. Try the 5-4-3-2-1 grounding technique.",
    ],
    sad: [
      "It's okay to feel down. These feelings are valid and they will pass.",
      "Sadness is a natural response. Be gentle with yourself today.",
      "Consider reaching out to someone you trust. You don't have to go through this alone.",
    ],
    angry: [
      "Anger often signals a boundary that was crossed. Honor that feeling.",
      "What you're feeling matters. Consider journaling to process these thoughts.",
      "Physical movement can help channel this energy in a healthy way.",
    ],
  };

  const emotionInsights = insights[emotion] || insights.neutral;
  return emotionInsights[Math.floor(Math.random() * emotionInsights.length)];
}

module.exports = router;
