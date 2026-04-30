"""
Conversation Management Module
Handles storing, retrieving, and analyzing AI conversations
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pymongo import MongoClient
import os

logger = logging.getLogger(__name__)


class ConversationManager:
    """Manage AI conversation storage and retrieval"""
    
    def __init__(self, mongo_uri: str = None):
        self.mongo_uri = mongo_uri or os.getenv('MONGO_URI', 'mongodb://localhost:27017/manomitra')
        try:
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client.manomitra
            self.collection = self.db.ai_conversations
            logger.info("✓ Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            self.db = None
    
    def create_conversation(self, user_id: str, title: str = None) -> str:
        """Create a new conversation"""
        if not self.db:
            return None
        
        try:
            doc = {
                'user_id': user_id,
                'title': title or 'New Conversation',
                'messages': [],
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'overall_session_mood': 'neutral',
                'risk_detected': False,
                'keywords_detected': []
            }
            result = self.collection.insert_one(doc)
            logger.info(f"Conversation created: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return None
    
    def add_message(self, conversation_id: str, role: str, content: str, metadata: Dict = None) -> bool:
        """Add message to conversation"""
        if not self.db:
            return False
        
        try:
            message = {
                'role': role,
                'content': content,
                'timestamp': datetime.now(),
                'metadata': metadata or {}
            }
            
            result = self.collection.update_one(
                {'_id': conversation_id},
                {
                    '$push': {'messages': message},
                    '$set': {'updated_at': datetime.now()}
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error adding message: {e}")
            return False
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation by ID"""
        if not self.db:
            return None
        
        try:
            return self.collection.find_one({'_id': conversation_id})
        except Exception as e:
            logger.error(f"Error retrieving conversation: {e}")
            return None
    
    def get_user_conversations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get user's recent conversations"""
        if not self.db:
            return []
        
        try:
            return list(
                self.collection.find({'user_id': user_id})
                .sort('updated_at', -1)
                .limit(limit)
            )
        except Exception as e:
            logger.error(f"Error retrieving conversations: {e}")
            return []
    
    def get_mood_summary(self, user_id: str, days: int = 30) -> Dict:
        """Get user's mood summary for a period"""
        if not self.db:
            return {}
        
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            conversations = list(
                self.collection.find({
                    'user_id': user_id,
                    'created_at': {'$gte': start_date}
                })
            )
            
            moods = []
            risk_alerts = 0
            total_messages = 0
            
            for conv in conversations:
                if conv.get('overall_session_mood'):
                    moods.append(conv['overall_session_mood'])
                if conv.get('risk_detected'):
                    risk_alerts += 1
                total_messages += len(conv.get('messages', []))
            
            from collections import Counter
            mood_distribution = dict(Counter(moods))
            
            return {
                'total_conversations': len(conversations),
                'total_messages': total_messages,
                'mood_distribution': mood_distribution,
                'most_common_mood': max(mood_distribution, key=mood_distribution.get) if mood_distribution else 'neutral',
                'risk_alerts': risk_alerts,
                'period_days': days
            }
        except Exception as e:
            logger.error(f"Error getting mood summary: {e}")
            return {}
    
    def update_session_mood(self, conversation_id: str, mood: str, risk_detected: bool = False) -> bool:
        """Update session mood and risk status"""
        if not self.db:
            return False
        
        try:
            result = self.collection.update_one(
                {'_id': conversation_id},
                {
                    '$set': {
                        'overall_session_mood': mood,
                        'risk_detected': risk_detected,
                        'updated_at': datetime.now()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating session mood: {e}")
            return False
    
    def delete_conversation(self, conversation_id: str) -> bool:
        """Delete a conversation"""
        if not self.db:
            return False
        
        try:
            result = self.collection.delete_one({'_id': conversation_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False


class ConversationAnalyzer:
    """Analyze conversation data for insights"""
    
    @staticmethod
    def analyze_sentiment_trend(messages: List[Dict]) -> Dict:
        """Analyze sentiment trend across messages"""
        sentiments = [
            msg.get('metadata', {}).get('sentiment_score', 0)
            for msg in messages
            if msg.get('role') == 'user'
        ]
        
        if not sentiments:
            return {'trend': 'unknown', 'average': 0}
        
        avg = sum(sentiments) / len(sentiments)
        
        if len(sentiments) > 1:
            trend = 'improving' if sentiments[-1] > sentiments[0] else 'declining'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'average': round(avg, 2),
            'data_points': len(sentiments)
        }
    
    @staticmethod
    def analyze_emotion_patterns(messages: List[Dict]) -> Dict:
        """Analyze emotion patterns in conversation"""
        emotions = [
            msg.get('metadata', {}).get('emotion_label')
            for msg in messages
            if msg.get('role') == 'user' and msg.get('metadata', {}).get('emotion_label')
        ]
        
        from collections import Counter
        emotion_counts = Counter(emotions)
        
        return {
            'emotion_distribution': dict(emotion_counts),
            'dominant_emotion': emotion_counts.most_common(1)[0][0] if emotion_counts else 'neutral',
            'emotion_variety': len(emotion_counts)
        }
    
    @staticmethod
    def extract_keywords(messages: List[Dict]) -> List[str]:
        """Extract important keywords from conversation"""
        keywords = []
        
        for msg in messages:
            if msg.get('role') == 'user':
                kw = msg.get('metadata', {}).get('keywords_detected', [])
                keywords.extend(kw)
        
        # Remove duplicates and return
        return list(set(keywords))


# Export classes
__all__ = ['ConversationManager', 'ConversationAnalyzer']
