import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Content } from '../models';
import { cacheData, getCachedData, deleteCache } from '../config/redis';

const router = express.Router();

// Get content library
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('tags').optional().isString(),
  query('platform').optional().isIn(['twitter', 'xiaohongshu', 'facebook', 'instagram', 'tiktok']),
  query('type').optional().isIn(['tweet', 'post', 'video', 'image', 'story']),
  query('aiGenerated').optional().isBoolean(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('sortBy').optional().isIn(['collectedAt', 'publishedAt', 'engagement', 'relevance']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user?.id;
  const {
    page = 1,
    limit = 20,
    search,
    tags,
    platform,
    type,
    aiGenerated,
    startDate,
    endDate,
    sortBy = 'collectedAt',
    sortOrder = 'desc',
  } = req.query;

  const query: any = {};

  // If user is authenticated, show their content or public content
  if (userId) {
    query.$or = [
      { source: userId },
      { isPublic: true },
    ];
  } else {
    query.isPublic = true;
  }

  // Add filters
  if (platform) query.platform = platform;
  if (type) query.type = type;
  if (aiGenerated !== undefined) query.aiGenerated = aiGenerated === 'true';

  // Date range
  if (startDate || endDate) {
    query.collectedAt = {};
    if (startDate) query.collectedAt.$gte = new Date(startDate as string);
    if (endDate) query.collectedAt.$lte = new Date(endDate as string);
  }

  // Search functionality
  if (search) {
    query.$text = { $search: search as string };
  }

  // Tags filter
  if (tags) {
    const tagArray = (tags as string).split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }

  // Build sort object
  const sort: any = {};
  if (sortBy === 'engagement') {
    sort['metadata.engagement.likes'] = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'relevance') {
    sort.score = { $meta: 'textScore' };
  } else {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  }

  const [content, total] = await Promise.all([
    Content.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('source', 'email profile.firstName profile.lastName'),
    Content.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      content,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: page * limit < total,
      },
    },
  });
}));

// Get content details
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const contentId = req.params.id;

  const content = await Content.findById(contentId)
    .populate('source', 'email profile.firstName profile.lastName');

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
    });
  }

  // Check if user has access to this content
  if (userId && content.source?.toString() !== userId && !content.isPublic) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  res.json({
    success: true,
    data: content,
  });
}));

// Save generated content
router.post('/', authenticateToken, [
  body('content').notEmpty().withMessage('Content is required'),
  body('source').optional().isString(),
  body('metadata').optional().isObject(),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const {
    content: contentText,
    source = 'manual',
    metadata = {},
    tags = [],
    isPublic = false,
  } = req.body;

  const content = new Content({
    platform: 'automedia',
    type: 'post',
    author: {
      id: userId,
      username: 'user',
      displayName: 'User',
      verified: false,
    },
    content: {
      text: contentText,
      media: [],
      links: [],
    },
    metadata: {
      engagement: {
        likes: 0,
        retweets: 0,
        replies: 0,
        views: 0,
      },
      sentiment: {
        score: 0,
        label: 'neutral',
      },
      topics: [],
      hashtags: [],
      mentions: [],
      language: 'en',
      ...metadata,
    },
    aiGenerated: source === 'ai',
    source: userId,
    tags,
    isPublic,
    publishedAt: new Date(),
    collectedAt: new Date(),
  });

  await content.save();

  res.status(201).json({
    success: true,
    message: 'Content saved successfully',
    data: content,
  });
}));

// Update content
router.put('/:id', authenticateToken, [
  body('content').optional().notEmpty(),
  body('tags').optional().isArray(),
  body('isPublic').optional().isBoolean(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const contentId = req.params.id;
  const updateData = req.body;

  const content = await Content.findOneAndUpdate(
    { _id: contentId, source: userId },
    updateData,
    { new: true }
  );

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found or access denied',
    });
  }

  res.json({
    success: true,
    message: 'Content updated successfully',
    data: content,
  });
}));

// Delete content
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contentId = req.params.id;

  const content = await Content.findOneAndDelete({
    _id: contentId,
    source: userId,
  });

  if (!content) {
    return res.status(404).json({
      success: false,
      message: 'Content not found or access denied',
    });
  }

  res.json({
    success: true,
    message: 'Content deleted successfully',
  });
}));

// Get content tags
router.get('/tags/list', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const tags = await Content.aggregate([
    { $match: { source: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ]);

  res.json({
    success: true,
    data: tags,
  });
}));

// Get content analytics
router.get('/analytics/overview', authenticateToken, [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const { startDate, endDate } = req.query;

  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate as string);
  if (endDate) dateFilter.$lte = new Date(endDate as string);

  const [
    totalContent,
    contentByPlatform,
    contentByType,
    contentByDate,
    topAuthors,
    averageEngagement,
  ] = await Promise.all([
    Content.countDocuments({ source: userId, ...(startDate && { collectedAt: dateFilter }) }),
    Content.aggregate([
      {
        $match: {
          source: new mongoose.Types.ObjectId(userId),
          ...(startDate && { collectedAt: dateFilter }),
        },
      },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]),
    Content.aggregate([
      {
        $match: {
          source: new mongoose.Types.ObjectId(userId),
          ...(startDate && { collectedAt: dateFilter }),
        },
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Content.aggregate([
      {
        $match: {
          source: new mongoose.Types.ObjectId(userId),
          ...(startDate && { collectedAt: dateFilter }),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$collectedAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Content.aggregate([
      {
        $match: {
          source: new mongoose.Types.ObjectId(userId),
          ...(startDate && { collectedAt: dateFilter }),
        },
      },
      { $group: { _id: '$author.username', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Content.aggregate([
      {
        $match: {
          source: new mongoose.Types.ObjectId(userId),
          ...(startDate && { collectedAt: dateFilter }),
        },
      },
      {
        $group: {
          _id: null,
          avgLikes: { $avg: '$metadata.engagement.likes' },
          avgRetweets: { $avg: '$metadata.engagement.retweets' },
          avgReplies: { $avg: '$metadata.engagement.replies' },
        },
      },
    ]),
  ]);

  const analytics = {
    overview: {
      totalContent,
      averageEngagement: averageEngagement[0] || {
        avgLikes: 0,
        avgRetweets: 0,
        avgReplies: 0,
      },
    },
    contentByPlatform: contentByPlatform.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    contentByType: contentByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    contentByDate,
    topAuthors,
  };

  res.json({
    success: true,
    data: analytics,
  });
}));

// Search content
router.get('/search/suggestions', authenticateToken, [
  query('q').notEmpty().withMessage('Search query is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const { q: query } = req.query;

  const suggestions = await Content.aggregate([
    {
      $match: {
        source: new mongoose.Types.ObjectId(userId),
        $text: { $search: query as string },
      },
    },
    {
      $project: {
        content: '$content.text',
        score: { $meta: 'textScore' },
        platform: 1,
        type: 1,
        collectedAt: 1,
      },
    },
    { $sort: { score: { $meta: 'textScore' } } },
    { $limit: 5 },
  ]);

  res.json({
    success: true,
    data: suggestions,
  });
}));

export default router;