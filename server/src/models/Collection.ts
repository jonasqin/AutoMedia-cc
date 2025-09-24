import mongoose, { Schema } from 'mongoose';
import { ICollection } from '../types';

const CollectionSchema = new Schema<ICollection>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true,
    maxlength: [100, 'Collection name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  type: {
    type: String,
    required: [true, 'Collection type is required'],
    enum: ['manual', 'auto', 'smart'],
    default: 'manual',
  },
  rules: {
    criteria: [{
      type: String,
      required: [true, 'Criteria are required for auto/smart collections'],
    }],
    conditions: {
      type: Schema.Types.Mixed,
      default: {},
    },
    autoAdd: {
      type: Boolean,
      default: false,
    },
  },
  contentCount: {
    type: Number,
    default: 0,
    min: [0, 'Content count cannot be negative'],
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  color: {
    type: String,
    match: [/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color'],
  },
  icon: {
    type: String,
    maxlength: [50, 'Icon cannot exceed 50 characters'],
  },
  settings: {
    allowSharing: {
      type: Boolean,
      default: false,
    },
    allowExport: {
      type: Boolean,
      default: true,
    },
    autoArchive: {
      type: Boolean,
      default: false,
    },
    retentionDays: {
      type: Number,
      default: 365,
      min: [1, 'Retention must be at least 1 day'],
    },
  },
  collaborators: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastContentAdded: {
    type: Date,
  },
  statistics: {
    totalViews: {
      type: Number,
      default: 0,
    },
    totalShares: {
      type: Number,
      default: 0,
    },
    totalExports: {
      type: Number,
      default: 0,
    },
    avgEngagementRate: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Ensure unique collection names per user
CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });

// Indexes for performance
CollectionSchema.index({ userId: 1, isActive: 1, type: 1 });
CollectionSchema.index({ type: 1, isPublic: 1 });
CollectionSchema.index({ tags: 1 });
CollectionSchema.index({ 'collaborators.userId': 1 });
CollectionSchema.index({ createdAt: -1 });

// Virtual for formatted name
CollectionSchema.virtual('formattedName').get(function() {
  return this.icon ? `${this.icon} ${this.name}` : this.name;
});

// Virtual for collaborator count
CollectionSchema.virtual('collaboratorCount').get(function() {
  return this.collaborators.length;
});

// Virtual for isOwner
CollectionSchema.virtual('isOwner').get(function() {
  // This would be set in the controller based on the authenticated user
  return true;
});

// Virtual for canEdit
CollectionSchema.virtual('canEdit').get(function() {
  // This would be set in the controller based on the authenticated user
  return true;
});

// Pre-save middleware to handle default collection logic
CollectionSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // If this collection is set as default, unset default for other collections for this user
    await this.constructor.updateMany(
      {
        userId: this.userId,
        _id: { $ne: this._id },
        isDefault: true
      },
      { isDefault: false }
    );
  }
  next();
});

// Pre-save middleware to update timestamps
CollectionSchema.pre('save', function(next) {
  if (this.isModified('rules.criteria') || this.isModified('rules.conditions')) {
    // Mark collection for re-evaluation if rules changed
    this.markModified('rules');
  }
  next();
});

export const Collection = mongoose.model<ICollection>('Collection', CollectionSchema);