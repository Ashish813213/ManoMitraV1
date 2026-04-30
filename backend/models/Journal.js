const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    detectedEmotion: {
      type: String,
      enum: ['sad', 'happy', 'angry', 'anxious', 'calm', 'neutral', 'excited', 'confused', 'hopeful'],
    },
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },
    aiReflection: String,
    tags: [String],
    isPrivate: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    triggers: [String],
    coping: [String],
    gratitude: [String],
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, createdAt: -1 },
      { userId: 1, moodScore: 1 },
      { detectedEmotion: 1, userId: 1 },
      { isPinned: 1, userId: 1 },
    ],
  }
);

module.exports = mongoose.model('Journal', journalSchema);
