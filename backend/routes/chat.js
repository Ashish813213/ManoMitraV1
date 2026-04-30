const express = require('express');
const { AIConversation } = require('../models');
const { verifyToken } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// GenerationChat API URL from environment
const GENERATION_CHAT_URL = process.env.GENERATION_CHAT_API_URL || 'http://localhost:5001';

/**
 * Create a new chat conversation
 * POST /api/chat/conversations
 * Body: { title?: string }
 */
router.post('/conversations', verifyToken, async (req, res, next) => {
  try {
    const { title } = req.body;
    
    const conversation = new AIConversation({
      userId: req.user.userId,
      title: title || 'New Conversation',
      messages: [],
      overallSessionMood: 'neutral',
      riskDetected: false,
      keywordsDetected: [],
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Conversation created',
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all conversations for user
 * GET /api/chat/conversations
 */
router.get('/conversations', verifyToken, async (req, res, next) => {
  try {
    const conversations = await AIConversation.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt');

    res.json({
      success: true,
      conversations,
      count: conversations.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get single conversation with messages
 * GET /api/chat/conversations/:conversationId
 */
router.get('/conversations/:conversationId', verifyToken, async (req, res, next) => {
  try {
    const conversation = await AIConversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Verify ownership
    if (conversation.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Send message and get AI response
 * POST /api/chat/messages
 * Body: { conversationId, message: string, emotion?: string }
 */
router.post('/messages', verifyToken, async (req, res, next) => {
  try {
    const { conversationId, message, emotion } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        message: 'conversationId and message are required',
      });
    }

    // Verify conversation exists and belongs to user
    const conversation = await AIConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Analyze sentiment and emotion using GenerationChat
    let analysisData = {
      emotion: emotion || 'neutral',
      sentiment: { sentiment_score: 0 },
    };
    
    try {
      const analyzeResponse = await axios.post(`${GENERATION_CHAT_URL}/analyze`, {
        text: message,
      });
      if (analyzeResponse.data) {
        analysisData = analyzeResponse.data;
      }
    } catch (error) {
      console.error('Error analyzing message:', error.message);
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      emotionLabel: analysisData.emotion || emotion || 'neutral',
      sentimentScore: analysisData.sentiment?.sentiment_score || 0,
      timestamp: new Date(),
    });

    // Get AI response from GenerationChat
    let aiResponse = 'I appreciate you sharing that. How are you feeling about this?';
    try {
      const chatResponse = await axios.post(`${GENERATION_CHAT_URL}/chat`, {
        message,
        emotion: analysisData.emotion || emotion || 'neutral',
        conversation_id: conversationId,
      });
      if (chatResponse.data.response) {
        aiResponse = chatResponse.data.response;
      }
    } catch (error) {
      console.error('Error getting AI response:', error.message);
    }

    // Add AI message to conversation
    conversation.messages.push({
      role: 'ai',
      content: aiResponse,
      emotionLabel: analysisData.emotion || 'neutral',
      sentimentScore: analysisData.sentiment?.sentiment_score || 0,
      timestamp: new Date(),
    });

    // Update conversation metadata
    conversation.overallSessionMood = analysisData.emotion || 'neutral';
    conversation.totalMessages = conversation.messages.length;

    // Check for safety alerts
    if (analysisData.safety_risk && analysisData.safety_risk.risk_level === 'high') {
      conversation.riskDetected = true;
      conversation.riskLevel = analysisData.safety_risk.risk_level;
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    // Record activity
    const { UserActivity } = require('../models');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let userActivity = await UserActivity.findOne({ userId: req.user.userId, date: today });
    if (!userActivity) {
      userActivity = new UserActivity({
        userId: req.user.userId,
        date: today,
        streakCount: 1,
      });
    }

    userActivity.chatSessions = (userActivity.chatSessions || 0) + 1;
    userActivity.sessionsCompleted = (userActivity.sessionsCompleted || 0) + 1;
    userActivity.minutesSpent = (userActivity.minutesSpent || 0) + 2;
    await userActivity.save();

    res.status(201).json({
      success: true,
      message: 'Message processed',
      data: {
        userMessage: {
          role: 'user',
          content: message,
          timestamp: new Date(),
        },
        aiMessage: {
          role: 'ai',
          content: aiResponse,
          timestamp: new Date(),
        },
        analysis: analysisData,
        safetyAlert: conversation.riskDetected ? { message: 'Safety concern detected', level: conversation.riskLevel } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete a conversation
 * DELETE /api/chat/conversations/:conversationId
 */
router.delete('/conversations/:conversationId', verifyToken, async (req, res, next) => {
  try {
    const conversation = await AIConversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await AIConversation.findByIdAndDelete(req.params.conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
