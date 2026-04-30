const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
  },
  {
    timestamps: true,
    indexes: [
      { chatRoomId: 1, createdAt: -1 },
      { senderId: 1, createdAt: -1 },
      { isFlagged: 1 },
      { emailLabel: 1 },
    ],
  }
);

module.exports = mongoose.model('Message', messageSchema);
