import mongoose, { Schema, Document } from 'mongoose';

export interface IUserFeedback extends Document {
  userId: string;
  betaUserId?: string;
  type: 'bug' | 'feature' | 'improvement' | 'general' | 'ui_ux' | 'performance';
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  severity?: 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker';
  title: string;
  description: string;
  steps: string[];
  expected?: string;
  actual?: string;
  screenshots: {
    url: string;
    description?: string;
    timestamp: Date;
  }[];
  environment: {
    platform: string;
    browser: string;
    version: string;
    device?: string;
    os?: string;
    screenSize?: string;
  };
  url?: string;
  reproduction: {
    frequency: 'always' | 'sometimes' | 'rarely';
    consistency: 'consistent' | 'intermittent';
  };
  status: 'open' | 'in_progress' | 'investigating' | 'resolved' | 'closed' | 'deferred' | 'duplicate';
  assignee?: string;
  labels: string[];
  tags: string[];
  sentiment: {
    score: number; // -1 to 1
    confidence: number; // 0 to 1
    analysis: string;
  };
  impact: {
    users: number;
    frequency: number;
    business: 'low' | 'medium' | 'high' | 'critical';
  };
  resolution?: {
    resolution: string;
    solution: string;
    assignee: string;
    resolvedAt: Date;
    timeToResolve: number; // in hours
  };
  votes: {
    upvotes: number;
    downvotes: number;
    totalVotes: number;
    votedBy: string[];
  };
  duplicates: string[];
  relatedIssues: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserFeedbackSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  betaUserId: {
    type: String,
    ref: 'BetaUser'
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'improvement', 'general', 'ui_ux', 'performance'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'urgent'],
    default: 'medium'
  },
  severity: {
    type: String,
    enum: ['cosmetic', 'minor', 'major', 'critical', 'blocker'],
    default: 'minor'
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
  steps: [{
    type: String,
    trim: true
  }],
  expected: {
    type: String,
    trim: true
  },
  actual: {
    type: String,
    trim: true
  },
  screenshots: [{
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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
    },
    screenSize: {
      type: String
    }
  },
  url: {
    type: String,
    trim: true
  },
  reproduction: {
    frequency: {
      type: String,
      enum: ['always', 'sometimes', 'rarely'],
      default: 'sometimes'
    },
    consistency: {
      type: String,
      enum: ['consistent', 'intermittent'],
      default: 'intermittent'
    }
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'investigating', 'resolved', 'closed', 'deferred', 'duplicate'],
    default: 'open'
  },
  assignee: {
    type: String,
    ref: 'User'
  },
  labels: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  sentiment: {
    score: {
      type: Number,
      min: -1,
      max: 1,
      default: 0
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    analysis: {
      type: String,
      trim: true
    }
  },
  impact: {
    users: {
      type: Number,
      default: 1,
      min: 1
    },
    frequency: {
      type: Number,
      default: 1,
      min: 0
    },
    business: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  resolution: {
    resolution: {
      type: String,
      trim: true
    },
    solution: {
      type: String,
      trim: true
    },
    assignee: {
      type: String,
      ref: 'User'
    },
    resolvedAt: {
      type: Date
    },
    timeToResolve: {
      type: Number
    }
  },
  votes: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    totalVotes: {
      type: Number,
      default: 0
    },
    votedBy: [{
      type: String,
      ref: 'User'
    }]
  },
  duplicates: [{
    type: String,
    ref: 'UserFeedback'
  }],
  relatedIssues: [{
    type: String,
    ref: 'UserFeedback'
  }]
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
UserFeedbackSchema.index({ userId: 1 });
UserFeedbackSchema.index({ betaUserId: 1 });
UserFeedbackSchema.index({ type: 1 });
UserFeedbackSchema.index({ category: 1 });
UserFeedbackSchema.index({ priority: 1 });
UserFeedbackSchema.index({ status: 1 });
UserFeedbackSchema.index({ assignee: 1 });
UserFeedbackSchema.index({ labels: 1 });
UserFeedbackSchema.index({ createdAt: -1 });
UserFeedbackSchema.index({ sentiment: -1 });
UserFeedbackSchema.index({ 'impact.business': 1 });

// Compound indexes
UserFeedbackSchema.index({ type: 1, status: 1 });
UserFeedbackSchema.index({ priority: 1, status: 1 });
UserFeedbackSchema.index({ category: 1, subcategory: 1 });
UserFeedbackSchema.index({ createdAt: -1, status: 1 });

// Virtual for calculated fields
UserFeedbackSchema.virtual('urgencyScore').get(function() {
  const priorityScore = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
    urgent: 5
  };

  const severityScore = {
    cosmetic: 1,
    minor: 2,
    major: 3,
    critical: 4,
    blocker: 5
  };

  const impactScore = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };

  return (priorityScore[this.priority as keyof typeof priorityScore] || 1) *
         (severityScore[this.severity as keyof typeof severityScore] || 1) *
         (impactScore[this.impact?.business as keyof typeof impactScore] || 1);
});

UserFeedbackSchema.virtual('isHighPriority').get(function() {
  return this.priority === 'critical' ||
         this.priority === 'urgent' ||
         this.severity === 'critical' ||
         this.severity === 'blocker' ||
         this.impact.business === 'critical';
});

// Pre-save middleware
UserFeedbackSchema.pre('save', function(next) {
  // Update total votes
  this.votes.totalVotes = this.votes.upvotes + this.votes.downvotes;

  // Calculate time to resolve if resolved
  if (this.resolution && this.resolution.resolvedAt && !this.resolution.timeToResolve) {
    this.resolution.timeToResolve = Math.round(
      (this.resolution.resolvedAt.getTime() - this.createdAt.getTime()) / (1000 * 60 * 60)
    );
  }

  next();
});

// Static methods
UserFeedbackSchema.statics.getHighPriorityIssues = function() {
  return this.find({
    $or: [
      { priority: { $in: ['critical', 'urgent'] } },
      { severity: { $in: ['critical', 'blocker'] } },
      { 'impact.business': 'critical' }
    ],
    status: { $in: ['open', 'in_progress', 'investigating'] }
  });
};

UserFeedbackSchema.statics.getIssuesByType = function(type: string) {
  return this.find({ type });
};

UserFeedbackSchema.statics.getIssuesByCategory = function(category: string) {
  return this.find({ category });
};

UserFeedbackSchema.statics.getAssignedIssues = function(assigneeId: string) {
  return this.find({ assignee: assigneeId });
};

UserFeedbackSchema.statics.getUnassignedIssues = function() {
  return this.find({
    assignee: { $exists: false },
    status: { $in: ['open', 'in_progress'] }
  });
};

UserFeedbackSchema.statics.searchFeedback = function(query: string) {
  return this.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { labels: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } }
    ]
  });
};

// Instance methods
UserFeedbackSchema.methods.vote = function(userId: string, voteType: 'up' | 'down') {
  const votedIndex = this.votes.votedBy.indexOf(userId);

  if (votedIndex === -1) {
    // New vote
    this.votes.votedBy.push(userId);
    if (voteType === 'up') {
      this.votes.upvotes += 1;
    } else {
      this.votes.downvotes += 1;
    }
  } else {
    // Change vote or remove
    this.votes.votedBy.splice(votedIndex, 1);
    if (voteType === 'up') {
      this.votes.upvotes = Math.max(0, this.votes.upvotes - 1);
    } else {
      this.votes.downvotes = Math.max(0, this.votes.downvotes - 1);
    }
  }

  this.votes.totalVotes = this.votes.upvotes + this.votes.downvotes;
  return this.save();
};

UserFeedbackSchema.methods.assignTo = function(assigneeId: string) {
  this.assignee = assigneeId;
  this.status = 'in_progress';
  return this.save();
};

UserFeedbackSchema.methods.resolve = function(resolution: string, solution: string, assigneeId: string) {
  this.status = 'resolved';
  this.resolution = {
    resolution,
    solution,
    assignee: assigneeId,
    resolvedAt: new Date(),
    timeToResolve: Math.round((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60))
  };
  return this.save();
};

UserFeedbackSchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

UserFeedbackSchema.methods.addDuplicate = function(duplicateId: string) {
  if (!this.duplicates.includes(duplicateId)) {
    this.duplicates.push(duplicateId);
    return this.save();
  }
  return Promise.resolve(this);
};

export const UserFeedback = mongoose.model<IUserFeedback>('UserFeedback', UserFeedbackSchema);