const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'safety_alert',
        'session_reminder',
        'session_booked',
        'session_cancelled',
        'mood_reminder',
        'new_message',
        'community_new_post',
        'streak_milestone',
        'achievement',
        'recommendation',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: String,
    data: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, isRead: 1 },
      { userId: 1, createdAt: -1 },
    ],
  }
);

notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  return this.save();
};

notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({ userId, isRead: false });
};

notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany({ userId, isRead: false }, { isRead: true });
};

module.exports = mongoose.model('Notification', notificationSchema);