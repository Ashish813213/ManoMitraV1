const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
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
      enum: ['breathing', 'meditation', 'grounding', 'yoga', 'mindfulness', 'journaling', 'visualization', 'progressive-relaxation'],
      required: true,
    },
    contentType: {
      type: String,
      enum: ['breathing', 'meditation', 'movement', 'journaling'],
      default: 'movement',
    },
    steps: [
      {
        instruction: String,
        durationSeconds: {
          type: Number,
          default: 30,
        },
        audioUrl: String,
        imageUrl: String,
      },
    ],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    videoUrl: String,
    imageUrl: String,
    instructions: [String],
    benefits: [String],
    targetAudience: [String],
    category: {
      type: String,
      enum: ['stress', 'anxiety', 'sleep', 'focus', 'energy', 'emotions', 'social'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { type: 1 },
      { difficulty: 1 },
      { category: 1 },
      { isActive: 1 },
    ],
  }
);

module.exports = mongoose.model('Exercise', exerciseSchema);
