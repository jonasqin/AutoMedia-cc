import mongoose, { Schema } from 'mongoose';
import { ITopic } from '../types';

const TopicSchema = new Schema<ITopic>({
  userId: {
    type: String,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
    maxlength: [100, 'Topic name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  keywords: [{
    type: String,
    trim: true,
    required: [true, 'Keywords are required'],
  }],
  weight: {
    type: Number,
    default: 1,
    min: [0, 'Weight cannot be negative'],
    max: [10, 'Weight cannot exceed 10'],
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  contentCount: {
    type: Number,
    default: 0,
    min: [0, 'Content count cannot be negative'],
  },
  settings: {
    updateFrequency: {
      type: String,
      enum: ['realtime', '5min', '15min', '30min', '1hour', '3hours', '6hours', '12hours', 'daily'],
      default: '1hour',
    },
    notificationEnabled: {
      type: Boolean,
      default: true,
    },
    autoCollect: {
      type: Boolean,
      default: true,
    },
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  emoji: {
    type: String,
    maxlength: [10, 'Emoji cannot exceed 10 characters'],
  },
  color: {
    type: String,
    match: [/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color'],
  },
}, {
  timestamps: true,
});

// Ensure unique topic names per user
TopicSchema.index({ userId: 1, name: 1 }, { unique: true });

// Indexes for performance
TopicSchema.index({ userId: 1, isActive: 1, weight: -1 });
TopicSchema.index({ category: 1, isActive: 1 });
TopicSchema.index({ 'settings.updateFrequency': 1 });
TopicSchema.index({ lastUpdated: -1 });

// Virtual for formatted name
TopicSchema.virtual('formattedName').get(function() {
  return this.emoji ? `${this.emoji} ${this.name}` : this.name;
});

// Virtual for keyword count
TopicSchema.virtual('keywordCount').get(function() {
  return this.keywords ? this.keywords.length : 0;
});

// Pre-save middleware to update lastUpdated
TopicSchema.pre('save', function(next) {
  if (this.isModified('keywords') || this.isModified('name') || this.isModified('weight')) {
    this.lastUpdated = new Date();
  }
  next();
});

export const Topic = mongoose.model<ITopic>('Topic', TopicSchema);