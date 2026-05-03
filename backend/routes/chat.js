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
      .select('_id title createdAt updatedAt sessionSentimentScore sessionEmotionLabel overallSessionMood sessionSummary');

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
// Valid emotion labels from the model
const VALID_EMOTIONS = ['sad', 'happy', 'angry', 'anxious', 'calm', 'neutral', 'excited', 'confused', 'hopeful'];

function normalizeEmotion(emotion) {
  if (!emotion) return 'neutral';
  if (typeof emotion !== 'string') return 'neutral';
  // Handle object like {emotion: 'sad', confidence: 0.8, method: 'model'}
  if (typeof emotion === 'object') {
    emotion = emotion.emotion || emotion.label;
  }
  if (!emotion || typeof emotion !== 'string') return 'neutral';
  const lower = emotion.toLowerCase();
  return VALID_EMOTIONS.includes(lower) ? lower : 'neutral';
}

router.post('/messages', verifyToken, async (req, res, next) => {
  try {
    console.log('Received /chat/messages request:', { body: req.body, userId: req.user.userId });
    
    const { conversationId, message, emotion } = req.body;

    if (!conversationId) {
      console.error('Missing conversationId');
      return res.status(400).json({
        success: false,
        message: 'conversationId is required',
      });
    }

    if (!message) {
      console.error('Missing message');
      return res.status(400).json({
        success: false,
        message: 'message is required',
      });
    }

    console.log('Looking for conversation:', conversationId);

    // Verify conversation exists and belongs to the user
    const conversation = await AIConversation.findById(conversationId);
    if (!conversation) {
      console.error('Conversation not found:', conversationId);
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    console.log('Found conversation:', conversation._id, 'userId:', conversation.userId.toString());

    if (conversation.userId.toString() !== req.user.userId) {
      console.error('Unauthorized - conversation userId:', conversation.userId.toString(), 'request userId:', req.user.userId);
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Analyze sentiment and emotion using GenerationChat
    let analysisData = {
      emotion: 'neutral',
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
    
    // Extract sentiment score - handle both object and number formats
    let sentimentScore = 0;
    if (analysisData.sentiment) {
      if (typeof analysisData.sentiment === 'object') {
        sentimentScore = analysisData.sentiment.sentiment_score ?? analysisData.sentiment.compound ?? 0;
      } else if (typeof analysisData.sentiment === 'number') {
        sentimentScore = analysisData.sentiment;
      }
    }
    
    // Normalize emotion to valid enum values
    const userEmotion = normalizeEmotion(analysisData.emotion || emotion || 'neutral');
    const aiEmotion = normalizeEmotion(analysisData.emotion || 'neutral');
    
    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      emotionLabel: userEmotion,
      sentimentScore: sentimentScore,
      timestamp: new Date(),
    });

    // Build compact conversation history for GenerationChat context.
    const conversationHistory = conversation.messages.slice(-12).map((msg) => ({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Get AI response from GenerationChat
    let aiResponse = null;
    let aiError = null;
    
    try {
      console.log(`Calling GenerationChat at ${GENERATION_CHAT_URL}/chat with message:`, message.substring(0, 50));
      
      const chatResponse = await axios.post(`${GENERATION_CHAT_URL}/chat`, {
        user_message: message,
        emotion: analysisData.emotion || emotion || 'neutral',
        conversation_id: conversationId,
        user_id: req.user.userId,
        conversation_history: conversationHistory,
      }, { timeout: 30000 });
      
      console.log('GenerationChat response:', JSON.stringify(chatResponse.data).substring(0, 200));
      
      if (chatResponse.data.ai_message) {
        aiResponse = chatResponse.data.ai_message;
      } else if (chatResponse.data.response) {
        aiResponse = chatResponse.data.response;
      } else if (chatResponse.data.success === false) {
        aiError = chatResponse.data.error || 'Unknown error from GenerationChat';
        console.error('GenerationChat error:', aiError);
      } else {
        aiError = 'Invalid response format from GenerationChat';
        console.error('Invalid response from GenerationChat:', chatResponse.data);
      }
    } catch (error) {
      aiError = `GenerationChat service error: ${error.message}`;
      console.error('Error getting AI response from GenerationChat:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received - GenerationChat service may not be running');
        aiError = 'NLP service is not running. Please start the GenerationChat service on port 5001.';
      }
    }
    
    // If AI response failed, return error to user
    if (!aiResponse) {
      return res.status(503).json({
        success: false,
        message: aiError || 'Failed to get AI response',
        error: 'NLP_SERVICE_ERROR',
        hint: 'Make sure the Python GenerationChat service is running on port 5001'
      });
    }

    // Add AI message to conversation
    conversation.messages.push({
      role: 'ai',
      content: aiResponse,
      emotionLabel: aiEmotion,
      sentimentScore: sentimentScore,
      timestamp: new Date(),
    });

    // Update conversation metadata
    conversation.overallSessionMood = aiEmotion;
    conversation.totalMessages = conversation.messages.length;

    // Check for safety alerts
    if (analysisData.safety_risk && analysisData.safety_risk.risk_level === 'high') {
      conversation.riskDetected = true;
      conversation.riskLevel = analysisData.safety_risk.risk_level;
    }

    conversation.updatedAt = new Date();
    
    try {
      await conversation.save();
      console.log('Conversation saved successfully, total messages:', conversation.messages.length);
    } catch (saveError) {
      console.error('Error saving conversation:', saveError.message);
      console.error('Save error details:', saveError.errors);
      return res.status(400).json({
        success: false,
        message: 'Failed to save conversation: ' + saveError.message,
      });
    }

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
        analysis: {
          emotion: userEmotion,
          sentiment: { sentiment_score: sentimentScore },
        },
        safetyAlert: conversation.riskDetected ? { message: 'Safety concern detected', level: conversation.riskLevel } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Close a conversation and store a session summary
 * POST /api/chat/conversations/:conversationId/close
 */
router.post('/conversations/:conversationId/close', verifyToken, async (req, res, next) => {
  try {
    const conversation = await AIConversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const userMessages = conversation.messages.filter((message) => message.role === 'user');
    const scores = userMessages
      .map((message) => typeof message.sentimentScore === 'number' ? message.sentimentScore : null)
      .filter((score) => score !== null);

    const averageScore = scores.length
      ? scores.reduce((total, score) => total + score, 0) / scores.length
      : 0;

    let sessionEmotionLabel = 'neutral';
    if (averageScore >= 0.35) {
      sessionEmotionLabel = 'happy';
    } else if (averageScore >= 0.1) {
      sessionEmotionLabel = 'calm';
    } else if (averageScore <= -0.35) {
      sessionEmotionLabel = 'sad';
    } else if (averageScore <= -0.15) {
      sessionEmotionLabel = 'anxious';
    }

    conversation.sessionSentimentScore = Number(averageScore.toFixed(3));
    conversation.sessionEmotionLabel = sessionEmotionLabel;
    conversation.overallSessionMood = sessionEmotionLabel;

    const messageCount = conversation.messages.length;
    conversation.sessionSummary = `Closed chat with ${messageCount} messages. Final session mood: ${sessionEmotionLabel}. Sentiment score: ${conversation.sessionSentimentScore.toFixed(3)}.`;
    conversation.updatedAt = new Date();

    await conversation.save();

    return res.json({
      success: true,
      message: 'Conversation closed',
      summary: {
        sentimentScore: conversation.sessionSentimentScore,
        emotion: sessionEmotionLabel,
        sessionSummary: conversation.sessionSummary,
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
