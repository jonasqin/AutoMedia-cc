import mongoose, { Schema, Document } from 'mongoose';

export interface IScalingConfig extends Document {
  name: string;
  description: string;
  environment: 'development' | 'staging' | 'production';
  isActive: boolean;
  version: string;
  lastUpdated: Date;
  configurations: {
    database: IDatabaseScaling;
    api: IAPIScaling;
    cache: ICacheConfig;
    loadBalancer: ILoadBalancerConfig;
    monitoring: IMonitoringConfig;
    security: ISecurityConfig;
    cdn: ICDNConfig;
    storage: IStorageConfig;
  };
  performanceTargets: {
    responseTime: number; // in ms
    throughput: number; // requests per second
    availability: number; // percentage
    errorRate: number; // percentage
    resourceUtilization: {
      cpu: number; // percentage
      memory: number; // percentage
      disk: number; // percentage
      network: number; // percentage
    };
  };
  autoScaling: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetCPUUtilization: number;
    targetMemoryUtilization: number;
    scaleUpCooldown: number; // in seconds
    scaleDownCooldown: number; // in seconds
  };
  costOptimization: {
    enabled: boolean;
    budget: number;
    alerts: {
      threshold: number; // percentage
      recipients: string[];
    };
    recommendations: {
      autoApply: boolean;
      types: string[];
    };
  };
  disasterRecovery: {
    enabled: boolean;
    backupSchedule: string;
    retentionPeriod: number; // in days
    recoveryTimeObjective: number; // in minutes
    recoveryPointObjective: number; // in minutes
    failoverRegions: string[];
  };
}

export interface IDatabaseScaling {
  readReplicas: number;
  connectionPool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
  indexing: {
    strategy: 'automatic' | 'manual';
    indexes: IIndexConfig[];
  };
  partitioning: {
    enabled: boolean;
    strategy: 'horizontal' | 'vertical' | 'sharding';
    shards?: number;
    shardKey?: string;
  };
  caching: {
    enabled: boolean;
    strategy: 'read_through' | 'write_through' | 'write_back' | 'cache_aside';
    ttl: number; // in seconds
    maxSize: string; // e.g., '1GB'
  };
  queryOptimization: {
    enabled: boolean;
    slowQueryThreshold: number; // in ms
    queryPlanCache: boolean;
    connectionTimeout: number; // in ms
  };
}

export interface IAPIScaling {
  rateLimit: IRateLimitConfig;
  caching: ICacheConfig;
  loadBalancing: ILoadBalancerConfig;
  autoScaling: IAutoScalingConfig;
  compression: {
    enabled: boolean;
    level: number; // 1-9
    types: string[];
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number; // in ms
    expectedException: string[];
  };
  retryPolicy: {
    enabled: boolean;
    maxAttempts: number;
    backoffMultiplier: number;
    initialDelay: number; // in ms
  };
}

export interface ICacheConfig {
  enabled: boolean;
  provider: 'redis' | 'memcached' | 'memory';
  servers: string[];
  ttl: number; // in seconds
  maxSize: string;
  evictionPolicy: 'lru' | 'lfu' | 'random' | 'ttl';
  compression: boolean;
  encryption: boolean;
  backup: boolean;
}

export interface ILoadBalancerConfig {
  enabled: boolean;
  algorithm: 'round_robin' | 'least_connections' | 'ip_hash' | 'weighted';
  healthCheck: {
    enabled: boolean;
    interval: number; // in seconds
    timeout: number; // in seconds
    path: string;
    expectedStatus: number;
  };
  stickySessions: {
    enabled: boolean;
    cookieName: string;
    duration: number; // in seconds
  };
  sslTermination: {
    enabled: boolean;
    certificateArn?: string;
  };
}

export interface IMonitoringConfig {
  enabled: boolean;
  metrics: {
    system: boolean;
    application: boolean;
    business: boolean;
    custom: boolean;
  };
  alerts: {
    enabled: boolean;
    channels: string[];
    rules: IAlertRule[];
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    retention: number; // in days
    destinations: string[];
  };
  tracing: {
    enabled: boolean;
    samplingRate: number; // 0-1
    serviceName: string;
  };
}

export interface ISecurityConfig {
  rateLimiting: IRateLimitConfig;
  ddosProtection: {
    enabled: boolean;
    threshold: number; // requests per minute
    blacklist: string[];
    whitelist: string[];
  };
  encryption: {
    inTransit: boolean;
    atRest: boolean;
    keyManagement: 'aws_kms' | 'azure_key_vault' | 'google_cloud_kms' | 'hashicorp_vault';
  };
  authentication: {
    enabled: boolean;
    providers: string[];
    sessionTimeout: number; // in minutes
    mfa: boolean;
  };
  authorization: {
    enabled: boolean;
    strategy: 'rbac' | 'abac' | 'acl';
    defaultRole: string;
  };
  auditLogging: {
    enabled: boolean;
    level: 'basic' | 'detailed' | 'verbose';
    retention: number; // in days
  };
}

export interface ICDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'aws_cloudfront' | 'azure_cdn' | 'google_cloud_cdn';
  domains: string[];
  caching: {
    staticAssets: {
      enabled: boolean;
      ttl: number; // in seconds
      patterns: string[];
    };
    dynamicContent: {
      enabled: boolean;
      ttl: number; // in seconds
      cacheKey: string;
    };
  };
  compression: {
    enabled: boolean;
    types: string[];
  };
  security: {
    ssl: boolean;
    ddos: boolean;
    botProtection: boolean;
  };
}

export interface IStorageConfig {
  provider: 'aws_s3' | 'azure_blob' | 'google_cloud_storage' | 'minio';
  buckets: IBucketConfig[];
  lifecycle: ILifecycleConfig[];
  versioning: {
    enabled: boolean;
    maxVersions: number;
  };
  encryption: {
    enabled: boolean;
    type: 'sse_s3' | 'sse_kms' | 'customer_managed';
  };
  backup: {
    enabled: boolean;
    schedule: string;
    retention: number; // in days
    destination: string;
  };
}

export interface IIndexConfig {
  name: string;
  fields: string[];
  unique: boolean;
  sparse: boolean;
  background: boolean;
  weights?: Record<string, number>;
}

export interface IRateLimitConfig {
  enabled: boolean;
  windowSize: number; // in seconds
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: string;
  handler: string;
}

export interface IAutoScalingConfig {
  enabled: boolean;
  minInstances: number;
  maxInstances: number;
  targetCPUUtilization: number;
  targetMemoryUtilization: number;
  scaleUpCooldown: number; // in seconds
  scaleDownCooldown: number; // in seconds
}

export interface IAlertRule {
  name: string;
  condition: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  duration: number; // in minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
}

export interface IBucketConfig {
  name: string;
  region: string;
  accessLevel: 'private' | 'public' | 'readonly';
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
  };
}

export interface ILifecycleConfig {
  prefix: string;
  transitions: {
    days: number;
    storageClass: string;
  }[];
  expiration: {
    days: number;
  };
}

// Schema definitions
const IndexConfigSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  fields: [{
    type: String,
    required: true
  }],
  unique: {
    type: Boolean,
    default: false
  },
  sparse: {
    type: Boolean,
    default: false
  },
  background: {
    type: Boolean,
    default: true
  },
  weights: {
    type: Map,
    of: Number
  }
});

const RateLimitConfigSchema: Schema = new Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  windowSize: {
    type: Number,
    default: 60
  },
  maxRequests: {
    type: Number,
    default: 100
  },
  skipSuccessfulRequests: {
    type: Boolean,
    default: false
  },
  skipFailedRequests: {
    type: Boolean,
    default: false
  },
  keyGenerator: {
    type: String,
    default: 'ip'
  },
  handler: {
    type: String,
    default: 'default'
  }
});

const AutoScalingConfigSchema: Schema = new Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  minInstances: {
    type: Number,
    default: 1
  },
  maxInstances: {
    type: Number,
    default: 10
  },
  targetCPUUtilization: {
    type: Number,
    default: 70,
    min: 1,
    max: 100
  },
  targetMemoryUtilization: {
    type: Number,
    default: 80,
    min: 1,
    max: 100
  },
  scaleUpCooldown: {
    type: Number,
    default: 300
  },
  scaleDownCooldown: {
    type: Number,
    default: 600
  }
});

const AlertRuleSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  threshold: {
    type: Number,
    required: true
  },
  operator: {
    type: String,
    enum: ['gt', 'lt', 'eq', 'gte', 'lte'],
    required: true
  },
  duration: {
    type: Number,
    default: 5
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  channels: [{
    type: String,
    required: true
  }]
});

const BucketConfigSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['private', 'public', 'readonly'],
    default: 'private'
  },
  cors: {
    allowedOrigins: [{
      type: String,
      required: true
    }],
    allowedMethods: [{
      type: String,
      required: true
    }],
    allowedHeaders: [{
      type: String,
      required: true
    }]
  }
});

const LifecycleConfigSchema: Schema = new Schema({
  prefix: {
    type: String,
    required: true
  },
  transitions: [{
    days: {
      type: Number,
      required: true
    },
    storageClass: {
      type: String,
      required: true
    }
  }],
  expiration: {
    days: {
      type: Number,
      required: true
    }
  }
});

const CacheConfigSchema: Schema = new Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  provider: {
    type: String,
    enum: ['redis', 'memcached', 'memory'],
    default: 'redis'
  },
  servers: [{
    type: String,
    required: true
  }],
  ttl: {
    type: Number,
    default: 3600
  },
  maxSize: {
    type: String,
    default: '1GB'
  },
  evictionPolicy: {
    type: String,
    enum: ['lru', 'lfu', 'random', 'ttl'],
    default: 'lru'
  },
  compression: {
    type: Boolean,
    default: false
  },
  encryption: {
    type: Boolean,
    default: true
  },
  backup: {
    type: Boolean,
    default: true
  }
});

const LoadBalancerConfigSchema: Schema = new Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  algorithm: {
    type: String,
    enum: ['round_robin', 'least_connections', 'ip_hash', 'weighted'],
    default: 'round_robin'
  },
  healthCheck: {
    enabled: {
      type: Boolean,
      default: true
    },
    interval: {
      type: Number,
      default: 30
    },
    timeout: {
      type: Number,
      default: 5
    },
    path: {
      type: String,
      default: '/health'
    },
    expectedStatus: {
      type: Number,
      default: 200
    }
  },
  stickySessions: {
    enabled: {
      type: Boolean,
      default: false
    },
    cookieName: {
      type: String,
      default: 'sticky_session'
    },
    duration: {
      type: Number,
      default: 3600
    }
  },
  sslTermination: {
    enabled: {
      type: Boolean,
      default: true
    },
    certificateArn: {
      type: String
    }
  }
});

const MonitoringConfigSchema: Schema = new Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  metrics: {
    system: {
      type: Boolean,
      default: true
    },
    application: {
      type: Boolean,
      default: true
    },
    business: {
      type: Boolean,
      default: true
    },
    custom: {
      type: Boolean,
      default: true
    }
  },
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    channels: [{
      type: String,
      required: true
    }],
    rules: [AlertRuleSchema]
  },
  logging: {
    level: {
      type: String,
      enum: ['debug', 'info', 'warn', 'error'],
      default: 'info'
    },
    format: {
      type: String,
      enum: ['json', 'text'],
      default: 'json'
    },
    retention: {
      type: Number,
      default: 30
    },
    destinations: [{
      type: String,
      required: true
    }]
  },
  tracing: {
    enabled: {
      type: Boolean,
      default: true
    },
    samplingRate: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1
    },
    serviceName: {
      type: String,
      default: 'automedia-api'
    }
  }
});

const SecurityConfigSchema: Schema = new Schema({
  rateLimiting: RateLimitConfigSchema,
  ddosProtection: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 1000
    },
    blacklist: [{
      type: String
    }],
    whitelist: [{
      type: String
    }]
  },
  encryption: {
    inTransit: {
      type: Boolean,
      default: true
    },
    atRest: {
      type: Boolean,
      default: true
    },
    keyManagement: {
      type: String,
      enum: ['aws_kms', 'azure_key_vault', 'google_cloud_kms', 'hashicorp_vault'],
      default: 'aws_kms'
    }
  },
  authentication: {
    enabled: {
      type: Boolean,
      default: true
    },
    providers: [{
      type: String,
      required: true
    }],
    sessionTimeout: {
      type: Number,
      default: 1440 // 24 hours
    },
    mfa: {
      type: Boolean,
      default: false
    }
  },
  authorization: {
    enabled: {
      type: Boolean,
      default: true
    },
    strategy: {
      type: String,
      enum: ['rbac', 'abac', 'acl'],
      default: 'rbac'
    },
    defaultRole: {
      type: String,
      default: 'user'
    }
  },
  auditLogging: {
    enabled: {
      type: Boolean,
      default: true
    },
    level: {
      type: String,
      enum: ['basic', 'detailed', 'verbose'],
      default: 'basic'
    },
    retention: {
      type: Number,
      default: 365
    }
  }
});

const CDNConfigSchema: Schema = new Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  provider: {
    type: String,
    enum: ['cloudflare', 'aws_cloudfront', 'azure_cdn', 'google_cloud_cdn'],
    default: 'cloudflare'
  },
  domains: [{
    type: String,
    required: true
  }],
  caching: {
    staticAssets: {
      enabled: {
        type: Boolean,
        default: true
      },
      ttl: {
        type: Number,
        default: 86400 // 24 hours
      },
      patterns: [{
        type: String,
        required: true
      }]
    },
    dynamicContent: {
      enabled: {
        type: Boolean,
        default: false
      },
      ttl: {
        type: Number,
        default: 300 // 5 minutes
      },
      cacheKey: {
        type: String,
        default: 'default'
      }
    }
  },
  compression: {
    enabled: {
      type: Boolean,
      default: true
    },
    types: [{
      type: String,
      required: true
    }]
  },
  security: {
    ssl: {
      type: Boolean,
      default: true
    },
    ddos: {
      type: Boolean,
      default: true
    },
    botProtection: {
      type: Boolean,
      default: true
    }
  }
});

const StorageConfigSchema: Schema = new Schema({
  provider: {
    type: String,
    enum: ['aws_s3', 'azure_blob', 'google_cloud_storage', 'minio'],
    default: 'aws_s3'
  },
  buckets: [BucketConfigSchema],
  lifecycle: [LifecycleConfigSchema],
  versioning: {
    enabled: {
      type: Boolean,
      default: true
    },
    maxVersions: {
      type: Number,
      default: 5
    }
  },
  encryption: {
    enabled: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      enum: ['sse_s3', 'sse_kms', 'customer_managed'],
      default: 'sse_s3'
    }
  },
  backup: {
    enabled: {
      type: Boolean,
      default: true
    },
    schedule: {
      type: String,
      default: '0 2 * * *' // Daily at 2 AM
    },
    retention: {
      type: Number,
      default: 30
    },
    destination: {
      type: String,
      required: true
    }
  }
});

const DatabaseScalingSchema: Schema = new Schema({
  readReplicas: {
    type: Number,
    default: 2,
    min: 0
  },
  connectionPool: {
    min: {
      type: Number,
      default: 2
    },
    max: {
      type: Number,
      default: 10
    },
    idleTimeoutMillis: {
      type: Number,
      default: 30000
    }
  },
  indexing: {
    strategy: {
      type: String,
      enum: ['automatic', 'manual'],
      default: 'automatic'
    },
    indexes: [IndexConfigSchema]
  },
  partitioning: {
    enabled: {
      type: Boolean,
      default: false
    },
    strategy: {
      type: String,
      enum: ['horizontal', 'vertical', 'sharding'],
      default: 'horizontal'
    },
    shards: {
      type: Number
    },
    shardKey: {
      type: String
    }
  },
  caching: {
    enabled: {
      type: Boolean,
      default: true
    },
    strategy: {
      type: String,
      enum: ['read_through', 'write_through', 'write_back', 'cache_aside'],
      default: 'read_through'
    },
    ttl: {
      type: Number,
      default: 300
    },
    maxSize: {
      type: String,
      default: '1GB'
    }
  },
  queryOptimization: {
    enabled: {
      type: Boolean,
      default: true
    },
    slowQueryThreshold: {
      type: Number,
      default: 1000
    },
    queryPlanCache: {
      type: Boolean,
      default: true
    },
    connectionTimeout: {
      type: Number,
      default: 5000
    }
  }
});

const APIScalingSchema: Schema = new Schema({
  rateLimit: RateLimitConfigSchema,
  caching: CacheConfigSchema,
  loadBalancing: LoadBalancerConfigSchema,
  autoScaling: AutoScalingConfigSchema,
  compression: {
    enabled: {
      type: Boolean,
      default: true
    },
    level: {
      type: Number,
      default: 6,
      min: 1,
      max: 9
    },
    types: [{
      type: String,
      required: true
    }]
  },
  circuitBreaker: {
    enabled: {
      type: Boolean,
      default: true
    },
    failureThreshold: {
      type: Number,
      default: 5
    },
    recoveryTimeout: {
      type: Number,
      default: 30000
    },
    expectedException: [{
      type: String,
      required: true
    }]
  },
  retryPolicy: {
    enabled: {
      type: Boolean,
      default: true
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    backoffMultiplier: {
      type: Number,
      default: 2
    },
    initialDelay: {
      type: Number,
      default: 1000
    }
  }
});

const ScalingConfigSchema: Schema = new Schema({
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
  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: String,
    required: true,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  configurations: {
    database: DatabaseScalingSchema,
    api: APIScalingSchema,
    cache: CacheConfigSchema,
    loadBalancer: LoadBalancerConfigSchema,
    monitoring: MonitoringConfigSchema,
    security: SecurityConfigSchema,
    cdn: CDNConfigSchema,
    storage: StorageConfigSchema
  },
  performanceTargets: {
    responseTime: {
      type: Number,
      default: 200,
      min: 0
    },
    throughput: {
      type: Number,
      default: 1000,
      min: 0
    },
    availability: {
      type: Number,
      default: 99.9,
      min: 0,
      max: 100
    },
    errorRate: {
      type: Number,
      default: 1,
      min: 0,
      max: 100
    },
    resourceUtilization: {
      cpu: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
      },
      memory: {
        type: Number,
        default: 80,
        min: 0,
        max: 100
      },
      disk: {
        type: Number,
        default: 85,
        min: 0,
        max: 100
      },
      network: {
        type: Number,
        default: 80,
        min: 0,
        max: 100
      }
    }
  },
  autoScaling: {
    enabled: {
      type: Boolean,
      default: true
    },
    minInstances: {
      type: Number,
      default: 1,
      min: 0
    },
    maxInstances: {
      type: Number,
      default: 10,
      min: 0
    },
    targetCPUUtilization: {
      type: Number,
      default: 70,
      min: 1,
      max: 100
    },
    targetMemoryUtilization: {
      type: Number,
      default: 80,
      min: 1,
      max: 100
    },
    scaleUpCooldown: {
      type: Number,
      default: 300
    },
    scaleDownCooldown: {
      type: Number,
      default: 600
    }
  },
  costOptimization: {
    enabled: {
      type: Boolean,
      default: true
    },
    budget: {
      type: Number,
      default: 1000,
      min: 0
    },
    alerts: {
      threshold: {
        type: Number,
        default: 80,
        min: 0,
        max: 100
      },
      recipients: [{
        type: String,
        required: true
      }]
    },
    recommendations: {
      autoApply: {
        type: Boolean,
        default: false
      },
      types: [{
        type: String,
        required: true
      }]
    }
  },
  disasterRecovery: {
    enabled: {
      type: Boolean,
      default: true
    },
    backupSchedule: {
      type: String,
      default: '0 2 * * *'
    },
    retentionPeriod: {
      type: Number,
      default: 30,
      min: 0
    },
    recoveryTimeObjective: {
      type: Number,
      default: 60,
      min: 0
    },
    recoveryPointObjective: {
      type: Number,
      default: 15,
      min: 0
    },
    failoverRegions: [{
      type: String,
      required: true
    }]
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
ScalingConfigSchema.index({ environment: 1, isActive: 1 });
ScalingConfigSchema.index({ version: 1 });
ScalingConfigSchema.index({ lastUpdated: -1 });

// Pre-save middleware
ScalingConfigSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static methods
ScalingConfigSchema.statics.getActiveConfig = function(environment: string) {
  return this.findOne({ environment, isActive: true })
    .sort({ lastUpdated: -1 });
};

ScalingConfigSchema.statics.getConfigByVersion = function(version: string) {
  return this.findOne({ version });
};

ScalingConfigSchema.statics.getAllConfigs = function(environment?: string) {
  const filter = environment ? { environment } : {};
  return this.find(filter)
    .sort({ lastUpdated: -1 });
};

// Instance methods
ScalingConfigSchema.methods.activate = function() {
  // Deactivate other configs for the same environment
  return this.constructor.updateMany(
    { environment: this.environment, isActive: true, _id: { $ne: this._id } },
    { isActive: false }
  ).then(() => {
    this.isActive = true;
    return this.save();
  });
};

ScalingConfigSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

ScalingConfigSchema.methods.clone = function(newName: string, newVersion: string) {
  const cloned = new this.constructor({
    name: newName,
    version: newVersion,
    environment: this.environment,
    description: `Clone of ${this.description}`,
    configurations: this.configurations,
    performanceTargets: this.performanceTargets,
    autoScaling: this.autoScaling,
    costOptimization: this.costOptimization,
    disasterRecovery: this.disasterRecovery
  });
  return cloned.save();
};

export const ScalingConfig = mongoose.model<IScalingConfig>('ScalingConfig', ScalingConfigSchema);