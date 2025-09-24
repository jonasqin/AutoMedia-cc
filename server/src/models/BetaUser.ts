import mongoose, { Schema, Document } from 'mongoose';

export interface IBetaUser extends Document {
  userId: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    company?: string;
    role?: string;
    industry?: string;
    experience: 'beginner' | 'intermediate' | 'advanced';
    interests: string[];
  };
  betaRole: 'alpha' | 'beta' | 'early_adopter';
  testingFocus: string[];
  onboardingStatus: 'pending' | 'active' | 'completed' | 'inactive';
  feedbackScore: number;
  contributions: {
    bugsReported: number;
    featuresRequested: number;
    surveysCompleted: number;
    sessionsParticipated: number;
  };
  permissions: {
    canAccessBeta: boolean;
    canViewAnalytics: boolean;
    canSuggestFeatures: boolean;
    canReportBugs: boolean;
  };
  joinDate: Date;
  lastActive: Date;
  isActive: boolean;
  notes?: string;
  tags: string[];
}

const BetaUserSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    interests: [{
      type: String,
      trim: true
    }]
  },
  betaRole: {
    type: String,
    enum: ['alpha', 'beta', 'early_adopter'],
    default: 'beta'
  },
  testingFocus: [{
    type: String,
    trim: true
  }],
  onboardingStatus: {
    type: String,
    enum: ['pending', 'active', 'completed', 'inactive'],
    default: 'pending'
  },
  feedbackScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  contributions: {
    bugsReported: {
      type: Number,
      default: 0
    },
    featuresRequested: {
      type: Number,
      default: 0
    },
    surveysCompleted: {
      type: Number,
      default: 0
    },
    sessionsParticipated: {
      type: Number,
      default: 0
    }
  },
  permissions: {
    canAccessBeta: {
      type: Boolean,
      default: true
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canSuggestFeatures: {
      type: Boolean,
      default: true
    },
    canReportBugs: {
      type: Boolean,
      default: true
    }
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
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
BetaUserSchema.index({ userId: 1 });
BetaUserSchema.index({ email: 1 });
BetaUserSchema.index({ betaRole: 1 });
BetaUserSchema.index({ onboardingStatus: 1 });
BetaUserSchema.index({ isActive: 1 });
BetaUserSchema.index({ feedbackScore: -1 });
BetaUserSchema.index({ joinDate: -1 });

// Virtual for full name
BetaUserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for total contribution score
BetaUserSchema.virtual('totalContributionScore').get(function() {
  const weights = {
    bugsReported: 3,
    featuresRequested: 2,
    surveysCompleted: 1,
    sessionsParticipated: 1
  };

  return Object.entries(this.contributions).reduce((score, [key, value]) => {
    return score + (value * (weights as any)[key] || 0);
  }, 0);
});

// Pre-save middleware to update lastActive
BetaUserSchema.pre('save', function(next) {
  if (this.isModified('onboardingStatus') || this.isModified('isActive')) {
    this.lastActive = new Date();
  }
  next();
});

// Static methods
BetaUserSchema.statics.getActiveBetaUsers = function() {
  return this.find({
    isActive: true,
    onboardingStatus: { $in: ['active', 'completed'] }
  });
};

BetaUserSchema.statics.getUsersByRole = function(role: string) {
  return this.find({
    betaRole: role,
    isActive: true
  });
};

BetaUserSchema.statics.getTopContributors = function(limit = 10) {
  return this.aggregate([
    { $match: { isActive: true } },
    { $addFields: {
        totalContribution: {
          $sum: [
            { $multiply: ['$contributions.bugsReported', 3] },
            { $multiply: ['$contributions.featuresRequested', 2] },
            '$contributions.surveysCompleted',
            '$contributions.sessionsParticipated'
          ]
        }
      }
    },
    { $sort: { totalContribution: -1 } },
    { $limit: limit }
  ]);
};

// Instance methods
BetaUserSchema.methods.updateActivity = function() {
  this.lastActive = new Date();
  return this.save();
};

BetaUserSchema.methods.incrementContribution = function(type: keyof IBetaUser['contributions']) {
  this.contributions[type] = (this.contributions[type] || 0) + 1;
  this.feedbackScore = Math.min(100, this.feedbackScore + 2);
  return this.save();
};

BetaUserSchema.methods.completeOnboarding = function() {
  this.onboardingStatus = 'completed';
  this.lastActive = new Date();
  return this.save();
};

export const BetaUser = mongoose.model<IBetaUser>('BetaUser', BetaUserSchema);