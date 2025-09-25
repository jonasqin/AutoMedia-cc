import mongoose, { Schema } from 'mongoose';

const MaterialSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true,
    maxlength: [100, 'Material name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  type: {
    type: String,
    required: [true, 'Material type is required'],
    enum: ['text', 'image', 'video', 'audio', 'document', 'template', 'prompt'],
  },
  content: {
    text: {
      type: String,
      maxlength: [50000, 'Text content cannot exceed 50000 characters'],
    },
    media: [{
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ['image', 'video', 'audio', 'document'],
      },
      filename: {
        type: String,
      },
      size: {
        type: Number,
        min: [0, 'Size cannot be negative'],
      },
      mimeType: {
        type: String,
      },
      altText: {
        type: String,
      },
      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    }],
    structure: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  source: {
    type: {
      type: String,
      enum: ['manual', 'ai_generated', 'imported', 'scraped'],
      default: 'manual',
    },
    sourceId: {
      type: String,
    },
    sourceUrl: {
      type: String,
    },
    author: {
      type: String,
    },
    license: {
      type: String,
      enum: ['free', 'royalty_free', 'commercial', 'custom'],
      default: 'free',
    },
    attribution: {
      type: String,
    },
  },
  tags: [{
    type: String,
    trim: true,
  }],
  categories: [{
    type: String,
    trim: true,
  }],
  topics: [{
    type: Schema.Types.ObjectId,
    ref: 'Topic',
  }],
  collections: [{
    type: Schema.Types.ObjectId,
    ref: 'Collection',
  }],
  agent: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
    name: {
      type: String,
    },
    model: {
      type: String,
    },
  },
  usage: {
    count: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
    },
    lastUsedAt: {
      type: Date,
    },
    projects: [{
      projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
      },
      usedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  quality: {
    score: {
      type: Number,
      min: [0, 'Quality score cannot be less than 0'],
      max: [100, 'Quality score cannot exceed 100'],
      default: 50,
    },
    rating: {
      type: Number,
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    feedback: {
      type: String,
    },
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    allowDownload: {
      type: Boolean,
      default: true,
    },
    allowSharing: {
      type: Boolean,
      default: false,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    variables: [{
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['text', 'number', 'date', 'boolean', 'select'],
        default: 'text',
      },
      defaultValue: {
        type: Schema.Types.Mixed,
      },
      required: {
        type: Boolean,
        default: false,
      },
      options: [{
        type: String,
      }],
      description: {
        type: String,
      },
    }],
  },
  statistics: {
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
  },
  version: {
    type: Number,
    default: 1,
  },
  parentMaterial: {
    type: Schema.Types.ObjectId,
    ref: 'Material',
  },
  variants: [{
    type: Schema.Types.ObjectId,
    ref: 'Material',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Text search index
MaterialSchema.index({
  name: 'text',
  description: 'text',
  'content.text': 'text',
  tags: 'text',
  categories: 'text',
});

// Indexes for performance
MaterialSchema.index({ userId: 1, type: 1, isActive: 1 });
MaterialSchema.index({ type: 1, isActive: 1 });
MaterialSchema.index({ tags: 1 });
MaterialSchema.index({ categories: 1 });
MaterialSchema.index({ 'source.type': 1 });
MaterialSchema.index({ 'agent.id': 1 });
MaterialSchema.index({ 'quality.score': -1 });
MaterialSchema.index({ 'usage.count': -1 });
MaterialSchema.index({ 'settings.isPublic': 1, 'settings.isFeatured': 1 });
MaterialSchema.index({ topics: 1 });
MaterialSchema.index({ collections: 1 });
MaterialSchema.index({ expiresAt: 1 });

// Virtual for formatted name
MaterialSchema.virtual('formattedName').get(function() {
  return this.content?.media && this.content.media.length > 0
    ? `${this.name} (${this.content.media[0]?.type})`
    : this.name;
});

// Virtual for isExpired
MaterialSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Virtual for file size
MaterialSchema.virtual('fileSize').get(function() {
  if (this.content?.media && this.content.media.length > 0) {
    return this.content.media.reduce((total, media) => total + (media.size || 0), 0);
  }
  return 0;
});

// Virtual for text length
MaterialSchema.virtual('textLength').get(function() {
  return this.content?.text ? this.content.text.length : 0;
});

// Virtual for hasVariables
MaterialSchema.virtual('hasVariables').get(function() {
  return this.settings?.variables && this.settings.variables.length > 0;
});

// Virtual for engagement metrics
MaterialSchema.virtual('engagementMetrics').get(function() {
  const stats = this.statistics || {} as any;
  const views = stats.views || 0;
  const downloads = stats.downloads || 0;
  const shares = stats.shares || 0;
  const likes = stats.likes || 0;
  const total = views + downloads + shares + likes;
  return {
    total,
    average: total / 4,
    mostEngaged: Math.max(views, downloads, shares, likes),
  };
});

// Pre-save middleware to handle expiration
MaterialSchema.pre('save', function(next) {
  if (this.isModified('type') && this.type === 'template' && this.settings) {
    this.settings.isTemplate = true;
  }
  next();
});

// Pre-save middleware to update usage statistics
MaterialSchema.pre('save', function(next) {
  if (this.isModified('usage.count') && this.usage && this.usage.count > 0) {
    this.usage.lastUsedAt = new Date();
  }
  next();
});

export const Material = mongoose.model('Material', MaterialSchema);