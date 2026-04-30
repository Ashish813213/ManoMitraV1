const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['therapist', 'anonymous', 'ai', 'peer'],
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    name: String,
    description: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessage: Date,
    totalMessages: {
      type: Number,
      default: 0,
    },
    settings: {
      isPrivate: {
        type: Boolean,
        default: true,
      },
      allowNotifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      { participants: 1 },
      { type: 1 },
      { type: 1, isActive: 1 },
      { lastMessage: -1 },
    ],
  }
);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
