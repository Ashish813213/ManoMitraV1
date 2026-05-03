const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: String,
    messageType: {
      type: String,
      enum: ['text', 'image', 'system', 'file'],
      default: 'text',
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        url: String,
        type: String,
        size: Number,
      },
    ],
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
    },
    emotionLabel: {
      type: String,
      enum: ['sad', 'happy', 'angry', 'anxious', 'calm', 'neutral', 'excited', 'confused'],
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: String,
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reportedAt: Date,
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    reactions: [
      {
        emoji: String,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    replyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    indexes: [
      { chatRoomId: 1, createdAt: -1 },
      { communityId: 1, createdAt: -1 },
      { senderId: 1, createdAt: -1 },
      { isFlagged: 1 },
      { isReported: 1 },
    ],
  }
);

module.exports = mongoose.model('Message', messageSchema);
