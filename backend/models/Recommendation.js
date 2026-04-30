const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'mood_match',
        'trending',
        'highly_rated',
        'user_history',
        'emotion_based',
        'category_interest',
        'personalized_algorithm',
      ],
      default: 'personalized_algorithm',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    }, // Recommendation confidence score
    clicked: {
      type: Boolean,
      default: false,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    rating: Number, // User's rating after completion
    feedback: String,
    relevanceFactors: {
      moodMatch: Number,
      categoryMatch: Number,
      difficultyMatch: Number,
      timeMatch: Number,
      userHistoryMatch: Number,
    },
    dismissedAt: Date,
    isDismissed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, createdAt: -1 },
      { userId: 1, isDismissed: 1 },
      { userId: 1, score: -1 },
    ],
  }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
