const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema(
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
    sessionsCompleted: {
      type: Number,
      default: 0,
    },
    journalEntries: {
      type: Number,
      default: 0,
    },
    exercisesCompleted: {
      type: Number,
      default: 0,
    },
    moodCheckIns: {
      type: Number,
      default: 0,
    },
    aiChatMessages: {
      type: Number,
      default: 0,
    },
    minutesSpent: {
      type: Number,
      default: 0,
    },
    streakCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, date: -1 },
    ],
  }
);

module.exports = mongoose.model('UserActivity', userActivitySchema);
