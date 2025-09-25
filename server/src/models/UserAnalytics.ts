import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionData extends Document {
  sessionId: string;
  userId: string;
  betaUserId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  pageViews: IPageView[];
  events: IAnalyticsEvent[];
  deviceInfo: IDeviceInfo;
  location?: ILocationInfo;
  referrer?: string;
  utmParameters?: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
  };
  isMobile: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPageView extends Document {
  sessionId: string;
  userId?: string;
  path: string;
  title: string;
  timestamp: Date;
  duration?: number; // in seconds
  scrollDepth?: number; // percentage
  referrer?: string;
  metadata?: {
    contentId?: string;
    category?: string;
    tags?: string[];
  };
}

export interface IAnalyticsEvent extends Document {
  sessionId: string;
  userId?: string;
  type: 'click' | 'view' | 'scroll' | 'form_submit' | 'navigation' | 'error' | 'custom';
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface IFeatureUsage extends Document {
  userId: string;
  betaUserId?: string;
  featureId: string;
  featureName: string;
  category: string;
  usageCount: number;
  lastUsed: Date;
  firstUsed: Date;
  usageDuration: number; // total time spent in minutes
  interactions: {
    type: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }[];
  successRate?: number; // percentage
  errorCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBehaviorMetrics extends Document {
  userId: string;
  betaUserId?: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: {
    sessionCount: number;
    totalDuration: number; // in minutes
    pageViews: number;
    events: number;
    featureUsage: number;
    errorRate: number;
    bounceRate: number;
    retentionRate: number;
    conversionRate?: number;
  };
  topFeatures: {
    featureId: string;
    featureName: string;
    usageCount: number;
  }[];
  behaviorPattern: {
    mostActiveTime: string;
    preferredDevices: string[];
    commonPaths: string[];
    dropOffPoints: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversionData extends Document {
  userId: string;
  betaUserId?: string;
  conversionType: 'registration' | 'beta_signup' | 'feature_adoption' | 'upgrade' | 'referral';
  conversionGoal: string;
  conversionDate: Date;
  conversionValue?: number;
  conversionSource: {
    channel: string;
    campaign?: string;
    content?: string;
    referrer?: string;
  };
  conversionPath: {
    steps: {
      step: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    }[];
    totalTime: number; // in minutes
    touchpoints: number;
  };
  attribution: {
    firstTouch: string;
    lastTouch: string;
    linear: string[];
    timeDecay: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IFunnelStep extends Document {
  funnelId: string;
  name: string;
  description: string;
  order: number;
  users: number;
  conversionRate: number; // percentage
  dropOffRate: number; // percentage
  averageTime: number; // in minutes
  conditions: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface IFunnelAnalysis extends Document {
  name: string;
  description: string;
  type: 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral';
  steps: IFunnelStep[];
  totalUsers: number;
  totalConversions: number;
  overallConversionRate: number;
  averageTimeToConvert: number; // in minutes
  dropOffPoints: {
    step: number;
    dropOffRate: number;
    reasons: string[];
  }[];
  segments: {
    segment: string;
    conversionRate: number;
    users: number;
  }[];
  period: {
    startDate: Date;
    endDate: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRetentionMetrics extends Document {
  userId: string;
  betaUserId?: string;
  cohort: string; // registration date cohort
  period: number; // days since registration
  retentionRate: number; // percentage
  activeUsers: number;
  totalUsers: number;
  metrics: {
    sessionCount: number;
    featureUsage: number;
    timeSpent: number;
    conversionEvents: number;
  };
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  lastActive: Date;
  predictedChurnDate?: Date;
  interventions: {
    type: string;
    date: Date;
    effectiveness?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenResolution: string;
  viewportSize: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  connectionSpeed?: number;
}

export interface ILocationInfo {
  country: string;
  region: string;
  city: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Schema definitions
const SessionDataSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  betaUserId: {
    type: String,
    ref: 'BetaUser'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number
  },
  pageViews: [{
    type: Schema.Types.ObjectId,
    ref: 'PageView'
  }],
  events: [{
    type: Schema.Types.ObjectId,
    ref: 'AnalyticsEvent'
  }],
  deviceInfo: {
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true
    },
    browser: {
      type: String,
      required: true
    },
    browserVersion: {
      type: String,
      required: true
    },
    os: {
      type: String,
      required: true
    },
    osVersion: {
      type: String,
      required: true
    },
    screenResolution: {
      type: String,
      required: true
    },
    viewportSize: {
      type: String,
      required: true
    },
    deviceMemory: Number,
    hardwareConcurrency: Number,
    connectionType: {
      type: String,
      enum: ['wifi', 'cellular', 'ethernet', 'unknown']
    },
    connectionSpeed: Number
  },
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  referrer: String,
  utmParameters: {
    source: String,
    medium: String,
    campaign: String,
    content: String,
    term: String
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const PageViewSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    ref: 'SessionData'
  },
  userId: {
    type: String,
    ref: 'User'
  },
  path: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: Number,
  scrollDepth: {
    type: Number,
    min: 0,
    max: 100
  },
  referrer: String,
  metadata: {
    contentId: String,
    category: String,
    tags: [String]
  }
});

const AnalyticsEventSchema: Schema = new Schema({
  sessionId: {
    type: String,
    required: true,
    ref: 'SessionData'
  },
  userId: {
    type: String,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['click', 'view', 'scroll', 'form_submit', 'navigation', 'error', 'custom'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  label: String,
  value: Number,
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const FeatureUsageSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  betaUserId: {
    type: String,
    ref: 'BetaUser'
  },
  featureId: {
    type: String,
    required: true
  },
  featureName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  usageCount: {
    type: Number,
    default: 1
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  firstUsed: {
    type: Date,
    default: Date.now
  },
  usageDuration: {
    type: Number,
    default: 0
  },
  interactions: [{
    type: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  }],
  successRate: {
    type: Number,
    min: 0,
    max: 100
  },
  errorCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const BehaviorMetricsSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  betaUserId: {
    type: String,
    ref: 'BetaUser'
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  metrics: {
    sessionCount: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    pageViews: {
      type: Number,
      default: 0
    },
    events: {
      type: Number,
      default: 0
    },
    featureUsage: {
      type: Number,
      default: 0
    },
    errorRate: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    },
    retentionRate: {
      type: Number,
      default: 0
    },
    conversionRate: Number
  },
  topFeatures: [{
    featureId: {
      type: String,
      required: true
    },
    featureName: {
      type: String,
      required: true
    },
    usageCount: {
      type: Number,
      default: 0
    }
  }],
  behaviorPattern: {
    mostActiveTime: String,
    preferredDevices: [String],
    commonPaths: [String],
    dropOffPoints: [String]
  }
}, {
  timestamps: true
});

const ConversionDataSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  betaUserId: {
    type: String,
    ref: 'BetaUser'
  },
  conversionType: {
    type: String,
    enum: ['registration', 'beta_signup', 'feature_adoption', 'upgrade', 'referral'],
    required: true
  },
  conversionGoal: {
    type: String,
    required: true
  },
  conversionDate: {
    type: Date,
    default: Date.now
  },
  conversionValue: Number,
  conversionSource: {
    channel: {
      type: String,
      required: true
    },
    campaign: String,
    content: String,
    referrer: String
  },
  conversionPath: {
    steps: [{
      step: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        required: true
      },
      metadata: {
        type: Schema.Types.Mixed,
        default: {}
      }
    }],
    totalTime: {
      type: Number,
      default: 0
    },
    touchpoints: {
      type: Number,
      default: 0
    }
  },
  attribution: {
    firstTouch: String,
    lastTouch: String,
    linear: [String],
    timeDecay: [String]
  }
}, {
  timestamps: true
});

const FunnelStepSchema: Schema = new Schema({
  funnelId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  users: {
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  dropOffRate: {
    type: Number,
    default: 0
  },
  averageTime: {
    type: Number,
    default: 0
  },
  conditions: {
    type: Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

const FunnelAnalysisSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['acquisition', 'activation', 'retention', 'revenue', 'referral'],
    required: true
  },
  steps: [FunnelStepSchema],
  totalUsers: {
    type: Number,
    default: 0
  },
  totalConversions: {
    type: Number,
    default: 0
  },
  overallConversionRate: {
    type: Number,
    default: 0
  },
  averageTimeToConvert: {
    type: Number,
    default: 0
  },
  dropOffPoints: [{
    step: {
      type: Number,
      required: true
    },
    dropOffRate: {
      type: Number,
      required: true
    },
    reasons: [String]
  }],
  segments: [{
    segment: {
      type: String,
      required: true
    },
    conversionRate: {
      type: Number,
      required: true
    },
    users: {
      type: Number,
      required: true
    }
  }],
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const RetentionMetricsSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  betaUserId: {
    type: String,
    ref: 'BetaUser'
  },
  cohort: {
    type: String,
    required: true
  },
  period: {
    type: Number,
    required: true
  },
  retentionRate: {
    type: Number,
    default: 0
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  totalUsers: {
    type: Number,
    default: 0
  },
  metrics: {
    sessionCount: {
      type: Number,
      default: 0
    },
    featureUsage: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    conversionEvents: {
      type: Number,
      default: 0
    }
  },
  churnRisk: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  predictedChurnDate: Date,
  interventions: [{
    type: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    effectiveness: Number
  }]
}, {
  timestamps: true
});

// Indexes for performance
SessionDataSchema.index({ userId: 1, startTime: -1 });
SessionDataSchema.index({ sessionId: 1 });
SessionDataSchema.index({ isActive: 1 });
SessionDataSchema.index({ 'deviceInfo.deviceType': 1 });

PageViewSchema.index({ sessionId: 1, timestamp: -1 });
PageViewSchema.index({ path: 1, timestamp: -1 });
PageViewSchema.index({ userId: 1, timestamp: -1 });

AnalyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ type: 1, category: 1, timestamp: -1 });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });

FeatureUsageSchema.index({ userId: 1, lastUsed: -1 });
FeatureUsageSchema.index({ featureId: 1 });
FeatureUsageSchema.index({ category: 1 });

BehaviorMetricsSchema.index({ userId: 1, period: 1, startDate: -1 });
BehaviorMetricsSchema.index({ period: 1, startDate: -1 });

ConversionDataSchema.index({ userId: 1, conversionDate: -1 });
ConversionDataSchema.index({ conversionType: 1, conversionDate: -1 });

FunnelAnalysisSchema.index({ type: 1, isActive: 1 });
FunnelAnalysisSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });

RetentionMetricsSchema.index({ userId: 1, period: 1 });
RetentionMetricsSchema.index({ cohort: 1, period: 1 });
RetentionMetricsSchema.index({ churnRisk: 1, lastActive: -1 });

// Export models
export const SessionData = mongoose.model<ISessionData>('SessionData', SessionDataSchema);
export const PageView = mongoose.model<IPageView>('PageView', PageViewSchema);
export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
export const FeatureUsage = mongoose.model<IFeatureUsage>('FeatureUsage', FeatureUsageSchema);
export const BehaviorMetrics = mongoose.model<IBehaviorMetrics>('BehaviorMetrics', BehaviorMetricsSchema);
export const ConversionData = mongoose.model<IConversionData>('ConversionData', ConversionDataSchema);
export const FunnelAnalysis = mongoose.model<IFunnelAnalysis>('FunnelAnalysis', FunnelAnalysisSchema);
export const RetentionMetrics = mongoose.model<IRetentionMetrics>('RetentionMetrics', RetentionMetricsSchema);

// Export namespace for analytics models
export const UserAnalytics = {
  SessionData,
  PageView,
  AnalyticsEvent,
  FeatureUsage,
  BehaviorMetrics,
  ConversionData,
  FunnelAnalysis,
  RetentionMetrics
};