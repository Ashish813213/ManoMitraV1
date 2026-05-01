# ManoMITRA Frontend

## Overview
This is the frontend application for the ManoMITRA Mental Health Platform, built with Next.js 16, React 19, and TypeScript. The application provides a responsive, user-friendly interface for users to access mental health resources, track their mood, journal, participate in exercises and workshops, engage with the community, and interact with AI-powered chat support.

## Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: React Context API (AuthContext)
- **HTTP Client**: Native Fetch API with custom wrapper
- **Build Tool**: Next.js built-in compiler
- **Development**: ESLint for code quality

## Project Structure
```
client/
├── app/                    # Next.js App Router directory
│   ├── layout.tsx          # Root layout with providers and global styles
│   ├── page.tsx            # Homepage
│   ├── about/              # About page
│   │   └── page.tsx
│   ├── contact/            # Contact page
│   │   └── page.tsx
│   ├── dashboard/          # Main dashboard (protected route)
│   │   └── page.tsx
│   ├── get-started/        # Onboarding page
│   │   └── page.tsx
│   ├── login/              # Login page
│   │   └── page.tsx
│   ├── signup/             # Registration page
│   │   └── page.tsx
│   └── components/         # Shared components
│       ├── Navbar.tsx      # Navigation bar
│       └── MoodModal.tsx   # Modal for mood logging
├── lib/                    # Utility files and context providers
│   ├── api.ts              # API service layer with endpoint wrappers
│   └── AuthContext.tsx     # Authentication state management
├── public/                 # Static assets
│   └── favicon.ico
├── styles/                 # Global styles
│   └── globals.css         # Tailwind CSS base styles
├── .env.local              # Environment variables (not committed)
├── .gitignore              # Git ignore rules
├── eslint.config.mjs       # ESLint configuration
├── next-env.d.ts           # Next.js TypeScript declarations
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and scripts
├── package-lock.json       # Dependency lockfile
├── postcss.config.mjs      # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
└── tsconfig.tsbuildinfo    # TypeScript build information
```

## Environment Variables
Create a `.env.local` file with the following variables:
- `NEXT_PUBLIC_API_BASE_URL` - Base URL for the backend API (default: `http://localhost:5000/api`)
- `NEXT_PUBLIC_CHAT_API_URL` - WebSocket or real-time chat API URL (default: `http://localhost:5001`)

## Key Features

### Authentication System
- User registration with email/password
- Secure login with JWT token storage in localStorage
- Protected routes that require authentication
- Automatic token attachment to API requests
- Logout functionality that clears authentication state

### Dashboard
The main dashboard provides an overview of:
- Personalized recommendations based on user activity
- Trending mental health resources
- Upcoming workshops
- Community highlights
- User statistics and progress tracking

### Mood Tracking
- Interactive mood logging with emotion selection
- Mood history visualization
- AI-powered insights from mood entries
- Safety alert detection for concerning patterns

### Journaling
- Create, read, update, and delete journal entries
- Tagging system for organization
- Mood association with each entry
- AI analysis of journal content for insights

### Exercises Library
- Browse mental health exercises by type and difficulty
- Detailed exercise instructions with images/videos
- Track completion and mood improvements
- Feedback system for exercise effectiveness

### Resources & Workshops
- Educational content (articles, videos, audio guides, meditations)
- Workshop registration and management
- Categorized content for easy discovery
- Resource rating and recommendation system

### Community Features
- Forum-style community posts
- Commenting system on posts
- Like/reaction functionality
- Community joining/leaving mechanics
- Category-based content filtering

### AI Chat Support
- Conversational AI therapist interface
- Conversation history persistence
- Emotion analysis of user messages
- Safety monitoring and alert system
- Multiple conversation management

## State Management
The application uses React Context API for authentication state:
- `AuthContext` provides user data and authentication functions
- Token is stored in localStorage and retrieved on app load
- Automatic redirect to login when token is invalid or missing
- Protected routes check authentication status before rendering

## API Communication
All backend communication is handled through the `lib/api.ts` service layer:
- Centralized API request handling with automatic token attachment
- Error handling with meaningful error messages
- TypeScript interfaces for all request/response payloads
- Cache-control headers set to 'no-store' for sensitive data
- Wrapper functions for each endpoint with proper typing

## Styling & UI
- Built with Tailwind CSS 4 for utility-first styling
- Responsive design that works on mobile, tablet, and desktop
- Dark/light mode ready (CSS variables defined)
- Consistent spacing, typography, and color scheme
- Interactive states (hover, focus, active) on all interactive elements
- Accessible form elements with proper labeling

## Pages Overview

### Public Pages
- **Home (`/`)** - Landing page with platform overview and call-to-action
- **About (`/about`)** - Information about the ManoMITRA platform
- **Contact (`/contact`)** - Contact form and support information
- **Get Started (`/get-started`)** - Onboarding flow for new users
- **Login (`/login`)** - Authentication form for existing users
- **Signup (`/signup`)** - Registration form for new users

### Protected Pages (Require Authentication)
- **Dashboard (`/dashboard`)** - Main user interface with personalized content
  - All feature modules accessible from dashboard navigation
  - User profile and settings access

## Components

### Shared Components
- **Navbar** - Responsive navigation with user menu and auth links
- **MoodModal** - Reusable modal for mood logging with emotion selection

## Data Flow
1. User interacts with UI components
2. Components call API functions from `lib/api.ts`
3. API functions make requests to backend endpoints
4. Backend processes requests and returns JSON responses
5. API functions transform responses and update React state
6. UI re-renders with new data

## Security Considerations
- JWT tokens stored in localStorage (XSS mitigation considerations)
- HTTP-only cookie alternative not used due to Next.js API route limitations
- All API requests include authorization tokens when available
- Input validation performed on both frontend and backend
- Error messages don't expose sensitive information
- Route protection prevents unauthorized access to protected pages

## Development Scripts
- `npm dev` - Start development server at http://localhost:3000
- `npm build` - Create production build
- `npm start` - Start production server
- `npm lint` - Run ESLint for code quality checking

## TypeScript Usage
- Strict type checking enabled
- Comprehensive typing for all API requests/responses
- Component props typing for better IDE support
- Context values fully typed
- Route parameters typed where applicable

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive enhancement principles applied

## Deployment
The application is optimized for Vercel deployment but can run on any Node.js hosting platform that supports Next.js.

## Future Enhancements
- Offline capability with service workers
- Push notifications for reminders and alerts
- Dark/light theme toggle
- Improved accessibility features
- Internationalization (i18n) support
- Analytics integration