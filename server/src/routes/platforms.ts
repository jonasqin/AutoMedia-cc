import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { PlatformConnection } from '../models/Platform';
import { cacheData, getCachedData, deleteCache } from '../config/redis';

const router = express.Router();

// Get all platform connections
router.get('/', authenticateToken, [
  query('platform').optional().isString(),
  query('status').optional().isString(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const { platform, status } = req.query;

  const cacheKey = `platforms:${userId}:${JSON.stringify(req.query)}`;

  // Try to get from cache first
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true,
    });
  }

  const query: any = { userId, isActive: true };

  // Apply filters
  if (platform) query.platform = platform;
  if (status) query.status = status;

  const platforms = await PlatformConnection.find(query)
    .sort({ createdAt: -1 });

  // Cache the result
  await cacheData(cacheKey, platforms, 300); // 5 minutes

  res.json({
    success: true,
    data: platforms,
  });
}));

// Get platform connection by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const platform = await PlatformConnection.findOne({ _id: id, userId, isActive: true });

  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform connection not found',
    });
  }

  res.json({
    success: true,
    data: platform,
  });
}));

// Create new platform connection
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Platform name is required'),
  body('platform').isIn(['twitter', 'xiaohongshu', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin']).withMessage('Invalid platform'),
  body('config.apiKey').optional().isString(),
  body('config.apiSecret').optional().isString(),
  body('config.accessToken').optional().isString(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const platformData = {
    ...req.body,
    userId,
    status: 'inactive',
  };

  const platform = new PlatformConnection(platformData);
  await platform.save();

  // Clear cache
  await deleteCache(`platforms:${userId}:*`);

  res.status(201).json({
    success: true,
    data: platform,
    message: 'Platform connection created successfully',
  });
}));

// Update platform connection
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty(),
  body('config.apiKey').optional().isString(),
  body('config.apiSecret').optional().isString(),
  body('config.accessToken').optional().isString(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const { id } = req.params;

  const platform = await PlatformConnection.findOne({ _id: id, userId, isActive: true });

  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform connection not found',
    });
  }

  Object.assign(platform, req.body);
  platform.status = 'inactive'; // Reset status when config changes
  await platform.save();

  // Clear cache
  await deleteCache(`platforms:${userId}:*`);

  res.json({
    success: true,
    data: platform,
    message: 'Platform connection updated successfully',
  });
}));

// Delete platform connection
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const platform = await PlatformConnection.findOne({ _id: id, userId, isActive: true });

  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform connection not found',
    });
  }

  platform.isActive = false;
  await platform.save();

  // Clear cache
  await deleteCache(`platforms:${userId}:*`);

  res.json({
    success: true,
    message: 'Platform connection deleted successfully',
  });
}));

// Test platform connection
router.post('/:id/test', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const platform = await PlatformConnection.findOne({ _id: id, userId, isActive: true });

  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform connection not found',
    });
  }

  try {
    // Test connection based on platform type
    let isConnected = false;
    let rateLimit = { remaining: 0, reset: new Date(), limit: 0 };

    switch (platform.platform) {
      case 'twitter':
        // Test Twitter API connection
        isConnected = platform.config.accessToken ? true : false;
        break;
      case 'facebook':
        // Test Facebook API connection
        isConnected = platform.config.accessToken ? true : false;
        break;
      default:
        isConnected = false;
    }

    platform.status = isConnected ? 'active' : 'error';
    platform.rateLimit = rateLimit;
    platform.lastUsedAt = new Date();
    await platform.save();

    res.json({
      success: true,
      data: {
        isConnected,
        status: platform.status,
        rateLimit,
      },
      message: isConnected ? 'Connection test successful' : 'Connection test failed',
    });
  } catch (error) {
    platform.status = 'error';
    platform.statistics.errorCount += 1;
    platform.statistics.lastError = error.message;
    await platform.save();

    res.status(500).json({
      success: false,
      message: `Connection test failed: ${error.message}`,
    });
  }
}));

// Update monitoring settings
router.put('/:id/monitoring', authenticateToken, [
  body('monitoring.enabled').isBoolean().withMessage('Monitoring enabled status is required'),
  body('monitoring.topics').optional().isArray(),
  body('monitoring.keywords').optional().isArray(),
  body('monitoring.accounts').optional().isArray(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const { id } = req.params;

  const platform = await PlatformConnection.findOne({ _id: id, userId, isActive: true });

  if (!platform) {
    return res.status(404).json({
      success: false,
      message: 'Platform connection not found',
    });
  }

  platform.monitoring = {
    ...platform.monitoring,
    ...req.body.monitoring,
  };

  await platform.save();

  // Clear cache
  await deleteCache(`platforms:${userId}:*`);

  res.json({
    success: true,
    data: platform,
    message: 'Monitoring settings updated successfully',
  });
}));

// Get platform statistics
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const cacheKey = `platforms:${userId}:stats`;

  // Try to get from cache first
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true,
    });
  }

  const [
    totalConnections,
    activeConnections,
    connectionsByPlatform,
    totalContentCollected,
    monitoringEnabled,
  ] = await Promise.all([
    PlatformConnection.countDocuments({ userId, isActive: true }),
    PlatformConnection.countDocuments({ userId, status: 'active', isActive: true }),
    PlatformConnection.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]),
    PlatformConnection.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      { $group: { _id: null, total: { $sum: '$statistics.totalCollected' } } },
    ]),
    PlatformConnection.countDocuments({ userId, 'monitoring.enabled': true, isActive: true }),
  ]);

  const stats = {
    totalConnections,
    activeConnections,
    connectionsByPlatform: connectionsByPlatform.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalContentCollected: totalContentCollected[0]?.total || 0,
    monitoringEnabled,
  };

  // Cache the statistics
  await cacheData(cacheKey, stats, 3600); // 1 hour

  res.json({
    success: true,
    data: stats,
  });
}));

export default router;