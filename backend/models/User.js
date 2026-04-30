const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: function () {
        return !this.isAnonymous;
      },
      trim: true,
    },
    email: {
      type: String,
      required: function () {
        return !this.isAnonymous;
      },
      unique: true,
      sparse: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: function () {
        return !this.isAnonymous;
      },
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'therapist', 'admin'],
      default: 'user',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    anonymousToken: {
      type: String,
      sparse: true,
    },
    profile: {
      age: Number,
      gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      },
      avatar: String,
    },
    mentalHealthProfile: {
      baselineMoodScore: {
        type: Number,
        min: 1,
        max: 10,
      },
      riskLevel: {
        type: String,
        enum: ['low', 'moderate', 'high'],
        default: 'low',
      },
      lastSentimentScore: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { email: 1, isAnonymous: 1 },
      { createdAt: 1 },
    ],
  }
);

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) {
    return;
  }
  try {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
