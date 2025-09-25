import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    preferences: {
      language: string;
      timezone: string;
      notifications: boolean;
    };
  };
  settings: {
    defaultAIModel: string;
    defaultAgent: string;
    theme: string;
  };
  apiKeys: Array<{
    provider: string;
    key: string;
    encrypted: boolean;
  }>;
  isActive: boolean;
  lastLogin?: Date;
  emailVerified: boolean;
  verificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IPlatform extends Document {
  _id: string;
  name: string;
  type: 'twitter' | 'xiaohongshu' | 'facebook' | 'instagram' | 'tiktok';
  config: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    webhookUrl?: string;
  };
  status: 'active' | 'inactive' | 'error';
  rateLimit: {
    remaining: number;
    reset: Date;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContent extends Document {
  _id: string;
  platform: string;
  platformId?: string;
  type: 'tweet' | 'post' | 'video' | 'image' | 'story';
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    verified: boolean;
  };
  content: {
    text: string;
    media: Array<{
      url: string;
      type: string;
      altText?: string;
    }>;
    links: Array<{
      url: string;
      title?: string;
      description?: string;
    }>;
  };
  metadata: {
    engagement: {
      likes: number;
      retweets: number;
      replies: number;
      views: number;
    };
    sentiment: {
      score: number;
      label: string;
    };
    topics: string[];
    hashtags: string[];
    mentions: string[];
    language: string;
    location?: string;
  };
  aiGenerated: boolean;
  source?: string;
  tags: string[];
  collections: string[];
  publishedAt?: Date;
  collectedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITopic extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  keywords: string[];
  weight: number;
  category?: string;
  isActive: boolean;
  lastUpdated: Date;
  contentCount: number;
  settings: {
    updateFrequency: string;
    notificationEnabled: boolean;
    autoCollect: boolean;
  };
  priority: string;
  emoji?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgent extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'content' | 'analysis' | 'marketing' | 'technical' | 'social';
  systemPrompt: string;
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
    outputFormat?: string;
    constraints?: string[];
  };
  isDefault: boolean;
  usageCount: number;
  isPublic: boolean;
  tags: string[];
  version: number;
  isActive: boolean;
  performance: {
    averageResponseTime: number;
    successRate: number;
    userRating?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IGeneration extends Document {
  _id: string;
  userId: string;
  agentId?: string;
  prompt: string;
  input: {
    content: string;
    context?: string;
    parameters: Record<string, any>;
  };
  output?: {
    content: string;
    metadata: Record<string, any>;
    sources: string[];
  };
  aiModel: string;
  provider: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  duration: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  priority: string;
  scheduledAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
  tags: string[];
  feedback?: {
    rating?: number;
    comment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICollection extends Document {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'manual' | 'auto' | 'smart';
  rules: {
    criteria: string[];
    conditions: Record<string, any>;
    autoAdd: boolean;
  };
  contentCount: number;
  isPublic: boolean;
  icon?: string;
  color?: string;
  isDefault?: boolean;
  tags: string[];
  settings: {
    allowSharing: boolean;
    allowExport: boolean;
    autoArchive: boolean;
    retentionDays: number;
  };
  collaborators?: Array<{
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
    addedAt: Date;
  }>;
  isActive: boolean;
  lastContentAdded?: Date;
  statistics: {
    totalViews: number;
    totalShares: number;
    totalExports: number;
    avgEngagementRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export interface AIProvider {
  name: string;
  apiEndpoint: string;
  models: string[];
  defaultModel: string;
  maxTokens: number;
  costPerToken: number;
}

export interface TwitterApiResponse {
  data: any;
  meta: {
    result_count: number;
    newest_id: string;
    oldest_id: string;
  };
  includes?: {
    users?: any[];
    media?: any[];
  };
}

export interface TrendingTopic {
  name: string;
  url: string;
  promoted_content?: boolean;
  query: string;
  tweet_volume?: number;
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // 0 to 1
}

export interface ContentEngagement {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  engagementRate: number; // likes + retweets + replies / followers * 100
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}