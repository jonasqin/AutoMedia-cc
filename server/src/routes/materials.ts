import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Material } from '../models/Material';
import { cacheData, getCachedData, deleteCache } from '../config/redis';
import mongoose from 'mongoose';

const router = express.Router();

// Get all materials
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isString(),
  query('search').optional().isString(),
  query('tags').optional().isString(),
  query('isPublic').optional().isBoolean(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
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
    type,
    search,
    tags,
    isPublic,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const cacheKey = `materials:${userId}:${JSON.stringify(req.query)}`;

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
  if (type) query.type = type;
  if (isPublic !== undefined) query['settings.isPublic'] = isPublic;

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Tags filter
  if (tags) {
    const tagArray = (tags as string).split(',').map(tag => tag.trim());
    query.tags = { $in: tagArray };
  }

  // Sort options
  const sortOptions: any = {};
  sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

  const [materials, total] = await Promise.all([
    Material.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('topics', 'name emoji color')
      .populate('collections', 'name color')
      .populate('agent.id', 'name type'),
    Material.countDocuments(query),
  ]);

  const result = {
    materials,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      hasMore: Number(page) * Number(limit) < total,
    },
  };

  // Cache the result
  await cacheData(cacheKey, result, 300); // 5 minutes

  res.json({
    success: true,
    data: result,
  });
}));

// Get material by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const material = await Material.findOne({
    _id: id,
    $or: [{ userId }, { 'settings.isPublic': true }],
    isActive: true,
  }).populate('topics collections agent.id');

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found',
    });
  }

  // Increment view count
  material.statistics.views += 1;
  await material.save();

  res.json({
    success: true,
    data: material,
  });
}));

// Create new material
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Material name is required'),
  body('type').isIn(['text', 'image', 'video', 'audio', 'document', 'template', 'prompt']).withMessage('Invalid material type'),
  body('content.text').optional().isString(),
  body('tags').optional().isArray(),
  body('categories').optional().isArray(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const materialData = {
    ...req.body,
    userId,
    source: {
      type: 'manual',
      sourceId: userId,
    },
  };

  const material = new Material(materialData);
  await material.save();

  // Clear cache
  await deleteCache(`materials:${userId}:*`);

  res.status(201).json({
    success: true,
    data: material,
    message: 'Material created successfully',
  });
}));

// Update material
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty(),
  body('type').optional().isIn(['text', 'image', 'video', 'audio', 'document', 'template', 'prompt']),
  body('tags').optional().isArray(),
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

  const material = await Material.findOne({ _id: id, userId, isActive: true });

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found',
    });
  }

  Object.assign(material, req.body);
  material.version += 1;
  await material.save();

  // Clear cache
  await deleteCache(`materials:${userId}:*`);

  res.json({
    success: true,
    data: material,
    message: 'Material updated successfully',
  });
}));

// Delete material
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const material = await Material.findOne({ _id: id, userId, isActive: true });

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found',
    });
  }

  material.isActive = false;
  await material.save();

  // Clear cache
  await deleteCache(`materials:${userId}:*`);

  res.json({
    success: true,
    message: 'Material deleted successfully',
  });
}));

// Download material
router.get('/:id/download', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const material = await Material.findOne({
    _id: id,
    $or: [{ userId }, { 'settings.isPublic': true }],
    isActive: true,
  });

  if (!material) {
    return res.status(404).json({
      success: false,
      message: 'Material not found',
    });
  }

  if (!material.settings.allowDownload) {
    return res.status(403).json({
      success: false,
      message: 'Download not allowed for this material',
    });
  }

  // Increment download count
  material.statistics.downloads += 1;
  await material.save();

  // Prepare download data
  const downloadData = {
    id: material._id,
    name: material.name,
    type: material.type,
    content: material.content,
    tags: material.tags,
    categories: material.categories,
    createdAt: material.createdAt,
    downloadedAt: new Date(),
  };

  res.json({
    success: true,
    data: downloadData,
  });
}));

// Get material statistics
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const cacheKey = `materials:${userId}:stats`;

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
    totalMaterials,
    materialsByType,
    materialsByCategory,
    totalViews,
    totalDownloads,
    recentMaterials,
  ] = await Promise.all([
    Material.countDocuments({ userId, isActive: true }),
    Material.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Material.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
    ]),
    Material.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      { $group: { _id: null, total: { $sum: '$statistics.views' } } },
    ]),
    Material.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      { $group: { _id: null, total: { $sum: '$statistics.downloads' } } },
    ]),
    Material.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name type createdAt statistics.views'),
  ]);

  const stats = {
    totalMaterials,
    materialsByType: materialsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    materialsByCategory: materialsByCategory.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalViews: totalViews[0]?.total || 0,
    totalDownloads: totalDownloads[0]?.total || 0,
    recentMaterials,
  };

  // Cache the statistics
  await cacheData(cacheKey, stats, 3600); // 1 hour

  res.json({
    success: true,
    data: stats,
  });
}));

export default router;