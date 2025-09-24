# AutoMedia Database Schema

## Overview

This document defines the complete database schema for AutoMedia, including MongoDB collections, Redis data structures, and their relationships. The schema is designed to support multi-platform social media data collection, AI-powered content generation, and user personalization.

## Database Technology Stack

- **Primary Database**: MongoDB 6.0+ with Mongoose ODM
- **Cache Layer**: Redis 7.0+ for session management and data caching
- **Vector Search**: MongoDB Atlas Vector Search for content similarity
- **File Storage**: GridFS for large media files

## MongoDB Collections

### 1. users

User account management and preferences.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "user@example.com", // Unique, indexed
  password: "$2b$10$...", // bcrypt hashed
  profile: {
    firstName: "John",
    lastName: "Doe",
    avatar: "https://example.com/avatar.jpg",
    bio: "Social media manager and content creator",
    website: "https://example.com",
    location: "San Francisco, CA",
    timezone: "America/Los_Angeles"
  },
  preferences: {
    language: "en",
    theme: "dark",
    notifications: {
      email: true,
      push: true,
      telegram: false
    },
    privacy: {
      profileVisibility: "public",
      activityVisibility: "private"
    },
    contentDefaults: {
      defaultAIModel: "gpt-4",
      defaultAgent: ObjectId("507f1f77bcf86cd799439013"),
      defaultPlatform: "twitter"
    }
  },
  settings: {
    apiKeys: [
      {
        provider: "openai",
        key: "encrypted_api_key",
        label: "Primary OpenAI Key",
        isActive: true,
        createdAt: ISODate("2024-01-15T10:00:00Z"),
        lastUsed: ISODate("2024-01-15T10:30:00Z")
      }
    ],
    rateLimits: {
      dailyGenerationLimit: 100,
      monthlyCollectionLimit: 10000
    },
    features: {
      betaAccess: true,
      advancedAnalytics: true
    }
  },
  subscription: {
    plan: "pro",
    status: "active",
    currentPeriodStart: ISODate("2024-01-01T00:00:00Z"),
    currentPeriodEnd: ISODate("2024-02-01T00:00:00Z"),
    cancelAtPeriodEnd: false
  },
  statistics: {
    totalContentGenerated: 1250,
    totalContentCollected: 5420,
    totalTokensUsed: 125000,
    lastActivity: ISODate("2024-01-15T10:30:00Z")
  },
  isActive: true,
  isVerified: true,
  createdAt: ISODate("2024-01-01T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Indexes:**
- `{ email: 1 }` - Unique
- `{ createdAt: -1 }`
- `{ "subscription.status": 1 }`
- `{ isActive: 1 }`

### 2. platforms

Platform connection configurations and status.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  userId: ObjectId("507f1f77bcf86cd799439011"), // Reference to users
  name: "Twitter",
  type: "twitter", // twitter, xiaohongshu, facebook, instagram, tiktok
  config: {
    apiKey: "encrypted_api_key",
    apiSecret: "encrypted_api_secret",
    accessToken: "encrypted_access_token",
    accessTokenSecret: "encrypted_access_token",
    webhookUrl: "https://api.automedia.com/webhooks/twitter",
    environment: "production"
  },
  status: "active", // active, inactive, error, pending
  rateLimit: {
    limit: 500,
    remaining: 450,
    reset: ISODate("2024-01-15T11:00:00Z"),
    window: "15m"
  },
  statistics: {
    totalCollected: 5420,
    todayCollected: 125,
    errors: {
      count: 5,
      lastError: {
        message: "Rate limit exceeded",
        timestamp: ISODate("2024-01-15T09:30:00Z")
      }
    }
  },
  webhooks: [
    {
      id: "wh_123456789",
      url: "https://user-app.com/webhook",
      events: ["tweet.created", "user.updated"],
      secret: "webhook_secret",
      isActive: true,
      createdAt: ISODate("2024-01-15T10:00:00Z")
    }
  ],
  settings: {
    autoReconnect: true,
    retryAttempts: 3,
    collectionInterval: "5m",
    includeRetweets: false,
    includeReplies: false
  },
  lastSync: ISODate("2024-01-15T10:25:00Z"),
  createdAt: ISODate("2024-01-01T10:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Indexes:**
- `{ userId: 1, type: 1 }` - Unique
- `{ status: 1 }`
- `{ type: 1 }`
- `{ lastSync: -1 }`

### 3. content

Social media content and generated content storage.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  platform: "twitter", // Platform source
  platformId: "1617333456782386210", // Original platform ID
  type: "tweet", // tweet, post, video, image, story, generated
  author: {
    id: "44196397",
    username: "elonmusk",
    displayName: "Elon Musk",
    avatar: "https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_normal.jpg",
    verified: true,
    followersCount: 150000000,
    followingCount: 200,
    bio: "CEO of Tesla, SpaceX, Neuralink & The Boring Company"
  },
  content: {
    text: "Starship will make life multiplanetary",
    media: [
      {
        url: "https://pbs.twimg.com/media/ABCDEFG.jpg",
        type: "photo",
        width: 1200,
        height: 800,
        altText: "Starship launch",
        fileSize: 125000,
        format: "jpg"
      }
    ],
    links: [
      {
        url: "https://spacex.com/starship",
        title: "Starship Official Website",
        description: "Learn about SpaceX's Starship program",
        expandedUrl: "https://spacex.com/starship",
        displayUrl: "spacex.com/starship"
      }
    ],
    mentions: [
      {
        username: "SpaceX",
        id: "13298072",
        indices: [50, 57]
      }
    ],
    hashtags: [
      {
        text: "SpaceX",
        indices: [58, 65]
      }
    ]
  },
  metadata: {
    engagement: {
      likes: 125000,
      retweets: 25000,
      replies: 8500,
      views: 2500000,
      quoteTweets: 5000,
      bookmarks: 12000
    },
    sentiment: {
      score: 0.8, // -1 to 1
      label: "positive", // positive, negative, neutral
      confidence: 0.95,
      emotions: {
        joy: 0.8,
        excitement: 0.6,
        anticipation: 0.4
      }
    },
    topics: [
      {
        name: "space technology",
        confidence: 0.9,
        category: "technology"
      },
      {
        name: "exploration",
        confidence: 0.7,
        category: "science"
      }
    ],
    language: "en",
    location: {
      name: "Texas, USA",
      coordinates: {
        lat: 31.9686,
        lng: -99.9018
      }
    },
    source: {
      type: "api", // api, webhook, manual, generated
      collectedBy: "monitoring"
    },
    quality: {
      score: 0.85,
      factors: ["engagement", "originality", "relevance"]
    }
  },
  aiGenerated: false,
  source: ObjectId("507f1f77bcf86cd799439011"), // Reference to users who collected/created
  tags: ["space", "technology", "exploration"],
  collections: [ObjectId("507f1f77bcf86cd799439014")], // Reference to collections
  topics: [ObjectId("507f1f77bcf86cd799439015")], // Reference to user topics
  publishedAt: ISODate("2024-01-15T09:30:00Z"),
  collectedAt: ISODate("2024-01-15T09:32:15Z"),
  processedAt: ISODate("2024-01-15T09:35:00Z"),
  expiresAt: ISODate("2024-02-15T09:30:00Z"), // For temporary content
  isArchived: false,
  isDeleted: false,
  moderationStatus: "approved", // pending, approved, rejected
  moderationNotes: "",
  createdAt: ISODate("2024-01-15T09:32:15Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Indexes:**
- `{ platform: 1, platformId: 1 }` - Unique
- `{ author.id: 1 }`
- `{ "author.username": 1 }`
- `{ publishedAt: -1 }`
- `{ collectedAt: -1 }`
- `{ tags: 1 }`
- `{ topics: 1 }`
- `{ aiGenerated: 1 }`
- `{ type: 1 }`
- `{ moderationStatus: 1 }`
- `{ metadata.sentiment.score: 1 }`
- `{ metadata.engagement.likes: -1 }`

### 4. topics

User-defined topic management and personalization.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439015"),
  userId: ObjectId("507f1f77bcf86cd799439011"), // Reference to users
  name: "Cryptocurrency",
  description: "Latest developments in cryptocurrency and blockchain technology",
  keywords: [
    {
      term: "Bitcoin",
      weight: 1.0,
      variations: ["BTC", "bitcoin"]
    },
    {
      term: "Ethereum",
      weight: 0.9,
      variations: ["ETH", "ethereum"]
    },
    {
      term: "DeFi",
      weight: 0.8,
      variations: ["decentralized finance"]
    }
  ],
  weight: 3, // User-defined importance (1-5)
  category: "finance", // User-defined category
  isActive: true,
  settings: {
    updateFrequency: "15m", // 5m, 15m, 30m, 1h, 6h, 12h, 1d
    notificationEnabled: true,
    autoCollect: true,
    contentTypes: ["tweet", "post"],
    platforms: ["twitter"],
    language: "en",
    location: "worldwide",
    minEngagement: {
      likes: 100,
      retweets: 10
    }
  },
  statistics: {
    contentCount: 125,
    lastContentUpdate: ISODate("2024-01-15T10:25:00Z"),
    averageEngagement: {
      likes: 850,
      retweets: 120
    },
    trendingScore: 0.75,
    relevanceScore: 0.85
  },
  filters: {
    sentiment: ["positive", "neutral"], // Include sentiments
    excludeKeywords: ["spam", "scam"],
    includeVerified: true,
    minFollowers: 1000
  },
  webhooks: [
    {
      url: "https://user-app.com/webhook/crypto",
      events: ["new_content", "trend_change"],
      isActive: true
    }
  ],
  lastUpdated: ISODate("2024-01-15T10:25:00Z"),
  createdAt: ISODate("2024-01-10T09:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Indexes:**
- `{ userId: 1, name: 1 }` - Unique
- `{ userId: 1, category: 1 }`
- `{ userId: 1, isActive: 1 }`
- `{ userId: 1, weight: -1 }`
- `{ category: 1 }`
- `{ isActive: 1 }`

### 5. agents

AI agent configuration and management.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439016"),
  userId: ObjectId("507f1f77bcf86cd799439011"), // Reference to users
  name: "Content Creator",
  description: "Specialized in creating engaging social media content",
  type: "content", // content, analysis, marketing, technical, social
  systemPrompt: "You are a professional social media content creator with expertise in technology and innovation. Your content is engaging, informative, and platform-optimized. Consider the target audience and platform constraints when generating content.",
  config: {
    model: "gpt-4",
    provider: "openai",
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    outputFormat: "social_media_post",
    constraints: [
      "Keep within platform character limits",
      "Include relevant hashtags",
      "Maintain professional tone",
      "Ensure originality"
    ],
    templates: [
      {
        name: "Tech Announcement",
        structure: "Introduction + Key Points + Call to Action",
        example: "🚀 Exciting news! {announcement}. Key highlights: {points}. Learn more: {link}"
      }
    ]
  },
  persona: {
    name: "Tech Insider",
    tone: "professional but approachable",
    expertise: ["technology", "innovation", "AI"],
    targetAudience: "tech enthusiasts, professionals",
    languageStyle: "clear, concise, engaging"
  },
  capabilities: [
    "content_generation",
    "summarization",
    "translation",
    "sentiment_analysis"
  ],
  usage: {
    count: 45,
    lastUsed: ISODate("2024-01-15T10:30:00Z"),
    averageTokens: 750,
    successRate: 0.98
  },
  performance: {
    averageGenerationTime: 1200, // milliseconds
    qualityScore: 0.85,
    userRating: 4.5
  },
  isDefault: false,
  isPublic: false, // Shareable with other users
  isFavorite: true,
  tags: ["content", "social_media", "technology"],
  version: 1,
  parentId: null, // For agent versions
  createdAt: ISODate("2024-01-10T09:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Indexes:**
- `{ userId: 1, name: 1 }` - Unique
- `{ userId: 1, type: 1 }`
- `{ userId: 1, isDefault: 1 }`
- `{ type: 1 }`
- `{ isPublic: 1 }`
- `{ isDefault: 1 }`

### 6. generations

AI content generation history and tracking.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439017"),
  userId: ObjectId("507f1f77bcf86cd799439011"), // Reference to users
  agentId: ObjectId("507f1f77bcf86cd799439016"), // Reference to agents
  prompt: "Create an engaging tweet about the latest AI developments",
  input: {
    content: "Based on recent AI breakthroughs in natural language processing",
    context: {
      sourceContent: [ObjectId("507f1f77bcf86cd799439013")],
      topic: "artificial intelligence",
      platform: "twitter",
      targetAudience: "tech enthusiasts",
      tone: "professional"
    },
    parameters: {
      temperature: 0.7,
      maxTokens: 280,
      includeHashtags: true,
      includeEmojis: true
    }
  },
  output: {
    content": "🤖 Exciting times in AI! GPT-4 is revolutionizing how we interact with technology. From creative writing to complex problem-solving, the possibilities are endless. What AI application are you most excited about? #AI #MachineLearning #Tech",
    metadata: {
      charCount": 280,
      wordCount: 45,
      hashtagCount: 3,
      emojiCount: 1,
      estimatedReadingTime: 15
    },
    suggestions": [
      "Consider mentioning specific AI companies",
      "Add a call-to-action for engagement",
      "Include relevant statistics or data points"
    ],
    qualityScore": 0.85,
    originalityScore": 0.92
  },
  model: "gpt-4",
  provider: "openai",
  tokens: {
    input: 25,
    output: 68,
    total: 93
  },
  cost: 0.00483,
  duration: 1200, // milliseconds
  status: "completed", // pending, processing, completed, failed, cancelled
  error: null,
  feedback: {
    userRating: 4,
    userComment": "Great content, exactly what I needed!",
    isSaved: true,
    isEdited: false
  },
  batchId: null, // For batch generations
  createdAt: ISODate("2024-01-15T10:35:00Z"),
  updatedAt: ISODate("2024-01-15T10:35:00Z")
}
```

**Indexes:**
- `{ userId: 1, createdAt: -1 }`
- `{ agentId: 1, createdAt: -1 }`
- `{ status: 1 }`
- `{ model: 1 }`
- `{ provider: 1 }`
- `{ createdAt: -1 }`

### 7. collections

Content organization and management.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439018"),
  userId: ObjectId("507f1f77bcf86cd799439011"), // Reference to users
  name: "AI Content Ideas",
  description: "Collection of AI-related content ideas and inspiration",
  type: "manual", // manual, auto, smart
  rules: {
    criteria: [
      {
        field: "tags",
        operator: "contains",
        value: "AI"
      },
      {
        field: "aiGenerated",
        operator: "equals",
        value: true
      }
    ],
    conditions: {
      minEngagement: {
        likes: 100
      },
      dateRange: {
        from: ISODate("2024-01-01T00:00:00Z"),
        to: ISODate("2024-12-31T23:59:59Z")
      }
    },
    autoAdd: true,
    autoRemove: false
  },
  settings: {
    isPublic: false,
    allowSharing: true,
    sortCriteria: "createdAt",
    sortOrder: "desc",
    maxItems: 1000
  },
  statistics: {
    itemCount: 45,
    totalViews: 1250,
    lastAdded: ISODate("2024-01-15T10:30:00Z"),
    lastUpdated: ISODate("2024-01-15T10:30:00Z")
  },
  permissions: [
    {
      userId: ObjectId("507f1f77bcf86cd799439019"),
      role: "editor", // owner, editor, viewer
      grantedAt: ISODate("2024-01-15T10:00:00Z")
    }
  ],
  tags: ["AI", "content", "ideas"],
  color: "#3B82F6",
  icon: "lightbulb",
  createdAt: ISODate("2024-01-10T09:00:00Z"),
  updatedAt: ISODate("2024-01-15T10:30:00Z")
}
```

**Indexes:**
- `{ userId: 1, name: 1 }` - Unique
- `{ userId: 1, type: 1 }`
- `{ userId: 1, isPublic: 1 }`
- `{ type: 1 }`
- `{ createdAt: -1 }`

### 8. sessions

User session management for authentication.

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439019"),
  userId: ObjectId("507f1f77bcf86cd799439011"), // Reference to users
  token: "jwt_token_hash",
  refreshToken: "refresh_token_hash",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  ipAddress: "192.168.1.1",
  location: {
    country: "United States",
    city: "San Francisco",
    coordinates: {
      lat: 37.7749,
      lng: -122.4194
    }
  },
  deviceInfo: {
    type: "desktop",
    os: "Windows 10",
    browser: "Chrome"
  },
  isActive: true,
  lastActivity: ISODate("2024-01-15T10:30:00Z"),
  expiresAt: ISODate("2024-01-15T11:30:00Z"),
  createdAt: ISODate("2024-01-15T10:00:00Z")
}
```

**Indexes:**
- `{ token: 1 }` - Unique
- `{ userId: 1 }`
- `{ isActive: 1 }`
- `{ expiresAt: 1 }`

## Redis Data Structures

### 1. User Sessions
```
Key: session:{sessionId}
Type: Hash
Fields:
- userId: String
- token: String
- expiresAt: Timestamp
- lastActivity: Timestamp
```

### 2. Rate Limiting
```
Key: rate_limit:{userId}:{endpoint}
Type: String
Value: Counter with TTL
```

### 3. Cache Data
```
Key: cache:{key}
Type: String
Value: JSON data with TTL
```

### 4. Real-time Updates
```
Key: updates:{userId}
Type: List
Value: Queue of update events
```

### 5. Trending Topics
```
Key: trends:{location}
Type: Sorted Set
Value: Topic names with scores
```

### 6. User Activity
```
Key: activity:{userId}
Type: Sorted Set
Value: Activity timestamps with scores
```

## Relationships and Data Flow

### User-Content Flow
```
User → Platform → Content → Topics → Collections
  ↓        ↓        ↓        ↓         ↓
Settings  Config   Metadata  Filters   Rules
```

### AI Generation Flow
```
User → Agent → Model → Generation → Content
  ↓      ↓      ↓        ↓         ↓
Config Prompt  Tokens   History   Library
```

### Real-time Data Flow
```
Platform API → Content Store → WebSocket → User Interface
      ↓             ↓              ↓           ↓
   Rate Limit    Processing     Queue       Dashboard
```

## Data Validation and Constraints

### MongoDB Validation Rules
- **Required Fields**: All documents have required fields with non-null values
- **Data Types**: Strict type checking for all fields
- **String Length**: Minimum and maximum length constraints
- **Enum Values**: Restricted to predefined values
- **References**: Valid ObjectID references to other collections
- **Unique Constraints**: Enforced through indexes
- **Default Values**: Applied when fields are not provided

### Input Validation
- **Email Validation**: RFC 5322 compliant email addresses
- **URL Validation**: Proper URL format and accessibility
- **Text Content**: Sanitization for XSS prevention
- **File Uploads**: Type, size, and format validation
- **API Keys**: Encrypted storage with validation
- **Dates**: ISO 8601 format validation

## Performance Optimization

### Indexing Strategy
- **Compound Indexes**: Multi-field indexes for common queries
- **Partial Indexes**: Indexes for specific document subsets
- **Text Indexes**: Full-text search capabilities
- **Geospatial Indexes**: Location-based queries
- **TTL Indexes**: Automatic document expiration

### Query Optimization
- **Projection**: Selective field retrieval
- **Pagination**: Limit and offset for large result sets
- **Caching**: Redis caching for frequent queries
- **Aggregation Pipelines**: Efficient data processing
- **Read Preferences**: Appropriate read concerns

### Data Archiving
- **Cold Storage**: Move old content to archival collections
- **Compression**: Compress large text fields
- **Partitioning**: Time-based data partitioning
- **Cleanup**: Regular cleanup of expired data

## Security Considerations

### Data Encryption
- **At Rest**: MongoDB encryption
- **In Transit**: TLS 1.3 encryption
- **Sensitive Fields**: Application-level encryption
- **API Keys**: Encrypted with industry standards

### Access Control
- **Document-level**: User access to own data
- **Collection-level**: Role-based permissions
- **Field-level**: Selective field access
- **Audit Trail**: Complete access logging

### Data Privacy
- **GDPR Compliance**: Right to be forgotten
- **Data Minimization**: Collect only necessary data
- **Anonymization**: Remove personal identifiers
- **Consent Management**: User preference tracking

## Backup and Recovery

### Backup Strategy
- **Automated Backups**: Daily snapshots
- **Point-in-Time Recovery**: Continuous backup
- **Cross-region**: Geo-redundant storage
- **Testing**: Regular recovery testing

### Disaster Recovery
- **Multi-region**: Geographic distribution
- **Failover**: Automatic failover procedures
- **Data Consistency**: Strong consistency guarantees
- **Recovery Time**: < 1 hour RTO

## Monitoring and Analytics

### Database Metrics
- **Performance**: Query times, throughput, latency
- **Storage**: Disk usage, collection sizes
- **Connections**: Connection pool, connection counts
- **Replication**: Replication lag, sync status

### Application Metrics
- **API Usage**: Request counts, response times
- **User Activity**: Active users, feature usage
- **AI Usage**: Token consumption, model usage
- **Error Rates**: Error frequency, error types

### Alerting
- **Thresholds**: Configurable alert thresholds
- **Notifications**: Email, Slack, SMS notifications
- **Severity Levels**: Critical, warning, info alerts
- **Escalation**: Multi-level escalation procedures