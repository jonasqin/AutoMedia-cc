import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Content, Topic } from '../models';
import { cacheData, getCachedData, deleteCache } from '../config/redis';
import { twitterService } from '../services/twitterService';

const router = express.Router();

// Get collection status
router.get('/status', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const [
    totalContent,
    totalTopics,
    recentContent,
    topTopics,
  ] = await Promise.all([
    Content.countDocuments({ source: userId }),
    Topic.countDocuments({ userId }),
    Content.find({ source: userId })
      .sort({ collectedAt: -1 })
      .limit(10)
      .populate('source', 'email profile.firstName profile.lastName'),
    Topic.find({ userId })
      .sort({ contentCount: -1 })
      .limit(5)
      .select('name contentCount keywords'),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalContent,
        totalTopics,
        recentContentCount: recentContent.length,
      },
      recentContent,
      topTopics,
    },
  });
}));

// Twitter API status
router.get('/twitter/status', authenticateToken, asyncHandler(async (req, res) => {
  const status = await twitterService.testConnection();

  res.json({
    success: true,
    data: status,
  });
}));

// Add Twitter users to monitor
router.post('/twitter/users', authenticateToken, [
  body('usernames').isArray().withMessage('Usernames must be an array'),
  body('usernames.*').isString().withMessage('Each username must be a string'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const { usernames } = req.body;

  try {
    const results = await twitterService.monitorUsers(usernames);

    // Get user's topics to associate content
    const userTopics = await Topic.find({ userId, isActive: true });

    // Save collected tweets
    const allTweets = [];
    for (const result of results) {
      if (result.tweets) {
        allTweets.push(...result.tweets);
      }
    }

    if (allTweets.length > 0) {
      const savedTweets = await twitterService.saveTweetsToDatabase(allTweets, userId);

      // Update topic content counts
      for (const topic of userTopics) {
        const relevantTweets = savedTweets.filter(tweet =>
          topic.keywords.some(keyword =>
            tweet.content.text.toLowerCase().includes(keyword.toLowerCase())
          )
        );

        if (relevantTweets.length > 0) {
          topic.contentCount += relevantTweets.length;
          topic.lastUpdated = new Date();
          await topic.save();
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${usernames.length} users`,
      data: {
        results,
        totalTweetsCollected: allTweets.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to monitor users: ${error.message}`,
    });
  }
}));

// Get collected content
router.get('/twitter/tweets', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('topic').optional().isString(),
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
    limit = 20,
    offset = 0,
    startDate,
    endDate,
    topic,
  } = req.query;

  const query: any = { source: userId };

  if (startDate || endDate) {
    query.collectedAt = {};
    if (startDate) query.collectedAt.$gte = new Date(startDate as string);
    if (endDate) query.collectedAt.$lte = new Date(endDate as string);
  }

  if (topic) {
    const topicDoc = await Topic.findOne({ userId, name: topic });
    if (topicDoc) {
      query.tags = { $in: topicDoc.keywords };
    }
  }

  const [tweets, total] = await Promise.all([
    Content.find(query)
      .sort({ collectedAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('source', 'email profile.firstName profile.lastName'),
    Content.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      tweets,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: offset + limit < total,
      },
    },
  });
}));

// Get trending topics
router.get('/trends', authenticateToken, [
  query('location').optional().isString(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const location = req.query.location || '1'; // Default to global
  const cacheKey = `trends:${location}`;

  // Try to get from cache first
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: {
        trends: cached,
        location,
        cached: true,
      },
    });
  }

  // Fetch from Twitter API
  try {
    const trends = await twitterService.getTrendingTopics(Number(location));

    // Cache the results
    await cacheData(cacheKey, trends, 1800); // 30 minutes

    res.json({
      success: true,
      data: {
        trends,
        location,
        cached: false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch trending topics: ${error.message}`,
    });
  }
}));

// Search tweets
router.get('/twitter/search', authenticateToken, [
  query('q').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('language').optional().isString(),
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
    q: query,
    limit = 20,
    language = 'en',
  } = req.query;

  try {
    const tweets = await twitterService.searchTweets(query as string, {
      maxResults: Number(limit),
      language,
    });

    // Save tweets to database
    const savedTweets = await twitterService.saveTweetsToDatabase(tweets, userId);

    res.json({
      success: true,
      data: {
        tweets: savedTweets,
        searchQuery: query,
        totalResults: savedTweets.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to search tweets: ${error.message}`,
    });
  }
}));

// Get user's collected content statistics
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const cacheKey = `user:${userId}:collection-stats`;

  // Try to get from cache first
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
    });
  }

  // Calculate statistics
  const [
    totalContent,
    totalTopics,
    contentByPlatform,
    contentByType,
    recentContent,
    topAuthors,
  ] = await Promise.all([
    Content.countDocuments({ source: userId }),
    Topic.countDocuments({ userId }),
    Content.aggregate([
      { $match: { source: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]),
    Content.aggregate([
      { $match: { source: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Content.find({ source: userId })
      .sort({ collectedAt: -1 })
      .limit(10),
    Content.aggregate([
      { $match: { source: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$author.username', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const stats = {
    totalContent,
    totalTopics,
    contentByPlatform: contentByPlatform.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    contentByType: contentByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    recentContent,
    topAuthors,
    lastUpdated: new Date(),
  };

  // Cache the statistics
  await cacheData(cacheKey, stats, 3600); // 1 hour

  res.json({
    success: true,
    data: stats,
  });
}));

export default router;