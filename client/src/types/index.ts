// User types
export interface User {
  id: string;
  email: string;
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
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Content types
export interface Content {
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
  publishedAt?: string;
  collectedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Topic types
export interface Topic {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  keywords: string[];
  weight: number;
  category?: string;
  isActive: boolean;
  lastUpdated: string;
  contentCount: number;
  settings: {
    updateFrequency: string;
    notificationEnabled: boolean;
    autoCollect: boolean;
  };
  priority: string;
  emoji?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// Agent types
export interface Agent {
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
  createdAt: string;
  updatedAt: string;
}

// Generation types
export interface Generation {
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
  model: string;
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
  scheduledAt?: string;
  completedAt?: string;
  retryCount: number;
  maxRetries: number;
  tags: string[];
  feedback?: {
    rating?: number;
    comment?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface TopicForm {
  name: string;
  description?: string;
  keywords: string[];
  weight: number;
  category?: string;
  settings: {
    updateFrequency: string;
    notificationEnabled: boolean;
    autoCollect: boolean;
  };
  emoji?: string;
  color?: string;
}

export interface AgentForm {
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
  tags?: string[];
}

// UI Component types
export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  children?: MenuItem[];
  badge?: string | number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
    borderWidth?: number;
  }[];
}

// Filter and search types
export interface SearchFilters {
  query?: string;
  tags?: string[];
  platform?: string;
  type?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

// Theme types
export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  mode: Theme;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}