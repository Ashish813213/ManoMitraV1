# ManoMITRA Backend

## Overview
This is the backend service for the ManoMITRA Mental Health Platform, built with Node.js, Express, and MongoDB. The API provides endpoints for user authentication, mood tracking, journaling, exercises, recommendations, community features, and AI-powered chat functionality.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Environment Variables**: dotenv
- **HTTP Client**: Axios
- **Password Hashing**: bcrypt
- **CORS**: cors middleware
- **Development**: nodemon for hot reloading

## Project Structure
```
backend/
├── index.js              # Entry point - Express app setup and server configuration
├── package.json          # Project dependencies and scripts
├── .env                  # Environment variables (not committed)
├── .env.example          # Example environment variables template
├── seed-data.js          # Initial data population script
├── seed.js               # Database seeding utility
├── middleware/           # Custom middleware functions
│   ├── requestLogger.js  # Request logging middleware
│   └── errorHandler.js   # Centralized error handling
├── models/               # Mongoose schema definitions
│   ├── User.js           # User authentication and profile data
│   ├── MoodHistory.js    # Mood tracking entries
│   ├── Journal.js        # User journal entries
│   ├── Exercise.js       # Mental health exercises
│   ├── UserExerciseProgress.js  # User progress on exercises
│   ├── Recommendation.js # Personalized recommendations
│   ├── Resource.js       # Educational resources
│   ├── Workshop.js       # Mental health workshops
│   ├── Community.js      # Community posts and discussions
│   ├── ChatRoom.js       # Chat rooms for community/chat features
│   ├── Message.js        # Messages in chat rooms
│   ├── Session.js        # User sessions
│   ├── Therapist.js      # Therapist information
│   ├── AIConversation.js # AI chat conversation history
│   ├── JournalAnalysis.js# Analysis of journal entries
│   ├── SafetyAlert.js    # Crisis/safety alerts
│   ├── UserActivity.js   # User activity tracking
│   └── index.js          # Model exports
├── routes/               # API route handlers
│   ├── auth.js           # Authentication endpoints (login, register)
│   ├── users.js          # User profile management
│   ├── userStats.js      # User statistics and analytics
│   ├── mood.js           # Mood tracking endpoints
│   ├── journals.js       # Journal entry management
│   ├── exercises.js      # Exercise routines and tracking
│   ├── recommendations.js# Personalized recommendations
│   ├── resources.js      # Educational content
│   ├── workshops.js      # Workshop registration and management
│   ├── community.js      # Community forum features
│   └── chat.js           # AI chat and real-time messaging
└── utils/                # Utility functions
    └── (various helpers)
```

## Environment Variables
Create a `.env` file based on `.env.example` with the following variables:
- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_EXPIRES_IN` - Token expiration time
- `NODE_ENV` - Environment (development/production)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Authenticate user and return JWT
- `POST /logout` - Invalidate user session

### Users (`/api/users`)
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `GET /therapists` - Get list of available therapists

### User Stats (`/api/users`)
- `GET /stats` - Get user activity statistics
- `GET /streak` - Get user's mood tracking streak

### Mood Tracking (`/api/mood`)
- `GET /history` - Get user's mood history
- `POST /entry` - Create new mood entry
- `GET /summary` - Get mood summary statistics

### Journals (`/api/journals`)
- `GET /` - Get user's journal entries
- `POST /` - Create new journal entry
- `GET /:id` - Get specific journal entry
- `PUT /:id` - Update journal entry
- `DELETE /:id` - Delete journal entry
- `POST /:id/analyze` - Analyze journal entry for insights

### Exercises (`/api/exercises`)
- `GET /` - Get available exercises
- `GET /category/:category` - Get exercises by category
- `POST /progress` - Record exercise progress
- `GET /progress` - Get user's exercise progress

### Recommendations (`/api/recommendations`)
- `GET /` - Get personalized recommendations
- `POST /feedback` - Submit feedback on recommendations

### Resources (`/api/resources`)
- `GET /` - Get educational resources
- `GET /category/:category` - Get resources by category
- `GET /:id` - Get specific resource details

### Workshops (`/api/workshops`)
- `GET /` - Get available workshops
- `GET /upcoming` - Get upcoming workshops
- `POST /register/:id` - Register for a workshop
- `GET /my-registrations` - Get user's workshop registrations

### Community (`/api/community`)
- `GET /posts` - Get community posts
- `POST /posts` - Create new community post
- `GET /posts/:id` - Get specific post
- `PUT /posts/:id` - Update community post
- `DELETE /posts/:id` - Delete community post
- `POST /posts/:id/comments` - Add comment to post
- `GET /posts/:id/comments` - Get comments for post
- `POST /posts/:id/like` - Like/unlike post
- `GET /categories` - Get community post categories

### Chat (`/api/chat`)
- `GET /rooms` - Get available chat rooms
- `POST /rooms` - Create new chat room
- `GET /rooms/:id/messages` - Get messages in a room
- `POST /rooms/:id/messages` - Send message to room
- `POST /ai-chat` - Send message to AI therapist
- `GET /ai-chat/history` - Get AI chat conversation history

## Middleware
- **requestLogger**: Logs all incoming requests for debugging and monitoring
- **errorHandler**: Centralized error handling that formats error responses consistently

## Database Models
Each model in `/models` represents a MongoDB collection with defined schemas:
- **User**: Authentication, profile, preferences
- **MoodHistory**: Timestamped mood entries with emotion tracking
- **Journal**: User-written reflections with analysis capabilities
- **Exercise**: Mental health exercises with categories and instructions
- **UserExerciseProgress**: Tracking user completion and effectiveness
- **Recommendation**: AI-generated personalized suggestions
- **Resource**: Articles, videos, and educational content
- **Workshop**: Live or recorded mental health workshops
- **Community**: Forum posts and discussions
- **ChatRoom**: Spaces for real-time communication
- **Message**: Individual chat messages
- **Session**: Active user sessions
- **Therapist**: Mental health professional profiles
- **AIConversation**: History of AI therapist interactions
- **JournalAnalysis**: Insights extracted from journal entries
- **SafetyAlert**: Crisis detection and intervention tracking
- **UserActivity**: Platform usage analytics

## Server Initialization
The `index.js` file:
1. Sets up Express middleware (JSON parsing, CORS, logging)
2. Connects to MongoDB using Mongoose
3. Registers all API route handlers under `/api` prefix
4. Provides a health check endpoint at `/`
5. Implements centralized error handling
6. Starts the server on specified port

## Development Scripts
- `npm start` - Run server in production mode
- `npm run dev` - Run server with nodemon for development
- `npm test` - Placeholder for future test implementation

## Data Seeding
- `seed.js` - Utility functions for database seeding
- `seed-data.js` - Sample data for initial database population

## Security Features
- Password hashing with bcrypt
- JWT-based authentication with expiration
- Environment variable configuration for sensitive data
- CORS configuration to restrict origins
- Input validation (implemented in route handlers)
- Error handling that doesn't expose sensitive information