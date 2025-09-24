import mongoose, { Schema, Document } from 'mongoose';

export interface IAudienceSegment extends Document {
  name: string;
  description: string;
  criteria: {
    demographics?: {
      ageRange?: [number, number];
      gender?: string[];
      location?: string[];
      language?: string[];
    };
    professional?: {
      industry?: string[];
      jobTitle?: string[];
      companySize?: string[];
      experience?: string[];
    };
    behavioral?: {
      interests?: string[];
      onlineActivities?: string[];
      purchaseBehavior?: string[];
      deviceUsage?: string[];
    };
    psychographic?: {
      values?: string[];
      lifestyle?: string[];
      personality?: string[];
      attitudes?: string[];
    };
  };
  estimatedSize: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketingContent extends Document {
  type: 'email' | 'social' | 'blog' | 'video' | 'infographic' | 'webinar' | 'case_study' | 'whitepaper';
  title: string;
  description: string;
  content: string;
  assets: {
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    description?: string;
    altText?: string;
  }[];
  callToAction: {
    text: string;
    url: string;
    trackingId: string;
  };
  targeting: {
    audienceSegments: string[];
    personas: string[];
    keywords: string[];
  };
  performance: {
    views: number;
    clicks: number;
    conversions: number;
    engagement: number;
    shares: number;
    likes: number;
    comments: number;
  };
  aBTest?: {
    variant: 'A' | 'B';
    testId: string;
    performance: {
      views: number;
      clicks: number;
      conversions: number;
    };
  };
  status: 'draft' | 'ready' | 'published' | 'archived';
  publishedAt?: Date;
  createdBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketingChannel extends Document {
  name: string;
  type: 'email' | 'social' | 'search' | 'display' | 'content' | 'affiliate' | 'events';
  platform: string;
  config: {
    apiKey?: string;
    accountId?: string;
    webhookUrl?: string;
    settings: Record<string, any>;
  };
  capabilities: string[];
  audience: {
    estimatedReach: number;
    demographics: Record<string, any>;
    engagement: number;
  };
  performance: {
    avgCTR: number;
    avgCPC: number;
    avgCPM: number;
    conversionRate: number;
    roi: number;
  };
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICampaignTimeline extends Document {
  phase: string;
  startDate: Date;
  endDate: Date;
  milestones: {
    name: string;
    date: Date;
    completed: boolean;
    notes?: string;
  }[];
  dependencies?: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketingCampaign extends Document {
  name: string;
  description: string;
  type: 'awareness' | 'acquisition' | 'conversion' | 'retention' | 'advocacy';
  category: 'product_launch' | 'beta_program' | 'feature_announcement' | 'educational' | 'promotional';
  objectives: {
    primary: string;
    secondary: string[];
  };
  targetAudience: string[]; // IAudienceSegment IDs
  targetPersonas: string[];
  content: string[]; // IMarketingContent IDs
  channels: string[]; // IMarketingChannel IDs
  budget: {
    total: number;
    allocated: {
      channel: string;
      amount: number;
      percentage: number;
    }[];
    spent: number;
    remaining: number;
    currency: string;
  };
  timeline: ICampaignTimeline[];
  keyMetrics: {
    reach: number;
    engagement: number;
    conversions: number;
    revenue: number;
    roi: number;
  };
  targeting: {
    geographies: string[];
    languages: string[];
    devices: string[];
    timezones: string[];
  };
  tracking: {
    utmParameters: {
      source: string;
      medium: string;
      campaign: string;
      content?: string;
      term?: string;
    };
    conversionGoals: string[];
    kpis: string[];
  };
  status: 'draft' | 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  createdBy: string;
  managedBy: string[];
  reviewedBy?: string;
  approvedBy?: string;
  collaborators: string[];
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AudienceSegmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  criteria: {
    demographics: {
      ageRange: [Number],
      gender: [String],
      location: [String],
      language: [String]
    },
    professional: {
      industry: [String],
      jobTitle: [String],
      companySize: [String],
      experience: [String]
    },
    behavioral: {
      interests: [String],
      onlineActivities: [String],
      purchaseBehavior: [String],
      deviceUsage: [String]
    },
    psychographic: {
      values: [String],
      lifestyle: [String],
      personality: [String],
      attitudes: [String]
    }
  },
  estimatedSize: {
    type: Number,
    required: true,
    min: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const MarketingContentSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ['email', 'social', 'blog', 'video', 'infographic', 'webinar', 'case_study', 'whitepaper'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  assets: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'audio'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    altText: {
      type: String,
      trim: true
    }
  }],
  callToAction: {
    text: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    trackingId: {
      type: String,
      required: true,
      trim: true
    }
  },
  targeting: {
    audienceSegments: [{
      type: String,
      ref: 'AudienceSegment'
    }],
    personas: [{
      type: String,
      trim: true
    }],
    keywords: [{
      type: String,
      trim: true
    }]
  },
  performance: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    }
  },
  aBTest: {
    variant: {
      type: String,
      enum: ['A', 'B']
    },
    testId: {
      type: String,
      trim: true
    },
    performance: {
      views: {
        type: Number,
        default: 0
      },
      clicks: {
        type: Number,
        default: 0
      },
      conversions: {
        type: Number,
        default: 0
      }
    }
  },
  status: {
    type: String,
    enum: ['draft', 'ready', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  createdBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  approvedBy: {
    type: String,
    ref: 'User'
  },
  scheduledAt: {
    type: Date
  }
}, {
  timestamps: true
});

const MarketingChannelSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['email', 'social', 'search', 'display', 'content', 'affiliate', 'events'],
    required: true
  },
  platform: {
    type: String,
    required: true,
    trim: true
  },
  config: {
    apiKey: {
      type: String,
      trim: true
    },
    accountId: {
      type: String,
      trim: true
    },
    webhookUrl: {
      type: String,
      trim: true
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  capabilities: [{
    type: String,
    trim: true
  }],
  audience: {
    estimatedReach: {
      type: Number,
      default: 0
    },
    demographics: {
      type: Schema.Types.Mixed,
      default: {}
    },
    engagement: {
      type: Number,
      default: 0
    }
  },
  performance: {
    avgCTR: {
      type: Number,
      default: 0
    },
    avgCPC: {
      type: Number,
      default: 0
    },
    avgCPM: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  lastSyncAt: {
    type: Date
  }
}, {
  timestamps: true
});

const CampaignTimelineSchema: Schema = new Schema({
  phase: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  milestones: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  dependencies: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'delayed'],
    default: 'planned'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

const MarketingCampaignSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['awareness', 'acquisition', 'conversion', 'retention', 'advocacy'],
    required: true
  },
  category: {
    type: String,
    enum: ['product_launch', 'beta_program', 'feature_announcement', 'educational', 'promotional'],
    required: true
  },
  objectives: {
    primary: {
      type: String,
      required: true,
      trim: true
    },
    secondary: [{
      type: String,
      trim: true
    }]
  },
  targetAudience: [{
    type: String,
    ref: 'AudienceSegment'
  }],
  targetPersonas: [{
    type: String,
    trim: true
  }],
  content: [{
    type: String,
    ref: 'MarketingContent'
  }],
  channels: [{
    type: String,
    ref: 'MarketingChannel'
  }],
  budget: {
    total: {
      type: Number,
      required: true,
      min: 0
    },
    allocated: [{
      channel: {
        type: String,
        ref: 'MarketingChannel'
      },
      amount: {
        type: Number,
        required: true
      },
      percentage: {
        type: Number,
        required: true
      }
    }],
    spent: {
      type: Number,
      default: 0
    },
    remaining: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true
    }
  },
  timeline: [CampaignTimelineSchema],
  keyMetrics: {
    reach: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    roi: {
      type: Number,
      default: 0
    }
  },
  targeting: {
    geographies: [{
      type: String,
      trim: true
    }],
    languages: [{
      type: String,
      trim: true
    }],
    devices: [{
      type: String,
      trim: true
    }],
    timezones: [{
      type: String,
      trim: true
    }]
  },
  tracking: {
    utmParameters: {
      source: {
        type: String,
        required: true,
        trim: true
      },
      medium: {
        type: String,
        required: true,
        trim: true
      },
      campaign: {
        type: String,
        required: true,
        trim: true
      },
      content: {
        type: String,
        trim: true
      },
      term: {
        type: String,
        trim: true
      }
    },
    conversionGoals: [{
      type: String,
      trim: true
    }],
    kpis: [{
      type: String,
      trim: true
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'planned', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  createdBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  managedBy: [{
    type: String,
    ref: 'User'
  }],
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  approvedBy: {
    type: String,
    ref: 'User'
  },
  collaborators: [{
    type: String,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
AudienceSegmentSchema.index({ isActive: 1 });
AudienceSegmentSchema.index({ priority: 1 });
AudienceSegmentSchema.index({ tags: 1 });

MarketingContentSchema.index({ type: 1 });
MarketingContentSchema.index({ status: 1 });
MarketingContentSchema.index({ createdBy: 1 });
MarketingContentSchema.index({ publishedAt: -1 });

MarketingChannelSchema.index({ type: 1 });
MarketingChannelSchema.index({ platform: 1 });
MarketingChannelSchema.index({ isActive: 1 });
MarketingChannelSchema.index({ isConnected: 1 });

MarketingCampaignSchema.index({ type: 1 });
MarketingCampaignSchema.index({ category: 1 });
MarketingCampaignSchema.index({ status: 1 });
MarketingCampaignSchema.index({ startDate: 1 });
MarketingCampaignSchema.index({ createdBy: 1 });
MarketingCampaignSchema.index({ tags: 1 });

// Virtual for calculated fields
MarketingContentSchema.virtual('ctr').get(function() {
  return this.performance.views > 0 ? (this.performance.clicks / this.performance.views) * 100 : 0;
});

MarketingContentSchema.virtual('conversionRate').get(function() {
  return this.performance.clicks > 0 ? (this.performance.conversions / this.performance.clicks) * 100 : 0;
});

MarketingCampaignSchema.virtual('budgetUtilization').get(function() {
  return this.budget.total > 0 ? (this.budget.spent / this.budget.total) * 100 : 0;
});

MarketingCampaignSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

MarketingCampaignSchema.virtual('isActiveCampaign').get(function() {
  const now = new Date();
  return this.status === 'active' && now >= this.startDate && now <= this.endDate;
});

// Pre-save middleware
MarketingCampaignSchema.pre('save', function(next) {
  // Calculate remaining budget
  this.budget.remaining = this.budget.total - this.budget.spent;

  // Update timeline progress
  if (this.timeline.length > 0) {
    const totalPhases = this.timeline.length;
    const completedPhases = this.timeline.filter(phase => phase.status === 'completed').length;
    const avgProgress = this.timeline.reduce((sum, phase) => sum + phase.progress, 0) / totalPhases;
    this.timeline[0].progress = Math.round(avgProgress);
  }

  next();
});

// Static methods
AudienceSegmentSchema.statics.getActiveSegments = function() {
  return this.find({ isActive: true }).sort({ priority: -1 });
};

MarketingContentSchema.statics.getPublishedContent = function() {
  return this.find({ status: 'published' })
    .populate('createdBy', 'name email')
    .sort({ publishedAt: -1 });
};

MarketingChannelSchema.statics.getActiveChannels = function() {
  return this.find({ isActive: true, isConnected: true });
};

MarketingCampaignSchema.statics.getActiveCampaigns = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  })
    .populate('targetAudience channels content createdBy managedBy')
    .sort({ startDate: 1 });
};

MarketingCampaignSchema.statics.getCampaignsByType = function(type: string) {
  return this.find({ type })
    .populate('targetAudience channels content createdBy')
    .sort({ createdAt: -1 });
};

MarketingCampaignSchema.statics.getUpcomingCampaigns = function() {
  const now = new Date();
  return this.find({
    status: { $in: ['planned', 'active'] },
    startDate: { $gte: now }
  })
    .populate('targetAudience channels content createdBy')
    .sort({ startDate: 1 });
};

// Instance methods
MarketingCampaignSchema.methods.calculateROI = function() {
  const revenue = this.keyMetrics.revenue;
  const spent = this.budget.spent;
  this.keyMetrics.roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
  return this.save();
};

MarketingCampaignSchema.methods.updateSpend = function(amount: number) {
  this.budget.spent += amount;
  this.budget.remaining = this.budget.total - this.budget.spent;
  return this.save();
};

MarketingCampaignSchema.methods.launch = function() {
  this.status = 'active';
  return this.save();
};

MarketingCampaignSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

MarketingCampaignSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

export const AudienceSegment = mongoose.model<IAudienceSegment>('AudienceSegment', AudienceSegmentSchema);
export const MarketingContent = mongoose.model<IMarketingContent>('MarketingContent', MarketingContentSchema);
export const MarketingChannel = mongoose.model<IMarketingChannel>('MarketingChannel', MarketingChannelSchema);
export const MarketingCampaign = mongoose.model<IMarketingCampaign>('MarketingCampaign', MarketingCampaignSchema);