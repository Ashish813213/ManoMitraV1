const express = require('express');
const { Recommendation, Resource, User, Journal, MoodHistory, Exercise, UserExerciseProgress, Community } = require('../models');
const { verifyToken } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

const GENERATION_CHAT_URL = process.env.GENERATION_CHAT_API_URL || 'http://localhost:5001';

/**
 * Generate dynamic recommendations based on user behavior
 * POST /api/recommendations/generate
 */
router.post('/generate', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const moodHistory = await MoodHistory.find({ userId })
      .sort({ date: -1 })
      .limit(14);
    
    const journalEntries = await Journal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    const completedExercises = await UserExerciseProgress.find({ userId, completed: true })
      .sort({ completedAt: -1 })
      .limit(5);
    
    const communityActivity = await Community.find({
      'members.userId': userId,
    }).limit(3);
    
    const user = await User.findById(userId);
    const mentalHealthProfile = user?.mentalHealthProfile || {};
    
    let moodTrend = 'stable';
    if (moodHistory.length >= 7) {
      const recentAvg = moodHistory.slice(0, 3).reduce((s, e) => s + e.moodScore, 0) / 3;
      const olderAvg = moodHistory.slice(3, 7).reduce((s, e) => s + e.moodScore, 0) / 4;
      if (recentAvg - olderAvg > 1.5) moodTrend = 'improving';
      else if (olderAvg - recentAvg > 1.5) moodTrend = 'declining';
    }
    
    const emotionCounts = {};
    moodHistory.forEach((m) => {
      emotionCounts[m.emotion] = (emotionCounts[m.emotion] || 0) + 1;
    });
    const dominantEmotion = Object.keys(emotionCounts).reduce(
      (a, b) => (emotionCounts[a] > emotionCounts[b] ? a : b),
      'neutral'
    );
    
    const recommendations = [];
    
    if (moodTrend === 'declining' || dominantEmotion === 'sad' || mentalHealthProfile.lastSentimentScore < -0.3) {
      recommendations.push({
        type: 'exercise',
        category: 'stress',
        reason: 'Mood declining detected',
        priority: 'high',
      });
    }
    
    if (dominantEmotion === 'anxious' || mentalHealthProfile.lastSentimentScore < -0.2) {
      recommendations.push({
        type: 'exercise',
        category: 'breathing',
        reason: 'Anxiety detected',
        priority: 'high',
      });
    }
    
    if (!completedExercises.length) {
      recommendations.push({
        type: 'exercise',
        category: 'mindfulness',
        reason: 'No recent activity',
        priority: 'medium',
      });
    }
    
    if (journalEntries.length > 0) {
      try {
        const journalText = journalEntries.slice(0, 3).map((j) => j.content).join(' ');
        const sentimentRes = await axios.post(`${GENERATION_CHAT_URL}/sentiment`, {
          text: journalText,
        });
        if (sentimentRes.data?.sentiment?.sentiment_score < -0.3) {
          recommendations.push({
            type: 'resource',
            category: 'emotional_support',
            reason: 'Journal sentiment analysis',
            priority: 'high',
          });
        }
      } catch (e) {
        console.log('GenerationChat sentiment analysis unavailable');
      }
    }
    
    if (!communityActivity.length) {
      recommendations.push({
        type: 'community',
        category: 'support',
        reason: 'Not engaged with community',
        priority: 'low',
      });
    }
    
    res.json({
      success: true,
      recommendations,
      analysis: {
        moodTrend,
        dominantEmotion,
        recentMoods: moodHistory.slice(0, 3).map((m) => m.moodScore),
        completedExercises: completedExercises.length,
        communityGroups: communityActivity.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Recommendations for User
 * GET /api/recommendations
 * Query: ?limit=10&offset=0
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Get user's recent mood/emotion data
    const userMoodHistory = await MoodHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(7); // Last 7 days

    const recentEmotions = userMoodHistory.map((m) => m.emotion);
    const mostRecentMood = recentEmotions[0] || 'neutral';

    // Get user's completed resources
    const userCompletedResources = await Recommendation.find({
      userId,
      completed: true,
    }).select('resourceId');

    const completedResourceIds = userCompletedResources.map((r) => r.resourceId);

    // Generate recommendations
    const recommendations = await Recommendation.find({
      userId,
      isDismissed: false,
    })
      .populate('resourceId')
      .sort({ score: -1 })
      .skip(offset)
      .limit(limit);

    if (recommendations.length < 5) {
      // Generate new recommendations if not enough
      await generateRecommendations(userId, mostRecentMood, completedResourceIds);

      // Fetch again
      const newRecs = await Recommendation.find({
        userId,
        isDismissed: false,
      })
        .populate('resourceId')
        .sort({ score: -1 })
        .skip(offset)
        .limit(limit);

      return res.json({
        success: true,
        recommendations: newRecs,
        count: newRecs.length,
      });
    }

    res.json({
      success: true,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Trending Resources
 * GET /api/recommendations/trending
 */
router.get('/trending', async (req, res, next) => {
  try {
    const trendingResources = await Resource.find({ isPublished: true })
      .sort({ views: -1, rating: -1 })
      .limit(6)
      .select('title description type duration imageUrl category rating');

    res.json({
      success: true,
      resources: trendingResources,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get Resource by ID
 * GET /api/recommendations/resource/:id
 */
router.get('/resource/:id', async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('author', 'fullName');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found',
      });
    }

    // Increment view count
    resource.views += 1;
    await resource.save();

    res.json({
      success: true,
      resource,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Mark Resource as Completed
 * POST /api/recommendations/:id/complete
 */
router.post('/:id/complete', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recommendationId = req.params.id;

    const recommendation = await Recommendation.findByIdAndUpdate(
      recommendationId,
      { completed: true, completedAt: new Date() },
      { new: true }
    ).populate('resourceId');

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found',
      });
    }

    res.json({
      success: true,
      message: 'Resource marked as completed',
      recommendation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Rate Completed Resource
 * POST /api/recommendations/:id/rate
 * Body: { rating: 1-5, feedback: "text" }
 */
router.post('/:id/rate', verifyToken, async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const recommendationId = req.params.id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    const recommendation = await Recommendation.findByIdAndUpdate(
      recommendationId,
      { rating, feedback },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found',
      });
    }

    res.json({
      success: true,
      message: 'Rating saved',
      recommendation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Dismiss Recommendation
 * POST /api/recommendations/:id/dismiss
 */
router.post('/:id/dismiss', verifyToken, async (req, res, next) => {
  try {
    const recommendationId = req.params.id;

    const recommendation = await Recommendation.findByIdAndUpdate(
      recommendationId,
      { isDismissed: true, dismissedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Recommendation dismissed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Generate Recommendations Algorithm
 * Internal function
 */
async function generateRecommendations(userId, userMood, completedResourceIds) {
  try {
    // Get resources that match user's current mood
    const moodMatchedResources = await Resource.find({
      targetEmotions: userMood,
      isPublished: true,
      _id: { $nin: completedResourceIds },
    })
      .limit(5)
      .select('_id');

    // Get trending/highly rated resources
    const trendingResources = await Resource.find({
      isPublished: true,
      _id: { $nin: completedResourceIds },
      rating: { $gte: 4.0 },
    })
      .sort({ views: -1 })
      .limit(3)
      .select('_id');

    // Get resources from different categories
    const diverseResources = await Resource.find({
      isPublished: true,
      _id: { $nin: completedResourceIds },
    })
      .limit(5)
      .select('_id');

    // Create recommendation records
    const allResourceIds = [
      ...new Set([
        ...moodMatchedResources.map((r) => r._id),
        ...trendingResources.map((r) => r._id),
        ...diverseResources.map((r) => r._id),
      ]),
    ].slice(0, 10);

    for (const resourceId of allResourceIds) {
      const existingRec = await Recommendation.findOne({ userId, resourceId });

      if (!existingRec) {
        const reason = moodMatchedResources.some((r) => r._id.equals(resourceId))
          ? 'mood_match'
          : trendingResources.some((r) => r._id.equals(resourceId))
          ? 'highly_rated'
          : 'trending';

        const score =
          reason === 'mood_match' ? 85 : reason === 'highly_rated' ? 75 : 60;

        await Recommendation.create({
          userId,
          resourceId,
          reason,
          score,
        });
      }
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
}

module.exports = router;
