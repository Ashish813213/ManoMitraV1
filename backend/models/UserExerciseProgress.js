const mongoose = require('mongoose');

const userExerciseProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    feedback: String,
    moodBefore: {
      type: Number,
      min: 1,
      max: 10,
    },
    moodAfter: {
      type: Number,
      min: 1,
      max: 10,
    },
    moodImprovement: Number,
    duration: Number,
    notes: String,
    efficiency: {
      type: String,
      enum: ['very_effective', 'effective', 'neutral', 'not_effective'],
    },
    streak: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, exerciseId: 1 },
      { userId: 1, completed: 1, createdAt: -1 },
      { exerciseId: 1, completed: 1 },
    ],
  }
);

module.exports = mongoose.model('UserExerciseProgress', userExerciseProgressSchema);
