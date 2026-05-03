const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: String,
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'ai'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        sentimentScore: {
          type: Number,
          min: -1,
          max: 1,
        },
        emotionLabel: {
          type: String,
          enum: ['sad', 'happy', 'angry', 'anxious', 'calm', 'neutral', 'excited', 'confused', 'hopeful'],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    overallSessionMood: String,
    sessionSentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },
    sessionEmotionLabel: {
      type: String,
      enum: ['sad', 'happy', 'angry', 'anxious', 'calm', 'neutral', 'excited', 'confused', 'hopeful'],
    },
    riskDetected: {
      type: Boolean,
      default: false,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    keywordsDetected: [String],
    sessionSummary: String,
    recommendations: [String],
    totalMessages: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, createdAt: -1 },
      { riskDetected: 1, userId: 1 },
      { userId: 1, 'messages.timestamp': -1 },
    ],
  }
);

module.exports = mongoose.model('AIConversation', aiConversationSchema);
