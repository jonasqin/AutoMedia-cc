import mongoose, { Schema } from 'mongoose';

const PlatformConnectionSchema = new Schema({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Platform name is required'],
    trim: true,
    maxlength: [50, 'Platform name cannot exceed 50 characters'],
  },
  platform: {
    type: String,
    required: [true, 'Platform type is required'],
    enum: ['twitter', 'xiaohongshu', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin'],
  },
  config: {
    apiKey: {
      type: String,
    },
    apiSecret: {
      type: String,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    webhookUrl: {
      type: String,
    },
    webhookSecret: {
      type: String,
    },
    appId: {
      type: String,
    },
    appSecret: {
      type: String,
    },
    additionalConfig: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error', 'needs_reauth'],
    default: 'inactive',
  },
  rateLimit: {
    remaining: {
      type: Number,
      default: 0,
    },
    reset: {
      type: Date,
    },
    limit: {
      type: Number,
      default: 0,
    },
  },
  accountInfo: {
    id: {
      type: String,
      required: [true, 'Account ID is required'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
    },
    avatar: {
      type: String,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
    },
    location: {
      type: String,
    },
    website: {
      type: String,
    },
    joinedAt: {
      type: Date,
    },
  },
  permissions: {
    canRead: {
      type: Boolean,
      default: true,
    },
    canWrite: {
      type: Boolean,
      default: false,
    },
    canDelete: {
      type: Boolean,
      default: false,
    },
    canManage: {
      type: Boolean,
      default: false,
    },
  },
  monitoring: {
    enabled: {
      type: Boolean,
      default: false,
    },
    topics: [{
      type: String,
    }],
    keywords: [{
      type: String,
    }],
    hashtags: [{
      type: String,
    }],
    accounts: [{
      type: String,
    }],
    languages: [{
      type: String,
      enum: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'ar'],
    }],
    locations: [{
      type: String,
    }],
    lastSyncAt: {
      type: Date,
    },
    nextSyncAt: {
      type: Date,
    },
  },
  statistics: {
    totalCollected: {
      type: Number,
      default: 0,
    },
    lastCollectedAt: {
      type: Date,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
    },
    avgResponseTime: {
      type: Number,
      default: 0,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUsedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Ensure unique platform connections per user per platform
PlatformConnectionSchema.index({ userId: 1, platform: 1 }, { unique: true });

// Indexes for performance
PlatformConnectionSchema.index({ userId: 1, status: 1, isActive: 1 });
PlatformConnectionSchema.index({ platform: 1, status: 1 });
PlatformConnectionSchema.index({ 'accountInfo.id': 1 });
PlatformConnectionSchema.index({ 'monitoring.enabled': 1 });
PlatformConnectionSchema.index({ expiresAt: 1 });

// Virtual for isExpired
PlatformConnectionSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for needsReauth
PlatformConnectionSchema.virtual('needsReauth').get(function() {
  return this.status === 'needs_reauth' || (this.expiresAt && this.expiresAt < new Date());
});

// Virtual for formatted account info
PlatformConnectionSchema.virtual('formattedAccount').get(function() {
  if (this.accountInfo) {
    return `${this.accountInfo.displayName} (@${this.accountInfo.username})`;
  }
  return 'Unknown Account';
});

// Virtual for monitoring status
PlatformConnectionSchema.virtual('monitoringStatus').get(function() {
  if (!this.monitoring) return 'disabled';
  if (!this.monitoring.enabled) return 'disabled';
  if (this.monitoring.nextSyncAt && this.monitoring.nextSyncAt < new Date()) return 'overdue';
  return 'active';
});

// Pre-save middleware to update lastUsedAt
PlatformConnectionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active') {
    this.lastUsedAt = new Date();
  }
  next();
});

// Pre-save middleware to handle expiration
PlatformConnectionSchema.pre('save', function(next) {
  // Set expiration based on platform (typically 30-90 days for most platforms)
  if (!this.expiresAt && this.config && this.config.accessToken) {
    const expirationDays = {
      twitter: 90,
      facebook: 60,
      instagram: 60,
      tiktok: 30,
      xiaohongshu: 90,
      youtube: 90,
      linkedin: 60,
    };
    const days = expirationDays[this.platform] || 60;
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  next();
});

export const PlatformConnection = mongoose.model('PlatformConnection', PlatformConnectionSchema);