import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureRequest extends Document {
  title: string;
  description: string;
  userId: string;
  betaUserId?: string;
  category: string;
  subcategory?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'enhancement' | 'new_feature' | 'bug_fix' | 'improvement' | 'integration';
  status: 'draft' | 'under_review' | 'planned' | 'in_progress' | 'testing' | 'released' | 'declined' | 'duplicate';

  // Methods
  vote(userId: string, voteType: 'up' | 'down', weight?: number): void;
  impact: {
    users: number;
    business_value: 'low' | 'medium' | 'high' | 'critical';
    effort: 'low' | 'medium' | 'high' | 'very_high';
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  requirements: {
    functional: string[];
    technical: string[];
    design: string[];
    user_experience: string[];
  };
  acceptanceCriteria: string[];
  useCases: {
    title: string;
    description: string;
    steps: string[];
    expectedOutcome: string;
  }[];
  dependencies: string[];
  attachments: {
    type: 'image' | 'document' | 'video' | 'link';
    url: string;
    description?: string;
    filename?: string;
    size?: number;
  }[];
  votes: {
    upvotes: number;
    downvotes: number;
    totalVotes: number;
    votedBy: string[];
  };
  duplicates: string[];
  relatedIssues: string[];
  timeline: {
    requested: Date;
    underReview?: Date;
    planned?: Date;
    inProgress?: Date;
    testing?: Date;
    released?: Date;
    declined?: Date;
  };
  team: {
    productManager?: string;
    developer?: string;
    designer?: string;
    qa?: string;
  };
  releaseInfo?: {
    version: string;
    releaseDate: Date;
    releaseNotes: string;
    changelogUrl?: string;
  };
  tags: string[];
  metadata: {
    source: string;
    referrer?: string;
    campaign?: string;
    userSegment?: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  voteScore?: number;
}

export interface IFeatureComment extends Document {
  requestId: string;
  userId: string;
  betaUserId?: string;
  content: string;
  type: 'comment' | 'update' | 'decision' | 'question' | 'answer';
  attachments?: {
    type: 'image' | 'document' | 'link';
    url: string;
    description?: string;
  }[];
  mentions: string[];
  isInternal: boolean;
  parentId?: string; // For threaded comments
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeatureVote extends Document {
  requestId: string;
  userId: string;
  betaUserId?: string;
  vote: 'up' | 'down';
  weight: number; // Based on user level/contribution
  createdAt: Date;
}

export interface IFeaturePriority extends Document {
  requestId: string;
  score: number;
  criteria: {
    userImpact: number;
    businessValue: number;
    strategicAlignment: number;
    technicalFeasibility: number;
    urgency: number;
    effort: number;
  };
  breakdown: {
    userImpact: {
      score: number;
      reasoning: string;
    };
    businessValue: {
      score: number;
      reasoning: string;
    };
    strategicAlignment: {
      score: number;
      reasoning: string;
    };
    technicalFeasibility: {
      score: number;
      reasoning: string;
    };
    urgency: {
      score: number;
      reasoning: string;
    };
    effort: {
      score: number;
      reasoning: string;
    };
  };
  calculatedBy: string;
  calculatedAt: Date;
  expiresAt?: Date;
}

const FeatureRequestSchema: Schema = new Schema({
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
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  betaUserId: {
    type: String,
    ref: 'BetaUser'
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
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['enhancement', 'new_feature', 'bug_fix', 'improvement', 'integration'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'under_review', 'planned', 'in_progress', 'testing', 'released', 'declined', 'duplicate'],
    default: 'draft'
  },
  impact: {
    users: {
      type: Number,
      default: 1,
      min: 0
    },
    business_value: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    effort: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium'
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  },
  requirements: {
    functional: [{
      type: String,
      trim: true
    }],
    technical: [{
      type: String,
      trim: true
    }],
    design: [{
      type: String,
      trim: true
    }],
    user_experience: [{
      type: String,
      trim: true
    }]
  },
  acceptanceCriteria: [{
    type: String,
    trim: true
  }],
  useCases: [{
    title: {
      type: String,
      required: true,
      trim: true
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
    expectedOutcome: {
      type: String,
      required: true,
      trim: true
    }
  }],
  dependencies: [{
    type: String,
    ref: 'FeatureRequest'
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'link'],
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
    filename: {
      type: String,
      trim: true
    },
    size: {
      type: Number
    }
  }],
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
    ref: 'FeatureRequest'
  }],
  relatedIssues: [{
    type: String,
    ref: 'UserFeedback'
  }],
  timeline: {
    requested: {
      type: Date,
      default: Date.now
    },
    underReview: {
      type: Date
    },
    planned: {
      type: Date
    },
    inProgress: {
      type: Date
    },
    testing: {
      type: Date
    },
    released: {
      type: Date
    },
    declined: {
      type: Date
    }
  },
  team: {
    productManager: {
      type: String,
      ref: 'User'
    },
    developer: {
      type: String,
      ref: 'User'
    },
    designer: {
      type: String,
      ref: 'User'
    },
    qa: {
      type: String,
      ref: 'User'
    }
  },
  releaseInfo: {
    version: {
      type: String,
      trim: true
    },
    releaseDate: {
      type: Date
    },
    releaseNotes: {
      type: String,
      trim: true
    },
    changelogUrl: {
      type: String,
      trim: true
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    source: {
      type: String,
      required: true,
      trim: true
    },
    referrer: {
      type: String,
      trim: true
    },
    campaign: {
      type: String,
      trim: true
    },
    userSegment: {
      type: String,
      trim: true
    }
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

const FeatureCommentSchema: Schema = new Schema({
  requestId: {
    type: String,
    required: true,
    ref: 'FeatureRequest'
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
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['comment', 'update', 'decision', 'question', 'answer'],
    default: 'comment'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'link'],
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
  }],
  mentions: [{
    type: String,
    ref: 'User'
  }],
  isInternal: {
    type: Boolean,
    default: false
  },
  parentId: {
    type: String,
    ref: 'FeatureComment'
  }
}, {
  timestamps: true
});

const FeatureVoteSchema: Schema = new Schema({
  requestId: {
    type: String,
    required: true,
    ref: 'FeatureRequest'
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
  vote: {
    type: String,
    enum: ['up', 'down'],
    required: true
  },
  weight: {
    type: Number,
    default: 1,
    min: 0.1,
    max: 10
  }
}, {
  timestamps: true
});

const FeaturePrioritySchema: Schema = new Schema({
  requestId: {
    type: String,
    required: true,
    ref: 'FeatureRequest'
  },
  score: {
    type: Number,
    required: true
  },
  criteria: {
    userImpact: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    businessValue: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    strategicAlignment: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    technicalFeasibility: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    urgency: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },
    effort: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    }
  },
  breakdown: {
    userImpact: {
      score: {
        type: Number,
        required: true
      },
      reasoning: {
        type: String,
        required: true,
        trim: true
      }
    },
    businessValue: {
      score: {
        type: Number,
        required: true
      },
      reasoning: {
        type: String,
        required: true,
        trim: true
      }
    },
    strategicAlignment: {
      score: {
        type: Number,
        required: true
      },
      reasoning: {
        type: String,
        required: true,
        trim: true
      }
    },
    technicalFeasibility: {
      score: {
        type: Number,
        required: true
      },
      reasoning: {
        type: String,
        required: true,
        trim: true
      }
    },
    urgency: {
      score: {
        type: Number,
        required: true
      },
      reasoning: {
        type: String,
        required: true,
        trim: true
      }
    },
    effort: {
      score: {
        type: Number,
        required: true
      },
      reasoning: {
        type: String,
        required: true,
        trim: true
      }
    }
  },
  calculatedBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

// Indexes for performance
FeatureRequestSchema.index({ userId: 1, createdAt: -1 });
FeatureRequestSchema.index({ status: 1, priority: 1 });
FeatureRequestSchema.index({ category: 1, subcategory: 1 });
FeatureRequestSchema.index({ type: 1, status: 1 });
FeatureRequestSchema.index({ 'impact.business_value': 1 });
FeatureRequestSchema.index({ 'impact.urgency': 1 });
FeatureRequestSchema.index({ tags: 1 });
FeatureRequestSchema.index({ createdAt: -1 });
FeatureRequestSchema.index({ 'timeline.released': -1 });

FeatureCommentSchema.index({ requestId: 1, createdAt: -1 });
FeatureCommentSchema.index({ userId: 1, createdAt: -1 });
FeatureCommentSchema.index({ parentId: 1 });

FeatureVoteSchema.index({ requestId: 1, userId: 1 });
FeatureVoteSchema.index({ userId: 1, createdAt: -1 });

FeaturePrioritySchema.index({ requestId: 1, calculatedAt: -1 });
FeaturePrioritySchema.index({ score: -1 });
FeaturePrioritySchema.index({ calculatedBy: 1, calculatedAt: -1 });

// Virtual for calculated fields
FeatureRequestSchema.virtual('voteScore').get(function() {
  return this.votes.upvotes - this.votes.downvotes;
});

FeatureRequestSchema.virtual('popularityScore').get(function() {
  const voteWeight = this.votes.totalVotes * 2;
  const impactWeight = this.impact.users * 3;
  const businessWeight = this.getBusinessValueWeight();
  return voteWeight + impactWeight + businessWeight;
});

FeatureRequestSchema.virtual('estimatedEffort').get(function() {
  const effortMap = {
    'low': 1,
    'medium': 3,
    'high': 5,
    'very_high': 8
  };
  return effortMap[this.impact.effort as keyof typeof effortMap] || 3;
});

FeatureRequestSchema.virtual('roi').get(function() {
  const businessValueWeight = this.getBusinessValueWeight();
  const effort = this.estimatedEffort;
  return effort > 0 ? businessValueWeight / effort : 0;
});

FeatureRequestSchema.virtual('timeInStatus').get(function() {
  const now = new Date();
  const statusTransitions = Object.entries(this.timeline)
    .filter(([key, value]) => value && key !== 'requested')
    .map(([key, date]) => ({ status: key, date: new Date(date as string) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (statusTransitions.length === 0) {
    return now.getTime() - new Date(this.timeline.requested).getTime();
  }

  let totalTime = 0;
  let lastDate = new Date(this.timeline.requested);

  for (const transition of statusTransitions) {
    totalTime += transition.date.getTime() - lastDate.getTime();
    lastDate = transition.date;
  }

  totalTime += now.getTime() - lastDate.getTime();
  return totalTime;
});

// Pre-save middleware
FeatureRequestSchema.pre('save', function(next) {
  // Update total votes
  this.votes.totalVotes = this.votes.upvotes + this.votes.downvotes;

  // Update timeline based on status changes
  if (this.isModified('status')) {
    const statusMap: { [key: string]: string } = {
      'under_review': 'underReview',
      'planned': 'planned',
      'in_progress': 'inProgress',
      'testing': 'testing',
      'released': 'released',
      'declined': 'declined'
    };

    const timelineField = statusMap[this.status];
    if (timelineField && !this.timeline[timelineField as keyof typeof this.timeline]) {
      (this.timeline as any)[timelineField] = new Date();
    }
  }

  next();
});

// Instance methods
FeatureRequestSchema.methods.getBusinessValueWeight = function() {
  const businessValueMap = {
    'low': 1,
    'medium': 3,
    'high': 5,
    'critical': 10
  };
  return businessValueMap[this.impact.business_value as keyof typeof businessValueMap] || 3;
};

FeatureRequestSchema.methods.vote = function(userId: string, voteType: 'up' | 'down', weight = 1) {
  const votedIndex = this.votes.votedBy.indexOf(userId);

  if (votedIndex === -1) {
    // New vote
    this.votes.votedBy.push(userId);
    if (voteType === 'up') {
      this.votes.upvotes += weight;
    } else {
      this.votes.downvotes += weight;
    }
  } else {
    // Change vote or remove
    this.votes.votedBy.splice(votedIndex, 1);
    if (voteType === 'up') {
      this.votes.upvotes = Math.max(0, this.votes.upvotes - weight);
    } else {
      this.votes.downvotes = Math.max(0, this.votes.downvotes - weight);
    }
  }

  this.votes.totalVotes = this.votes.upvotes + this.votes.downvotes;
  return this.save();
};

FeatureRequestSchema.methods.moveToStatus = function(newStatus: string, userId?: string) {
  this.status = newStatus;

  const statusMap: { [key: string]: string } = {
    'under_review': 'underReview',
    'planned': 'planned',
    'in_progress': 'inProgress',
    'testing': 'testing',
    'released': 'released',
    'declined': 'declined'
  };

  const timelineField = statusMap[newStatus];
  if (timelineField) {
    (this.timeline as any)[timelineField] = new Date();
  }

  return this.save();
};

FeatureRequestSchema.methods.assignTo = function(role: string, userId: string) {
  this.team[role as keyof typeof this.team] = userId;
  return this.save();
};

FeatureRequestSchema.methods.addComment = function(commentData: any) {
  // This would be handled by the Comment model
  return Promise.resolve(this);
};

// Static methods
FeatureRequestSchema.statics.getByStatus = function(status: string) {
  return this.find({ status })
    .populate('userId betaUserId team.productManager team.developer team.designer team.qa')
    .sort({ priority: -1, createdAt: -1 });
};

FeatureRequestSchema.statics.getByCategory = function(category: string) {
  return this.find({ category })
    .populate('userId betaUserId')
    .sort({ createdAt: -1 });
};

FeatureRequestSchema.statics.getByPriority = function(priority: string) {
  return this.find({ priority })
    .populate('userId betaUserId')
    .sort({ createdAt: -1 });
};

FeatureRequestSchema.statics.getPopularFeatures = function(limit = 10) {
  return this.find({ status: { $in: ['under_review', 'planned', 'in_progress'] } })
    .sort({ 'votes.upvotes': -1, 'impact.users': -1 })
    .limit(limit)
    .populate('userId betaUserId');
};

FeatureRequestSchema.statics.searchFeatureRequests = function(query: string) {
  return this.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { subcategory: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } }
    ]
  })
    .populate('userId betaUserId')
    .sort({ createdAt: -1 });
};

FeatureRequestSchema.statics.getFeatureBacklog = function() {
  return this.find({ status: { $in: ['planned', 'in_progress'] } })
    .populate('userId betaUserId team.productManager team.developer team.designer team.qa')
    .sort({ priority: -1, 'impact.urgency': -1 });
};

FeatureRequestSchema.statics.getReleasedFeatures = function(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return this.find({
    status: 'released',
    'timeline.released': { $gte: date }
  })
    .populate('userId betaUserId team.productManager team.developer team.designer team.qa')
    .sort({ 'timeline.released': -1 });
};

export const FeatureRequest = mongoose.model<IFeatureRequest>('FeatureRequest', FeatureRequestSchema);
export const FeatureComment = mongoose.model<IFeatureComment>('FeatureComment', FeatureCommentSchema);
export const FeatureVote = mongoose.model<IFeatureVote>('FeatureVote', FeatureVoteSchema);
export const FeaturePriority = mongoose.model<IFeaturePriority>('FeaturePriority', FeaturePrioritySchema);