# AutoMedia API Specification

## Overview

This document defines the complete API specification for the AutoMedia intelligent Twitter content management system. The API follows RESTful conventions with WebSocket support for real-time updates.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging.automedia.com/api`
- **Production**: `https://api.automedia.com/api`

## Authentication

All API endpoints require authentication using JWT tokens, except for public endpoints.

### Authentication Flow

1. **Login**: `POST /auth/login` - Obtain access and refresh tokens
2. **Refresh**: `POST /auth/refresh` - Refresh access tokens
3. **Logout**: `POST /auth/logout` - Invalidate tokens

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## API Endpoints

### 1. Authentication

#### POST /auth/login
Authenticate user and return access token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://example.com/avatar.jpg"
      }
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### 2. Data Collection

#### GET /collection/twitter/status
Check Twitter API connection status and rate limits.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "rateLimit": {
      "limit": 500,
      "remaining": 450,
      "reset": "2024-01-15T11:00:00Z"
    },
    "lastSync": "2024-01-15T10:25:00Z"
  }
}
```

#### POST /collection/twitter/users
Add Twitter users to monitoring list.

**Request:**
```json
{
  "usernames": ["elonmusk", "sundarpichai", "tim_cook"],
  "monitorSettings": {
    "includeRetweets": false,
    "includeReplies": false,
    "notificationEnabled": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "added": 3,
    "failed": 0,
    "monitoredUsers": 15
  }
}
```

#### GET /collection/twitter/tweets
Retrieve collected tweets with filtering and pagination.

**Query Parameters:**
- `limit` (number, default: 20, max: 100) - Number of tweets per page
- `offset` (number, default: 0) - Offset for pagination
- `startDate` (string, format: YYYY-MM-DD) - Filter by start date
- `endDate` (string, format: YYYY-MM-DD) - Filter by end date
- `userId` (string) - Filter by specific user
- `hashtags` (string) - Filter by hashtags (comma-separated)
- `sentiment` (string) - Filter by sentiment (positive, negative, neutral)
- `minLikes` (number) - Filter by minimum likes
- `search` (string) - Search in tweet text

**Response:**
```json
{
  "success": true,
  "data": {
    "tweets": [
      {
        "id": "507f1f77bcf86cd799439012",
        "platformId": "1617333456782386210",
        "platform": "twitter",
        "type": "tweet",
        "author": {
          "id": "44196397",
          "username": "elonmusk",
          "displayName": "Elon Musk",
          "avatar": "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_normal.jpg",
          "verified": true
        },
        "content": {
          "text": "Starship will make life multiplanetary",
          "media": [],
          "links": []
        },
        "metadata": {
          "engagement": {
            "likes": 125000,
            "retweets": 25000,
            "replies": 8500,
            "views": 2500000
          },
          "sentiment": {
            "score": 0.8,
            "label": "positive"
          },
          "topics": ["space", "technology"],
          "hashtags": ["#SpaceX", "#Starship"],
          "mentions": [],
          "language": "en"
        },
        "publishedAt": "2024-01-15T09:30:00Z",
        "collectedAt": "2024-01-15T09:32:15Z"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### GET /collection/trends
Get trending topics from Twitter.

**Query Parameters:**
- `location` (string, default: "worldwide") - Location for trends
- `limit` (number, default: 10, max: 50) - Number of trends to return

**Response:**
```json
{
  "success": true,
  "data": {
    "location": "worldwide",
    "trends": [
      {
        "name": "#Bitcoin",
        "tweetVolume": 125000,
        "url": "https://twitter.com/search?q=%23Bitcoin",
        "promotedContent": false
      },
      {
        "name": "OpenAI",
        "tweetVolume": 85000,
        "url": "https://twitter.com/search?q=OpenAI",
        "promotedContent": false
      }
    ],
    "asOf": "2024-01-15T10:00:00Z"
  }
}
```

### 3. AI Generation

#### GET /ai/models
Get available AI models.

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "gpt-4",
        "name": "GPT-4",
        "provider": "openai",
        "description": "Most capable model for complex tasks",
        "maxTokens": 8192,
        "supportsStreaming": true,
        "costPer1kTokens": {
          "input": 0.03,
          "output": 0.06
        },
        "isAvailable": true
      },
      {
        "id": "gemini-pro",
        "name": "Gemini Pro",
        "provider": "google",
        "description": "Google's advanced language model",
        "maxTokens": 32768,
        "supportsStreaming": true,
        "costPer1kTokens": {
          "input": 0.00025,
          "output": 0.0005
        },
        "isAvailable": true
      }
    ]
  }
}
```

#### GET /ai/agents
Get user's configured agents.

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "507f1f77bcf86cd799439013",
        "name": "Content Creator",
        "description": "Specialized in creating engaging social media content",
        "type": "content",
        "systemPrompt": "You are a professional social media content creator...",
        "config": {
          "model": "gpt-4",
          "temperature": 0.7,
          "maxTokens": 1000,
          "outputFormat": "social_media_post"
        },
        "isDefault": true,
        "usageCount": 45
      }
    ]
  }
}
```

#### POST /ai/agents
Create a new AI agent.

**Request:**
```json
{
  "name": "Tech Analyst",
  "description": "Specialized in analyzing technology trends",
  "type": "analysis",
  "systemPrompt": "You are a technology analyst with expertise in emerging tech...",
  "config": {
    "model": "gpt-4",
    "temperature": 0.5,
    "maxTokens": 1500,
    "outputFormat": "analysis_report",
    "constraints": [
      "Provide data-backed insights",
      "Include trend analysis",
      "Suggest future implications"
    ]
  },
  "isDefault": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "507f1f77bcf86cd799439014",
      "name": "Tech Analyst",
      "description": "Specialized in analyzing technology trends",
      "type": "analysis",
      "systemPrompt": "You are a technology analyst with expertise in emerging tech...",
      "config": {
        "model": "gpt-4",
        "temperature": 0.5,
        "maxTokens": 1500,
        "outputFormat": "analysis_report"
      },
      "isDefault": false,
      "usageCount": 0
    }
  }
}
```

#### POST /ai/generate
Generate content using AI.

**Request:**
```json
{
  "prompt": "Create an engaging tweet about the latest AI developments",
  "model": "gpt-4",
  "agentId": "507f1f77bcf86cd799439013",
  "context": {
    "sourceContent": ["507f1f77bcf86cd799439012"],
    "topic": "artificial intelligence",
    "platform": "twitter",
    "targetAudience": "tech enthusiasts"
  },
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 280,
    "stream": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "generation": {
      "id": "507f1f77bcf86cd799439015",
      "content": "🤖 Exciting times in AI! GPT-4 is revolutionizing how we interact with technology. From creative writing to complex problem-solving, the possibilities are endless. What AI application are you most excited about? #AI #MachineLearning #Tech",
      "metadata": {
        "model": "gpt-4",
        "provider": "openai",
        "tokens": {
          "input": 25,
          "output": 68,
          "total": 93
        },
        "cost": 0.00483,
        "duration": 1200,
        "suggestions": [
          "Consider adding relevant hashtags",
          "Mention specific AI companies for engagement"
        ]
      },
      "status": "completed",
      "createdAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

### 4. Content Management

#### GET /content
Retrieve content from the material library.

**Query Parameters:**
- `search` (string) - Search query
- `tags` (string) - Filter by tags (comma-separated)
- `platform` (string) - Filter by platform
- `type` (string) - Filter by content type
- `aiGenerated` (boolean) - Filter by AI-generated content
- `limit` (number, default: 20, max: 100) - Items per page
- `offset` (number, default: 0) - Pagination offset
- `sortBy` (string, default: "createdAt") - Sort field
- "sortOrder" (string, default: "desc") - Sort direction

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "507f1f77bcf86cd799439016",
        "platform": "ai_generated",
        "type": "text",
        "content": {
          "text": "The future of AI is not just about automation, but about augmentation...",
          "media": [],
          "links": []
        },
        "source": {
          "generationId": "507f1f77bcf86cd799439015",
          "agent": "Content Creator",
          "model": "gpt-4"
        },
        "tags": ["AI", "technology", "future"],
        "collections": ["507f1f77bcf86cd799439017"],
        "createdAt": "2024-01-15T10:35:00Z",
        "updatedAt": "2024-01-15T10:35:00Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

#### POST /content
Save generated content to the material library.

**Request:**
```json
{
  "content": "The future of AI is not just about automation, but about augmentation...",
  "source": {
    "type": "ai_generated",
    "generationId": "507f1f77bcf86cd799439015",
    "platform": "twitter"
  },
  "metadata": {
    "topic": "AI",
    "targetPlatform": "twitter",
    "targetAudience": "tech_enthusiasts"
  },
  "tags": ["AI", "technology", "future"],
  "collections": ["my_ai_content"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": {
      "id": "507f1f77bcf86cd799439016",
      "platform": "ai_generated",
      "type": "text",
      "content": {
        "text": "The future of AI is not just about automation, but about augmentation...",
        "media": [],
        "links": []
      },
      "source": {
        "generationId": "507f1f77bcf86cd799439015",
        "agent": "Content Creator",
        "model": "gpt-4"
      },
      "tags": ["AI", "technology", "future"],
      "collections": ["507f1f77bcf86cd799439017"],
      "createdAt": "2024-01-15T10:35:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  }
}
```

### 5. User Topics

#### GET /topics
Get user's configured topics.

**Response:**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": "507f1f77bcf86cd799439018",
        "name": "Cryptocurrency",
        "description": "Latest developments in cryptocurrency and blockchain",
        "keywords": ["Bitcoin", "Ethereum", "DeFi", "NFT", "blockchain"],
        "weight": 3,
        "category": "finance",
        "isActive": true,
        "contentCount": 125,
        "settings": {
          "updateFrequency": "15m",
          "notificationEnabled": true,
          "autoCollect": true
        },
        "lastUpdated": "2024-01-15T10:25:00Z",
        "createdAt": "2024-01-10T09:00:00Z"
      }
    ]
  }
}
```

#### POST /topics
Create a new user topic.

**Request:**
```json
{
  "name": "Artificial Intelligence",
  "description": "AI and machine learning developments",
  "keywords": ["AI", "machine learning", "deep learning", "neural networks", "ChatGPT"],
  "weight": 2,
  "category": "technology",
  "settings": {
    "updateFrequency": "30m",
    "notificationEnabled": true,
    "autoCollect": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": {
      "id": "507f1f77bcf86cd799439019",
      "name": "Artificial Intelligence",
      "description": "AI and machine learning developments",
      "keywords": ["AI", "machine learning", "deep learning", "neural networks", "ChatGPT"],
      "weight": 2,
      "category": "technology",
      "isActive": true,
      "contentCount": 0,
      "settings": {
        "updateFrequency": "30m",
        "notificationEnabled": true,
        "autoCollect": true
      },
      "lastUpdated": "2024-01-15T10:40:00Z",
      "createdAt": "2024-01-15T10:40:00Z"
    }
  }
}
```

#### GET /topics/recommendations
Get topic recommendations based on user interests.

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "name": "Quantum Computing",
        "description": "Breakthrough developments in quantum computing technology",
        "keywords": ["quantum", "qubit", "quantum supremacy", "IBM Quantum", "Google Sycamore"],
        "confidence": 0.85,
        "reason": "Based on your interest in technology and AI"
      },
      {
        "name": "Space Technology",
        "description": "Latest news from space exploration and commercial spaceflight",
        "keywords": ["SpaceX", "NASA", "Blue Origin", "space tourism", "Mars mission"],
        "confidence": 0.72,
        "reason": "Popular among tech enthusiasts"
      }
    ]
  }
}
```

### 6. WebSocket Events

#### Connection
```javascript
const ws = new WebSocket('wss://api.automedia.com/ws');
ws.addEventListener('open', () => {
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'your_jwt_token'
  }));
});
```

#### Events

**tweet:collected**
```json
{
  "type": "tweet:collected",
  "data": {
    "tweet": {
      "id": "507f1f77bcf86cd799439012",
      "platformId": "1617333456782386210",
      "text": "Starship will make life multiplanetary",
      "author": {
        "username": "elonmusk",
        "displayName": "Elon Musk"
      },
      "engagement": {
        "likes": 125000,
        "retweets": 25000
      }
    },
    "source": "monitoring",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**trend:updated**
```json
{
  "type": "trend:updated",
  "data": {
    "trends": [
      {
        "name": "#Bitcoin",
        "tweetVolume": 125000,
        "change": "+15%"
      }
    ],
    "location": "worldwide",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

**generation:progress**
```json
{
  "type": "generation:progress",
  "data": {
    "generationId": "507f1f77bcf86cd799439015",
    "progress": 75,
    "status": "processing",
    "message": "Generating content...",
    "timestamp": "2024-01-15T10:35:00Z"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| AUTH001 | Invalid credentials |
| AUTH002 | Token expired |
| AUTH003 | Invalid token |
| RATE001 | Rate limit exceeded |
| RATE002 | API quota exceeded |
| DATA001 | Resource not found |
| DATA002 | Invalid data format |
| AI001 | Model not available |
| AI002 | Generation failed |
| AI003 | Content filter triggered |
| SYS001 | Internal server error |
| SYS002 | Service unavailable |

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **AI generation**: 10 requests per minute
- **Data collection**: 500 requests per hour
- **WebSocket**: 100 messages per minute

## Data Validation

All requests are validated using JSON Schema. Common validation rules:

- **Email**: Must be valid email format
- **Strings**: Trim whitespace, minimum length 1
- **Numbers**: Must be positive where applicable
- **Arrays**: Maximum length limits apply
- **Dates**: ISO 8601 format required

## Security

- **Authentication**: JWT with RS256 algorithm
- **Authorization**: Role-based access control
- **Rate Limiting**: Per-user and per-endpoint limits
- **Input Validation**: Schema validation for all inputs
- **CORS**: Configured for specific domains
- **HTTPS**: Required for all production requests
- **Data Encryption**: Sensitive data encrypted at rest

## Pagination

All list endpoints support pagination:

```json
{
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Pagination Query Parameters:**
- `limit`: Items per page (max: 100)
- `offset`: Number of items to skip

## Search and Filtering

Common query parameters across endpoints:

- `search`: Full-text search
- `tags`: Filter by tags (comma-separated)
- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc`
- `dateFrom`: Start date filter (YYYY-MM-DD)
- `dateTo`: End date filter (YYYY-MM-DD)

## Webhooks

Configure webhooks to receive real-time updates:

**POST /webhooks**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["tweet:collected", "trend:updated"],
  "secret": "your_webhook_secret"
}
```

## SDK

Official SDKs are available for:

- **JavaScript/Node.js**: `@automedia/sdk`
- **Python**: `automedia-sdk`
- **cURL**: Examples provided in documentation

## Versioning

API versioning is handled through URL paths:

- **Current version**: `/v1/`
- **Deprecated versions**: `/v0/`
- **Beta features**: `/beta/`

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Twitter data collection endpoints
- AI content generation
- User topic management
- WebSocket real-time updates

## Support

- **Documentation**: https://docs.automedia.com
- **API Status**: https://status.automedia.com
- **Support**: support@automedia.com
- **Community**: https://community.automedia.com