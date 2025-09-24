import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  canceledAt?: Date;
  pausedAt?: Date;
  paymentMethod: IPaymentMethod;
  usage: IUsage;
  limits: IPlanLimits;
  addons: IAddon[];
  metadata: {
    source: string;
    campaign?: string;
    referralCode?: string;
    promoCode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IPaymentMethod {
  type: 'card' | 'paypal' | 'bank' | 'crypto';
  id: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface IUsage {
  aiGenerations: {
    current: number;
    limit: number;
    resetDate: Date;
  };
  contentPieces: {
    current: number;
    limit: number;
    resetDate: Date;
  };
  apiCalls: {
    current: number;
    limit: number;
    resetDate: Date;
  };
  storage: {
    current: number; // in MB
    limit: number; // in MB
  };
  teamMembers: {
    current: number;
    limit: number;
  };
  platforms: {
    current: number;
    limit: number;
  };
}

interface IPlanLimits {
  aiGenerations: number;
  contentPieces: number;
  apiCalls: number;
  storage: number; // in MB
  teamMembers: number;
  platforms: number;
  features: string[];
  prioritySupport: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  customIntegrations: boolean;
  advancedAnalytics: boolean;
  enterpriseFeatures: boolean;
}

interface IAddon {
  id: string;
  name: string;
  type: 'ai_credits' | 'storage' | 'team_members' | 'platforms' | 'api_access';
  quantity: number;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'one_time';
  status: 'active' | 'cancelled';
  addedAt: Date;
  expiresAt?: Date;
}

const SubscriptionSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'team', 'enterprise'],
    default: 'free',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'suspended'],
    default: 'active',
    index: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  trialEnd: Date,
  canceledAt: Date,
  pausedAt: Date,
  paymentMethod: {
    type: {
      type: String,
      enum: ['card', 'paypal', 'bank', 'crypto'],
      required: true
    },
    id: {
      type: String,
      required: true
    },
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    isDefault: {
      type: Boolean,
      default: true
    }
  },
  usage: {
    aiGenerations: {
      current: {
        type: Number,
        default: 0
      },
      limit: {
        type: Number,
        default: 100
      },
      resetDate: Date
    },
    contentPieces: {
      current: {
        type: Number,
        default: 0
      },
      limit: {
        type: Number,
        default: 100
      },
      resetDate: Date
    },
    apiCalls: {
      current: {
        type: Number,
        default: 0
      },
      limit: {
        type: Number,
        default: 1000
      },
      resetDate: Date
    },
    storage: {
      current: {
        type: Number,
        default: 0
      },
      limit: {
        type: Number,
        default: 1024 // 1GB
      },
      unit: {
        type: String,
        enum: ['MB', 'GB'],
        default: 'MB'
      }
    },
    teamMembers: {
      current: {
        type: Number,
        default: 1
      },
      limit: {
        type: Number,
        default: 1
      }
    },
    platforms: {
      current: {
        type: Number,
        default: 1
      },
      limit: {
        type: Number,
        default: 1
      }
    }
  },
  limits: {
    aiGenerations: {
      type: Number,
      default: 100
    },
    contentPieces: {
      type: Number,
      default: 100
    },
    apiCalls: {
      type: Number,
      default: 1000
    },
    storage: {
      type: Number,
      default: 1024 // 1GB
    },
    teamMembers: {
      type: Number,
      default: 1
    },
    platforms: {
      type: Number,
      default: 1
    },
    features: [{
      type: String
    }],
    prioritySupport: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    customIntegrations: {
      type: Boolean,
      default: false
    },
    advancedAnalytics: {
      type: Boolean,
      default: false
    },
    enterpriseFeatures: {
      type: Boolean,
      default: false
    }
  },
  addons: [{
    id: String,
    name: String,
    type: {
      type: String,
      enum: ['ai_credits', 'storage', 'team_members', 'platforms', 'api_access']
    },
    quantity: {
      type: Number,
      default: 1
    },
    price: Number,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'one_time'],
      default: 'monthly'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  metadata: {
    source: {
      type: String,
      default: 'web'
    },
    campaign: String,
    referralCode: String,
    promoCode: String
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
SubscriptionSchema.index({ status: 1, plan: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 });
SubscriptionSchema.index({ 'addons.status': 1 });

// Virtual fields
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && (!this.canceledAt || this.canceledAt > new Date());
});

SubscriptionSchema.virtual('isOnTrial').get(function() {
  return this.trialEnd && this.trialEnd > new Date();
});

SubscriptionSchema.virtual('daysUntilRenewal').get(function() {
  const now = new Date();
  const renewalDate = this.currentPeriodEnd;
  const diffTime = renewalDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

SubscriptionSchema.virtual('usagePercentage').get(function() {
  const totalLimit = this.limits.aiGenerations + this.limits.contentPieces + this.limits.apiCalls;
  const totalUsed = this.usage.aiGenerations.current + this.usage.contentPieces.current + this.usage.apiCalls.current;
  return totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;
});

SubscriptionSchema.virtual('nextBillingDate').get(function() {
  if (this.status === 'cancelled' && this.canceledAt) {
    return this.canceledAt;
  }
  return this.currentPeriodEnd;
});

SubscriptionSchema.virtual('renewalAmount').get(function() {
  // This would calculate the next billing amount based on plan and addons
  const planPrices = {
    free: 0,
    pro: this.billingCycle === 'yearly' ? 190 : 19,
    team: this.billingCycle === 'yearly' ? 490 : 49,
    enterprise: 0 // Custom pricing
  };

  let total = planPrices[this.plan] || 0;

  // Add addon costs
  this.addons.forEach(addon => {
    if (addon.status === 'active') {
      if (addon.billingCycle === this.billingCycle || addon.billingCycle === 'one_time') {
        total += addon.price * addon.quantity;
      }
    }
  });

  return total;
});

// Methods
SubscriptionSchema.methods.canUseFeature = function(feature: string) {
  return this.limits.features.includes(feature);
};

SubscriptionSchema.methods.hasCapacity = function(type: keyof IUsage, amount = 1) {
  const usageData = this.usage[type];
  return usageData.current + amount <= usageData.limit;
};

SubscriptionSchema.methods.useResource = function(type: keyof IUsage, amount = 1) {
  if (!this.hasCapacity(type, amount)) {
    throw new Error(`Insufficient ${type} capacity`);
  }

  this.usage[type].current += amount;
  return this.save();
};

SubscriptionSchema.methods.resetUsage = function(type?: keyof IUsage) {
  if (type) {
    this.usage[type].current = 0;
  } else {
    // Reset all usage
    Object.keys(this.usage).forEach(key => {
      this.usage[key].current = 0;
    });
  }
  return this.save();
};

SubscriptionSchema.methods.upgradePlan = function(newPlan: 'free' | 'pro' | 'team' | 'enterprise') {
  if (newPlan === this.plan) {
    return this;
  }

  this.plan = newPlan;
  this.status = 'active';
  this.canceledAt = undefined;

  // Update limits based on new plan
  this.updateLimitsForPlan(newPlan);

  return this.save();
};

SubscriptionSchema.methods.updateLimitsForPlan = function(plan: 'free' | 'pro' | 'team' | 'enterprise') {
  const planLimits = {
    free: {
      aiGenerations: 100,
      contentPieces: 100,
      apiCalls: 1000,
      storage: 1024, // 1GB
      teamMembers: 1,
      platforms: 1,
      features: ['basic_ai', 'twitter_integration', 'basic_analytics'],
      prioritySupport: false,
      whiteLabel: false,
      apiAccess: false,
      customIntegrations: false,
      advancedAnalytics: false,
      enterpriseFeatures: false
    },
    pro: {
      aiGenerations: -1, // Unlimited
      contentPieces: -1,
      apiCalls: 10000,
      storage: 10240, // 10GB
      teamMembers: 1,
      platforms: 3,
      features: ['basic_ai', 'twitter_integration', 'basic_analytics', 'advanced_ai', 'multi_platform', 'team_collaboration'],
      prioritySupport: true,
      whiteLabel: false,
      apiAccess: true,
      customIntegrations: false,
      advancedAnalytics: true,
      enterpriseFeatures: false
    },
    team: {
      aiGenerations: -1,
      contentPieces: -1,
      apiCalls: 50000,
      storage: 51200, // 50GB
      teamMembers: 10,
      platforms: 5,
      features: ['basic_ai', 'twitter_integration', 'basic_analytics', 'advanced_ai', 'multi_platform', 'team_collaboration', 'admin_controls', 'custom_templates'],
      prioritySupport: true,
      whiteLabel: false,
      apiAccess: true,
      customIntegrations: true,
      advancedAnalytics: true,
      enterpriseFeatures: false
    },
    enterprise: {
      aiGenerations: -1,
      contentPieces: -1,
      apiCalls: -1,
      storage: -1,
      teamMembers: -1,
      platforms: -1,
      features: ['basic_ai', 'twitter_integration', 'basic_analytics', 'advanced_ai', 'multi_platform', 'team_collaboration', 'admin_controls', 'custom_templates', 'white_label', 'enterprise_security', 'custom_integrations', 'priority_support', 'advanced_analytics', 'enterprise_features'],
      prioritySupport: true,
      whiteLabel: true,
      apiAccess: true,
      customIntegrations: true,
      advancedAnalytics: true,
      enterpriseFeatures: true
    }
  };

  this.limits = planLimits[plan];

  // Update usage limits
  Object.keys(this.usage).forEach(key => {
    if (this.limits[key] !== -1) {
      this.usage[key].limit = this.limits[key];
    }
  });
};

// Pre-save middleware
SubscriptionSchema.pre('save', function(next) {
  // Auto-expire subscription if period ended
  if (this.currentPeriodEnd < new Date() && this.status === 'active') {
    this.status = 'expired';
  }

  // Auto-cancel if trial ended and no payment method
  if (this.trialEnd && this.trialEnd < new Date() && !this.paymentMethod.id) {
    this.status = 'cancelled';
  }

  next();
});

// Static methods
SubscriptionSchema.statics.findExpiringSubscriptions = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    status: 'active',
    currentPeriodEnd: {
      $gte: new Date(),
      $lte: futureDate
    }
  });
};

SubscriptionSchema.statics.findHighUsageSubscriptions = function(usageThreshold = 80) {
  return this.find({
    status: 'active',
    $or: [
      { 'usage.aiGenerations.current': { $gte: this.limits.aiGenerations * usageThreshold / 100 } },
      { 'usage.contentPieces.current': { $gte: this.limits.contentPieces * usageThreshold / 100 } },
      { 'usage.apiCalls.current': { $gte: this.limits.apiCalls * usageThreshold / 100 } }
    ]
  });
};

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);