import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Topic, Content } from '../models';
import { cacheData, getCachedData, deleteCache } from '../config/redis';

const router = express.Router();

// Get user's topics
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isString(),
  query('isActive').optional().isBoolean(),
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
    page = 1,
    limit = 20,
    category,
    isActive,
  } = req.query;

  const query: any = { userId };

  if (category !== undefined) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const [topics, total] = await Promise.all([
    Topic.find(query)
      .sort({ weight: -1, lastUpdated: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Topic.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      topics,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: page * limit < total,
      },
    },
  });
}));

// Create new topic
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Topic name is required'),
  body('keywords').isArray().withMessage('Keywords must be an array'),
  body('keywords.*').isString().withMessage('Each keyword must be a string'),
  body('weight').optional().isFloat({ min: 0, max: 10 }),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('settings.updateFrequency').optional().isIn(['realtime', '5min', '15min', '30min', '1hour', '3hours', '6hours', '12hours', 'daily']),
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
    name,
    keywords,
    weight = 1,
    description,
    category,
    settings = {},
    emoji,
    color,
  } = req.body;

  // Check if topic with same name already exists for this user
  const existingTopic = await Topic.findOne({ userId, name });
  if (existingTopic) {
    return res.status(409).json({
      success: false,
      message: 'Topic with this name already exists',
    });
  }

  const topic = new Topic({
    userId,
    name,
    keywords,
    weight,
    description,
    category,
    settings: {
      updateFrequency: settings.updateFrequency || '1hour',
      notificationEnabled: settings.notificationEnabled !== false,
      autoCollect: settings.autoCollect !== false,
    },
    emoji,
    color,
  });

  await topic.save();

  // Clear cache
  await deleteCache(`user:${userId}:topics`);

  res.status(201).json({
    success: true,
    message: 'Topic created successfully',
    data: topic,
  });
}));

// Get topic details
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const topicId = req.params.id;

  const topic = await Topic.findOne({ _id: topicId, userId });

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found',
    });
  }

  // Get recent content for this topic
  const recentContent = await Content.find({
    source: userId,
    $or: topic.keywords.map(keyword => ({
      'content.text': { $regex: keyword, $options: 'i' },
    })),
  })
    .sort({ collectedAt: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      topic,
      recentContent,
    },
  });
}));

// Update topic
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty(),
  body('keywords').optional().isArray(),
  body('weight').optional().isFloat({ min: 0, max: 10 }),
  body('settings.updateFrequency').optional().isIn(['realtime', '5min', '15min', '30min', '1hour', '3hours', '6hours', '12hours', 'daily']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const topicId = req.params.id;
  const updateData = req.body;

  // Check if new name conflicts with existing topics
  if (updateData.name) {
    const existingTopic = await Topic.findOne({
      userId,
      name: updateData.name,
      _id: { $ne: topicId },
    });

    if (existingTopic) {
      return res.status(409).json({
        success: false,
        message: 'Topic with this name already exists',
      });
    }
  }

  const topic = await Topic.findOneAndUpdate(
    { _id: topicId, userId },
    updateData,
    { new: true }
  );

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found',
    });
  }

  // Clear cache
  await deleteCache(`user:${userId}:topics`);
  await deleteCache(`topic:${topicId}`);

  res.json({
    success: true,
    message: 'Topic updated successfully',
    data: topic,
  });
}));

// Delete topic
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const topicId = req.params.id;

  const topic = await Topic.findOneAndDelete({
    _id: topicId,
    userId,
  });

  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found',
    });
  }

  // Clear cache
  await deleteCache(`user:${userId}:topics`);
  await deleteCache(`topic:${topicId}`);

  res.json({
    success: true,
    message: 'Topic deleted successfully',
  });
}));

// Get topic content
router.get('/:id/content', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
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
  const topicId = req.params.id;
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
  } = req.query;

  const topic = await Topic.findOne({ _id: topicId, userId });
  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found',
    });
  }

  const query: any = {
    source: userId,
    $or: topic.keywords.map(keyword => ({
      'content.text': { $regex: keyword, $options: 'i' },
    })),
  };

  if (startDate || endDate) {
    query.collectedAt = {};
    if (startDate) query.collectedAt.$gte = new Date(startDate as string);
    if (endDate) query.collectedAt.$lte = new Date(endDate as string);
  }

  const [content, total] = await Promise.all([
    Content.find(query)
      .sort({ collectedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Content.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      content,
      topic: {
        id: topic._id,
        name: topic.name,
        keywords: topic.keywords,
      },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: page * limit < total,
      },
    },
  });
}));

// Get topic statistics
router.get('/:id/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const topicId = req.params.id;

  const topic = await Topic.findOne({ _id: topicId, userId });
  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found',
    });
  }

  const cacheKey = `topic:${topicId}:stats`;
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
    });
  }

  const [
    totalContent,
    contentByType,
    contentByPlatform,
    topKeywords,
    recentActivity,
  ] = await Promise.all([
    Content.countDocuments({
      source: userId,
      $or: topic.keywords.map(keyword => ({
        'content.text': { $regex: keyword, $options: 'i' },
      })),
    }),
    Content.aggregate([
      {
        $match: {
          source: new mongoose.Types.ObjectId(userId),
          $or: topic.keywords.map(keyword => ({
            'content.text': { $regex: keyword, $options: 'i' },
          })),
        },
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Content.aggregate([
      {
        $match: {
          source: new mongoose.Types.ObjectId(userId),
          $or: topic.keywords.map(keyword => ({
            'content.text': { $regex: keyword, $options: 'i' },
          })),
        },
      },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]),
    // Calculate keyword frequency
    Content.aggregate([
      {
        $match: {
          source: new mongoose.Types.ObjectId(userId),
          $or: topic.keywords.map(keyword => ({
            'content.text': { $regex: keyword, $options: 'i' },
          })),
        },
      },
      { $unwind: '$metadata.hashtags' },
      { $group: { _id: '$metadata.hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Content.find({
      source: userId,
      $or: topic.keywords.map(keyword => ({
        'content.text': { $regex: keyword, $options: 'i' },
      })),
    })
      .sort({ collectedAt: -1 })
      .limit(5),
  ]);

  const stats = {
    topic: {
      id: topic._id,
      name: topic.name,
      keywords: topic.keywords,
      weight: topic.weight,
      contentCount: topic.contentCount,
    },
    totalContent,
    contentByType: contentByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    contentByPlatform: contentByPlatform.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    topHashtags: topKeywords,
    recentActivity,
    lastUpdated: new Date(),
  };

  await cacheData(cacheKey, stats, 1800); // Cache for 30 minutes

  res.json({
    success: true,
    data: stats,
  });
}));

// Get topic recommendations
router.get('/recommendations', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const cacheKey = `user:${userId}:topic-recommendations`;

  const cached = await getCachedData(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
    });
  }

  // Get user's existing topics
  const existingTopics = await Topic.find({ userId });
  const existingKeywords = existingTopics.flatMap(topic => topic.keywords);

  // Get user's content to analyze patterns
  const userContent = await Content.find({ userId })
    .sort({ collectedAt: -1 })
    .limit(100);

  // Analyze content to find trending topics
  const allHashtags = userContent.flatMap(content => content.metadata.hashtags);
  const hashtagFrequency = allHashtags.reduce((acc, hashtag) => {
    acc[hashtag] = (acc[hashtag] || 0) + 1;
    return acc;
  }, {});

  const trendingHashtags = Object.entries(hashtagFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([hashtag]) => hashtag);

  // Generate recommendations based on user activity
  const recommendations = [
    {
      name: 'Cryptocurrency Trends',
      keywords: ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'defi'],
      category: 'finance',
      description: 'Latest cryptocurrency and blockchain technology trends',
      emoji: '🚀',
    },
    {
      name: 'AI & Machine Learning',
      keywords: ['artificial intelligence', 'machine learning', 'AI', 'ML', 'neural networks'],
      category: 'technology',
      description: 'Advances in artificial intelligence and machine learning',
      emoji: '🤖',
    },
    {
      name: 'Web3 & NFTs',
      keywords: ['web3', 'NFT', 'metaverse', 'decentralized', 'DAO'],
      category: 'technology',
      description: 'Web3 technologies and NFT developments',
      emoji: '🌐',
    },
    {
      name: 'Startup News',
      keywords: ['startup', 'funding', 'venture capital', 'entrepreneurship'],
      category: 'business',
      description: 'Latest startup funding and entrepreneurship news',
      emoji: '💼',
    },
    {
      name: 'Tech Innovation',
      keywords: ['innovation', 'technology', 'startup', 'future tech'],
      category: 'technology',
      description: 'Cutting-edge technology innovations',
      emoji: '💡',
    },
  ];

  // Filter out recommendations that match existing keywords
  const filteredRecommendations = recommendations.filter(rec => {
    return !rec.keywords.some(keyword =>
      existingKeywords.some(existing =>
        keyword.toLowerCase().includes(existing.toLowerCase()) ||
        existing.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  });

  await cacheData(cacheKey, filteredRecommendations, 3600); // Cache for 1 hour

  res.json({
    success: true,
    data: filteredRecommendations,
  });
}));

export default router;