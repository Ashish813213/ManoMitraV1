// Utilities for NLP/Sentiment Analysis integration with Python service

/**
 * Analyze sentiment and emotion of a message
 * Sends to Python NLP service for processing
 */
const analyzeSentiment = async (text) => {
  try {
    const response = await fetch(
      process.env.NLP_SERVICE_URL || 'http://localhost:5001/analyze',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      throw new Error(`NLP Service Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract sentiment data
    const sentimentScore = data.sentiment?.sentiment_score || 0;
    const emotionLabel = data.emotion?.emotion || 'neutral';
    const moodRank = data.mood_rank || 5;
    const moodLabel = data.mood_label || 'okay';
    const tag = data.tag || emotionLabel;
    
    return {
      sentimentScore,
      emotionLabel,
      moodRank,
      moodLabel,
      tags: [tag],
      keywords: data.emotion?.keywords || [],
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return {
      sentimentScore: 0,
      emotionLabel: 'neutral',
      moodRank: 5,
      moodLabel: 'okay',
      tags: [],
      keywords: [],
    };
  }
};

/**
 * Detect high-risk keywords in text
 */
const detectRiskKeywords = (text) => {
  const riskKeywords = {
    critical: ['suicide', 'kill myself', 'end it all', 'no point living', 'overdose'],
    high: ['self harm', 'cut myself', 'destroy myself', 'hospitalized', 'emergency'],
    medium: ['hopeless', 'worthless', 'can\'t take it', 'give up', 'don\'t care'],
  };

  const lowerText = text.toLowerCase();
  const detected = {
    critical: [],
    high: [],
    medium: [],
  };

  Object.entries(riskKeywords).forEach(([level, keywords]) => {
    keywords.forEach((keyword) => {
      if (lowerText.includes(keyword)) {
        detected[level].push(keyword);
      }
    });
  });

  return detected;
};

/**
 * Determine risk level based on keywords and sentiment
 */
const assessRiskLevel = (text, sentimentScore) => {
  const detected = detectRiskKeywords(text);

  if (detected.critical.length > 0) {
    return 'critical';
  }
  if (detected.high.length > 0) {
    return 'high';
  }
  if (detected.medium.length > 0 || sentimentScore < -0.5) {
    return 'medium';
  }
  return 'low';
};

module.exports = {
  analyzeSentiment,
  detectRiskKeywords,
  assessRiskLevel,
};
