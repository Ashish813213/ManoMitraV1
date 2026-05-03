# GenerationChat - ManoMITRA NLP & Chat Generation Service

## Overview
GenerationChat is a comprehensive natural language processing and AI chat generation backend service designed specifically for mental health and wellness support within the ManoMITRA platform. It provides advanced NLP capabilities including sentiment analysis, emotion detection, safety risk assessment, and contextual AI-powered chat responses using state-of-the-art models.

This service acts as the intelligent backend for the ManoMITRA frontend chat features, providing real-time analysis and empathetic responses to user inputs while maintaining safety protocols for mental health support.

## Core Features

### 1. Advanced Natural Language Processing
- **Sentiment Analysis**: Uses VADER (Valence Aware Dictionary and sEntiment Reasoner) for nuanced sentiment scoring (-1 to +1 scale)
- **Emotion Detection**: Utilizes transformer-based models (DistilRoBERTa) with keyword-based fallback for emotion classification (sad, happy, angry, anxious, calm, confused, hopeful, neutral)
- **Safety Risk Detection**: Multi-level risk assessment (low, medium, high, critical) with keyword matching for self-harm, suicide ideation, and crisis indicators

### 2. AI-Powered Chat Generation
- **NVIDIA Nemotron Integration**: Primary chat engine using NVIDIA's Nemotron 3 Nano Omni model via API for advanced reasoning and contextual understanding
- **Contextual Fallback System**: Rule-based chatbot with emotion-specific response templates when NVIDIA API is unavailable
- **Reasoning Capabilities**: Extended thinking processes for more thoughtful, therapeutic responses

### 3. Conversation Management
- **MongoDB Persistence**: Automatic storage and retrieval of conversations with user context
- **Session Tracking**: Mood tracking across conversations and risk level monitoring
- **Historical Analysis**: Tools for analyzing sentiment trends and emotional patterns over time

### 4. RESTful API Interface
- Well-documented endpoints for all NLP and chat functionalities
- JSON-based request/response format
- Comprehensive error handling and status codes
- CORS-enabled for frontend integration

## Architecture Overview

### Component Breakdown

#### `main.py` - Flask API Server
The entry point exposing all service endpoints:
- **POST /health** - Service health check
- **POST /analyze** - Complete NLP analysis (sentiment + emotion + safety)
- **POST /chat** - AI chat generation with context awareness
- **POST /sentiment** - Sentiment analysis only
- **POST /emotion** - Emotion detection only
- **POST /safety** - Safety risk detection only

#### `advanced_chat.py` - Dual Chat Engine System
- **NvidiaAdvancedChatBot**: Connects to NVIDIA Nemotron API for state-of-the-art language understanding and generation with extended reasoning capabilities
- **ContextualChatBot**: Intelligent fallback system using emotion-specific templates and contextual suggestions

#### `conversation_manager.py` - Persistence & Analysis Layer
- **ConversationManager**: Handles CRUD operations for conversations in MongoDB
- **ConversationAnalyzer**: Provides analytical capabilities including sentiment trend analysis, emotion pattern detection, and keyword extraction

#### `run.py` - CLI Orchestrator
- Dependency verification and environment setup
- Automatic NLTK data downloading
- Server startup with configurable options

### Data Flow

1. **Input Reception**: Frontend sends user message to `/chat` or `/analyze` endpoint
2. **NLP Pipeline**:
   - Sentiment analysis via VADER
   - Emotion detection (transformer model or keyword fallback)
   - Safety assessment via keyword matching
3. **Response Generation**:
   - Attempt NVIDIA Nemotron API call (if configured)
   - Fallback to contextual template response
4. **Persistence**: Store conversation in MongoDB (if user_id provided)
5. **Response Delivery**: Return JSON with AI message, analysis results, suggestions, and safety flags

## Technical Specifications

### Dependencies
- **Framework**: Flask 2.3.3+ with CORS support
- **NLP**: NLTK 3.8.1, Transformers 4.40.0+, PyTorch 2.1.0+
- **Database**: PyMongo 4.6.0+ for MongoDB connectivity
- **Utilities**: Python-dotenv, Requests, NumPy, OpenAI (for potential API compatibility)

### Environment Variables
Configure via `.env` file:
- `NLP_PORT`: Server port (default: 5001)
- `NODE_ENV`: `development` or `production` (default: development)
- `MONGO_URI`: MongoDB connection string (default: mongodb://localhost:27017/manomitra)
- `NVIDIA_API_KEY`: Required for NVIDIA Nemotron API access
- `LOG_LEVEL`: Logging verbosity (default: INFO)

### Model Details
- **Sentiment**: VADER (rule-based, optimized for social media text)
- **Emotion**: j-hartmann/emotion-english-distilroberta-base (Twitter-trained RoBERTa)
- **Chat**: NVIDIA Nemotron 3 Nano Omni (via NVIDIA NIM API)
- **Fallback**: Contextual template system with emotion-specific responses

## API Documentation

### Chat Endpoint (`POST /chat`)
Generate AI-powered responses with full context analysis.

**Request:**
```json
{
  "user_message": "I've been feeling really overwhelmed lately",
  "user_id": "user_123",
  "conversation_id": "conv_456"
}
```

**Response:**
```json
{
  "success": true,
  "ai_message": "I hear that you're feeling overwhelmed. That's a lot to carry on your own...",
  "reasoning": "The user expressed feelings of being overwhelmed...",
  "suggestions": ["Try a 5-minute breathing exercise", "Consider journaling about what's feeling overwhelming"],
  "resources": [{"title": "Stress Management Guide", "url": "#"}],
  "analysis": {
    "sentiment": -0.62,
    "sentiment_label": "negative",
    "emotion": "anxious",
    "emotion_confidence": 0.87
  },
  "safety_alert": false,
  "model_used": "nvidia-nemotron",
  "timestamp": "2026-05-01T15:30:00Z"
}
```

### Analysis Endpoint (`POST /analyze`)
Perform comprehensive NLP analysis on text.

**Request:**
```json
{
  "text": "I feel hopeless and don't see a way forward",
  "include_emotion": true,
  "include_safety": true
}
```

**Response:**
```json
{
  "success": true,
  "text_length": 42,
  "sentiment": {
    "sentiment_score": -0.8,
    "compound": -0.8,
    "positive": 0.0,
    "negative": 0.75,
    "neutral": 0.25,
    "sentiment_label": "negative"
  },
  "emotion": {
    "emotion": "sad",
    "confidence": 0.92,
    "method": "model"
  },
  "safety": {
    "risk_level": "high",
    "keywords_detected": ["hopeless"],
    "immediate_action_required": true
  },
  "timestamp": "2026-05-01T15:30:00Z"
}
```

## Setup & Installation

### Prerequisites
- Python 3.10+
- MongoDB instance (local or cloud)
- NVIDIA API key (for advanced chat features)

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd GenerationChat
   ```

2. **Create Virtual Environment** (Recommended)
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # - Set NVIDIA_API_KEY
   # - Adjust MONGO_URI if needed
   # - Modify NLP_PORT if required
   ```

5. **Initialize NLTK Data**
   ```bash
   python run.py --check
   # This will download required NLTK data packages
   ```

### Running the Service

#### Development Mode
```bash
python run.py
# Starts server on http://localhost:5001 with debug mode enabled
```

#### Production Mode
```bash
python run.py --production
# Starts server without debug mode or auto-reloader
```

#### Custom Port
```bash
python run.py --port 8080
```

#### Dependency Check Only
```bash
python run.py --check
```

#### Run Test Suite
```bash
python run.py --test
# Requires the service to be running separately
```

#### Direct Execution
```bash
python main.py
# Starts Flask development server directly
```

## Web Interface
The service includes a built-in web interface accessible at the root URL (`http://localhost:5001`) for testing and demonstration purposes.

## Safety & Ethical Considerations

### Crisis Detection
- Multi-level risk assessment system
- Immediate flagging of critical/high risk indicators
- Configurable safety protocols
- Resource provision for detected risks

### Data Privacy
- Conversations stored with user identifiers only when provided
- No personal data shared with external APIs without consent
- Secure handling of sensitive information

### Bias Mitigation
- Emotion models trained on diverse datasets
- Regular evaluation for fairness across demographics
- Configurable response templates to ensure inclusivity

## Integration with ManoMITRA Platform

### Frontend Communication
The GenerationChat service integrates with the ManoMITRA frontend through:
- **API Endpoints**: RESTful JSON endpoints consumed by the frontend's `lib/api.ts`
- **Real-time Chat**: Used for the AI therapist chat feature
- **Mood Analysis**: Powers emotion detection in mood logging and journal analysis
- **Safety Monitoring**: Provides risk assessment for crisis prevention

### Expected Data Flow
1. Frontend user sends message to AI chat
2. Frontend calls `/chat` endpoint via API service layer
3. GenerationChat processes message through NLP pipeline
4. AI response generated with appropriate tone and suggestions
5. Conversation stored in MongoDB for continuity
6. Response returned to frontend with analysis and safety flags
7. Frontend displays response and handles any safety alerts appropriately

## Extending the Service

### Adding New Emotions
1. Update `EmotionDetector.EMOTION_KEYWORDS` in `main.py`
2. Add corresponding templates in `ChatGenerator.RESPONSE_TEMPLATES`
3. Retrain or fine-tune emotion model if using ML approach

### Customizing Responses
1. Modify response templates in `ChatGenerator` class
2. Adjust suggestion generation logic in `_generate_suggestions` method
3. Update resource mappings in `_get_resources` method

### Adding New Analysis Features
1. Create new utility classes following existing patterns
2. Register endpoints in `main.py`
3. Update analysis endpoint to include new features
4. Document in API documentation

## Troubleshooting

### Common Issues

#### NVIDIA API Connection Failures
- Verify `NVIDIA_API_KEY` is correctly set in `.env`
- Check network connectivity to NVIDIA endpoints
- Service will automatically fall back to contextual chatbot

#### MongoDB Connection Errors
- Confirm MongoDB instance is running and accessible
- Verify `MONGO_URI` format is correct
- Check firewall/network permissions

#### NLTK Data Missing
- Run `python run.py --check` to download required packages
- Ensure internet connectivity during initial setup

#### Memory Issues with Transformers
- The service uses CPU by default (`device=-1`)
- For GPU usage, ensure CUDA is properly configured and set device to `0`
- Consider reducing batch sizes if deploying in memory-constrained environments

## Performance Considerations

### Response Times
- Sentiment/Emotion Analysis: <100ms
- Safety Detection: <10ms
- Chat Generation (Fallback): <50ms
- Chat Generation (NVIDIA): 500ms-2s depending on API latency

### Scaling Recommendations
- Horizontal scaling behind load balancer for high traffic
- MongoDB replication for production deployments
- Caching layer for frequent analysis requests
- Consider async processing for non-critical operations

## Future Enhancements

### Planned Features
- Voice-to-text and text-to-speech capabilities
- Multi-language support
- Advanced therapeutic techniques (CBT, DBT integration)
- Progress tracking and goal setting features
- Group therapy session support
- Integration with wearable device data for holistic wellness

### Technical Improvements
- Model quantization for faster inference
- On-premise model hosting options
- Advanced conversation summarization
- Personalized response tuning based on user history
- A/B testing framework for response optimization

## License & Acknowledgements

This service is part of the ManoMITRA Mental Health Platform. Special thanks to:
- NVIDIA for providing access to Nemotron models via NIM API
- The open-source NLP community for NLTK, Transformers, and related libraries
- Mental health professionals whose expertise informed the safety protocols and response templates

## Support
For issues, questions, or contributions related to this service:
1. Check existing documentation in this README
2. Review source code comments for implementation details
3. Contact the ManoMITRA development team for platform-specific inquiries

---

*GenerationChat - Empowering mental health support through intelligent, empathetic AI technology.*