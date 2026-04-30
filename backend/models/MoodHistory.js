const mongoose = require('mongoose');

const moodHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    moodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    emotion: {
      type: String,
      enum: ['sad', 'happy', 'angry', 'anxious', 'calm', 'neutral', 'excited', 'confused', 'hopeful'],
      required: true,
    },
    source: {
      type: String,
      enum: ['journal', 'exercise', 'chat', 'ai', 'manual_entry'],
      default: 'manual_entry',
    },
    activity: String,
    notes: String,
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, date: -1 },
      { userId: 1, moodScore: 1 },
      { date: 1 },
      { userId: 1, emotion: 1 },
    ],
  }
);

// Compound index for unique date per user
moodHistorySchema.index({ userId: 1, date: 1 }, { unique: false });

module.exports = mongoose.model('MoodHistory', moodHistorySchema);
