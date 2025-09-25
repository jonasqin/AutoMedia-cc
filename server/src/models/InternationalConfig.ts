import mongoose, { Schema, Document } from 'mongoose';

export interface IInternationalConfig extends Document {
  region: string;
  country: string;
  language: string;
  currency: string;
  timezone: string;
  status: 'active' | 'pending' | 'disabled';
  localization: ILocalization;
  compliance: ICompliance;
  infrastructure: IRegionalInfrastructure;
  marketing: IRegionalMarketing;
  support: IRegionalSupport;
  pricing: IRegionalPricing;
  features: IRegionalFeatures;
  launchDate: Date;
  performance: IRegionalPerformance;
  createdAt: Date;
  updatedAt: Date;
}

interface ILocalization {
  interfaceLanguage: string;
  contentLanguage: string;
  dateFormat: string;
  numberFormat: string;
  currencyFormat: string;
  translations: {
    interface: Record<string, string>;
    content: Record<string, string>;
    marketing: Record<string, string>;
    support: Record<string, string>;
  };
  culturalAdaptations: {
    contentStyle: string;
    toneOfVoice: string;
    imagery: string[];
    colors: string[];
    holidays: string[];
  };
}

interface ICompliance {
  dataPrivacy: {
    regulation: string; // GDPR, CCPA, LGPD, etc.
    consentRequired: boolean;
    dataProcessing: {
      consent: boolean;
      retention: number; // days
      localization: boolean;
    };
    userRights: {
      access: boolean;
      deletion: boolean;
      portability: boolean;
      rectification: boolean;
    };
  };
  financial: {
    regulation: string;
    taxIdRequired: boolean;
    reporting: {
      frequency: string;
      format: string;
      requirements: string[];
    };
  };
  content: {
    regulation: string;
    restrictions: string[];
    moderation: {
      required: boolean;
      standards: string[];
    };
  };
  platform: {
    regulations: Record<string, {
      name: string;
      requirements: string[];
      restrictions: string[];
    }>;
  };
}

interface IRegionalInfrastructure {
  dataCenter: {
    region: string;
    provider: string;
    status: 'active' | 'maintenance' | 'offline';
    capacity: number;
    usage: number;
  };
  cdn: {
    endpoints: string[];
    providers: string[];
    status: 'active' | 'degraded' | 'offline';
  };
  database: {
    primary: {
      region: string;
      status: string;
      latency: number;
    };
    replicas: {
      region: string;
      status: string;
      latency: number;
    }[];
  };
  services: {
    status: 'operational' | 'degraded' | 'outage';
    degradedServices: string[];
    uptime: number;
    responseTime: number;
  };
  compliance: {
    dataSovereignty: boolean;
    encryption: {
      atRest: boolean;
      inTransit: boolean;
    };
    audits: {
      lastAudit: Date;
      nextAudit: Date;
      certification: string;
    };
  };
}

interface IRegionalMarketing {
  channels: IMarketingChannel[];
  campaigns: IRegionalCampaign[];
  content: IRegionalContent[];
  influencers: IInfluencer[];
  budget: {
    total: number;
    allocated: number;
    spent: number;
    categories: {
      digital: number;
      traditional: number;
      influencer: number;
      events: number;
      pr: number;
    };
  };
  performance: {
    reach: number;
    engagement: number;
    conversions: number;
    cost: number;
    roi: number;
  };
}

interface IMarketingChannel {
  name: string;
  type: 'social' | 'search' | 'email' | 'content' | 'influencer' | 'traditional';
  platform: string;
  status: 'active' | 'inactive' | 'banned';
  audience: {
    size: number;
    demographics: any;
    interests: string[];
  };
  performance: {
    reach: number;
    engagement: number;
    ctr: number;
    cost: number;
  };
}

interface IRegionalCampaign {
  id: string;
  name: string;
  type: 'awareness' | 'acquisition' | 'conversion' | 'retention';
  status: 'planning' | 'active' | 'paused' | 'completed';
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
  creativeAssets: string[];
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    roi: number;
  };
}

interface IRegionalContent {
  id: string;
  type: 'blog' | 'video' | 'social' | 'email' | 'landing' | 'press' | 'localized';
  title: string;
  description: string;
  language: string;
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

interface IInfluencer {
  id: string;
  name: string;
  platform: string;
  followers: number;
  engagement: number;
  niche: string[];
  status: 'available' | 'contacted' | 'negotiating' | 'active' | 'inactive';
  rates: {
    post: number;
    story: number;
    video: number;
    campaign: number;
  };
  performance: {
    reach: number;
    engagement: number;
    conversions: number;
    roi: number;
  };
}

interface IRegionalSupport {
  languages: string[];
  channels: {
    email: {
      address: string;
      responseTime: number; // hours
      availability: string;
    };
    chat: {
      platform: string;
      availability: string;
      languages: string[];
    };
    phone: {
      numbers: string[];
      availability: string;
      languages: string[];
    };
    social: {
      platforms: string[];
      responseTime: number;
      languages: string[];
    };
  };
  team: {
    size: number;
    languages: string[];
    training: string[];
    certification: string;
  };
  hours: {
    timezone: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  performance: {
    responseTime: number;
    resolutionTime: number;
    satisfaction: number;
    availability: number;
  };
}

interface IRegionalPricing {
  basePlan: {
    free: boolean;
    pro: number;
    team: number;
    enterprise: boolean;
  };
  currency: string;
  tax: {
    rate: number;
    inclusive: boolean;
    name: string;
  };
  paymentMethods: {
    cards: string[];
    digital: string[];
    bank: string[];
    other: string[];
  };
  promotions: {
    launch: {
      discount: number;
      duration: number; // days
    };
    seasonal: Array<{
      name: string;
      discount: number;
      startDate: Date;
      endDate: Date;
    }>;
  };
  enterprise: {
    contactRequired: boolean;
    pricingModel: string;
    minimumCommitment: number;
  };
}

interface IRegionalFeatures {
  platformAdapters: string[];
  aiModels: string[];
  integrations: string[];
  localized: {
    templates: string[];
    workflows: string[];
    reports: string[];
  };
  restricted: string[];
  beta: string[];
}

interface IRegionalPerformance {
  users: {
    total: number;
    active: number;
    new: number;
    churn: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  engagement: {
    sessions: number;
    duration: number;
    bounceRate: number;
  };
  technical: {
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  business: {
    cac: number; // Customer Acquisition Cost
    ltv: number; // Lifetime Value
    nps: number; // Net Promoter Score
  };
}

const InternationalConfigSchema = new Schema({
  region: {
    type: String,
    required: true,
    index: true
  },
  country: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    index: true
  },
  currency: {
    type: String,
    required: true,
    index: true
  },
  timezone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'disabled'],
    default: 'pending',
    index: true
  },
  localization: {
    interfaceLanguage: String,
    contentLanguage: String,
    dateFormat: String,
    numberFormat: String,
    currencyFormat: String,
    translations: {
      interface: {
        type: Map,
        of: String
      },
      content: {
        type: Map,
        of: String
      },
      marketing: {
        type: Map,
        of: String
      },
      support: {
        type: Map,
        of: String
      }
    },
    culturalAdaptations: {
      contentStyle: String,
      toneOfVoice: String,
      imagery: [String],
      colors: [String],
      holidays: [String]
    }
  },
  compliance: {
    dataPrivacy: {
      regulation: String,
      consentRequired: Boolean,
      dataProcessing: {
        consent: Boolean,
        retention: Number,
        localization: Boolean
      },
      userRights: {
        access: Boolean,
        deletion: Boolean,
        portability: Boolean,
        rectification: Boolean
      }
    },
    financial: {
      regulation: String,
      taxIdRequired: Boolean,
      reporting: {
        frequency: String,
        format: String,
        requirements: [String]
      }
    },
    content: {
      regulation: String,
      restrictions: [String],
      moderation: {
        required: Boolean,
        standards: [String]
      }
    },
    platform: {
      regulations: {
        type: Map,
        of: {
          name: String,
          requirements: [String],
          restrictions: [String]
        }
      }
    }
  },
  infrastructure: {
    dataCenter: {
      region: String,
      provider: String,
      status: {
        type: String,
        enum: ['active', 'maintenance', 'offline']
      },
      capacity: Number,
      usage: {
        type: Number,
        default: 0
      }
    },
    cdn: {
      endpoints: [String],
      providers: [String],
      status: {
        type: String,
        enum: ['active', 'degraded', 'offline']
      }
    },
    database: {
      primary: {
        region: String,
        status: String,
        latency: Number
      },
      replicas: [{
        region: String,
        status: String,
        latency: Number
      }]
    },
    services: {
      status: {
        type: String,
        enum: ['operational', 'degraded', 'outage']
      },
      degradedServices: [String],
      uptime: {
        type: Number,
        default: 100
      },
      responseTime: {
        type: Number,
        default: 0
      }
    },
    compliance: {
      dataSovereignty: Boolean,
      encryption: {
        atRest: Boolean,
        inTransit: Boolean
      },
      audits: {
        lastAudit: Date,
        nextAudit: Date,
        certification: String
      }
    }
  },
  marketing: {
    channels: [{
      name: String,
      type: {
        type: String,
        enum: ['social', 'search', 'email', 'content', 'influencer', 'traditional']
      },
      platform: String,
      status: {
        type: String,
        enum: ['active', 'inactive', 'banned']
      },
      audience: {
        size: Number,
        demographics: Schema.Types.Mixed,
        interests: [String]
      },
      performance: {
        reach: {
          type: Number,
          default: 0
        },
        engagement: {
          type: Number,
          default: 0
        },
        ctr: {
          type: Number,
          default: 0
        },
        cost: {
          type: Number,
          default: 0
        }
      }
    }],
    campaigns: [{
      id: String,
      name: String,
      type: {
        type: String,
        enum: ['awareness', 'acquisition', 'conversion', 'retention']
      },
      status: {
        type: String,
        enum: ['planning', 'active', 'paused', 'completed']
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
      creativeAssets: [String],
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
    content: [{
      id: String,
      type: {
        type: String,
        enum: ['blog', 'video', 'social', 'email', 'landing', 'press', 'localized']
      },
      title: String,
      description: String,
      language: String,
      status: {
        type: String,
        enum: ['draft', 'published', 'archived']
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
    influencers: [{
      id: String,
      name: String,
      platform: String,
      followers: Number,
      engagement: Number,
      niche: [String],
      status: {
        type: String,
        enum: ['available', 'contacted', 'negotiating', 'active', 'inactive']
      },
      rates: {
        post: Number,
        story: Number,
        video: Number,
        campaign: Number
      },
      performance: {
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
        roi: {
          type: Number,
          default: 0
        }
      }
    }],
    budget: {
      total: Number,
      allocated: {
        type: Number,
        default: 0
      },
      spent: {
        type: Number,
        default: 0
      },
      categories: {
        digital: {
          type: Number,
          default: 0
        },
        traditional: {
          type: Number,
          default: 0
        },
        influencer: {
          type: Number,
          default: 0
        },
        events: {
          type: Number,
          default: 0
        },
        pr: {
          type: Number,
          default: 0
        }
      }
    },
    performance: {
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
      },
      roi: {
        type: Number,
        default: 0
      }
    }
  },
  support: {
    languages: [String],
    channels: {
      email: {
        address: String,
        responseTime: Number,
        availability: String
      },
      chat: {
        platform: String,
        availability: String,
        languages: [String]
      },
      phone: {
        numbers: [String],
        availability: String,
        languages: [String]
      },
      social: {
        platforms: [String],
        responseTime: Number,
        languages: [String]
      }
    },
    team: {
      size: {
        type: Number,
        default: 0
      },
      languages: [String],
      training: [String],
      certification: String
    },
    hours: {
      timezone: String,
      monday: String,
      tuesday: String,
      wednesday: String,
      thursday: String,
      friday: String,
      saturday: String,
      sunday: String
    },
    performance: {
      responseTime: {
        type: Number,
        default: 0
      },
      resolutionTime: {
        type: Number,
        default: 0
      },
      satisfaction: {
        type: Number,
        default: 0
      },
      availability: {
        type: Number,
        default: 0
      }
    }
  },
  pricing: {
    basePlan: {
      free: Boolean,
      pro: Number,
      team: Number,
      enterprise: Boolean
    },
    currency: String,
    tax: {
      rate: Number,
      inclusive: Boolean,
      name: String
    },
    paymentMethods: {
      cards: [String],
      digital: [String],
      bank: [String],
      other: [String]
    },
    promotions: {
      launch: {
        discount: Number,
        duration: Number
      },
      seasonal: [{
        name: String,
        discount: Number,
        startDate: Date,
        endDate: Date
      }]
    },
    enterprise: {
      contactRequired: Boolean,
      pricingModel: String,
      minimumCommitment: Number
    }
  },
  features: {
    platformAdapters: [String],
    aiModels: [String],
    integrations: [String],
    localized: {
      templates: [String],
      workflows: [String],
      reports: [String]
    },
    restricted: [String],
    beta: [String]
  },
  launchDate: Date,
  performance: {
    users: {
      total: {
        type: Number,
        default: 0
      },
      active: {
        type: Number,
        default: 0
      },
      new: {
        type: Number,
        default: 0
      },
      churn: {
        type: Number,
        default: 0
      }
    },
    revenue: {
      total: {
        type: Number,
        default: 0
      },
      monthly: {
        type: Number,
        default: 0
      },
      growth: {
        type: Number,
        default: 0
      }
    },
    engagement: {
      sessions: {
        type: Number,
        default: 0
      },
      duration: {
        type: Number,
        default: 0
      },
      bounceRate: {
        type: Number,
        default: 0
      }
    },
    technical: {
      uptime: {
        type: Number,
        default: 100
      },
      responseTime: {
        type: Number,
        default: 0
      },
      errorRate: {
        type: Number,
        default: 0
      }
    },
    business: {
      cac: {
        type: Number,
        default: 0
      },
      ltv: {
        type: Number,
        default: 0
      },
      nps: {
        type: Number,
        default: 0
      }
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
InternationalConfigSchema.index({ region: 1, country: 1 });
InternationalConfigSchema.index({ status: 1, launchDate: 1 });
InternationalConfigSchema.index({ 'marketing.campaigns.status': 1 });
InternationalConfigSchema.index({ 'infrastructure.services.status': 1 });

// Virtual fields
InternationalConfigSchema.virtual('isLaunched').get(function() {
  return this.launchDate && this.launchDate <= new Date();
});

InternationalConfigSchema.virtual('daysSinceLaunch').get(function() {
  if (!this.launchDate) return 0;
  const now = new Date();
  const diffTime = now.getTime() - this.launchDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

InternationalConfigSchema.virtual('isOperational').get(function() {
  return this.infrastructure?.services?.status === 'operational';
});

InternationalConfigSchema.virtual('marketingROI').get(function() {
  const marketing = this.marketing || {} as any;
  const { performance = {}, budget = {} } = marketing;
  return performance.cost > 0 ? (performance.conversions * 100) / performance.cost : 0;
});

InternationalConfigSchema.virtual('supportScore').get(function() {
  const support = this.support || {} as any;
  const { performance = {} } = support;
  return (performance.satisfaction || 0 + performance.availability || 0) / 2;
});

// Methods
InternationalConfigSchema.methods.getLocalizedContent = function(key: string, type = 'interface') {
  return this.localization.translations[type]?.get(key) || key;
};

InternationalConfigSchema.methods.isCompliant = function(regulation: string) {
  return this.compliance.dataPrivacy.regulation === regulation;
};

InternationalConfigSchema.methods.getPaymentMethods = function() {
  return this.pricing.paymentMethods;
};

InternationalConfigSchema.methods.getFeatureAvailability = function(feature: string) {
  return this.features.platformAdapters.includes(feature) ||
         this.features.aiModels.includes(feature) ||
         this.features.integrations.includes(feature);
};

// Pre-save middleware
InternationalConfigSchema.pre('save', function(next) {
  // Update marketing performance totals
  if (this.isModified('marketing.campaigns')) {
    let totalReach = 0;
    let totalEngagement = 0;
    let totalConversions = 0;
    let totalCost = 0;

    if (this.marketing?.campaigns) {
      this.marketing.campaigns.forEach(campaign => {
        const metrics = campaign.metrics || {} as any;
        totalReach += metrics.reach || 0;
        totalEngagement += metrics.engagement || 0;
        totalConversions += metrics.conversions || 0;
        totalCost += metrics.cost || 0;
      });
    }

    if (this.marketing?.performance) {
      this.marketing.performance.reach = totalReach;
      this.marketing.performance.engagement = totalEngagement;
      this.marketing.performance.conversions = totalConversions;
      this.marketing.performance.cost = totalCost;
      this.marketing.performance.roi = totalCost > 0 ? (totalConversions * 100) / totalCost : 0;
    }
  }

  next();
});

// Static methods
InternationalConfigSchema.statics.getActiveRegions = function() {
  return this.find({ status: 'active' });
};

InternationalConfigSchema.statics.getRegionsByLanguage = function(language: string) {
  return this.find({ language, status: 'active' });
};

InternationalConfigSchema.statics.getPendingLaunches = function() {
  const now = new Date();
  return this.find({
    status: 'pending',
    launchDate: { $gte: now }
  });
};

export const InternationalConfig = mongoose.model<IInternationalConfig>('InternationalConfig', InternationalConfigSchema);