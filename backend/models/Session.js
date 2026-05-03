const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    meetingLink: {
      type: String,
      required: true,
    },
    sessionNotes: String,
    aiSummary: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
    recordingUrl: String,
    cancelledAt: Date,
    cancelledBy: {
      type: String,
      enum: ['user', 'therapist', 'system'],
    },
    cancellationReason: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'free'],
      default: 'pending',
    },
    paymentIntentId: String,
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, scheduledAt: -1 },
      { therapistId: 1, scheduledAt: -1 },
      { status: 1, scheduledAt: 1 },
      { scheduledAt: 1 },
    ],
  }
);

module.exports = mongoose.model('Session', sessionSchema);
