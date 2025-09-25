import mongoose, { Schema } from 'mongoose';
import { IGeneration } from '../types';

const GenerationSchema = new Schema<IGeneration>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  agentId: {
    type: String,
    ref: 'Agent',
  },
  prompt: {
    type: String,
    required: [true, 'Prompt is required'],
    maxlength: [5000, 'Prompt cannot exceed 5000 characters'],
  },
  input: {
    content: {
      type: String,
      required: [true, 'Input content is required'],
    },
    context: {
      type: String,
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  output: {
    content: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sources: [{
      type: String,
      ref: 'Content',
    }],
  },
  model: {
    type: String,
    required: [true, 'AI model is required'],
  },
  provider: {
    type: String,
    required: [true, 'AI provider is required'],
    enum: ['openai', 'google', 'deepseek', 'claude', 'ollama'],
  },
  tokens: {
    input: {
      type: Number,
      default: 0,
      min: [0, 'Input tokens cannot be negative'],
    },
    output: {
      type: Number,
      default: 0,
      min: [0, 'Output tokens cannot be negative'],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total tokens cannot be negative'],
    },
  },
  cost: {
    type: Number,
    default: 0,
    min: [0, 'Cost cannot be negative'],
  },
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative'],
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  error: {
    type: String,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  scheduledAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  retryCount: {
    type: Number,
    default: 0,
    min: [0, 'Retry count cannot be negative'],
  },
  maxRetries: {
    type: Number,
    default: 3,
    min: [0, 'Max retries cannot be negative'],
  },
  tags: [{
    type: String,
  }],
  feedback: {
    rating: {
      type: Number,
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
    },
  },
}, {
  timestamps: true,
});

// Virtual for total execution time
GenerationSchema.virtual('executionTime').get(function() {
  if (this.completedAt && this.createdAt) {
    return this.completedAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

// Virtual for cost per token
GenerationSchema.virtual('costPerToken').get(function() {
  if (this.tokens.total > 0) {
    return this.cost / this.tokens.total;
  }
  return 0;
});

// Virtual for success rate
GenerationSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Indexes for performance
GenerationSchema.index({ userId: 1, createdAt: -1 });
GenerationSchema.index({ agentId: 1, createdAt: -1 });
GenerationSchema.index({ status: 1, createdAt: -1 });
GenerationSchema.index({ model: 1, provider: 1 });
GenerationSchema.index({ tags: 1 });
GenerationSchema.index({ 'feedback.rating': 1 });

// Compound indexes
GenerationSchema.index({ userId: 1, status: 1, createdAt: -1 });
GenerationSchema.index({ provider: 1, model: 1, createdAt: -1 });

// Text search index
GenerationSchema.index({
  prompt: 'text',
  'input.content': 'text',
  'output.content': 'text',
  tags: 'text',
});

// Pre-save middleware to calculate total tokens
GenerationSchema.pre('save', function(next) {
  if (this.isModified('tokens.input') || this.isModified('tokens.output')) {
    this.tokens.total = this.tokens.input + this.tokens.output;
  }
  next();
});

// Pre-save middleware to set completion timestamp
GenerationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

export const Generation = mongoose.model<IGeneration>('Generation', GenerationSchema);