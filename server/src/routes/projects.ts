import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Project } from '../models/Project';
import { cacheData, getCachedData, deleteCache } from '../config/redis';
import mongoose from 'mongoose';

const router = express.Router();

// Get all projects
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  query('type').optional().isString(),
  query('search').optional().isString(),
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
    status,
    type,
    search,
  } = req.query;

  const cacheKey = `projects:${userId}:${JSON.stringify(req.query)}`;

  // Try to get from cache first
  const cached = await getCachedData(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true,
    });
  }

  const query: any = {
    $or: [
      { userId },
      { 'team.userId': userId },
    ],
    isActive: true,
  };

  // Apply filters
  if (status) query.status = status;
  if (type) query.type = type;

  // Text search
  if (search) {
    query.$or = [
      ...query.$or,
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('topics.topicId', 'name emoji color')
      .populate('agents.agentId', 'name type')
      .populate('team.userId', 'email profile.firstName profile.lastName'),
    Project.countDocuments(query),
  ]);

  const result = {
    projects,
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

// Get project by ID
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const project = await Project.findOne({
    _id: id,
    $or: [
      { userId },
      { 'team.userId': userId },
    ],
    isActive: true,
  }).populate('topics.topicId agents.agentId team.userId materials.materialId');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  res.json({
    success: true,
    data: project,
  });
}));

// Create new project
router.post('/', authenticateToken, [
  body('name').notEmpty().withMessage('Project name is required'),
  body('type').isIn(['content_campaign', 'brand_management', 'social_media_strategy', 'market_research', 'crisis_management', 'product_launch']).withMessage('Invalid project type'),
  body('timeline.startDate').isISO8601().withMessage('Valid start date is required'),
  body('timeline.endDate').isISO8601().withMessage('Valid end date is required'),
  body('objectives.primary').isIn(['brand_awareness', 'lead_generation', 'community_building', 'customer_support', 'sales_conversion', 'thought_leadership']).withMessage('Invalid primary objective'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const projectData = {
    ...req.body,
    userId,
    team: [{
      userId,
      role: 'owner',
      permissions: {
        canEdit: true,
        canDelete: true,
        canInvite: true,
        canManageBudget: true,
      },
    }],
  };

  const project = new Project(projectData);
  await project.save();

  // Clear cache
  await deleteCache(`projects:${userId}:*`);

  res.status(201).json({
    success: true,
    data: project,
    message: 'Project created successfully',
  });
}));

// Update project
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty(),
  body('type').optional().isIn(['content_campaign', 'brand_management', 'social_media_strategy', 'market_research', 'crisis_management', 'product_launch']),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed', 'cancelled']),
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

  const project = await Project.findOne({
    _id: id,
    $or: [
      { userId },
      { 'team.userId': userId, 'team.permissions.canEdit': true },
    ],
    isActive: true,
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  Object.assign(project, req.body);
  await project.save();

  // Clear cache
  await deleteCache(`projects:${userId}:*`);

  res.json({
    success: true,
    data: project,
    message: 'Project updated successfully',
  });
}));

// Delete project
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const project = await Project.findOne({
    _id: id,
    $or: [
      { userId },
      { 'team.userId': userId, 'team.permissions.canDelete': true },
    ],
    isActive: true,
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found',
    });
  }

  project.isActive = false;
  await project.save();

  // Clear cache
  await deleteCache(`projects:${userId}:*`);

  res.json({
    success: true,
    message: 'Project deleted successfully',
  });
}));

// Add team member to project
router.post('/:id/team', authenticateToken, [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').isIn(['owner', 'admin', 'editor', 'viewer']).withMessage('Invalid role'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const currentUserId = req.user!.id;
  const { id } = req.params;
  const { userId, role, permissions = {} } = req.body;

  const project = await Project.findOne({
    _id: id,
    userId: currentUserId,
    isActive: true,
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or you don\'t have permission',
    });
  }

  // Check if user is already in team
  const existingMember = project.team.find(member => member.userId.toString() === userId);
  if (existingMember) {
    return res.status(400).json({
      success: false,
      message: 'User is already a team member',
    });
  }

  // Add team member
  const defaultPermissions = {
    canEdit: ['admin', 'editor'].includes(role),
    canDelete: role === 'admin',
    canInvite: ['admin'].includes(role),
    canManageBudget: ['admin'].includes(role),
    ...permissions,
  };

  project.team.push({
    userId,
    role,
    permissions: defaultPermissions,
  });

  await project.save();

  // Clear cache
  await deleteCache(`projects:${currentUserId}:*`);

  res.json({
    success: true,
    data: project,
    message: 'Team member added successfully',
  });
}));

// Remove team member from project
router.delete('/:id/team/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const currentUserId = req.user!.id;
  const { id, userId } = req.params;

  const project = await Project.findOne({
    _id: id,
    userId: currentUserId,
    isActive: true,
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found or you don\'t have permission',
    });
  }

  // Remove team member
  project.team = project.team.filter(member => member.userId.toString() !== userId);
  await project.save();

  // Clear cache
  await deleteCache(`projects:${currentUserId}:*`);

  res.json({
    success: true,
    data: project,
    message: 'Team member removed successfully',
  });
}));

// Get project statistics
router.get('/stats/overview', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const cacheKey = `projects:${userId}:stats`;

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
    totalProjects,
    activeProjects,
    completedProjects,
    projectsByType,
    projectsByStatus,
    totalBudget,
    spentBudget,
    recentProjects,
  ] = await Promise.all([
    Project.countDocuments({
      $or: [
        { userId },
        { 'team.userId': userId },
      ],
      isActive: true,
    }),
    Project.countDocuments({
      $or: [
        { userId },
        { 'team.userId': userId },
      ],
      status: 'active',
      isActive: true,
    }),
    Project.countDocuments({
      $or: [
        { userId },
        { 'team.userId': userId },
      ],
      status: 'completed',
      isActive: true,
    }),
    Project.aggregate([
      { $match: { $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { 'team.userId': new mongoose.Types.ObjectId(userId) }], isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      { $match: { $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { 'team.userId': new mongoose.Types.ObjectId(userId) }], isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      { $match: { $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { 'team.userId': new mongoose.Types.ObjectId(userId) }], isActive: true } },
      { $group: { _id: null, total: { $sum: '$budget.total' } } },
    ]),
    Project.aggregate([
      { $match: { $or: [{ userId: new mongoose.Types.ObjectId(userId) }, { 'team.userId': new mongoose.Types.ObjectId(userId) }], isActive: true } },
      { $group: { _id: null, total: { $sum: '$budget.spent' } } },
    ]),
    Project.find({
      $or: [
        { userId },
        { 'team.userId': userId },
      ],
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name type status timeline.startDate timeline.endDate'),
  ]);

  const stats = {
    totalProjects,
    activeProjects,
    completedProjects,
    projectsByType: projectsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    projectsByStatus: projectsByStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    totalBudget: totalBudget[0]?.total || 0,
    spentBudget: spentBudget[0]?.total || 0,
    recentProjects,
  };

  // Cache the statistics
  await cacheData(cacheKey, stats, 3600); // 1 hour

  res.json({
    success: true,
    data: stats,
  });
}));

export default router;