const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['workshop', 'webinar', 'group_session', 'therapy_appointment'],
      required: true,
    },
    category: String,
    facilitator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
    },
    facilitatorName: String,
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    duration: Number, // in minutes
    maxParticipants: {
      type: Number,
      default: 50,
    },
    currentParticipants: {
      type: Number,
      default: 0,
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: Date,
        status: {
          type: String,
          enum: ['registered', 'joined', 'completed', 'cancelled'],
          default: 'registered',
        },
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    meetingLink: String, // Zoom/Google Meet link
    imageUrl: String,
    targetEmotions: [String],
    benefits: [String],
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
    isFull: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { scheduledAt: 1, status: 1 },
      { 'participants.userId': 1 },
      { facilitator: 1 },
      { status: 1 },
    ],
  }
);

// Pre-save hook to check if workshop is full
workshopSchema.pre('save', function () {
  this.isFull = this.currentParticipants >= this.maxParticipants;
});

module.exports = mongoose.model('Workshop', workshopSchema);
