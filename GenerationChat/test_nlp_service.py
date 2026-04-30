"""
Test Script for ManoMITRA NLP Service
Demonstrates how to use the service API
"""

import requests
import json
from typing import Dict

# Configuration
BASE_URL = "http://localhost:5001"
TIMEOUT = 10


class NLPServiceClient:
    """Client for interacting with the NLP service"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
    
    def health_check(self) -> Dict:
        """Check if service is healthy"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=TIMEOUT)
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def analyze(self, text: str, include_emotion: bool = True, include_safety: bool = True) -> Dict:
        """Analyze text for sentiment, emotion, and safety"""
        payload = {
            "text": text,
            "include_emotion": include_emotion,
            "include_safety": include_safety
        }
        try:
            response = requests.post(
                f"{self.base_url}/analyze",
                json=payload,
                timeout=TIMEOUT
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def chat(self, user_message: str, user_id: str = None, conversation_id: str = None) -> Dict:
        """Generate AI response to user message"""
        payload = {
            "user_message": user_message,
            "user_id": user_id,
            "conversation_id": conversation_id
        }
        try:
            response = requests.post(
                f"{self.base_url}/chat",
                json=payload,
                timeout=TIMEOUT
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def sentiment(self, text: str) -> Dict:
        """Analyze sentiment only"""
        payload = {"text": text}
        try:
            response = requests.post(
                f"{self.base_url}/sentiment",
                json=payload,
                timeout=TIMEOUT
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def emotion(self, text: str) -> Dict:
        """Detect emotion only"""
        payload = {"text": text}
        try:
            response = requests.post(
                f"{self.base_url}/emotion",
                json=payload,
                timeout=TIMEOUT
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    def safety(self, text: str) -> Dict:
        """Detect safety concerns only"""
        payload = {"text": text}
        try:
            response = requests.post(
                f"{self.base_url}/safety",
                json=payload,
                timeout=TIMEOUT
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}


def print_section(title: str):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def test_service():
    """Run comprehensive tests of the NLP service"""
    
    client = NLPServiceClient()
    
    # Test 1: Health Check
    print_section("Test 1: Health Check")
    health = client.health_check()
    print(json.dumps(health, indent=2))
    
    if "error" in health:
        print("\n❌ Service is not running. Start it with: python main.py")
        return
    
    print("✓ Service is healthy")
    
    # Test 2: Sentiment Analysis
    print_section("Test 2: Sentiment Analysis")
    
    test_texts = [
        "I'm feeling absolutely wonderful today!",
        "I'm so depressed and hopeless",
        "Today was okay, nothing special",
        "I'm really anxious about my presentation"
    ]
    
    for text in test_texts:
        result = client.sentiment(text)
        if "success" in result and result["success"]:
            sentiment = result["sentiment"]
            print(f"Text: '{text}'")
            print(f"  Sentiment: {sentiment['sentiment_label']}")
            print(f"  Score: {sentiment['sentiment_score']:.2f}")
            print()
    
    # Test 3: Emotion Detection
    print_section("Test 3: Emotion Detection")
    
    test_texts = [
        ("I just got promoted at work!", "happy"),
        ("I feel so lonely and isolated", "sad"),
        ("I'm absolutely furious right now!", "angry"),
        ("I'm so scared and worried", "anxious"),
    ]
    
    for text, expected_emotion in test_texts:
        result = client.emotion(text)
        if "success" in result and result["success"]:
            emotion_data = result["emotion"]
            emotion = emotion_data["emotion"]
            confidence = emotion_data["confidence"]
            print(f"Text: '{text}'")
            print(f"  Detected: {emotion} (confidence: {confidence:.2%})")
            print(f"  Expected: {expected_emotion}")
            print()
    
    # Test 4: Safety Detection
    print_section("Test 4: Safety Detection")
    
    safe_texts = [
        ("I'm having a regular day", "low"),
        ("I feel hopeless and tired", "medium"),
        ("I'm thinking about self harm", "high"),
        ("I want to kill myself", "critical")
    ]
    
    for text, expected_risk in safe_texts:
        result = client.safety(text)
        if "success" in result and result["success"]:
            safety = result["safety"]
            risk_level = safety["risk_level"]
            keywords = safety["keywords_detected"]
            print(f"Text: '{text}'")
            print(f"  Risk Level: {risk_level} (expected: {expected_risk})")
            if keywords:
                print(f"  Keywords: {', '.join(keywords)}")
            print()
    
    # Test 5: Complete Analysis
    print_section("Test 5: Complete Analysis")
    
    test_text = "I've been feeling really anxiety-ridden and depressed for weeks now"
    result = client.analyze(test_text)
    
    if "success" in result and result["success"]:
        print(f"Text: '{test_text}'\n")
        print("Sentiment Analysis:")
        print(f"  Label: {result['sentiment']['sentiment_label']}")
        print(f"  Score: {result['sentiment']['sentiment_score']:.2f}")
        print(f"  Pos: {result['sentiment']['positive']:.2f}, "
              f"Neg: {result['sentiment']['negative']:.2f}, "
              f"Neu: {result['sentiment']['neutral']:.2f}")
        print("\nEmotion Detection:")
        print(f"  Emotion: {result['emotion']['emotion']}")
        print(f"  Confidence: {result['emotion']['confidence']:.2%}")
        print("\nSafety Assessment:")
        print(f"  Risk Level: {result['safety']['risk_level']}")
        if result['safety']['keywords_detected']:
            print(f"  Keywords: {', '.join(result['safety']['keywords_detected'])}")
    
    # Test 6: Chat Generation
    print_section("Test 6: Chat Generation & AI Response")
    
    user_messages = [
        "I'm feeling really depressed and don't know if things will get better",
        "I just got promoted! I'm so excited!",
        "I'm anxious about my health and can't stop worrying",
    ]
    
    for i, message in enumerate(user_messages, 1):
        print(f"--- Conversation {i} ---")
        print(f"User: {message}\n")
        
        result = client.chat(message, user_id=f"user_{i}")
        
        if "success" in result and result["success"]:
            print(f"Analysis:")
            print(f"  Emotion: {result['analysis']['emotion']}")
            print(f"  Sentiment: {result['analysis']['sentiment_label']}")
            if result.get('safety_alert'):
                print(f"  ⚠️  SAFETY ALERT: {result['safety_details']['risk_level']}")
            
            print(f"\nAI Response:")
            print(f"{result['ai_message']}\n")
            
            if result['suggestions']:
                print(f"Suggestions:")
                for sugg in result['suggestions']:
                    print(f"  • {sugg}")
            print()
    
    # Test 7: Integration Example
    print_section("Test 7: Multi-Turn Conversation")
    
    conversation_id = "demo_conversation"
    user_id = "demo_user"
    
    conversation_flow = [
        "I've been struggling with anxiety lately",
        "Yeah, it's been affecting my sleep and concentration",
        "I've tried meditation but it doesn't seem to help much",
    ]
    
    print(f"Starting conversation: {conversation_id}\n")
    
    for turn, message in enumerate(conversation_flow, 1):
        print(f"Turn {turn}:")
        print(f"User: {message}")
        
        result = client.chat(
            message,
            user_id=user_id,
            conversation_id=conversation_id
        )
        
        if "success" in result and result["success"]:
            print(f"Emotion: {result['analysis']['emotion']}")
            print(f"AI: {result['ai_message'][:150]}...\n")


if __name__ == "__main__":
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*15 + "ManoMITRA NLP Service Tester" + " "*16 + "║")
    print("╚" + "="*58 + "╝")
    
    try:
        test_service()
        print_section("✅ All Tests Completed")
        print("Service is working correctly!\n")
    except KeyboardInterrupt:
        print("\n\n❌ Tests interrupted by user\n")
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
