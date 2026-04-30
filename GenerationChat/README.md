# GenerationChat - ManoMITRA NLP & Chat Generation Service

A comprehensive natural language processing and AI chat generation backend for mental health and wellness support.

## Folder Structure

```
GenerationChat/
├── main.py                  # Flask API server (entry point for all endpoints)
├── advanced_chat.py         # NVIDIA Nemotron AI chatbot + contextual response engine
├── conversation_manager.py  # MongoDB conversation storage, retrieval, and analysis
├── run.py                   # CLI startup script (dependency check, NLTK download, server launch)
├── test_nlp_service.py      # Test client that exercises all API endpoints
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (local, git-ignored)
├── .env.example             # Environment variable template
└── __pycache__/             # Compiled Python bytecode
```

## How It Works

### Architecture Flow

```
Client (Frontend)
       │
       ▼ POST /chat or /analyze
┌─────────────────────────────┐
│  main.py (Flask Server)     │
│                             │
│  1. Receive user message    │
│  2. SentimentAnalyzer ──► VADER sentiment scores
│  3. EmotionDetector ────► TextCNN model or keyword fallback
│  4. SafetyDetector ────► Risk level detection (low/medium/high/critical)
│  5. ChatGenerator ─────► NVIDIA Nemotron API or local template fallback
│  6. MongoDB (optional) ─► Store conversation with user_id
│  7. Return JSON response  │
└─────────────────────────────┘
       │
       ▼ JSON Response
Client receives: ai_message, sentiment, emotion, safety_alert, suggestions
```

### Component Breakdown

**`main.py`** - The Flask server exposing 5 REST endpoints:
- `POST /health` - Health check
- `POST /analyze` - Full NLP analysis (sentiment + emotion + safety)
- `POST /chat` - AI chat generation with NVIDIA Nemotron (falls back to local templates)
- `POST /sentiment` - Sentiment analysis only
- `POST /emotion` - Emotion detection only
- `POST /safety` - Safety risk detection only

**`advanced_chat.py`** - Two chat generation engines:
- `NvidiaAdvancedChatBot` - Uses NVIDIA Nemotron 3 Nano Omni model via API with extended reasoning/thinking
- `ContextualChatBot` - Rule-based fallback with emotion-specific response templates and wellness suggestions

**`conversation_manager.py`** - MongoDB persistence layer:
- `ConversationManager` - CRUD operations for conversations (create, add messages, retrieve, mood summaries)
- `ConversationAnalyzer` - Analyzes sentiment trends, emotion patterns, and keyword extraction across conversations

**`run.py`** - CLI wrapper with commands:
- Checks dependencies are installed
- Downloads NLTK data (punkt, stopwords)
- Starts the Flask server with configurable port and debug mode
- Can run the test suite

### Request Flow (Chat Example)

1. User sends message via `POST /chat` with `{user_message, user_id?}`
2. `SentimentAnalyzer` scores the text with VADER (-1 to +1)
3. `EmotionDetector` classifies emotion (sad/happy/angry/anxious/calm/confused/hopeful/neutral)
4. `SafetyDetector` checks for risk keywords (critical/high/medium/low)
5. If NVIDIA API is configured, `NvidiaAdvancedChatBot` generates a response with extended reasoning
6. If NVIDIA fails or is unavailable, `ChatGenerator` produces a contextual template response
7. Conversation is stored in MongoDB (if `user_id` provided)
8. JSON response returned with AI message, analysis, suggestions, and safety alerts

## Setup & Commands

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your NVIDIA_API_KEY and MONGO_URI
```

### 3. Run the Service

```bash
# Default (development mode, port 5001)
python run.py

# Custom port
python run.py --port 8080

# Production mode (no debug, no reloader)
python run.py --production

# Check dependencies only
python run.py --check

# Run test suite (service must be running)
python run.py --test
```

### 4. Alternative: Run Directly

```bash
python main.py
```

### 5. Run Tests

```bash
# Via run.py (recommended)
python run.py --test

# Or directly
python test_nlp_service.py
```

## API Examples

### Chat Generation

```bash
curl -X POST http://localhost:5001/chat \
  -H "Content-Type: application/json" \
  -d '{"user_message": "I have been feeling really anxious lately", "user_id": "user_123"}'
```

### Full NLP Analysis

```bash
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel hopeless and tired all the time", "include_emotion": true, "include_safety": true}'
```

### Health Check

```bash
curl http://localhost:5001/health
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NLP_PORT` | Server port | `5001` |
| `NODE_ENV` | `development` or `production` | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/manomitra` |
| `NVIDIA_API_KEY` | NVIDIA NIM API key (for advanced chat) | _(required for AI chat)_ |
| `LOG_LEVEL` | Logging level | `INFO` |
