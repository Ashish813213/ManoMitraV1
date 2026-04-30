const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['article', 'audio_guide', 'workshop', 'video', 'meditation', 'exercise'],
      required: true,
    },
    category: {
      type: String,
      enum: ['stress_management', 'sleep', 'anxiety', 'depression', 'mindfulness', 'fitness', 'nutrition', 'relationships', 'work', 'general'],
      default: 'general',
    },
    duration: Number, // in minutes
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    content: {
      url: String, // Link to content
      markdown: String, // For articles
      audioUrl: String, // For audio guides
      videoUrl: String, // For videos
    },
    tags: [String],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
    },
    authorName: String,
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    targetEmotions: [
      {
        type: String,
        enum: ['sad', 'anxious', 'angry', 'hopeful', 'calm', 'confused', 'neutral'],
      },
    ], // Recommended for specific emotions
    imageUrl: String,
    benefits: [String],
  },
  {
    timestamps: true,
    indexes: [
      { type: 1, category: 1 },
      { createdAt: -1 },
      { rating: -1 },
      { views: -1 },
      { targetEmotions: 1 },
    ],
  }
);

module.exports = mongoose.model('Resource', resourceSchema);
