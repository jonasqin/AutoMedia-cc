import { Document } from 'mongoose';
import { IUser, IContent, ITopic } from '../../types';

export interface TestFixtures {
  users: any[];
  content: any[];
  topics: any[];
}

export const createTestFixtures = async (): Promise<TestFixtures> => {
  const { User } = await import('../../models/User');
  const { Content } = await import('../../models/Content');
  const { Topic } = await import('../../models/Topic');

  // Create test users
  const users = await User.insertMany([
    {
      email: 'admin@test.com',
      password: '$2a$10$TestHashedPassword123',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: true,
        },
      },
      settings: {
        defaultAIModel: 'gpt-4',
        defaultAgent: 'admin',
        theme: 'dark',
      },
      isActive: true,
      emailVerified: true,
      role: 'admin',
    },
    {
      email: 'user@test.com',
      password: '$2a$10$TestHashedPassword123',
      profile: {
        firstName: 'Regular',
        lastName: 'User',
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: true,
        },
      },
      settings: {
        defaultAIModel: 'gpt-3.5-turbo',
        defaultAgent: 'content',
        theme: 'light',
      },
      isActive: true,
      emailVerified: true,
      role: 'user',
    },
  ]);

  // Create test topics
  const topics = await Topic.insertMany([
    {
      userId: users[0]._id,
      name: 'Technology',
      description: 'Latest tech news and updates',
      keywords: ['tech', 'technology', 'ai', 'software'],
      weight: 1.0,
      isActive: true,
      lastUpdated: new Date(),
      contentCount: 0,
      settings: {
        updateFrequency: 'daily',
        notificationEnabled: true,
        autoCollect: true,
      },
      priority: 'high',
      emoji: '💻',
      color: '#3B82F6',
    },
    {
      userId: users[0]._id,
      name: 'Marketing',
      description: 'Digital marketing strategies',
      keywords: ['marketing', 'social media', 'branding'],
      weight: 0.8,
      isActive: true,
      lastUpdated: new Date(),
      contentCount: 0,
      settings: {
        updateFrequency: 'weekly',
        notificationEnabled: false,
        autoCollect: false,
      },
      priority: 'medium',
      emoji: '📈',
      color: '#10B981',
    },
  ]);

  // Create test content
  const content = await Content.insertMany([
    {
      platform: 'twitter',
      platformId: '1234567890',
      type: 'tweet',
      author: {
        id: 'twitter-user-1',
        username: 'techguru',
        displayName: 'Tech Guru',
        verified: true,
      },
      content: {
        text: 'Just discovered an amazing AI tool that revolutionizes content creation! 🤖 #AI #Tech',
        media: [],
        links: [],
      },
      metadata: {
        engagement: {
          likes: 150,
          retweets: 45,
          replies: 12,
          views: 2500,
        },
        sentiment: {
          score: 0.8,
          label: 'positive',
        },
        topics: ['AI', 'Technology'],
        hashtags: ['#AI', '#Tech'],
        mentions: [],
        language: 'en',
      },
      aiGenerated: false,
      source: users[0]._id,
      tags: ['AI', 'Technology', 'Tools'],
      collections: [topics[0]._id],
      publishedAt: new Date('2024-01-15T10:30:00Z'),
      collectedAt: new Date(),
      isActive: true,
    },
    {
      platform: 'twitter',
      platformId: '1234567891',
      type: 'tweet',
      author: {
        id: 'twitter-user-2',
        username: 'marketingpro',
        displayName: 'Marketing Pro',
        verified: false,
      },
      content: {
        text: '5 tips for effective social media marketing campaigns in 2024. thread 🧵',
        media: [],
        links: [],
      },
      metadata: {
        engagement: {
          likes: 89,
          retweets: 23,
          replies: 8,
          views: 1200,
        },
        sentiment: {
          score: 0.6,
          label: 'positive',
        },
        topics: ['Marketing', 'Social Media'],
        hashtags: ['#Marketing', '#SocialMedia'],
        mentions: [],
        language: 'en',
      },
      aiGenerated: false,
      source: users[1]._id,
      tags: ['Marketing', 'Social Media', 'Tips'],
      collections: [topics[1]._id],
      publishedAt: new Date('2024-01-14T14:20:00Z'),
      collectedAt: new Date(),
      isActive: true,
    },
  ]);

  return {
    users,
    content,
    topics,
  };
};

export const createAuthHeaders = (userId: string, token?: string) => {
  return {
    Authorization: `Bearer ${token || 'test-jwt-token'}`,
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  };
};

export const mockTwitterResponses = {
  searchTweets: {
    data: [
      {
        id: '1234567890',
        text: 'Test tweet content',
        author_id: 'author123',
        created_at: '2024-01-15T10:30:00Z',
        public_metrics: {
          retweet_count: 10,
          reply_count: 5,
          like_count: 50,
          quote_count: 2,
        },
      },
    ],
    meta: {
      result_count: 1,
      newest_id: '1234567890',
      oldest_id: '1234567890',
    },
  },
  trendingTopics: [
    {
      name: 'Technology',
      url: 'http://twitter.com/search?q=Technology',
      promoted_content: false,
      query: 'Technology',
      tweet_volume: 12500,
    },
  ],
  userInfo: {
    data: {
      id: 'author123',
      name: 'Test Author',
      username: 'testauthor',
      verified: false,
      public_metrics: {
        followers_count: 1000,
        following_count: 500,
        tweet_count: 250,
      },
    },
  },
};

export const mockAIResponses = {
  generateContent: {
    content: 'AI-generated content based on the provided prompt and context.',
    metadata: {
      model: 'gpt-3.5-turbo',
      tokens: {
        input: 100,
        output: 150,
        total: 250,
      },
      cost: 0.005,
      duration: 2000,
    },
  },
  analyzeSentiment: {
    score: 0.7,
    label: 'positive',
    confidence: 0.85,
    topics: ['technology', 'innovation'],
    keywords: ['AI', 'future', 'technology'],
  },
};