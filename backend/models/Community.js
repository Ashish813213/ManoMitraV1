const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: String,
    category: {
      type: String,
      enum: [
        'anxiety_support',
        'depression_support',
        'stress_management',
        'sleep_wellness',
        'fitness',
        'meditation',
        'relationships',
        'work_life_balance',
        'general',
      ],
      default: 'general',
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: Date,
        role: {
          type: String,
          enum: ['member', 'moderator', 'admin'],
          default: 'member',
        },
      },
    ],
    totalMembers: {
      type: Number,
      default: 0,
    },
    posts: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        userName: String,
        content: String,
        likes: {
          type: Number,
          default: 0,
        },
        comments: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            userName: String,
            content: String,
            likes: {
              type: Number,
              default: 0,
            },
            createdAt: Date,
          },
        ],
        createdAt: Date,
        updatedAt: Date,
      },
    ],
    imageUrl: String,
    bannerUrl: String,
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowAnonymousPosts: {
      type: Boolean,
      default: false,
    },
    guidelines: String,
    tags: [String],
  },
  {
    timestamps: true,
    indexes: [
      { category: 1 },
      { totalMembers: -1 },
      { createdAt: -1 },
      { 'members.userId': 1 },
    ],
  }
);

module.exports = mongoose.model('Community', communitySchema);
