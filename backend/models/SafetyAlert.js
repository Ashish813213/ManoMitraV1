const mongoose = require('mongoose');

const safetyAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    detectedFrom: {
      type: String,
      enum: ['journal', 'chat', 'ai', 'exercise', 'session', 'manual', 'mood'],
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    keywordsDetected: [String],
    description: String,
    actionTaken: {
      type: String,
      enum: ['alert_sent', 'emergency_services_notified', 'therapist_contacted', 'none', 'pending_review'],
      default: 'pending_review',
    },
    actionDetails: String,
    reviewedByAdmin: {
      type: Boolean,
      default: false,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: String,
    status: {
      type: String,
      enum: ['open', 'resolved', 'escalated', 'closed'],
      default: 'open',
    },
    relatedDocuments: [
      {
        docType: String,
        docId: mongoose.Schema.Types.ObjectId,
      },
    ],
    emergencyContact: {
      name: String,
      phone: String,
      email: String,
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, createdAt: -1 },
      { riskLevel: 1, status: 1 },
      { detectedFrom: 1, riskLevel: 1 },
      { status: 1 },
      { reviewedByAdmin: 1, createdAt: -1 },
    ],
  }
);

module.exports = mongoose.model('SafetyAlert', safetyAlertSchema);
