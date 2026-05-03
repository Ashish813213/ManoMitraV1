const express = require('express');
const { MoodHistory, UserActivity } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { analyzeSentiment, assessRiskLevel } = require('../utils/nlpService');
const { checkSafety } = require('../utils/safetyCheck');

const router = express.Router();

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

/**
 * Get Mood Analytics
 * GET /api/mood/analytics?days=30
 */
router.get('/analytics', verifyToken, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await MoodHistory.find({
      userId: req.user.userId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    if (entries.length === 0) {
      return res.json({
        success: true,
        data: {
          totalEntries: 0,
          averageMoodScore: 0,
          weeklyAverage: 0,
          monthlyAverage: 0,
          bestDay: null,
          worstDay: null,
          currentStreak: 0,
          emotionDistribution: {},
          dailyTrend: [],
          weeklyTrend: [],
          insights: [],
        },
      });
    }

    // Averages
    const totalEntries = entries.length;
    const averageMoodScore = entries.reduce((sum, e) => sum + e.moodScore, 0) / totalEntries;

    // Weekly average (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEntries = entries.filter((e) => e.date >= weekStart);
    const weeklyAverage = weekEntries.length
      ? weekEntries.reduce((sum, e) => sum + e.moodScore, 0) / weekEntries.length
      : averageMoodScore;

    // Monthly average (last 30 days)
    const monthlyAverage = averageMoodScore;

    // Best and worst days
    const sorted = [...entries].sort((a, b) => b.moodScore - a.moodScore);
    const bestDay = sorted[0] ? { date: sorted[0].date, score: sorted[0].moodScore, emotion: sorted[0].emotion } : null;
    const worstDay = sorted[sorted.length - 1] ? { date: sorted[sorted.length - 1].date, score: sorted[sorted.length - 1].moodScore, emotion: sorted[sorted.length - 1].emotion } : null;

    // Current streak (consecutive days with at least one entry)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const hasEntry = entries.some((e) => e.date >= day && e.date <= dayEnd);
      if (hasEntry) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Emotion distribution
    const emotionDistribution = {};
    entries.forEach((e) => {
      emotionDistribution[e.emotion] = (emotionDistribution[e.emotion] || 0) + 1;
    });

    // Daily trend (group by date, average score per day)
    const dailyMap = {};
    entries.forEach((e) => {
      const dateKey = new Date(e.date).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) dailyMap[dateKey] = [];
      dailyMap[dateKey].push(e.moodScore);
    });
    const dailyTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        averageScore: scores.reduce((s, v) => s + v, 0) / scores.length,
        entryCount: scores.length,
      }));

    // Weekly trend (group by ISO week)
    const weeklyMap = {};
    entries.forEach((e) => {
      const d = new Date(e.date);
      const weekNum = getISOWeek(d);
      const key = `${d.getFullYear()}-W${weekNum}`;
      if (!weeklyMap[key]) weeklyMap[key] = [];
      weeklyMap[key].push(e.moodScore);
    });
    const weeklyTrend = Object.entries(weeklyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, scores]) => ({
        week,
        averageScore: scores.reduce((s, v) => s + v, 0) / scores.length,
        entryCount: scores.length,
      }));

    // Generate text insights
    const insights = generateMoodInsights(averageMoodScore, currentStreak, emotionDistribution, weeklyAverage);

    res.json({
      success: true,
      data: {
        totalEntries,
        averageMoodScore: parseFloat(averageMoodScore.toFixed(2)),
        weeklyAverage: parseFloat(weeklyAverage.toFixed(2)),
        monthlyAverage: parseFloat(monthlyAverage.toFixed(2)),
        bestDay,
        worstDay,
        currentStreak,
        emotionDistribution,
        dailyTrend,
        weeklyTrend,
        insights,
      },
    });
  } catch (error) {
    next(error);
  }
});

function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function generateMoodInsights(avg, streak, dist, weeklyAvg) {
  const insights = [];
  if (avg >= 7) insights.push({ type: 'positive', text: 'Your average mood is great! Keep up the positive habits.' });
  else if (avg >= 5) insights.push({ type: 'neutral', text: 'Your mood is stable. Small daily practices can boost it further.' });
  else insights.push({ type: 'concern', text: 'Your mood has been lower lately. Consider reaching out to a therapist or trying breathing exercises.' });

  if (streak >= 7) insights.push({ type: 'positive', text: `🔥 You're on a ${streak}-day streak! Consistency is key to mental wellness.` });
  else if (streak >= 3) insights.push({ type: 'positive', text: `Good job! ${streak} days in a row of mood tracking.` });
  else insights.push({ type: 'tip', text: 'Try to check in daily. Consistent tracking reveals important patterns.' });

  const topEmotion = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
  if (topEmotion) {
    const [emotion] = topEmotion;
    if (['anxious', 'sad', 'angry'].includes(emotion)) {
      insights.push({ type: 'tip', text: `You've been feeling ${emotion} frequently. Breathing exercises and journaling can help.` });
    } else if (['calm', 'happy', 'hopeful'].includes(emotion)) {
      insights.push({ type: 'positive', text: `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} is your most common emotion — that's a great sign!` });
    }
  }

  if (weeklyAvg > avg + 0.5) insights.push({ type: 'positive', text: 'Your mood this week is trending upward! 📈' });
  else if (weeklyAvg < avg - 0.5) insights.push({ type: 'concern', text: 'Your mood this week is slightly lower than average. Be gentle with yourself.' });

  return insights;
}

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
