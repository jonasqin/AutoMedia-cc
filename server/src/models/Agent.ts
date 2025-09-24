import mongoose, { Schema } from 'mongoose';
import { IAgent } from '../types';

const AgentSchema = new Schema<IAgent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true,
    maxlength: [100, 'Agent name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  type: {
    type: String,
    required: [true, 'Agent type is required'],
    enum: ['content', 'analysis', 'marketing', 'technical', 'social'],
  },
  systemPrompt: {
    type: String,
    required: [true, 'System prompt is required'],
    maxlength: [2000, 'System prompt cannot exceed 2000 characters'],
  },
  config: {
    model: {
      type: String,
      required: [true, 'AI model is required'],
      enum: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-2', 'claude-instant', 'gemini-pro', 'gemini-1.5-pro', 'deepseek-chat', 'deepseek-coder'],
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: [0, 'Temperature cannot be negative'],
      max: [2, 'Temperature cannot exceed 2'],
    },
    maxTokens: {
      type: Number,
      default: 1000,
      min: [1, 'Max tokens must be at least 1'],
      max: [8192, 'Max tokens cannot exceed 8192'],
    },
    outputFormat: {
      type: String,
      enum: ['text', 'json', 'markdown', 'html'],
      default: 'text',
    },
    constraints: [{
      type: String,
    }],
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative'],
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
  }],
  version: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  performance: {
    averageResponseTime: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
    },
    userRating: {
      type: Number,
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
  },
}, {
  timestamps: true,
});

// Ensure only one default agent per user per type
AgentSchema.index({ userId: 1, type: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

// Indexes for performance
AgentSchema.index({ userId: 1, type: 1, isActive: 1 });
AgentSchema.index({ 'config.model': 1 });
AgentSchema.index({ isPublic: 1, type: 1 });
AgentSchema.index({ usageCount: -1 });
AgentSchema.index({ createdAt: -1 });

// Virtual for formatted config
AgentSchema.virtual('formattedConfig').get(function() {
  return {
    ...this.config.toObject(),
    // Add any formatting logic here
  };
});

// Virtual for usage statistics
AgentSchema.virtual('usageStats').get(function() {
  return {
    totalUsage: this.usageCount,
    isPopular: this.usageCount > 100,
    isActive: this.isActive,
  };
});

// Pre-save middleware to handle default agent logic
AgentSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // If this agent is set as default, unset default for other agents of the same type for this user
    await this.constructor.updateMany(
      {
        userId: this.userId,
        type: this.type,
        _id: { $ne: this._id },
        isDefault: true
      },
      { isDefault: false }
    );
  }
  next();
});

export const Agent = mongoose.model<IAgent>('Agent', AgentSchema);