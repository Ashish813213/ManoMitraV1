"""
Advanced Chat Generation Module with NVIDIA Nemotron Integration
Provides sophisticated conversation generation using NVIDIA's API with advanced reasoning
"""

import os
import logging
from typing import Dict, List, Optional, Generator
from datetime import datetime
from openai import OpenAI

logger = logging.getLogger(__name__)


class NvidiaAdvancedChatBot:
    """Advanced chatbot powered by NVIDIA Nemotron model with extended thinking"""
    
    def __init__(self):
        """Initialize NVIDIA API client"""
        api_key = os.getenv("NVIDIA_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("Neither NVIDIA_API_KEY nor OPENAI_API_KEY found in environment variables")
        
        # Set OPENAI_API_KEY for the library
        os.environ['OPENAI_API_KEY'] = api_key
        
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
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
            
            # Call NVIDIA API with streaming
            reasoning_content = ""
            full_response = ""
            
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
                    "chat_template_kwargs": {"enable_thinking": False}
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
                    content = chunk.choices[0].delta.content
                    full_response += content
            
            # If no content was generated, use reasoning as fallback
            if not full_response and reasoning_content:
                full_response = reasoning_content[:500]  # First 500 chars
            
            # Add assistant response to history
            if full_response:
                self.conversation_history.append({
                    "role": "assistant",
                    "content": full_response
                })
            
            return {
                "success": True,
                "response": full_response,
                "reasoning": reasoning_content,
                "timestamp": datetime.now().isoformat(),
                "model": self.model,
                "emotion_context": emotion
            }
            
            # If no content was generated, use reasoning as fallback
            if not full_response and reasoning_content:
                full_response = reasoning_content[:500]  # First 500 chars of reasoning
            
            # Store full response in history
            if full_response:
                self.conversation_history.append({
                    "role": "assistant",
                    "content": full_response
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
    """Advanced contextual chatbot powered by NVIDIA Nemotron for mental health support"""
    
    def __init__(self):
        """Initialize NVIDIA API client for contextual responses"""
        api_key = os.getenv("NVIDIA_API_KEY")
        if not api_key:
            raise ValueError("NVIDIA_API_KEY not found in environment variables")
        
        self.client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=api_key
        )
        self.model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
        self.conversation_history = []
        
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

    @staticmethod
    def generate_response(
        emotion: str,
        sentiment_score: float,
        user_message: str,
        conversation_history: List[str] = None
    ) -> Dict:
        """
        Generate AI-powered response using NVIDIA Nemotron based on emotion and context
        
        Args:
            emotion: Detected emotion label
            sentiment_score: Sentiment score (-1 to 1)
            user_message: User's message
            conversation_history: Previous messages in conversation
        
        Returns:
            Dict with response, suggestions, and metadata
        """
        try:
            api_key = os.getenv("NVIDIA_API_KEY")
            if not api_key:
                raise ValueError("NVIDIA_API_KEY not found")
            
            client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=api_key
            )
            model = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
            
            system_prompt = f"""You are ManoMITRA, a compassionate mental health support assistant.
The user's detected emotion is: {emotion}
The sentiment score is: {sentiment_score} (range: -1 to 1, where negative is negative sentiment)

Your approach:
1. Validate their feelings and experiences
2. Show genuine empathy and understanding
3. Ask clarifying questions to better understand
4. Offer practical coping strategies when appropriate
5. Encourage professional help when needed
6. Never diagnose or prescribe medications
7. Prioritize user safety and crisis resources

Tone: Warm, supportive, non-judgmental, professional.
Keep responses concise (2-4 sentences). Always maintain confidentiality and respect boundaries."""

            messages = [{"role": "system", "content": system_prompt}]
            
            if conversation_history:
                for msg in conversation_history[-6:]:
                    messages.append({"role": "user", "content": msg})
            
            messages.append({"role": "user", "content": user_message})
            
            completion = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                top_p=0.95,
                max_tokens=1024,
                extra_body={
                    "chat_template_kwargs": {"enable_thinking": True},
                    "reasoning_budget": 4096
                }
            )
            
            response_content = completion.choices[0].message.content
            
            wellness_suggestions = ContextualChatBot._generate_suggestions(emotion, sentiment_score)
            follow_ups = ContextualChatBot._generate_follow_ups(emotion)
            
            return {
                'response': response_content,
                'suggestions': wellness_suggestions,
                'emotion': emotion,
                'sentiment_score': sentiment_score,
                'timestamp': datetime.now().isoformat(),
                'follow_up_questions': follow_ups,
                'model': 'nvidia-nemotron'
            }
            
        except Exception as e:
            logger.error(f"Error generating contextual response: {str(e)}")
            return {
                'response': "I'm here to listen and support you. Please tell me more about what you're experiencing.",
                'suggestions': ContextualChatBot._generate_suggestions(emotion, sentiment_score),
                'emotion': emotion,
                'sentiment_score': sentiment_score,
                'timestamp': datetime.now().isoformat(),
                'follow_up_questions': ContextualChatBot._generate_follow_ups(emotion),
                'model': 'fallback',
                'error': str(e)
            }

    @staticmethod
    def _generate_suggestions(emotion: str, sentiment_score: float) -> List[str]:
        """Generate wellness suggestions based on emotion"""
        suggestions_map = {
            'sad': [
                'Try a 10-minute meditation to ground yourself',
                'Write in your journal - let your feelings out',
                'Take a walk in nature or fresh air',
                'Reach out to someone you trust',
                'Do something that usually brings you joy',
            ],
            'anxious': [
                '4-7-8 breathing exercise (in-4, hold-7, out-8)',
                'Progressive muscle relaxation',
                'Grounding exercise (5-4-3-2-1)',
                'Journaling about your worries',
                'Physical exercise to discharge energy',
            ],
            'angry': [
                'Physical activity (workout, running, dancing)',
                'Write an unsent letter expressing your feelings',
                'Creative expression (art, music)',
                'Taking deep breaths',
                'Space away from the trigger if possible',
            ],
            'hopeful': [
                'Gratitude journaling',
                'Share your positivity with someone',
                'Set a goal based on your momentum',
                'Plan something exciting',
            ],
            'calm': [
                'Continue what you are doing - it is working',
                'Meditation or mindfulness practice',
                'Journaling reflections',
                'Time in nature',
            ]
        }
        
        suggestions = suggestions_map.get(emotion, [
            'Take a moment for self-reflection',
            'Practice mindful breathing',
            'Connect with someone you trust'
        ])
        
        if sentiment_score < -0.5:
            suggestions.append('Consider talking to a professional therapist')
        
        return suggestions[:3]

    @staticmethod
    def _generate_follow_ups(emotion: str) -> List[str]:
        """Generate follow-up questions based on emotion"""
        follow_ups_map = {
            'sad': [
                "What's helped you feel better in the past?",
                "Is there someone you can talk to about this?",
                "What's one small thing that might help right now?"
            ],
            'anxious': [
                "What can you control in this situation?",
                "What would help you feel more grounded?",
                "Would a breathing exercise help?"
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
        
        return follow_ups_map.get(emotion, [
            "How are you feeling about all of this?",
            "Is there anything else you'd like to talk about?",
            "What would be most helpful for you right now?"
        ])


# Export
__all__ = ['ContextualChatBot']
