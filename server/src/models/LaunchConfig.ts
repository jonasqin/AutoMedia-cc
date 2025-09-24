import mongoose, { Schema, Document } from 'mongoose';

export interface ILaunchConfig extends Document {
  name: string;
  description: string;
  status: 'planning' | 'ready' | 'active' | 'completed' | 'paused';
  launchDate: Date;
  phases: ILaunchPhase[];
  metrics: ILaunchMetrics;
  budget: ILaunchBudget;
  team: ILaunchTeam;
  infrastructure: ILaunchInfrastructure;
  marketing: ILaunchMarketing;
  createdAt: Date;
  updatedAt: Date;
}

interface ILaunchPhase {
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startDate: Date;
  endDate: Date;
  tasks: ILaunchTask[];
  dependencies: string[];
  deliverables: string[];
}

interface ILaunchTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours: number;
  dueDate: Date;
  completedAt?: Date;
  notes?: string;
}

interface ILaunchMetrics {
  userAcquisition: {
    target: number;
    current: number;
    channels: {
      organic: number;
      paid: number;
      referral: number;
      social: number;
      email: number;
    };
  };
  revenue: {
    target: number;
    current: number;
    streams: {
      subscriptions: number;
      usage: number;
      enterprise: number;
      marketplace: number;
    };
  };
  engagement: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    sessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  performance: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    userSatisfaction: number;
  };
}

interface ILaunchBudget {
  total: number;
  allocated: number;
  spent: number;
  categories: {
    marketing: number;
    infrastructure: number;
    support: number;
    legal: number;
    development: number;
    contingency: number;
  };
  currency: string;
}

interface ILaunchTeam {
  lead: string;
  members: ITeamMember[];
  roles: {
    product: string[];
    marketing: string[];
    engineering: string[];
    support: string[];
    sales: string[];
  };
}

interface ITeamMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  responsibilities: string[];
  availability: 'full_time' | 'part_time' | 'contractor';
  startDate: Date;
  endDate?: Date;
}

interface ILaunchInfrastructure {
  status: 'ready' | 'needs_attention' | 'critical';
  components: {
    servers: {
      status: 'healthy' | 'warning' | 'critical';
      capacity: number;
      usage: number;
    };
    database: {
      status: 'healthy' | 'warning' | 'critical';
      capacity: number;
      usage: number;
    };
    cdn: {
      status: 'healthy' | 'warning' | 'critical';
      regions: string[];
    };
    monitoring: {
      status: 'healthy' | 'warning' | 'critical';
      alerts: number;
    };
    security: {
      status: 'healthy' | 'warning' | 'critical';
      threats: number;
      incidents: number;
    };
  };
  scaling: {
    autoScaling: boolean;
    maxCapacity: number;
    currentCapacity: number;
    costOptimization: boolean;
  };
}

interface ILaunchMarketing {
  campaigns: IMarketingCampaign[];
  channels: IMarketingChannel[];
  content: IMarketingContent[];
  analytics: IMarketingAnalytics;
}

interface IMarketingCampaign {
  id: string;
  name: string;
  type: 'launch' | 'awareness' | 'conversion' | 'retention';
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  targetAudience: {
    demographics: any;
    interests: string[];
    behavior: any;
  };
  channels: string[];
  content: string[];
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    roi: number;
  };
}

interface IMarketingChannel {
  name: string;
  type: 'social' | 'search' | 'email' | 'content' | 'influencer' | 'pr';
  status: 'active' | 'inactive';
  config: any;
  metrics: {
    reach: number;
    engagement: number;
    conversions: number;
    cost: number;
  };
}

interface IMarketingContent {
  id: string;
  type: 'blog' | 'video' | 'social' | 'email' | 'landing' | 'press';
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  publishDate: Date;
  channels: string[];
  metrics: {
    views: number;
    engagement: number;
    shares: number;
    conversions: number;
  };
}

interface IMarketingAnalytics {
  overview: {
    totalBudget: number;
    totalSpent: number;
    totalReach: number;
    totalConversions: number;
    overallROI: number;
  };
  channelPerformance: Array<{
    channel: string;
    spend: number;
    reach: number;
    conversions: number;
    roi: number;
  }>;
  campaignPerformance: Array<{
    campaign: string;
    spend: number;
    reach: number;
    conversions: number;
    roi: number;
  }>;
}

const LaunchConfigSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['planning', 'ready', 'active', 'completed', 'paused'],
    default: 'planning',
    index: true
  },
  launchDate: {
    type: Date,
    required: true,
    index: true
  },
  phases: [{
    name: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    startDate: Date,
    endDate: Date,
    tasks: [{
      id: String,
      title: String,
      description: String,
      assignedTo: String,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'blocked'],
        default: 'pending'
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      estimatedHours: Number,
      actualHours: {
        type: Number,
        default: 0
      },
      dueDate: Date,
      completedAt: Date,
      notes: String
    }],
    dependencies: [String],
    deliverables: [String]
  }],
  metrics: {
    userAcquisition: {
      target: {
        type: Number,
        default: 0
      },
      current: {
        type: Number,
        default: 0
      },
      channels: {
        organic: {
          type: Number,
          default: 0
        },
        paid: {
          type: Number,
          default: 0
        },
        referral: {
          type: Number,
          default: 0
        },
        social: {
          type: Number,
          default: 0
        },
        email: {
          type: Number,
          default: 0
        }
      }
    },
    revenue: {
      target: {
        type: Number,
        default: 0
      },
      current: {
        type: Number,
        default: 0
      },
      streams: {
        subscriptions: {
          type: Number,
          default: 0
        },
        usage: {
          type: Number,
          default: 0
        },
        enterprise: {
          type: Number,
          default: 0
        },
        marketplace: {
          type: Number,
          default: 0
        }
      }
    },
    engagement: {
      dailyActiveUsers: {
        type: Number,
        default: 0
      },
      monthlyActiveUsers: {
        type: Number,
        default: 0
      },
      sessionDuration: {
        type: Number,
        default: 0
      },
      bounceRate: {
        type: Number,
        default: 0
      },
      conversionRate: {
        type: Number,
        default: 0
      }
    },
    performance: {
      uptime: {
        type: Number,
        default: 0
      },
      responseTime: {
        type: Number,
        default: 0
      },
      errorRate: {
        type: Number,
        default: 0
      },
      userSatisfaction: {
        type: Number,
        default: 0
      }
    }
  },
  budget: {
    total: {
      type: Number,
      required: true
    },
    allocated: {
      type: Number,
      default: 0
    },
    spent: {
      type: Number,
      default: 0
    },
    categories: {
      marketing: {
        type: Number,
        default: 0
      },
      infrastructure: {
        type: Number,
        default: 0
      },
      support: {
        type: Number,
        default: 0
      },
      legal: {
        type: Number,
        default: 0
      },
      development: {
        type: Number,
        default: 0
      },
      contingency: {
        type: Number,
        default: 0
      }
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  team: {
    lead: {
      type: String,
      required: true
    },
    members: [{
      userId: String,
      name: String,
      email: String,
      role: String,
      responsibilities: [String],
      availability: {
        type: String,
        enum: ['full_time', 'part_time', 'contractor']
      },
      startDate: Date,
      endDate: Date
    }],
    roles: {
      product: [String],
      marketing: [String],
      engineering: [String],
      support: [String],
      sales: [String]
    }
  },
  infrastructure: {
    status: {
      type: String,
      enum: ['ready', 'needs_attention', 'critical'],
      default: 'ready'
    },
    components: {
      servers: {
        status: {
          type: String,
          enum: ['healthy', 'warning', 'critical'],
          default: 'healthy'
        },
        capacity: Number,
        usage: {
          type: Number,
          default: 0
        }
      },
      database: {
        status: {
          type: String,
          enum: ['healthy', 'warning', 'critical'],
          default: 'healthy'
        },
        capacity: Number,
        usage: {
          type: Number,
          default: 0
        }
      },
      cdn: {
        status: {
          type: String,
          enum: ['healthy', 'warning', 'critical'],
          default: 'healthy'
        },
        regions: [String]
      },
      monitoring: {
        status: {
          type: String,
          enum: ['healthy', 'warning', 'critical'],
          default: 'healthy'
        },
        alerts: {
          type: Number,
          default: 0
        }
      },
      security: {
        status: {
          type: String,
          enum: ['healthy', 'warning', 'critical'],
          default: 'healthy'
        },
        threats: {
          type: Number,
          default: 0
        },
        incidents: {
          type: Number,
          default: 0
        }
      }
    },
    scaling: {
      autoScaling: {
        type: Boolean,
        default: true
      },
      maxCapacity: Number,
      currentCapacity: {
        type: Number,
        default: 0
      },
      costOptimization: {
        type: Boolean,
        default: true
      }
    }
  },
  marketing: {
    campaigns: [{
      id: String,
      name: String,
      type: {
        type: String,
        enum: ['launch', 'awareness', 'conversion', 'retention']
      },
      status: {
        type: String,
        enum: ['draft', 'active', 'paused', 'completed'],
        default: 'draft'
      },
      startDate: Date,
      endDate: Date,
      budget: Number,
      spent: {
        type: Number,
        default: 0
      },
      targetAudience: {
        demographics: Schema.Types.Mixed,
        interests: [String],
        behavior: Schema.Types.Mixed
      },
      channels: [String],
      content: [String],
      metrics: {
        impressions: {
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
        cost: {
          type: Number,
          default: 0
        },
        roi: {
          type: Number,
          default: 0
        }
      }
    }],
    channels: [{
      name: String,
      type: {
        type: String,
        enum: ['social', 'search', 'email', 'content', 'influencer', 'pr']
      },
      status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
      },
      config: Schema.Types.Mixed,
      metrics: {
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
        cost: {
          type: Number,
          default: 0
        }
      }
    }],
    content: [{
      id: String,
      type: {
        type: String,
        enum: ['blog', 'video', 'social', 'email', 'landing', 'press']
      },
      title: String,
      description: String,
      status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
      },
      publishDate: Date,
      channels: [String],
      metrics: {
        views: {
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
        conversions: {
          type: Number,
          default: 0
        }
      }
    }],
    analytics: {
      overview: {
        totalBudget: {
          type: Number,
          default: 0
        },
        totalSpent: {
          type: Number,
          default: 0
        },
        totalReach: {
          type: Number,
          default: 0
        },
        totalConversions: {
          type: Number,
          default: 0
        },
        overallROI: {
          type: Number,
          default: 0
        }
      },
      channelPerformance: [{
        channel: String,
        spend: Number,
        reach: Number,
        conversions: Number,
        roi: Number
      }],
      campaignPerformance: [{
        campaign: String,
        spend: Number,
        reach: Number,
        conversions: Number,
        roi: Number
      }]
    }
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
LaunchConfigSchema.index({ status: 1, launchDate: 1 });
LaunchConfigSchema.index({ 'marketing.campaigns.status': 1 });
LaunchConfigSchema.index({ 'marketing.campaigns.type': 1 });

// Virtual fields
LaunchConfigSchema.virtual('progress').get(function() {
  if (this.phases.length === 0) return 0;
  const completedPhases = this.phases.filter(phase => phase.status === 'completed').length;
  return Math.round((completedPhases / this.phases.length) * 100);
});

LaunchConfigSchema.virtual('budgetUtilization').get(function() {
  return this.budget.total > 0 ? Math.round((this.budget.spent / this.budget.total) * 100) : 0;
});

LaunchConfigSchema.virtual('activeCampaigns').get(function() {
  return this.marketing.campaigns.filter(campaign => campaign.status === 'active');
});

LaunchConfigSchema.virtual('isReadyToLaunch').get(function() {
  return this.status === 'ready' && this.infrastructure.status === 'ready';
});

// Pre-save middleware
LaunchConfigSchema.pre('save', function(next) {
  if (this.isModified('phases')) {
    // Update overall status based on phase statuses
    const completedPhases = this.phases.filter(phase => phase.status === 'completed').length;
    const inProgressPhases = this.phases.filter(phase => phase.status === 'in_progress').length;

    if (completedPhases === this.phases.length) {
      this.status = 'completed';
    } else if (inProgressPhases > 0) {
      this.status = 'active';
    }
  }
  next();
});

export const LaunchConfig = mongoose.model<ILaunchConfig>('LaunchConfig', LaunchConfigSchema);