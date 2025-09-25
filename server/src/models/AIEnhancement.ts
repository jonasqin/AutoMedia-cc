import mongoose, { Schema, Document } from 'mongoose';

export interface IAIEnhancement extends Document {
  name: string;
  description: string;
  type: 'model' | 'feature' | 'capability' | 'integration';
  category: 'content_generation' | 'analysis' | 'optimization' | 'automation' | 'personalization';
  status: 'research' | 'development' | 'testing' | 'beta' | 'production' | 'deprecated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  version: string;
  models: IAIModel[];
  features: IAIFeature[];
  capabilities: IAICapability[];
  integrations: IAIIntegration[];
  performance: IAIPerformance;
  usage: IAIUsage;
  cost: IAICost;
  deployment: IAIDeployment;
  compliance: IAICompliance;
  roadmap: IAIRoadmap;
  metadata: {
    source: string;
    dependencies: string[];
    incompatibleWith: string[];
    requirements: string[];
  };
  createdAt: Date;
  updatedAt: Date;

  // Methods
  getModel(provider: string, model: string): IAIModel | null;
  getFeature(featureName: string): IAIFeature | null;
  getCostEstimate(requests: number, tokens: number, model: string): number;
  isCompliant(regulation: string): boolean;
  hasCapability(capabilityName: string): boolean;
}

interface IAIModel {
  provider: string;
  model: string;
  version: string;
  status: 'available' | 'deprecated' | 'discontinued';
  capabilities: string[];
  limits: {
    maxTokens: number;
    maxRequests: number;
    maxContext: number;
  };
  pricing: {
    input: number; // per 1K tokens
    output: number; // per 1K tokens
    currency: string;
  };
  performance: {
    latency: number; // ms
    accuracy: number; // percentage
    reliability: number; // percentage
  };
  availability: {
    regions: string[];
    uptime: number; // percentage
  };
}

interface IAIFeature {
  name: string;
  description: string;
  type: 'generation' | 'analysis' | 'optimization' | 'automation';
  input: string;
  output: string;
  parameters: IFeatureParameter[];
  examples: IFeatureExample[];
  useCases: string[];
  limitations: string[];
}

interface IFeatureParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

interface IFeatureExample {
  input: any;
  output: any;
  description: string;
  context?: string;
}

interface IAICapability {
  name: string;
  description: string;
  type: 'core' | 'advanced' | 'specialized';
  enabled: boolean;
  configuration: any;
  dependencies: string[];
  performance: {
    speed: number;
    accuracy: number;
    resourceUsage: number;
  };
}

interface IAIIntegration {
  platform: string;
  type: 'api' | 'sdk' | 'webhook' | 'plugin';
  version: string;
  status: 'connected' | 'disconnected' | 'error';
  configuration: any;
  usage: {
    requests: number;
    errors: number;
    lastUsed: Date;
  };
  capabilities: string[];
}

interface IAIPerformance {
  overall: {
    uptime: number;
    responseTime: number;
    successRate: number;
    errorRate: number;
  };
  models: Array<{
    model: string;
    latency: number;
    accuracy: number;
    throughput: number;
  }>;
  features: Array<{
    feature: string;
    usage: number;
    satisfaction: number;
    errors: number;
  }>;
  benchmarks: {
    standard: number;
    current: number;
    improvement: number;
  };
}

interface IAIUsage {
  daily: {
    date: Date;
    requests: number;
    tokens: number;
    cost: number;
    users: number;
  }[];
  monthly: {
    month: string;
    requests: number;
    tokens: number;
    cost: number;
    users: number;
  }[];
  total: {
    requests: number;
    tokens: number;
    cost: number;
    users: number;
  };
  byFeature: Array<{
    feature: string;
    requests: number;
    tokens: number;
    cost: number;
    users: number;
  }>;
  byModel: Array<{
    model: string;
    requests: number;
    tokens: number;
    cost: number;
    users: number;
  }>;
}

interface IAICost {
  total: number;
  budget: number;
  byProvider: Array<{
    provider: string;
    cost: number;
    requests: number;
    tokens: number;
  }>;
  byFeature: Array<{
    feature: string;
    cost: number;
    requests: number;
    tokens: number;
  }>;
  optimization: {
    recommendations: string[];
    savings: number;
    efficiency: number;
  };
}

interface IAIDeployment {
  environment: 'development' | 'staging' | 'production';
  status: 'deployed' | 'deploying' | 'failed' | 'rolled_back';
  version: string;
  deployedAt: Date;
  infrastructure: {
    compute: {
      type: string;
      instances: number;
      capacity: number;
    };
    memory: {
      total: number;
      used: number;
    };
    storage: {
      total: number;
      used: number;
    };
  };
  scaling: {
    autoScale: boolean;
    minInstances: number;
    maxInstances: number;
    currentInstances: number;
  };
  monitoring: {
    enabled: boolean;
    alerts: IAlert[];
    metrics: IMetric[];
  };
}

interface IAlert {
  name: string;
  type: 'performance' | 'error' | 'cost' | 'usage';
  condition: string;
  threshold: number;
  action: string;
  status: 'active' | 'triggered' | 'resolved';
  lastTriggered?: Date;
}

interface IMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  unit: string;
  timestamp: Date;
}

interface IAICompliance {
  dataPrivacy: {
    encryption: {
      atRest: boolean;
      inTransit: boolean;
    };
    dataRetention: {
      policy: string;
      duration: number;
    };
    userConsent: {
      required: boolean;
      mechanism: string;
    };
  };
  security: {
    authentication: {
      enabled: boolean;
      method: string;
    };
    authorization: {
      enabled: boolean;
      roles: string[];
    };
    audit: {
      enabled: boolean;
      retention: number;
      level: string;
    };
  };
  regulatory: {
    gdpr: {
      compliant: boolean;
      lastAssessment: Date;
    };
    ccpa: {
      compliant: boolean;
      lastAssessment: Date;
    };
    hipaa: {
      compliant: boolean;
      lastAssessment: Date;
    };
    other: Array<{
      regulation: string;
      compliant: boolean;
      lastAssessment: Date;
    }>;
  };
  ethical: {
    biasDetection: {
      enabled: boolean;
      framework: string;
      frequency: string;
    };
    transparency: {
      explainability: boolean;
      disclosure: boolean;
    };
    fairness: {
      assessment: boolean;
      monitoring: boolean;
    };
  };
}

interface IAIRoadmap {
  current: {
    phase: string;
    progress: number;
    deliverables: string[];
    timeline: {
      start: Date;
      end: Date;
    };
  };
  upcoming: Array<{
    phase: string;
    description: string;
    priority: string;
    timeline: {
      start: Date;
      end: Date;
    };
    deliverables: string[];
    dependencies: string[];
  }>;
  longTerm: Array<{
    vision: string;
    description: string;
    timeline: string;
    impact: string;
    feasibility: number;
  }>;
}

const AIEnhancementSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['model', 'feature', 'capability', 'integration'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['content_generation', 'analysis', 'optimization', 'automation', 'personalization'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['research', 'development', 'testing', 'beta', 'production', 'deprecated'],
    default: 'research',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  version: {
    type: String,
    required: true
  },
  models: [{
    provider: String,
    model: String,
    version: String,
    status: {
      type: String,
      enum: ['available', 'deprecated', 'discontinued'],
      default: 'available'
    },
    capabilities: [String],
    limits: {
      maxTokens: Number,
      maxRequests: Number,
      maxContext: Number
    },
    pricing: {
      input: Number,
      output: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    performance: {
      latency: Number,
      accuracy: Number,
      reliability: Number
    },
    availability: {
      regions: [String],
      uptime: {
        type: Number,
        default: 100
      }
    }
  }],
  features: [{
    name: String,
    description: String,
    type: {
      type: String,
      enum: ['generation', 'analysis', 'optimization', 'automation']
    },
    input: String,
    output: String,
    parameters: [{
      name: String,
      type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'array', 'object']
      },
      required: Boolean,
      default: Schema.Types.Mixed,
      description: String,
      validation: {
        min: Number,
        max: Number,
        pattern: String,
        enum: [String]
      }
    }],
    examples: [{
      input: Schema.Types.Mixed,
      output: Schema.Types.Mixed,
      description: String,
      context: String
    }],
    useCases: [String],
    limitations: [String]
  }],
  capabilities: [{
    name: String,
    description: String,
    type: {
      type: String,
      enum: ['core', 'advanced', 'specialized']
    },
    enabled: {
      type: Boolean,
      default: true
    },
    configuration: Schema.Types.Mixed,
    dependencies: [String],
    performance: {
      speed: Number,
      accuracy: Number,
      resourceUsage: Number
    }
  }],
  integrations: [{
    platform: String,
    type: {
      type: String,
      enum: ['api', 'sdk', 'webhook', 'plugin']
    },
    version: String,
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error']
    },
    configuration: Schema.Types.Mixed,
    usage: {
      requests: {
        type: Number,
        default: 0
      },
      errors: {
        type: Number,
        default: 0
      },
      lastUsed: Date
    },
    capabilities: [String]
  }],
  performance: {
    overall: {
      uptime: {
        type: Number,
        default: 100
      },
      responseTime: {
        type: Number,
        default: 0
      },
      successRate: {
        type: Number,
        default: 100
      },
      errorRate: {
        type: Number,
        default: 0
      }
    },
    models: [{
      model: String,
      latency: Number,
      accuracy: Number,
      throughput: Number
    }],
    features: [{
      feature: String,
      usage: Number,
      satisfaction: Number,
      errors: Number
    }],
    benchmarks: {
      standard: Number,
      current: Number,
      improvement: {
        type: Number,
        default: 0
      }
    }
  },
  usage: {
    daily: [{
      date: Date,
      requests: {
        type: Number,
        default: 0
      },
      tokens: {
        type: Number,
        default: 0
      },
      cost: {
        type: Number,
        default: 0
      },
      users: {
        type: Number,
        default: 0
      }
    }],
    monthly: [{
      month: String,
      requests: {
        type: Number,
        default: 0
      },
      tokens: {
        type: Number,
        default: 0
      },
      cost: {
        type: Number,
        default: 0
      },
      users: {
        type: Number,
        default: 0
      }
    }],
    total: {
      requests: {
        type: Number,
        default: 0
      },
      tokens: {
        type: Number,
        default: 0
      },
      cost: {
        type: Number,
        default: 0
      },
      users: {
        type: Number,
        default: 0
      }
    },
    byFeature: [{
      feature: String,
      requests: {
        type: Number,
        default: 0
      },
      tokens: {
        type: Number,
        default: 0
      },
      cost: {
        type: Number,
        default: 0
      },
      users: {
        type: Number,
        default: 0
      }
    }],
    byModel: [{
      model: String,
      requests: {
        type: Number,
        default: 0
      },
      tokens: {
        type: Number,
        default: 0
      },
      cost: {
        type: Number,
        default: 0
      },
      users: {
        type: Number,
        default: 0
      }
    }]
  },
  cost: {
    total: {
      type: Number,
      default: 0
    },
    budget: Number,
    byProvider: [{
      provider: String,
      cost: {
        type: Number,
        default: 0
      },
      requests: {
        type: Number,
        default: 0
      },
      tokens: {
        type: Number,
        default: 0
      }
    }],
    byFeature: [{
      feature: String,
      cost: {
        type: Number,
        default: 0
      },
      requests: {
        type: Number,
        default: 0
      },
      tokens: {
        type: Number,
        default: 0
      }
    }],
    optimization: {
      recommendations: [String],
      savings: {
        type: Number,
        default: 0
      },
      efficiency: {
        type: Number,
        default: 0
      }
    }
  },
  deployment: {
    environment: {
      type: String,
      enum: ['development', 'staging', 'production']
    },
    status: {
      type: String,
      enum: ['deployed', 'deploying', 'failed', 'rolled_back']
    },
    version: String,
    deployedAt: Date,
    infrastructure: {
      compute: {
        type: String,
        instances: Number,
        capacity: Number
      },
      memory: {
        total: Number,
        used: {
          type: Number,
          default: 0
        }
      },
      storage: {
        total: Number,
        used: {
          type: Number,
          default: 0
        }
      }
    },
    scaling: {
      autoScale: {
        type: Boolean,
        default: true
      },
      minInstances: {
        type: Number,
        default: 1
      },
      maxInstances: Number,
      currentInstances: {
        type: Number,
        default: 1
      }
    },
    monitoring: {
      enabled: {
        type: Boolean,
        default: true
      },
      alerts: [{
        name: String,
        type: {
          type: String,
          enum: ['performance', 'error', 'cost', 'usage']
        },
        condition: String,
        threshold: Number,
        action: String,
        status: {
          type: String,
          enum: ['active', 'triggered', 'resolved'],
          default: 'active'
        },
        lastTriggered: Date
      }],
      metrics: [{
        name: String,
        type: {
          type: String,
          enum: ['counter', 'gauge', 'histogram']
        },
        value: Number,
        unit: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }]
    }
  },
  compliance: {
    dataPrivacy: {
      encryption: {
        atRest: {
          type: Boolean,
          default: true
        },
        inTransit: {
          type: Boolean,
          default: true
        }
      },
      dataRetention: {
        policy: String,
        duration: Number
      },
      userConsent: {
        required: Boolean,
        mechanism: String
      }
    },
    security: {
      authentication: {
        enabled: {
          type: Boolean,
          default: true
        },
        method: String
      },
      authorization: {
        enabled: {
          type: Boolean,
          default: true
        },
        roles: [String]
      },
      audit: {
        enabled: {
          type: Boolean,
          default: true
        },
        retention: Number,
        level: String
      }
    },
    regulatory: {
      gdpr: {
        compliant: Boolean,
        lastAssessment: Date
      },
      ccpa: {
        compliant: Boolean,
        lastAssessment: Date
      },
      hipaa: {
        compliant: Boolean,
        lastAssessment: Date
      },
      other: [{
        regulation: String,
        compliant: Boolean,
        lastAssessment: Date
      }]
    },
    ethical: {
      biasDetection: {
        enabled: {
          type: Boolean,
          default: true
        },
        framework: String,
        frequency: String
      },
      transparency: {
        explainability: {
          type: Boolean,
          default: true
        },
        disclosure: {
          type: Boolean,
          default: true
        }
      },
      fairness: {
        assessment: {
          type: Boolean,
          default: true
        },
        monitoring: {
          type: Boolean,
          default: true
        }
      }
    }
  },
  roadmap: {
    current: {
      phase: String,
      progress: {
        type: Number,
        default: 0
      },
      deliverables: [String],
      timeline: {
        start: Date,
        end: Date
      }
    },
    upcoming: [{
      phase: String,
      description: String,
      priority: String,
      timeline: {
        start: Date,
        end: Date
      },
      deliverables: [String],
      dependencies: [String]
    }],
    longTerm: [{
      vision: String,
      description: String,
      timeline: String,
      impact: String,
      feasibility: {
        type: Number,
        min: 0,
        max: 100
      }
    }]
  },
  metadata: {
    source: {
      type: String,
      default: 'internal'
    },
    dependencies: [String],
    incompatibleWith: [String],
    requirements: [String]
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
AIEnhancementSchema.index({ type: 1, status: 1 });
AIEnhancementSchema.index({ category: 1, priority: 1 });
AIEnhancementSchema.index({ 'deployment.status': 1 });
AIEnhancementSchema.index({ 'deployment.environment': 1 });

// Virtual fields
AIEnhancementSchema.virtual('isProductionReady').get(function() {
  return this.status === 'production' && this.deployment?.status === 'deployed';
});

AIEnhancementSchema.virtual('hasActiveAlerts').get(function() {
  return this.deployment?.monitoring?.alerts?.some((alert: any) => alert.status === 'triggered') || false;
});

AIEnhancementSchema.virtual('costEfficiency').get(function() {
  const total = this.usage?.total || {} as any;
  if (total.requests === 0) return 0;
  return total.cost / total.requests;
});

AIEnhancementSchema.virtual('modelCount').get(function() {
  if (!this.models) return 0;
  return this.models.filter((model: any) => model.status === 'available').length;
});

AIEnhancementSchema.virtual('averageModelLatency').get(function() {
  const models = this.performance?.models || [];
  if (models.length === 0) return 0;
  const total = models.reduce((sum: number, model: any) => sum + (model.latency || 0), 0);
  return total / models.length;
});

// Methods
AIEnhancementSchema.methods.getModel = function(provider: string, model: string) {
  if (!this.models) return null;
  return this.models.find((m: any) => m.provider === provider && m.model === model);
};

AIEnhancementSchema.methods.getFeature = function(featureName: string) {
  if (!this.features) return null;
  return this.features.find((f: any) => f.name === featureName);
};

AIEnhancementSchema.methods.getCostEstimate = function(requests: number, tokens: number, model: string) {
  const modelConfig = this.getModel(model.split(':')[0], model.split(':')[1]);
  if (!modelConfig) return 0;

  const inputTokens = Math.floor(tokens * 0.3); // 30% input tokens assumption
  const outputTokens = Math.floor(tokens * 0.7); // 70% output tokens assumption

  return (inputTokens * modelConfig.pricing.input / 1000) + (outputTokens * modelConfig.pricing.output / 1000);
};

AIEnhancementSchema.methods.isCompliant = function(regulation: string) {
  return this.compliance.regulatory[regulation.toLowerCase()]?.compliant || false;
};

AIEnhancementSchema.methods.hasCapability = function(capabilityName: string) {
  if (!this.capabilities) return false;
  return this.capabilities.some((cap: any) => cap.name === capabilityName && cap.enabled);
};

// Pre-save middleware
AIEnhancementSchema.pre('save', function(next) {
  // Update total usage
  if (this.isModified('usage.daily') && this.usage?.daily) {
    if (this.usage.total) {
      this.usage.total.requests = this.usage.daily.reduce((sum, day) => sum + (day.requests || 0), 0);
      this.usage.total.tokens = this.usage.daily.reduce((sum, day) => sum + (day.tokens || 0), 0);
      this.usage.total.cost = this.usage.daily.reduce((sum, day) => sum + (day.cost || 0), 0);
      this.usage.total.users = this.usage.daily.reduce((sum, day) => sum + (day.users || 0), 0);
    }
  }

  // Update total cost
  if (this.isModified('cost.byProvider') && this.cost?.byProvider) {
    if (this.cost) {
      this.cost.total = this.cost.byProvider.reduce((sum, provider) => sum + (provider.cost || 0), 0);
    }
  }

  // Update performance metrics
  if (this.isModified('performance.models') && this.performance?.models) {
    const models = this.performance.models;
    const avgLatency = models.reduce((sum: number, model: any) => sum + (model.latency || 0), 0) / models.length;
    const avgAccuracy = models.reduce((sum: number, model: any) => sum + (model.accuracy || 0), 0) / models.length;

    if (this.performance.overall) {
      this.performance.overall.responseTime = avgLatency;
      this.performance.overall.successRate = avgAccuracy;
      this.performance.overall.errorRate = 100 - avgAccuracy;
    }
  }

  next();
});

// Static methods
AIEnhancementSchema.statics.findByType = function(type: string) {
  return this.find({ type, status: { $ne: 'deprecated' } });
};

AIEnhancementSchema.statics.findByCategory = function(category: string) {
  return this.find({ category, status: { $ne: 'deprecated' } });
};

AIEnhancementSchema.statics.findProductionReady = function() {
  return this.find({
    status: 'production',
    'deployment.status': 'deployed'
  });
};

AIEnhancementSchema.statics.findHighPriority = function() {
  return this.find({
    priority: { $in: ['high', 'critical'] },
    status: { $ne: 'deprecated' }
  });
};

AIEnhancementSchema.statics.findByModel = function(provider: string, model: string) {
  return this.find({
    'models.provider': provider,
    'models.model': model,
    'models.status': 'available'
  });
};

export const AIEnhancement = mongoose.model<IAIEnhancement>('AIEnhancement', AIEnhancementSchema);