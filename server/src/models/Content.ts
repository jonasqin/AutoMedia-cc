import mongoose, { Schema } from 'mongoose';
import { IContent } from '../types';

const ContentSchema = new Schema<IContent>({
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: ['twitter', 'xiaohongshu', 'facebook', 'instagram', 'tiktok'],
  },
  platformId: {
    type: String,
    sparse: true,
    unique: true,
  },
  type: {
    type: String,
    required: [true, 'Content type is required'],
    enum: ['tweet', 'post', 'video', 'image', 'story'],
  },
  author: {
    id: {
      type: String,
      required: [true, 'Author ID is required'],
    },
    username: {
      type: String,
      required: [true, 'Author username is required'],
    },
    displayName: {
      type: String,
      required: [true, 'Author display name is required'],
    },
    avatar: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  content: {
    text: {
      type: String,
      required: [true, 'Content text is required'],
      maxlength: [10000, 'Content text cannot exceed 10000 characters'],
    },
    media: [{
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ['image', 'video', 'gif'],
      },
      altText: {
        type: String,
      },
    }],
    links: [{
      url: {
        type: String,
        required: true,
      },
      title: {
        type: String,
      },
      description: {
        type: String,
      },
    }],
  },
  metadata: {
    engagement: {
      likes: {
        type: Number,
        default: 0,
        min: [0, 'Likes cannot be negative'],
      },
      retweets: {
        type: Number,
        default: 0,
        min: [0, 'Retweets cannot be negative'],
      },
      replies: {
        type: Number,
        default: 0,
        min: [0, 'Replies cannot be negative'],
      },
      views: {
        type: Number,
        default: 0,
        min: [0, 'Views cannot be negative'],
      },
    },
    sentiment: {
      score: {
        type: Number,
        min: [-1, 'Sentiment score cannot be less than -1'],
        max: [1, 'Sentiment score cannot be greater than 1'],
        default: 0,
      },
      label: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral',
      },
    },
    topics: [{
      type: String,
    }],
    hashtags: [{
      type: String,
    }],
    mentions: [{
      type: String,
    }],
    language: {
      type: String,
      default: 'en',
    },
    location: {
      type: String,
    },
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  source: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  tags: [{
    type: String,
  }],
  collections: [{
    type: Schema.Types.ObjectId,
    ref: 'Collection',
  }],
  publishedAt: {
    type: Date,
  },
  collectedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Virtual for engagement rate
ContentSchema.virtual('engagementRate').get(function() {
  const { likes, retweets, replies } = this.metadata.engagement;
  // This is a simplified calculation. In a real app, you'd need follower count
  return likes + retweets + replies;
});

// Text search index
ContentSchema.index({
  'content.text': 'text',
  'author.username': 'text',
  'author.displayName': 'text',
  'metadata.topics': 'text',
  'metadata.hashtags': 'text',
  tags: 'text',
});

// Compound indexes
ContentSchema.index({ platform: 1, collectedAt: -1 });
ContentSchema.index({ 'author.id': 1, collectedAt: -1 });
ContentSchema.index({ platform: 1, 'metadata.sentiment.label': 1 });
ContentSchema.index({ aiGenerated: 1, collectedAt: -1 });
ContentSchema.index({ tags: 1, collectedAt: -1 });
ContentSchema.index({ collections: 1, collectedAt: -1 });

export const Content = mongoose.model<IContent>('Content', ContentSchema);