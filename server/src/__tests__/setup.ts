import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import redis from 'redis-mock';
import { jest } from '@jest/globals';

// Global test setup
let mongoServer: MongoMemoryServer;

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.TWITTER_BEARER_TOKEN = 'test-twitter-token';
process.env.TWITTER_API_KEY = 'test-twitter-key';
process.env.TWITTER_API_SECRET = 'test-twitter-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GOOGLE_AI_API_KEY = 'test-google-key';

// Mock Redis
jest.mock('../config/redis', () => ({
  cacheData: jest.fn(),
  getCachedData: jest.fn(),
  deleteCache: jest.fn(),
  redisClient: {
    connect: jest.fn(),
    quit: jest.fn(),
  },
}));

// Mock external services
jest.mock('twitter-api-v2', () => ({
  TwitterApi: jest.fn().mockImplementation(() => ({
    v2: {
      get: jest.fn(),
      userByUsername: jest.fn(),
      userTimeline: jest.fn(),
      search: jest.fn(),
    },
    v1: {
      trendsByPlace: jest.fn(),
      get: jest.fn(),
    },
  })),
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}));

// Setup in-memory database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear database before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }

  // Clear all mocks
  jest.clearAllMocks();
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Global test utilities
global.testUtils = {
  createTestUser: async (userData = {}) => {
    const { User } = await import('../models/User');
    const defaultUser = {
      email: 'test@example.com',
      password: 'Password123!',
      profile: {
        firstName: 'Test',
        lastName: 'User',
      },
      ...userData,
    };
    const user = new User(defaultUser);
    await user.save();
    return user;
  },

  createTestTopic: async (topicData = {}) => {
    const { Topic } = await import('../models/Topic');
    const defaultTopic = {
      userId: 'test-user-id',
      name: 'Test Topic',
      keywords: ['test', 'topic'],
      description: 'A test topic',
      ...topicData,
    };
    const topic = new Topic(defaultTopic);
    await topic.save();
    return topic;
  },

  createTestContent: async (contentData = {}) => {
    const { Content } = await import('../models/Content');
    const defaultContent = {
      platform: 'twitter',
      platformId: 'test-tweet-id',
      type: 'tweet',
      author: {
        id: 'test-author-id',
        username: 'testauthor',
        displayName: 'Test Author',
        verified: false,
      },
      content: {
        text: 'This is a test tweet',
        media: [],
        links: [],
      },
      metadata: {
        engagement: {
          likes: 10,
          retweets: 5,
          replies: 2,
          views: 100,
        },
        sentiment: {
          score: 0.5,
          label: 'positive',
        },
        topics: ['test'],
        hashtags: ['#test'],
        mentions: [],
        language: 'en',
      },
      ...contentData,
    };
    const content = new Content(defaultContent);
    await content.save();
    return content;
  },

  generateTestToken: (userId: string, email: string) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  },

  generateRefreshToken: (userId: string, email: string) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  },
};

export default {};