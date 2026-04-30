/**
 * Mood history utilities for analytics
 */

const { MoodHistory, Journal, UserExerciseProgress } = require('../models');

/**
 * Get mood trend for a user
 */
const getMoodTrend = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moodData = await MoodHistory.find({
      userId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    return moodData;
  } catch (error) {
    console.error('Error getting mood trend:', error);
    return [];
  }
};

/**
 * Calculate mood statistics
 */
const calculateMoodStats = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moodData = await MoodHistory.find({
      userId,
      date: { $gte: startDate },
    });

    if (moodData.length === 0) {
      return null;
    }

    const scores = moodData.map((m) => m.moodScore);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    const emotionCounts = {};
    moodData.forEach((m) => {
      emotionCounts[m.emotion] = (emotionCounts[m.emotion] || 0) + 1;
    });

    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    return {
      averageMoodScore: Math.round(average * 100) / 100,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      dominantEmotion,
      totalEntries: moodData.length,
      emotionBreakdown: emotionCounts,
    };
  } catch (error) {
    console.error('Error calculating mood stats:', error);
    return null;
  }
};

/**
 * Get mood improvement from exercises
 */
const getExerciseImpact = async (userId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const exercises = await UserExerciseProgress.find({
      userId,
      completed: true,
      completedAt: { $gte: startDate },
    });

    if (exercises.length === 0) {
      return null;
    }

    const improvements = exercises
      .filter((e) => e.moodBefore && e.moodAfter)
      .map((e) => e.moodAfter - e.moodBefore);

    const avgImprovement =
      improvements.length > 0
        ? Math.round((improvements.reduce((a, b) => a + b, 0) / improvements.length) * 100) / 100
        : 0;

    return {
      totalExercisesCompleted: exercises.length,
      averageMoodImprovement: avgImprovement,
      mostEffectiveType: await getMostEffectiveExerciseType(exercises),
    };
  } catch (error) {
    console.error('Error calculating exercise impact:', error);
    return null;
  }
};

/**
 * Helper to find most effective exercise type
 */
const getMostEffectiveExerciseType = async (exercises) => {
  const typeImpact = {};

  for (let exercise of exercises) {
    if (exercise.moodBefore && exercise.moodAfter) {
      const improvement = exercise.moodAfter - exercise.moodBefore;
      const exerciseData = await require('../models').Exercise.findById(exercise.exerciseId);

      if (exerciseData) {
        typeImpact[exerciseData.type] = (typeImpact[exerciseData.type] || 0) + improvement;
      }
    }
  }

  if (Object.keys(typeImpact).length === 0) {
    return null;
  }

  return Object.keys(typeImpact).reduce((a, b) =>
    typeImpact[a] > typeImpact[b] ? a : b
  );
};

module.exports = {
  getMoodTrend,
  calculateMoodStats,
  getExerciseImpact,
};
