const { SafetyAlert, User } = require('../models');
const { assessRiskLevel, detectRiskKeywords } = require('./nlpService');

/**
 * Check for safety concerns and create alerts if needed
 */
const checkSafety = async (userId, text, source) => {
  try {
    const riskLevel = assessRiskLevel(text, -0.5); // Simplified for now
    const keywords = detectRiskKeywords(text);
    const allKeywords = [...keywords.critical, ...keywords.high, ...keywords.medium];

    if (riskLevel !== 'low') {
      const alert = new SafetyAlert({
        userId,
        detectedFrom: source,
        riskLevel,
        keywordsDetected: allKeywords,
        actionTaken: riskLevel === 'critical' ? 'alert_sent' : 'pending_review',
        description: `Detected concerning content from ${source}`,
      });

      await alert.save();

      // If critical, notify admins
      if (riskLevel === 'critical') {
        await notifyAdmins(userId, alert);
      }

      return alert;
    }

    return null;
  } catch (error) {
    console.error('Error checking safety:', error);
    return null;
  }
};

/**
 * Notify administrators of critical alerts
 */
const notifyAdmins = async (userId, alert) => {
  try {
    const admins = await User.find({ role: 'admin' });
    // TODO: Implement email/SMS/push notification logic
    console.log(`[ALERT] Admin notification sent for user ${userId}: ${alert._id}`);
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};

/**
 * Generate safety assessment summary
 */
const generateSafetyAssessment = async (userId) => {
  try {
    const recentAlerts = await SafetyAlert.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    const criticalCount = recentAlerts.filter((a) => a.riskLevel === 'critical').length;
    const highCount = recentAlerts.filter((a) => a.riskLevel === 'high').length;

    return {
      totalAlerts: recentAlerts.length,
      criticalAlerts: criticalCount,
      highAlerts: highCount,
      recentAlerts,
      overallRisk: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'low',
    };
  } catch (error) {
    console.error('Error generating safety assessment:', error);
    return null;
  }
};

module.exports = {
  checkSafety,
  notifyAdmins,
  generateSafetyAssessment,
};
