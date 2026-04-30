const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    qualifications: {
      type: String,
      required: true,
    },
    experienceYears: {
      type: Number,
      required: true,
      min: 0,
    },
    specialization: {
      type: [String],
      enum: ['anxiety', 'depression', 'trauma', 'stress', 'relationships', 'grief', 'addiction', 'ocd', 'sleep', 'other'],
      required: true,
    },
    availability: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        startTime: String,
        endTime: String,
      },
    ],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    bio: String,
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    licenseExpiry: Date,
    hourlyRate: {
      type: Number,
      required: true,
    },
    languages: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1 },
      { specialization: 1 },
      { isVerified: 1 },
      { rating: -1 },
    ],
  }
);

module.exports = mongoose.model('Therapist', therapistSchema);
