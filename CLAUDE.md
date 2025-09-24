# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Environment
```bash
# Start full development environment (frontend + backend)
npm run dev

# Start backend only
npm run server:dev

# Start frontend only
npm run client:dev
```

### Building and Testing
```bash
# Build both frontend and backend
npm run build

# Run all tests
npm run test

# Run E2E tests
npm run e2e

# Run linting
npm run lint

# Format code
npm run format
```

### Docker Operations
```bash
# Build Docker containers
npm run docker:build

# Start development environment in Docker
npm run docker:dev

# Stop Docker containers
npm run docker:down
```

### Individual Component Commands
```bash
# Backend-specific commands
cd server && npm run dev          # Development with nodemon
cd server && npm run test         # Jest tests
cd server && npm run test:watch   # Watch mode tests
cd server && npm run lint         # ESLint
cd server && npm run typecheck    # TypeScript checking

# Frontend-specific commands
cd client && npm run dev          # Vite development server
cd client && npm run test         # Vitest tests
cd client && npm run test:ui      # Vitest UI
cd client && npm run test:coverage # Coverage report
cd client && npm run e2e          # Playwright E2E tests
cd client && npm run typecheck    # TypeScript checking
```

## Architecture Overview

### Project Structure
AutoMedia is a full-stack web application with a monorepo structure:

- **`client/`**: React 18 + TypeScript frontend with Vite
- **`server/`**: Node.js + Express.js + TypeScript backend API
- **`docs/`**: Comprehensive documentation including PRD, API specs, and implementation plans
- **`docker/`**: Docker configuration files for containerized deployment
- **`shared/`**: Shared utilities and types (if needed)

### Core Technology Stack

#### Frontend (React 18 + TypeScript)
- **State Management**: Zustand for client state, React Query for server state
- **Routing**: React Router v6 with protected routes
- **UI Framework**: Tailwind CSS + Headless UI (Radix UI components)
- **Real-time**: Socket.io client for live updates
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library + Playwright for E2E
- **Build Tool**: Vite with TypeScript

#### Backend (Node.js + Express.js + TypeScript)
- **API Design**: RESTful APIs + WebSocket for real-time features
- **Authentication**: JWT-based auth with refresh tokens
- **Database**: MongoDB with Mongoose ODM + Redis for caching
- **Rate Limiting**: Express-rate-limit with Redis backend
- **File Upload**: Multer for file handling
- **Logging**: Winston + Morgan for structured logging
- **Testing**: Jest + Supertest for API testing
- **AI Integration**: Multi-provider (OpenAI, Google Gemini, DeepSeek, Claude)

#### Database Architecture
The application uses 21 MongoDB models organized around core domains:

**Core Models**: User, Content, Topic, Agent, Generation
**Content Management**: Collection, Material, Project
**Platform Integration**: PlatformConnection (Twitter, Xiaohongshu, Facebook, etc.)
**Business Logic**: Subscription, InternationalConfig, AIEnhancement
**Analytics**: UserAnalytics, MarketingCampaign, FeatureRequest
**Launch Management**: LaunchConfig, BetaUser, UserFeedback, UATScenario, ScalingConfig

### Key Application Features

#### Twitter Integration (MVP)
- Real-time Twitter data collection via API v2
- User monitoring for specific accounts
- Hot topics tracking and trend analysis
- Automated content collection and categorization

#### AI Content Generation
- Multi-provider AI model integration with fallback strategies
- Customizable Agent system for specialized content generation
- Material library for storing and organizing generated content
- Cost tracking and optimization for AI usage

#### Multi-Platform Framework
- Extensible adapter system for social media platforms
- Currently supports Twitter (MVP) with framework for expansion
- Platform connection management and API credential handling

#### User Management
- Role-based access control (User, Admin, etc.)
- JWT-based authentication with refresh tokens
- User preferences and settings management
- Subscription management (Free, Pro, Team, Enterprise tiers)

### Real-time Features
- WebSocket-based real-time notifications
- Live data updates for social media monitoring
- Real-time collaboration features for team projects

### Responsive Design
- Mobile-first responsive design with breakpoints:
  - Mobile: <768px
  - Tablet: 768px-1199px
  - Desktop: ≥1200px
- PWA-ready architecture with service worker support
- Touch-optimized interfaces for mobile devices

## Development Patterns

### Frontend Patterns
- Use `@/` alias for absolute imports from `src/`
- Components follow PascalCase naming (`Button.tsx`, `Card.tsx`)
- Pages use PascalCase with .tsx extension (`Dashboard.tsx`)
- Hooks start with `use` prefix for custom hooks
- Store actions are async functions with proper error handling
- Use React Query for all server state management
- Implement proper loading states and error boundaries

### Backend Patterns
- Controllers handle business logic and validation
- Routes define API endpoints and middleware
- Models define MongoDB schemas and relationships
- Services handle external API integrations (Twitter, AI providers)
- Middleware handles cross-cutting concerns (auth, rate limiting)
- Use Express-validator for request validation
- Implement proper error handling with custom error classes

### Database Patterns
- Models use Mongoose schemas with proper validation
- Use references for relationships, avoid embedding large datasets
- Implement proper indexing for query performance
- Use Redis for caching frequently accessed data
- Implement soft deletes where appropriate
- Use timestamps for all models (createdAt, updatedAt)

### Field Naming Conventions
- **Frontend ↔ Backend**: Use camelCase for all field names
- **Database**: Use camelCase in MongoDB documents
- **API Responses**: Consistent camelCase across all endpoints
- **Environment Variables**: Use UPPER_SNAKE_CASE

## Important Configuration

### Environment Variables
The application requires these environment variables:

**Backend (.env)**
- `NODE_ENV`: Development/production environment
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: JWT refresh token secret
- `TWITTER_BEARER_TOKEN`: Twitter API v2 bearer token
- `OPENAI_API_KEY`: OpenAI API key
- `GOOGLE_AI_API_KEY`: Google AI API key
- `CLIENT_URL`: Frontend URL for CORS

**Frontend (.env)**
- `VITE_API_URL`: Backend API URL

### Docker Configuration
- `docker-compose.yml`: Full stack with MongoDB, Redis, Backend, Frontend, Nginx
- Environment variables should be provided in `.env` file
- Docker volumes persist data for MongoDB and Redis

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Vitest for component and utility testing
- **Integration Tests**: React Testing Library for component interactions
- **E2E Tests**: Playwright for full user journey testing
- **Coverage**: Target 80%+ coverage for critical paths

### Backend Testing
- **Unit Tests**: Jest for controller and service testing
- **Integration Tests**: Supertest for API endpoint testing
- **Database Tests**: In-memory MongoDB for model testing
- **Coverage**: Target 90%+ coverage for API endpoints

## API Documentation

- Comprehensive API documentation available in `/docs/API_SPEC.md`
- Swagger/OpenAPI integration for interactive API docs
- All endpoints include proper error handling and validation
- RESTful naming conventions with proper HTTP methods

## Development Workflow

1. **Setup**: Run `npm install` in root and both client/server directories
2. **Development**: Use `npm run dev` for concurrent frontend/backend development
3. **Testing**: Run tests locally before committing
4. **Linting**: Code must pass ESLint and Prettier checks
5. **TypeScript**: Strict TypeScript checking enabled
6. **Git Hooks**: Pre-commit hooks run linting and formatting

## Common Pitfalls

- Always use React Query for data fetching, avoid direct axios calls in components
- Implement proper error boundaries around async operations
- Use Zustand store actions for all state mutations
- Ensure all API routes have proper authentication middleware
- Use environment variables for all sensitive configuration
- Implement proper cleanup for WebSocket connections
- Use proper TypeScript types for all API responses and requests

## Mobile Development Considerations

- All components must be responsive and work on mobile devices
- Use appropriate touch targets (minimum 44px)
- Test on multiple view sizes during development
- Implement proper mobile navigation patterns
- Optimize images and assets for mobile networks
- Consider offline functionality for critical features