const express = require('express');
const { User, MoodHistory, AIConversation, Journal, UserExerciseProgress, UserActivity } = require('../models');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Get user wellness stats
 * GET /api/users/stats
 * Returns: streak, sessions, progress, goal, recent mood trend
 */
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Calculate streak: count consecutive days with activity
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities = await UserActivity.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    let streak = 0;
    let checkDate = new Date(today);

    // If today has no activity yet, start checking from yesterday
    const todayActivity = activities.find((a) => {
      const d = new Date(a.date);
      return d.toDateString() === today.toDateString();
    });
    if (!todayActivity) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 30; i++) {
      const hasActivity = activities.some((a) => {
        const d = new Date(a.date);
        return d.toDateString() === checkDate.toDateString();
      });

      if (hasActivity) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Total sessions: sum of all completed activities (mood check-ins + exercises + journal + AI chat)
    const allSessions = await UserActivity.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalSessions: {
            $sum: {
              $add: ['$moodCheckIns', '$exercisesCompleted', '$journalEntries', '$aiChatMessages'],
            },
          },
          totalMinutes: { $sum: '$minutesSpent' },
        },
      },
    ]);

    const totalSessions = allSessions.length > 0 ? allSessions[0].totalSessions : 0;
    const totalMinutes = allSessions.length > 0 ? allSessions[0].totalMinutes : 0;

    // Progress: based on mood trend over the last 30 days
    const moodEntries = await MoodHistory.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 });

    let progress = 50;
    if (moodEntries.length >= 2) {
      const firstMood = moodEntries[0].moodScore;
      const lastMood = moodEntries[moodEntries.length - 1].moodScore;
      const avgMood = moodEntries.reduce((sum, e) => sum + e.moodScore, 0) / moodEntries.length;

      // Base progress on average mood (1-10 scale mapped to 0-100%)
      progress = Math.round((avgMood / 10) * 100);

      // Boost if trend is improving
      if (lastMood > firstMood) {
        progress = Math.min(100, progress + 10);
      } else if (lastMood < firstMood) {
        progress = Math.max(0, progress - 5);
      }
    }

    // Goal status based on recent activity consistency
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const recentActivity = await UserActivity.find({
      userId,
      date: { $gte: last7Days },
    });

    const activeDays = recentActivity.length;
    const goalStatus = activeDays >= 5 ? 'On Track' : activeDays >= 3 ? 'Almost There' : 'Get Started';

    // Today's activities
    const todayActivityData = todayActivity
      ? {
          sessionsCompleted: todayActivity.sessionsCompleted,
          journalEntries: todayActivity.journalEntries,
          exercisesCompleted: todayActivity.exercisesCompleted,
          moodCheckIns: todayActivity.moodCheckIns,
          minutesSpent: todayActivity.minutesSpent,
        }
      : {
          sessionsCompleted: 0,
          journalEntries: 0,
          exercisesCompleted: 0,
          moodCheckIns: 0,
          minutesSpent: 0,
        };

    res.json({
      success: true,
      stats: {
        streak,
        sessions: totalSessions,
        progress,
        goal: goalStatus,
        activeDaysThisWeek: activeDays,
        totalMinutes,
        moodEntriesCount: moodEntries.length,
        today: todayActivityData,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Record activity for the current day
 * POST /api/users/activity
 * Body: { type: 'mood' | 'exercise' | 'journal' | 'chat', minutes?: number }
 */
router.post('/activity', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { type, minutes = 5 } = req.body;

    if (!type || !['mood', 'exercise', 'journal', 'chat'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Valid activity type required: mood, exercise, journal, or chat',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let activity = await UserActivity.findOne({ userId, date: today });

    if (!activity) {
      // Check if yesterday had activity for streak continuation
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayActivity = await UserActivity.findOne({ userId, date: yesterday });

      let newStreak = 1;
      if (yesterdayActivity) {
        newStreak = (yesterdayActivity.streakCount || 0) + 1;
      }

      activity = new UserActivity({
        userId,
        date: today,
        streakCount: newStreak,
      });
    }

    // Increment the appropriate counter
    const updateMap = {
      mood: 'moodCheckIns',
      exercise: 'exercisesCompleted',
      journal: 'journalEntries',
      chat: 'aiChatMessages',
    };

    activity[updateMap[type]] = (activity[updateMap[type]] || 0) + 1;
    activity.sessionsCompleted = (activity.sessionsCompleted || 0) + 1;
    activity.minutesSpent = (activity.minutesSpent || 0) + minutes;

    await activity.save();

    res.json({
      success: true,
      message: 'Activity recorded',
      activity: {
        streakCount: activity.streakCount,
        sessionsCompleted: activity.sessionsCompleted,
        minutesSpent: activity.minutesSpent,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
