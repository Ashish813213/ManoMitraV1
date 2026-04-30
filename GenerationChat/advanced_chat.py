"""
Advanced Chat Generation Module with NVIDIA Nemotron Integration
Provides sophisticated conversation generation using NVIDIA's API with advanced reasoning
"""

import os
import random
import logging
from typing import Dict, List, Optional, Generator
from datetime import datetime
from openai import OpenAI

logger = logging.getLogger(__name__)


class NvidiaAdvancedChatBot:
    """Advanced chatbot powered by NVIDIA Nemotron model with extended thinking"""
    
    def __init__(self):
        """Initialize NVIDIA API client"""
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key:
            raise ValueError("NVIDIA_API_KEY not found in environment variables")
        
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        self.model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
        self.conversation_history = []
        
        # Context for mental health support
        self.system_prompt = """You are ManoMITRA, a compassionate mental health support assistant. 
You provide empathetic, thoughtful responses to users sharing their mental health concerns.

Your approach:
1. Validate their feelings and experiences
2. Show genuine empathy and understanding
3. Ask clarifying questions to better understand
4. Offer practical coping strategies when appropriate
5. Encourage professional help when needed
6. Never diagnose or prescribe medications
7. Prioritize user safety and crisis resources

Tone: Warm, supportive, non-judgmental, professional.
Always maintain confidentiality and respect boundaries."""

    def generate_response(self, user_message: str, emotion: str = None) -> Dict:
        """
        Generate advanced response using NVIDIA Nemotron with extended thinking
        
        Args:
            user_message: User's input message
            emotion: Detected emotion (optional, for context)
            
        Returns:
            Dict with response, thinking process, and metadata
        """
        try:
            # Build conversation context
            context_message = f"User emotion detected: {emotion}\n" if emotion else ""
            full_message = f"{context_message}User: {user_message}"
            
            self.conversation_history.append({
                "role": "user",
                "content": full_message
            })
            
            # Call NVIDIA API with streaming and extended thinking
            reasoning_content = ""
            response_content = ""
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    *self.conversation_history
                ],
                temperature=0.7,
                top_p=0.95,
                max_tokens=2048,
                extra_body={
                    "chat_template_kwargs": {"enable_thinking": True},
                    "reasoning_budget": 8192
                },
                stream=True
            )
            
            # Process streaming response
            for chunk in completion:
                if not chunk.choices:
                    continue
                
                # Extract reasoning (extended thinking)
                reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
                if reasoning:
                    reasoning_content += reasoning
                
                # Extract response content
                if chunk.choices[0].delta.content is not None:
                    response_content += chunk.choices[0].delta.content
            
            # Add assistant response to history
            if response_content:
                self.conversation_history.append({
                    "role": "assistant",
                    "content": response_content
                })
            
            return {
                "success": True,
                "response": response_content,
                "reasoning": reasoning_content,
                "timestamp": datetime.now().isoformat(),
                "model": self.model,
                "emotion_context": emotion
            }
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "response": "I encountered an error processing your message. Please try again.",
                "timestamp": datetime.now().isoformat()
            }
    
    def generate_response_stream(self, user_message: str, emotion: str = None) -> Generator:
        """
        Generate response with streaming output for real-time display
        
        Args:
            user_message: User's input message
            emotion: Detected emotion (optional)
            
        Yields:
            Chunks of response content
        """
        try:
            context_message = f"User emotion detected: {emotion}\n" if emotion else ""
            full_message = f"{context_message}User: {user_message}"
            
            self.conversation_history.append({
                "role": "user",
                "content": full_message
            })
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    *self.conversation_history
                ],
                temperature=0.7,
                top_p=0.95,
                max_tokens=2048,
                extra_body={
                    "chat_template_kwargs": {"enable_thinking": True},
                    "reasoning_budget": 8192
                },
                stream=True
            )
            
            full_response = ""
            
            for chunk in completion:
                if not chunk.choices:
                    continue
                
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield {
                        "type": "content",
                        "data": content,
                        "timestamp": datetime.now().isoformat()
                    }
            
            # Store full response in history
            if full_response:
                self.conversation_history.append({
                    "role": "assistant",
                    "content": full_response
                })
            
            yield {
                "type": "complete",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in streaming response: {str(e)}")
            yield {
                "type": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def clear_history(self):
        """Clear conversation history for new session"""
        self.conversation_history = []
    
    def get_conversation_summary(self) -> Dict:
        """Get summary of current conversation"""
        if not self.conversation_history:
            return {"summary": "No conversation yet", "message_count": 0}
        
        message_count = len(self.conversation_history)
        user_messages = [m for m in self.conversation_history if m.get("role") == "user"]
        
        return {
            "message_count": message_count,
            "user_turns": len(user_messages),
            "conversation_active": True,
            "last_updated": datetime.now().isoformat()
        }
    
    def set_conversation_context(self, context: str):
        """Set additional context for the conversation"""
        if context:
            self.conversation_history.append({
                "role": "system",
                "content": f"Context: {context}"
            })


class ContextualChatBot:
    """Advanced contextual chatbot for mental health support"""
    
    # Comprehensive response library organized by emotion and context
    RESPONSE_LIBRARY = {
        'sad': {
            'validate': [
                "It sounds like you're going through a really tough time right now.",
                "Those feelings are valid, and I appreciate you sharing them with me.",
                "It's completely understandable to feel this way.",
                "Sadness is a natural emotion, and you're not alone in feeling it.",
            ],
            'explore': [
                "Can you tell me a bit more about what's been making you feel this way?",
                "What happened that led to these feelings?",
                "Is there a specific trigger, or has it been building up?",
                "How long have you been feeling like this?",
            ],
            'empathize': [
                "I can sense how much you're struggling right now.",
                "Your pain is real and important.",
                "Thank you for being vulnerable with me.",
                "It takes courage to acknowledge these feelings.",
            ],
            'encourage': [
                "Even though it doesn't feel like it now, these feelings will change.",
                "You've overcome difficult times before.",
                "Small steps forward are still progress.",
                "You deserve support and care, especially from yourself.",
            ],
            'suggest': [
                "Would it help to talk about what might make you feel a little better?",
                "Some people find journaling helps process these feelings.",
                "A short walk or gentle movement sometimes helps shift mood.",
                "Would you like to try a grounding exercise together?",
            ]
        },
        'anxious': {
            'validate': [
                "Anxiety can feel really overwhelming and scary.",
                "Your worries are real and valid.",
                "It's okay to feel anxious about uncertainty.",
                "What you're experiencing is a common human response.",
            ],
            'explore': [
                "What are you most worried about right now?",
                "When did you first start feeling this way?",
                "Is there something specific triggering this, or does it feel general?",
                "What thoughts are running through your mind?",
            ],
            'reframe': [
                "Remember: you've survived 100% of your bad days so far.",
                "Anxiety often feels bigger than it actually is.",
                "What's one thing you can control right now?",
                "Can you identify one thing that's actually safe in this moment?",
            ],
            'ground': [
                "Let's focus on the present moment. What can you see right now?",
                "Let's try grounding you: name 5 things you can see, 4 you can touch...",
                "Slow, deep breathing can help calm your nervous system.",
                "Tell me what's real and true right now.",
            ],
            'guide': [
                "Would a breathing exercise help you feel more grounded?",
                "Let's practice calming techniques together.",
                "Focusing on your senses can help reduce anxiety.",
                "Physical movement can help discharge anxiety energy.",
            ]
        },
        'angry': {
            'validate': [
                "Your anger is valid. Something important has been violated.",
                "It's healthy to feel angry about injustice or frustration.",
                "Your feelings matter, and they deserve to be heard.",
                "Anger often means something matters deeply to you.",
            ],
            'explore': [
                "What happened that made you feel this way?",
                "Who or what are you most frustrated with?",
                "Where do you feel this anger in your body?",
                "What would need to happen for this to feel resolved?",
            ],
            'understand': [
                "Anger is often covering up pain or fear. What might that be?",
                "Sometimes anger is a sign that a boundary was crossed.",
                "What value of yours was violated?",
                "What are you protecting?",
            ],
            'channel': [
                "Physical activity can be a great way to channel anger productively.",
                "Some people find it helpful to write angry letters they don't send.",
                "What's a healthy way you could express this?",
                "How can you make your voice heard constructively?",
            ],
            'resolve': [
                "Once you feel calmer, would you like to think about next steps?",
                "What would help you move forward?",
                "How can you use this energy for positive change?",
                "What do you need to feel respected?",
            ]
        },
        'hopeful': {
            'celebrate': [
                "That's wonderful! I'm genuinely happy for you!",
                "This is great progress - hold onto this feeling!",
                "Your optimism is beautiful to see.",
                "This is exactly the kind of momentum that creates positive change.",
            ],
            'affirm': [
                "You deserve to feel this good.",
                "Keep nurturing what's bringing you this joy.",
                "This hope you're feeling is powerful.",
                "You're creating positive momentum.",
            ],
            'strengthen': [
                "How can you hold onto this feeling?",
                "What can you do to keep building on this?",
                "Who should you share this with?",
                "What needs to stay the same to keep this going?",
            ],
            'plan': [
                "What would you like to do with this positive energy?",
                "Can you set a goal based on this hope?",
                "How can you help others feel this way too?",
                "What's the next step you'd like to take?",
            ]
        },
        'confused': {
            'clarify': [
                "It's okay to feel confused. Let's work through this together.",
                "Can you help me understand what's confusing you?",
                "Sometimes things become clearer when we talk about them.",
                "Let's break this down into smaller pieces.",
            ],
            'explore': [
                "What aspect is most confusing to you?",
                "Have you felt this way before?",
                "Is this about a situation or your feelings?",
                "What would clarity look like to you?",
            ],
            'organize': [
                "Let's list out what you know for sure.",
                "What are the unknowns that are creating confusion?",
                "Which part can you control?",
                "What information might help clarify things?",
            ],
            'support': [
                "It's okay not to have all the answers right now.",
                "Sometimes confusion is part of growth.",
                "We can figure this out step by step.",
                "Would it help to talk to someone else about this?",
            ]
        },
        'calm': {
            'affirm': [
                "I'm glad you're feeling calm and centered.",
                "This peaceful state is worth recognizing.",
                "You've found a good place right now.",
                "This calm is something to protect and nurture.",
            ],
            'explore': [
                "What's helped you get to this calm place?",
                "How are you taking care of yourself right now?",
                "What would you like to do with this peace?",
                "Is there something you want to share or process?",
            ],
            'maintain': [
                "What can you do to maintain this feeling?",
                "What activities bring you this peace?",
                "How often can you create space for this?",
                "Who or what supports your calmness?",
            ],
            'deepen': [
                "Would you like to go deeper with a meditation?",
                "This would be a good time for reflection.",
                "Would journaling help capture this moment?",
                "Is there something you'd like to think about while feeling this way?",
            ]
        },
        'neutral': {
            'check_in': [
                "How are you really doing today?",
                "I'm here if you'd like to talk about anything.",
                "What's on your mind?",
                "Is there something you'd like to explore?",
            ],
            'invite': [
                "Would you like to journal about your day?",
                "Is there anything concerning you?",
                "What would make today better?",
                "Do you have anything you'd like to share?",
            ],
            'support': [
                "I'm here whenever you need to talk.",
                "Feel free to share whatever's in your heart.",
                "Let's take a moment for a wellness check-in?",
                "What kind of support would help you right now?",
            ]
        }
    }
    
    # Wellness suggestions by emotion
    WELLNESS_SUGGESTIONS = {
        'sad': [
            'Try a 10-minute meditation to ground yourself',
            'Write in your journal - let your feelings out',
            'Take a walk in nature or fresh air',
            'Reach out to someone you trust',
            'Do something that usually brings you joy',
            'Try gentle stretching or yoga',
            'Listen to your favorite music',
        ],
        'anxious': [
            '4-7-8 breathing exercise (in-4, hold-7, out-8)',
            'Progressive muscle relaxation',
            'Grounding exercise (5-4-3-2-1)',
            'Lavender aromatherapy or tea',
            'Journaling about your worries',
            'Physical exercise to discharge energy',
            'Connect with something comforting',
        ],
        'angry': [
            'Physical activity (workout, running, dancing)',
            'Progressive muscle relaxation',
            'Write an unsent letter expressing your feelings',
            'Creative expression (art, music)',
            'Taking deep breaths',
            'Cold water on your face (activates calming response)',
            'Space away from the trigger if possible',
        ],
        'hopeful': [
            'Gratitude journaling',
            'Share your positivity with someone',
            'Set a goal based on your momentum',
            'Do something you love',
            'Plan something exciting',
            'Help someone else',
        ],
        'calm': [
            "Continue what you're doing - it's working!",
            'Meditation or mindfulness practice',
            'Journaling reflections',
            'Creative activities',
            'Time in nature',
            'Gentle yoga or stretching',
        ]
    }
    
    @staticmethod
    def generate_response(
        emotion: str,
        sentiment_score: float,
        user_message: str,
        conversation_history: List[str] = None
    ) -> Dict:
        """
        Generate a sophisticated response based on emotion and context
        
        Args:
            emotion: Detected emotion label
            sentiment_score: Sentiment score (-1 to 1)
            user_message: User's message
            conversation_history: Previous messages in conversation
        
        Returns:
            Dict with response, suggestions, and metadata
        """
        
        emotion_key = emotion if emotion in ContextualChatBot.RESPONSE_LIBRARY else 'neutral'
        response_lib = ContextualChatBot.RESPONSE_LIBRARY[emotion_key]
        
        # Build multi-part response
        parts = []
        
        # Select from different response types
        response_types = list(response_lib.keys())
        random.shuffle(response_types)
        
        selected_types = response_types[:2]  # Use 2 response types
        
        for resp_type in selected_types:
            options = response_lib[resp_type]
            parts.append(random.choice(options))
        
        # Combine into full response
        full_response = '\n\n'.join(parts)
        
        # Get suggestions
        suggestions = ContextualChatBot.WELLNESS_SUGGESTIONS.get(emotion_key, [])
        suggestions = random.sample(suggestions, min(3, len(suggestions)))
        
        return {
            'response': full_response,
            'suggestions': suggestions,
            'emotion': emotion,
            'sentiment_score': sentiment_score,
            'timestamp': datetime.now().isoformat(),
            'follow_up_questions': ContextualChatBot._generate_follow_ups(emotion_key)
        }
    
    @staticmethod
    def _generate_follow_ups(emotion: str) -> List[str]:
        """Generate follow-up questions based on emotion"""
        follow_ups = {
            'sad': [
                "What's helped you feel better in the past?",
                "Is there someone you can talk to about this?",
                "What's one small thing that might help right now?"
            ],
            'anxious': [
                "What's the worst thing that could happen, and could you handle it?",
                "What can you control in this situation?",
                "What would help you feel more grounded?"
            ],
            'angry': [
                "What boundary was crossed?",
                "What do you need to happen for this to feel resolved?",
                "How can you express this in a healthy way?"
            ],
            'hopeful': [
                "How can you keep this momentum going?",
                "What's next for you?",
                "Who should you celebrate this with?"
            ],
            'calm': [
                "What would you like to reflect on?",
                "How can you protect this peace?",
                "What are you grateful for right now?"
            ]
        }
        
        return follow_ups.get(emotion, [
            "How are you feeling about all of this?",
            "Is there anything else you'd like to talk about?",
            "What would be most helpful for you right now?"
        ])


# Export
__all__ = ['ContextualChatBot']
