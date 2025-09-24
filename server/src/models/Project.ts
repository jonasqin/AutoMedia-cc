import mongoose, { Schema } from 'mongoose';

const ProjectSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  type: {
    type: String,
    required: [true, 'Project type is required'],
    enum: ['content_campaign', 'brand_management', 'social_media_strategy', 'market_research', 'crisis_management', 'product_launch'],
    default: 'content_campaign',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },
  settings: {
    autoGenerate: {
      type: Boolean,
      default: false,
    },
    generateFrequency: {
      type: String,
      enum: ['manual', 'hourly', 'daily', 'weekly', 'monthly'],
      default: 'manual',
    },
    maxContentPerPeriod: {
      type: Number,
      default: 10,
      min: [1, 'Must generate at least 1 content item per period'],
    },
    qualityThreshold: {
      type: Number,
      default: 70,
      min: [0, 'Quality threshold cannot be negative'],
      max: [100, 'Quality threshold cannot exceed 100'],
    },
    approvalRequired: {
      type: Boolean,
      default: true,
    },
    platforms: [{
      type: String,
      enum: ['twitter', 'xiaohongshu', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin'],
    }],
    languages: [{
      type: String,
      enum: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'pt', 'ru', 'ar'],
      default: 'en',
    }],
    targetAudience: {
      demographics: {
        ageRange: {
          min: {
            type: Number,
            min: [13, 'Minimum age cannot be less than 13'],
          },
          max: {
            type: Number,
          },
        },
        gender: [{
          type: String,
          enum: ['male', 'female', 'other'],
        }],
        location: [{
          type: String,
        }],
        interests: [{
          type: String,
        }],
      },
      psychographics: {
        values: [{
          type: String,
        }],
        lifestyle: [{
          type: String,
        }],
        personality: [{
          type: String,
        }],
      },
    },
  },
  objectives: {
    primary: {
      type: String,
      required: [true, 'Primary objective is required'],
      enum: ['brand_awareness', 'lead_generation', 'community_building', 'customer_support', 'sales_conversion', 'thought_leadership'],
    },
    secondary: [{
      type: String,
      enum: ['brand_awareness', 'lead_generation', 'community_building', 'customer_support', 'sales_conversion', 'thought_leadership'],
    }],
    kpis: [{
      name: {
        type: String,
        required: true,
      },
      target: {
        type: Number,
        required: true,
      },
      current: {
        type: Number,
        default: 0,
      },
      unit: {
        type: String,
        default: 'count',
      },
      deadline: {
        type: Date,
      },
    }],
  },
  topics: [{
    topicId: {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    weight: {
      type: Number,
      default: 1,
      min: [0, 'Weight cannot be negative'],
      max: [10, 'Weight cannot exceed 10'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  agents: [{
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'reviewer', 'optimizer'],
      default: 'secondary',
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, 'Priority cannot be less than 1'],
      max: [10, 'Priority cannot exceed 10'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  materials: [{
    materialId: {
      type: Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
    },
    usageType: {
      type: String,
      enum: ['reference', 'template', 'source', 'example'],
      default: 'reference',
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
  }],
  budget: {
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total budget cannot be negative'],
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent budget cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
    },
    perContentItem: {
      type: Number,
      default: 0,
      min: [0, 'Per item budget cannot be negative'],
    },
  },
  timeline: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    milestones: [{
      name: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      description: {
        type: String,
      },
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'delayed'],
        default: 'pending',
      },
    }],
  },
  team: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'viewer',
    },
    permissions: {
      canEdit: {
        type: Boolean,
        default: false,
      },
      canDelete: {
        type: Boolean,
        default: false,
      },
      canInvite: {
        type: Boolean,
        default: false,
      },
      canManageBudget: {
        type: Boolean,
        default: false,
      },
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  statistics: {
    totalContentGenerated: {
      type: Number,
      default: 0,
    },
    totalContentPublished: {
      type: Number,
      default: 0,
    },
    totalEngagement: {
      type: Number,
      default: 0,
    },
    averageEngagementRate: {
      type: Number,
      default: 0,
    },
    totalReach: {
      type: Number,
      default: 0,
    },
    totalImpressions: {
      type: Number,
      default: 0,
    },
    roi: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  templateProjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
  },
}, {
  timestamps: true,
});

// Ensure unique project names per user
ProjectSchema.index({ userId: 1, name: 1 }, { unique: true });

// Indexes for performance
ProjectSchema.index({ userId: 1, status: 1, isActive: 1 });
ProjectSchema.index({ type: 1, status: 1 });
ProjectSchema.index({ 'timeline.startDate': 1, 'timeline.endDate': 1 });
ProjectSchema.index({ 'team.userId': 1 });
ProjectSchema.index({ tags: 1 });
ProjectSchema.index({ createdAt: -1 });

// Virtual for project duration
ProjectSchema.virtual('duration').get(function() {
  if (this.timeline.startDate && this.timeline.endDate) {
    return this.timeline.endDate.getTime() - this.timeline.startDate.getTime();
  }
  return 0;
});

// Virtual for days remaining
ProjectSchema.virtual('daysRemaining').get(function() {
  if (this.timeline.endDate) {
    const now = new Date();
    const remaining = this.timeline.endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
  }
  return 0;
});

// Virtual for budget remaining
ProjectSchema.virtual('budgetRemaining').get(function() {
  return this.budget.total - this.budget.spent;
});

// Virtual for budget utilization
ProjectSchema.virtual('budgetUtilization').get(function() {
  if (this.budget.total > 0) {
    return (this.budget.spent / this.budget.total) * 100;
  }
  return 0;
});

// Virtual for progress
ProjectSchema.virtual('progress').get(function() {
  if (this.timeline.milestones && this.timeline.milestones.length > 0) {
    const completed = this.timeline.milestones.filter(m => m.status === 'completed').length;
    return (completed / this.timeline.milestones.length) * 100;
  }
  return 0;
});

// Virtual for isOverBudget
ProjectSchema.virtual('isOverBudget').get(function() {
  return this.budget.spent > this.budget.total;
});

// Virtual for isOverdue
ProjectSchema.virtual('isOverdue').get(function() {
  return this.timeline.endDate && this.timeline.endDate < new Date() && this.status !== 'completed';
});

// Virtual for kpiProgress
ProjectSchema.virtual('kpiProgress').get(function() {
  if (this.objectives.kpis && this.objectives.kpis.length > 0) {
    return this.objectives.kpis.map(kpi => ({
      name: kpi.name,
      target: kpi.target,
      current: kpi.current,
      progress: kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0,
      isAchieved: kpi.current >= kpi.target,
      deadline: kpi.deadline,
      isOverdue: kpi.deadline && kpi.deadline < new Date(),
    }));
  }
  return [];
});

// Pre-save middleware to validate timeline
ProjectSchema.pre('save', function(next) {
  if (this.timeline.startDate && this.timeline.endDate) {
    if (this.timeline.startDate >= this.timeline.endDate) {
      return next(new Error('End date must be after start date'));
    }
  }
  next();
});

// Pre-save middleware to update statistics
ProjectSchema.pre('save', function(next) {
  if (this.isModified('statistics')) {
    this.statistics.lastUpdated = new Date();
  }
  next();
});

export const Project = mongoose.model('Project', ProjectSchema);