import mongoose, { Schema, Document } from 'mongoose';

export interface IUATStep extends Document {
  step: number;
  action: string;
  expected: string;
  actual?: string;
  passed?: boolean;
  notes?: string;
  evidence?: {
    type: 'screenshot' | 'video' | 'log' | 'file';
    url: string;
    description?: string;
  };
  timestamp?: Date;
}

export interface IUATResult extends Document {
  userId: string;
  betaUserId?: string;
  scenarioId: string;
  steps: IUATStep[];
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  overallResult: 'passed' | 'failed' | 'partial' | 'not_tested';
  successRate: number; // 0-100
  environment: {
    platform: string;
    browser: string;
    version: string;
    device?: string;
    os?: string;
  };
  issues: {
    step: number;
    issue: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    screenshot?: string;
  }[];
  feedback: {
    rating: number; // 1-5
    comments: string;
    suggestions: string[];
  };
  createdAt: Date;
}

export interface IUATScenario extends Document {
  name: string;
  description: string;
  type: 'functional' | 'usability' | 'performance' | 'security' | 'integration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  tags: string[];
  steps: IUATStep[];
  expectedOutcome: string;
  successCriteria: string[];
  preconditions: string[];
  testData?: {
    type: string;
    data: any;
    description?: string;
  }[];
  assignedUsers: string[];
  assignedRoles: string[];
  estimatedDuration: number; // in minutes
  maxAttempts: number;
  results: IUATResult[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  version: number;
  dependencies?: string[]; // IDs of dependent scenarios
  createdBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UATStepSchema: Schema = new Schema({
  step: {
    type: Number,
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  expected: {
    type: String,
    required: true,
    trim: true
  },
  actual: {
    type: String,
    trim: true
  },
  passed: {
    type: Boolean
  },
  notes: {
    type: String,
    trim: true
  },
  evidence: {
    type: {
      type: String,
      enum: ['screenshot', 'video', 'log', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const UATResultSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  betaUserId: {
    type: String,
    ref: 'BetaUser'
  },
  scenarioId: {
    type: String,
    required: true,
    ref: 'UATScenario'
  },
  steps: [UATStepSchema],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  overallResult: {
    type: String,
    enum: ['passed', 'failed', 'partial', 'not_tested'],
    default: 'not_tested'
  },
  successRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  environment: {
    platform: {
      type: String,
      required: true
    },
    browser: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    device: {
      type: String
    },
    os: {
      type: String
    }
  },
  issues: [{
    step: {
      type: Number,
      required: true
    },
    issue: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    screenshot: {
      type: String
    }
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    comments: {
      type: String,
      trim: true
    },
    suggestions: [{
      type: String,
      trim: true
    }]
  }
}, {
  timestamps: true
});

const UATScenarioSchema: Schema = new Schema({
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
    enum: ['functional', 'usability', 'performance', 'security', 'integration'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  steps: [UATStepSchema],
  expectedOutcome: {
    type: String,
    required: true,
    trim: true
  },
  successCriteria: [{
    type: String,
    trim: true
  }],
  preconditions: [{
    type: String,
    trim: true
  }],
  testData: [{
    type: {
      type: String,
      required: true
    },
    data: {
      type: Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  assignedUsers: [{
    type: String,
    ref: 'User'
  }],
  assignedRoles: [{
    type: String,
    trim: true
  }],
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1
  },
  maxAttempts: {
    type: Number,
    default: 3,
    min: 1
  },
  results: [UATResultSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },
  dependencies: [{
    type: String,
    ref: 'UATScenario'
  }],
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
UATScenarioSchema.index({ type: 1 });
UATScenarioSchema.index({ priority: 1 });
UATScenarioSchema.index({ category: 1 });
UATScenarioSchema.index({ status: 1 });
UATScenarioSchema.index({ assignedUsers: 1 });
UATScenarioSchema.index({ createdBy: 1 });
UATScenarioSchema.index({ createdAt: -1 });
UATScenarioSchema.index({ tags: 1 });

// Compound indexes
UATScenarioSchema.index({ type: 1, status: 1 });
UATScenarioSchema.index({ priority: 1, status: 1 });
UATScenarioSchema.index({ category: 1, status: 1 });

// Virtual for calculated fields
UATScenarioSchema.virtual('completionRate').get(function() {
  if (!this.results || this.results.length === 0) return 0;
  const completed = this.results.filter((r: any) => r.overallResult === 'passed').length;
  return (completed / this.results.length) * 100;
});

UATScenarioSchema.virtual('averageSuccessRate').get(function() {
  if (!this.results || this.results.length === 0) return 0;
  const totalSuccessRate = this.results.reduce((sum: number, r: any) => sum + (r.successRate || 0), 0);
  return totalSuccessRate / this.results.length;
});

UATScenarioSchema.virtual('averageRating').get(function() {
  if (!this.results || this.results.length === 0) return 0;
  const totalRating = this.results.reduce((sum: number, r: any) => sum + (r.feedback?.rating || 0), 0);
  return totalRating / this.results.length;
});

UATScenarioSchema.virtual('totalIssues').get(function() {
  if (!this.results) return 0;
  return this.results.reduce((total: number, r: any) => total + (r.issues?.length || 0), 0);
});

// Pre-save middleware
UATScenarioSchema.pre('save', function(next) {
  // Sort steps by step number
  this.steps.sort((a: any, b: any) => a.step - b.step);
  next();
});

// Static methods
UATScenarioSchema.statics.getActiveScenarios = function() {
  return this.find({ status: 'active' })
    .populate('createdBy', 'name email')
    .sort({ priority: -1, createdAt: 1 });
};

UATScenarioSchema.statics.getScenariosByType = function(type: string) {
  return this.find({ type })
    .populate('createdBy', 'name email')
    .sort({ priority: -1, createdAt: 1 });
};

UATScenarioSchema.statics.getScenariosByCategory = function(category: string) {
  return this.find({ category })
    .populate('createdBy', 'name email')
    .sort({ priority: -1, createdAt: 1 });
};

UATScenarioSchema.statics.getAssignedScenarios = function(userId: string) {
  return this.find({
    $or: [
      { assignedUsers: userId },
      { assignedRoles: { $in: ['beta_user', 'tester'] } }
    ],
    status: { $in: ['active', 'paused'] }
  })
    .populate('createdBy', 'name email')
    .sort({ priority: -1, createdAt: 1 });
};

UATScenarioSchema.statics.getCompletedScenarios = function() {
  return this.find({ status: 'completed' })
    .populate('createdBy', 'name email')
    .sort({ updatedAt: -1 });
};

UATScenarioSchema.statics.searchScenarios = function(query: string) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } }
    ]
  })
    .populate('createdBy', 'name email')
    .sort({ priority: -1, createdAt: 1 });
};

// Instance methods
UATScenarioSchema.methods.assignToUser = function(userId: string) {
  if (!this.assignedUsers.includes(userId)) {
    this.assignedUsers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

UATScenarioSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

UATScenarioSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

UATScenarioSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

UATScenarioSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

UATScenarioSchema.methods.addResult = function(result: Partial<IUATResult>) {
  this.results.push(result as any);
  return this.save();
};

UATScenarioSchema.methods.calculateMetrics = function() {
  const results = this.results || [];
  const totalResults = results.length;
  const passedResults = results.filter((r: any) => r.overallResult === 'passed').length;
  const failedResults = results.filter((r: any) => r.overallResult === 'failed').length;
  const partialResults = results.filter((r: any) => r.overallResult === 'partial').length;

  return {
    totalResults,
    passedResults,
    failedResults,
    partialResults,
    completionRate: totalResults > 0 ? (passedResults / totalResults) * 100 : 0,
    averageSuccessRate: this.averageSuccessRate,
    averageRating: this.averageRating,
    totalIssues: this.totalIssues
  };
};

export const UATScenario = mongoose.model<IUATScenario>('UATScenario', UATScenarioSchema);
export const UATResult = mongoose.model<IUATResult>('UATResult', UATResultSchema);
export const UATStep = mongoose.model<IUATStep>('UATStep', UATStepSchema);