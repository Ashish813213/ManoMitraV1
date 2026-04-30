"""
ManoMITRA NLP & Chat Generation Service
A comprehensive natural language processing and AI chat generation backend
for mental health and wellness support.

Features:
- Sentiment analysis (VADER)
- Emotion classification (TextCNN/Rule-based)
- Safety risk detection
- Contextual chat generation
- Integration with MongoDB
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np

# NLP and ML imports
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
import nltk
from transformers import pipeline

# Database
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# Configure logging early so startup failures are captured safely.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Import advanced chatbot
from advanced_chat import NvidiaAdvancedChatBot, ContextualChatBot

# Initialize NVIDIA chatbot
try:
    nvidia_chatbot = NvidiaAdvancedChatBot()
    logger.info("✓ NVIDIA Nemotron chatbot initialized")
    use_nvidia = True
except Exception as e:
    logger.warning(f"Could not initialize NVIDIA chatbot: {e}. Using fallback.")
    nvidia_chatbot = None
    use_nvidia = False

# =============================================================================
# NLTK Downloads
# =============================================================================

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# =============================================================================
# Initialize NLP Models
# =============================================================================

# VADER Sentiment Analysis (Fast, rule-based)
sia = SentimentIntensityAnalyzer()

# Try to load emotion classification model (requires transformers)
try:
    emotion_classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        device=-1  # CPU, use 0 for GPU
    )
    logger.info("✓ Emotion classification model loaded")
except Exception as e:
    logger.warning(f"Could not load emotion model: {e}. Using rule-based fallback.")
    emotion_classifier = None

# =============================================================================
# Database Connection
# =============================================================================

def get_db():
    """Get MongoDB connection"""
    try:
        mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/manomitra')
        client = MongoClient(mongo_uri)
        db = client.manomitra
        return db
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

# =============================================================================
# NLP Utilities
# =============================================================================

class SentimentAnalyzer:
    """Sentiment analysis utility"""
    
    @staticmethod
    def analyze(text: str) -> Dict:
        """
        Analyze sentiment of text using VADER
        Returns: {
            'sentiment_score': float (-1 to 1),
            'compound': float,
            'positive': float,
            'negative': float,
            'neutral': float,
            'sentiment_label': str
        }
        """
        if not text or not isinstance(text, str):
            return {
                'sentiment_score': 0,
                'compound': 0,
                'sentiment_label': 'neutral'
            }
        
        try:
            scores = sia.polarity_scores(text)
            
            # Normalize compound score (-1 to 1)
            compound = scores['compound']
            
            # Determine sentiment label
            if compound >= 0.05:
                label = 'positive'
            elif compound <= -0.05:
                label = 'negative'
            else:
                label = 'neutral'
            
            return {
                'sentiment_score': compound,
                'compound': compound,
                'positive': scores['pos'],
                'negative': scores['neg'],
                'neutral': scores['neu'],
                'sentiment_label': label
            }
        except Exception as e:
            logger.error(f"Sentiment analysis error: {e}")
            return {'sentiment_score': 0, 'sentiment_label': 'neutral', 'error': str(e)}


class EmotionDetector:
    """Emotion detection utility"""
    
    # Emotion keywords fallback (when model not available)
    EMOTION_KEYWORDS = {
        'sad': ['sad', 'depressed', 'unhappy', 'miserable', 'lonely', 'down', 'blue', 'devastated'],
        'happy': ['happy', 'joyful', 'excited', 'delighted', 'thrilled', 'cheerful', 'wonderful'],
        'angry': ['angry', 'furious', 'rage', 'frustrated', 'annoyed', 'mad', 'irritated'],
        'anxious': ['anxious', 'nervous', 'worried', 'afraid', 'scared', 'terrified', 'stressed'],
        'calm': ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil', 'content', 'at ease'],
        'confused': ['confused', 'puzzled', 'bewildered', 'disoriented', 'uncertain'],
        'hopeful': ['hopeful', 'optimistic', 'positive', 'encouraged', 'inspired'],
        'neutral': ['okay', 'fine', 'alright', 'normal', 'usual']
    }
    
    @staticmethod
    def detect(text: str) -> Dict:
        """
        Detect emotion from text using model or keyword matching
        Returns: {
            'emotion': str,
            'confidence': float,
            'all_emotions': dict,
            'method': 'model' or 'keyword'
        }
        """
        if not text:
            return {'emotion': 'neutral', 'confidence': 0.5, 'method': 'default'}
        
        text_lower = text.lower()
        
        # Try using model if available
        if emotion_classifier:
            try:
                result = emotion_classifier(text[:512])  # Limit to 512 chars
                emotion = result[0]['label']
                confidence = result[0]['score']
                return {
                    'emotion': emotion,
                    'confidence': float(confidence),
                    'method': 'model'
                }
            except Exception as e:
                logger.warning(f"Emotion detection error: {e}, falling back to keywords")
        
        # Fallback: keyword-based detection
        emotion_scores = {emotion: 0 for emotion in EmotionDetector.EMOTION_KEYWORDS}
        
        for emotion, keywords in EmotionDetector.EMOTION_KEYWORDS.items():
            emotion_scores[emotion] = sum(1 for keyword in keywords if keyword in text_lower)
        
        max_emotion = max(emotion_scores, key=emotion_scores.get)
        max_score = emotion_scores[max_emotion]
        
        confidence = min(max_score / 5.0, 1.0) if max_score > 0 else 0.5
        
        if max_score == 0:
            return {
                'emotion': 'neutral',
                'confidence': 0.5,
                'method': 'keyword'
            }
        
        return {
            'emotion': max_emotion,
            'confidence': float(confidence),
            'method': 'keyword'
        }


class SafetyDetector:
    """Safety risk detection"""
    
    # Risk keywords organized by severity
    RISK_KEYWORDS = {
        'critical': [
            'suicide', 'kill myself', 'end it all', 'no point living',
            'overdose', 'hang myself', 'jump', 'cut myself deep',
            'not worth living', 'better off dead'
        ],
        'high': [
            'self harm', 'self-harm', 'cut myself', 'hurt myself',
            'destroy myself', 'hospitalized', 'emergency room',
            'cannot take it', 'breaking point'
        ],
        'medium': [
            'hopeless', 'worthless', 'useless', 'give up',
            'can\'t go on', 'don\'t care', 'don\'t want to live',
            'tired of living', 'empty inside'
        ]
    }
    
    @staticmethod
    def detect(text: str) -> Dict:
        """
        Detect safety concerns in text
        Returns: {
            'risk_level': 'low' | 'medium' | 'high' | 'critical',
            'keywords_detected': list,
            'immediate_action_required': bool
        }
        """
        if not text:
            return {'risk_level': 'low', 'keywords_detected': []}
        
        text_lower = text.lower()
        detected_keywords = []
        
        # Check each risk level
        for level, keywords in SafetyDetector.RISK_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    detected_keywords.append((keyword, level))
        
        # Determine overall risk level
        if not detected_keywords:
            risk_level = 'low'
        else:
            levels = [level for _, level in detected_keywords]
            if 'critical' in levels:
                risk_level = 'critical'
            elif 'high' in levels:
                risk_level = 'high'
            else:
                risk_level = 'medium'
        
        return {
            'risk_level': risk_level,
            'keywords_detected': [k[0] for k in detected_keywords],
            'immediate_action_required': risk_level in ['critical', 'high']
        }


class ChatGenerator:
    """AI chat generation - contextual responses"""
    
    # Response templates based on emotion and context
    RESPONSE_TEMPLATES = {
        'sad': {
            'opening': [
                "I'm so sorry you're feeling down. That sounds really difficult.",
                "It's okay to feel sad sometimes. I'm here to listen.",
                "I hear you. These feelings are valid.",
            ],
            'supportive': [
                "Remember that this feeling is temporary, even if it doesn't feel that way right now.",
                "You've overcome challenges before. You're stronger than you think.",
                "It's okay to not be okay. What matters is that you're reaching out.",
            ],
            'actionable': [
                "Would you like to try a grounding exercise to help you feel more present?",
                "Sometimes talking to someone you trust can really help. Have you considered reaching out to a friend or therapist?",
                "Taking a walk or doing some gentle movement might help lift your mood a bit.",
            ]
        },
        'anxious': {
            'opening': [
                "Anxiety can feel overwhelming. I'm here to help you through this.",
                "What you're feeling is real, and it's manageable.",
                "Let's work through this together.",
            ],
            'supportive': [
                "Remember: you've made it through 100% of your worst days so far.",
                "Anxiety often feels bigger than it actually is. You can handle this.",
                "Try to focus on what you can control right now, not everything.",
            ],
            'actionable': [
                "Taking slow, deep breaths can help calm your nervous system. Try breathing in for 4, holding for 4, and out for 4.",
                "Would a grounding exercise help you feel more present and less anxious?",
                "Sometimes writing down your worries can help organize them.",
            ]
        },
        'angry': {
            'opening': [
                "I understand you're feeling frustrated. That's valid.",
                "Anger is often masking pain. What's really bothering you?",
                "It's okay to feel angry. Let's talk about what triggered this.",
            ],
            'supportive': [
                "Your feelings are important and deserve to be heard.",
                "This situation is frustrating, and you have a right to feel upset.",
                "Anger can be a sign that something important matters to you.",
            ],
            'actionable': [
                "Sometimes physical activity like a workout can help release anger productively.",
                "Writing or journaling about your feelings can help process them.",
                "Would you like to talk about what happened?",
            ]
        },
        'happy': {
            'opening': [
                "That's wonderful! I'm so glad you're doing well!",
                "It's great to hear positive things from you!",
                "Your happiness is contagious! What's going on?",
            ],
            'supportive': [
                "Hold onto these good feelings - they matter.",
                "It's beautiful to see you thriving.",
                "Keep nurturing what's bringing you joy.",
            ],
            'actionable': [
                "Would you like to journal about this positive moment?",
                "Consider sharing this happiness with someone you care about.",
                "Let's celebrate this with you!",
            ]
        },
        'neutral': {
            'opening': [
                "Hello! How are you really feeling today?",
                "I'm here if you'd like to talk about anything.",
                "What's on your mind?",
            ],
            'supportive': [
                "It's okay if you're not sure how you're feeling.",
                "Take your time to express yourself.",
                "I'm listening without judgment.",
            ],
            'actionable': [
                "Would you like to do a wellness check-in?",
                "How can I best support you right now?",
                "What would help you feel better?",
            ]
        }
    }
    
    @staticmethod
    def generate(user_message: str, emotion: str, sentiment_score: float, context: Optional[Dict] = None) -> Dict:
        """
        Generate contextual AI response
        Returns: {
            'response': str,
            'suggestions': list,
            'resources': list,
            'follow_up': str
        }
        """
        if not user_message or not isinstance(user_message, str):
            return {'response': 'I\'m having trouble understanding. Could you say that differently?', 'suggestions': []}
        
        try:
            # Determine response tone based on emotion
            emotion_key = emotion if emotion in ChatGenerator.RESPONSE_TEMPLATES else 'neutral'
            templates = ChatGenerator.RESPONSE_TEMPLATES[emotion_key]
            
            # Select opening response
            opening = np.random.choice(templates['opening'])
            
            # Add supportive message
            supportive = np.random.choice(templates['supportive'])
            
            # Add actionable suggestion
            actionable = np.random.choice(templates['actionable'])
            
            # Combine response
            response = f"{opening}\n\n{supportive}\n\n{actionable}"
            
            # Generate suggestions based on context
            suggestions = ChatGenerator._generate_suggestions(emotion, sentiment_score)
            
            # Resources
            resources = ChatGenerator._get_resources(emotion)
            
            return {
                'response': response,
                'suggestions': suggestions,
                'resources': resources,
                'emotion_detected': emotion
            }
        except Exception as e:
            logger.error(f"Chat generation error: {e}")
            return {
                'response': "I'm here to listen. Tell me more about what you're experiencing.",
                'suggestions': []
            }
    
    @staticmethod
    def _generate_suggestions(emotion: str, sentiment_score: float) -> List[str]:
        """Generate wellness suggestions based on emotion"""
        suggestions = []
        
        if emotion in ['sad', 'anxious']:
            suggestions.extend([
                "Try a 5-minute breathing exercise",
                "Write in your journal",
                "Take a short walk in nature"
            ])
        
        if emotion == 'anxious':
            suggestions.extend([
                "Practice the 5-4-3-2-1 grounding technique",
                "Listen to calming music"
            ])
        
        if emotion == 'angry':
            suggestions.extend([
                "Do some physical exercise",
                "Try progressive muscle relaxation",
                "Write down your thoughts"
            ])
        
        if emotion == 'happy':
            suggestions.append("Share your happiness with someone")
        
        if sentiment_score < -0.5:
            suggestions.append("Consider talking to a professional therapist")
        
        return suggestions[:3]  # Return top 3
    
    @staticmethod
    def _get_resources(emotion: str) -> List[Dict]:
        """Get relevant resources for emotion"""
        resources_map = {
            'sad': [
                {'title': 'Depression Resources', 'url': 'https://www.nimh.nih.gov/depression'},
                {'title': 'Helpline', 'phone': '1-800-273-8255'}
            ],
            'anxious': [
                {'title': 'Anxiety Techniques', 'url': 'https://www.nimh.nih.gov/anxiety'},
                {'title': 'Breathing Exercises', 'url': '#'}
            ],
            'angry': [
                {'title': 'Anger Management', 'url': '#'},
                {'title': 'Conflict Resolution', 'url': '#'}
            ]
        }
        
        return resources_map.get(emotion, [])


# =============================================================================
# API Endpoints
# =============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'ManoMITRA NLP Service',
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/analyze', methods=['POST'])
def analyze_text():
    """
    Main NLP analysis endpoint
    POST /analyze
    Body: {
        'text': str,
        'include_emotion': bool (optional),
        'include_safety': bool (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Text is required'
            }), 400
        
        text = data['text'].strip()
        include_emotion = data.get('include_emotion', True)
        include_safety = data.get('include_safety', True)
        
        # Sentiment Analysis
        sentiment_result = SentimentAnalyzer.analyze(text)
        
        # Emotion Detection
        emotion_result = EmotionDetector.detect(text) if include_emotion else {}
        
        # Safety Detection
        safety_result = SafetyDetector.detect(text) if include_safety else {}
        
        response = {
            'success': True,
            'text_length': len(text),
            'sentiment': sentiment_result,
            'emotion': emotion_result,
            'safety': safety_result,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Analysis complete - Sentiment: {sentiment_result['sentiment_label']}, Emotion: {emotion_result.get('emotion', 'N/A')}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/chat', methods=['POST'])
def chat():
    """
    Advanced chat generation endpoint powered by NVIDIA Nemotron AI
    POST /chat
    Body: {
        'user_message': str,
        'user_id': str (optional),
        'conversation_id': str (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'user_message' not in data:
            return jsonify({
                'success': False,
                'error': 'user_message is required'
            }), 400
        
        user_message = data['user_message'].strip()
        user_id = data.get('user_id')
        conversation_id = data.get('conversation_id')
        
        # Analyze user message
        sentiment = SentimentAnalyzer.analyze(user_message)
        emotion = EmotionDetector.detect(user_message)
        safety = SafetyDetector.detect(user_message)
        
        # Generate response using NVIDIA API or fallback
        if use_nvidia and nvidia_chatbot:
            try:
                ai_response_result = nvidia_chatbot.generate_response(
                    user_message=user_message,
                    emotion=emotion['emotion']
                )
                
                if ai_response_result.get('success'):
                    ai_response = {
                        'response': ai_response_result['response'],
                        'reasoning': ai_response_result.get('reasoning', ''),
                        'suggestions': [],  # NVIDIA model generates contextual suggestions in response
                        'resources': []
                    }
                else:
                    # Fallback to local generation
                    ai_response = ChatGenerator.generate(
                        user_message,
                        emotion['emotion'],
                        sentiment['sentiment_score']
                    )
            except Exception as e:
                logger.warning(f"NVIDIA API error, using fallback: {e}")
                ai_response = ChatGenerator.generate(
                    user_message,
                    emotion['emotion'],
                    sentiment['sentiment_score']
                )
        else:
            # Use fallback local generation
            ai_response = ChatGenerator.generate(
                user_message,
                emotion['emotion'],
                sentiment['sentiment_score']
            )
        
        # Store conversation (if user_id provided)
        if user_id:
            db = get_db()
            if db:
                try:
                    db.ai_conversations.update_one(
                        {'_id': conversation_id or user_id},
                        {
                            '$push': {
                                'messages': [
                                    {
                                        'role': 'user',
                                        'content': user_message,
                                        'sentiment_score': sentiment['sentiment_score'],
                                        'emotion_label': emotion['emotion'],
                                        'timestamp': datetime.now()
                                    },
                                    {
                                        'role': 'ai',
                                        'content': ai_response['response'],
                                        'model': 'nvidia-nemotron' if use_nvidia else 'local-fallback',
                                        'reasoning': ai_response.get('reasoning', ''),
                                        'timestamp': datetime.now()
                                    }
                                ]
                            },
                            '$set': {
                                'overall_session_mood': emotion['emotion'],
                                'risk_detected': safety['risk_level'] in ['high', 'critical']
                            }
                        },
                        upsert=True
                    )
                except Exception as e:
                    logger.warning(f"Could not store conversation: {e}")
        
        response = {
            'success': True,
            'ai_message': ai_response['response'],
            'reasoning': ai_response.get('reasoning', ''),
            'suggestions': ai_response.get('suggestions', []),
            'resources': ai_response.get('resources', []),
            'analysis': {
                'sentiment': sentiment['sentiment_score'],
                'sentiment_label': sentiment['sentiment_label'],
                'emotion': emotion['emotion'],
                'emotion_confidence': emotion['confidence']
            },
            'safety_alert': safety['risk_level'] in ['high', 'critical'],
            'safety_details': safety if safety['risk_level'] != 'low' else None,
            'model_used': 'nvidia-nemotron' if use_nvidia else 'local-fallback',
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Chat response generated - Model: {'NVIDIA' if use_nvidia else 'Fallback'}, Emotion: {emotion['emotion']}, Risk: {safety['risk_level']}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/sentiment', methods=['POST'])
def sentiment():
    """
    Dedicated sentiment analysis endpoint
    POST /sentiment
    Body: { 'text': str }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Text required'}), 400
        
        result = SentimentAnalyzer.analyze(data['text'])
        return jsonify({'success': True, 'sentiment': result}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/emotion', methods=['POST'])
def emotion():
    """
    Dedicated emotion detection endpoint
    POST /emotion
    Body: { 'text': str }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Text required'}), 400
        
        result = EmotionDetector.detect(data['text'])
        return jsonify({'success': True, 'emotion': result}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/safety', methods=['POST'])
def safety():
    """
    Safety risk detection endpoint
    POST /safety
    Body: { 'text': str }
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Text required'}), 400
        
        result = SafetyDetector.detect(data['text'])
        return jsonify({'success': True, 'safety': result}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# Error Handlers
# =============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {error}")
    return jsonify({'error': 'Internal server error'}), 500


# =============================================================================
# Main
# =============================================================================

if __name__ == '__main__':
    port = int(os.getenv('NLP_PORT', 5001))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    
    logger.info(f"🚀 Starting ManoMITRA NLP Service on port {port}")
    logger.info(f"Debug mode: {debug}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug,
        use_reloader=debug
    )
