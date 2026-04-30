const mongoose = require('mongoose');

const journalAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    averageMoodScore: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    dominantEmotion: {
      type: String,
      enum: ['sad', 'happy', 'angry', 'anxious', 'calm', 'neutral', 'excited', 'confused', 'hopeful'],
    },
    totalEntries: {
      type: Number,
      default: 1,
    },
    moodTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable'],
    },
    keywords: [String],
    aiInsights: String,
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, date: -1 },
      { userId: 1, averageMoodScore: 1 },
    ],
  }
);

module.exports = mongoose.model('JournalAnalysis', journalAnalysisSchema);
