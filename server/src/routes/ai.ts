import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { aiService } from '../services/aiService';
import { Agent, Generation } from '../models';
import { cacheData, getCachedData, deleteCache } from '../config/redis';

const router = express.Router();

// Get available AI models
router.get('/models', authenticateToken, asyncHandler(async (req, res) => {
  const providers = await aiService.getAvailableProviders();
  const models = {};

  for (const provider of providers) {
    models[provider] = await aiService.getModelsForProvider(provider);
  }

  res.json({
    success: true,
    data: {
      providers,
      models,
    },
  });
}));

// Generate content
router.post('/generate', authenticateToken, [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('model').optional().isString(),
  body('temperature').optional().isFloat({ min: 0, max: 2 }),
  body('maxTokens').optional().isInt({ min: 1, max: 8192 }),
  body('agentId').optional().isString(),
  body('context').optional().isString(),
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
    prompt,
    model,
    temperature,
    maxTokens,
    agentId,
    context,
  } = req.body;

  try {
    const result = await aiService.generateContent(prompt, userId, {
      model,
      temperature,
      maxTokens,
      agentId,
      context,
    });

    res.json({
      success: true,
      message: 'Content generated successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to generate content: ${error.message}`,
    });
  }
}));

// Get user's generation history
router.get('/generations', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']),
  query('model').optional().isString(),
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
    model,
  } = req.query;

  const result = await aiService.getUserGenerations(userId, {
    page: Number(page),
    limit: Number(limit),
    status,
    model,
  });

  res.json({
    success: true,
    data: result,
  });
}));

// Get generation details
router.get('/generations/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const generationId = req.params.id;

  const generation = await Generation.findOne({
    _id: generationId,
    userId,
  }).populate('agentId', 'name type');

  if (!generation) {
    return res.status(404).json({
      success: false,
      message: 'Generation not found',
    });
  }

  res.json({
    success: true,
    data: generation,
  });
}));

// Get generation statistics
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const stats = await aiService.getGenerationStats(userId);

  res.json({
    success: true,
    data: stats,
  });
}));

// Create new agent
router.post('/agents', authenticateToken, [
  body('name').notEmpty().withMessage('Agent name is required'),
  body('type').isIn(['content', 'analysis', 'marketing', 'technical', 'social']).withMessage('Invalid agent type'),
  body('systemPrompt').notEmpty().withMessage('System prompt is required'),
  body('config.model').isIn(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-2', 'claude-instant', 'gemini-pro', 'gemini-1.5-pro', 'deepseek-chat']).withMessage('Invalid model'),
  body('config.temperature').optional().isFloat({ min: 0, max: 2 }),
  body('config.maxTokens').optional().isInt({ min: 1, max: 8192 }),
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
    type,
    systemPrompt,
    description,
    config,
    tags,
  } = req.body;

  const agent = new Agent({
    userId,
    name,
    type,
    systemPrompt,
    description,
    config: {
      model: config.model || 'gpt-3.5-turbo',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1000,
      outputFormat: config.outputFormat || 'text',
      constraints: config.constraints || [],
    },
    tags,
  });

  await agent.save();

  // Clear cache
  await deleteCache(`user:${userId}:agents`);

  res.status(201).json({
    success: true,
    message: 'Agent created successfully',
    data: agent,
  });
}));

// Get user's agents
router.get('/agents', authenticateToken, [
  query('type').optional().isIn(['content', 'analysis', 'marketing', 'technical', 'social']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const {
    type,
    page = 1,
    limit = 20,
  } = req.query;

  const query: any = { userId, isActive: true };
  if (type) query.type = type;

  const [agents, total] = await Promise.all([
    Agent.find(query)
      .sort({ isDefault: -1, usageCount: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Agent.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: {
      agents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: page * limit < total,
      },
    },
  });
}));

// Get agent details
router.get('/agents/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const agentId = req.params.id;

  const agent = await Agent.findOne({
    _id: agentId,
    userId,
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  res.json({
    success: true,
    data: agent,
  });
}));

// Update agent
router.put('/agents/:id', authenticateToken, [
  body('name').optional().notEmpty(),
  body('type').optional().isIn(['content', 'analysis', 'marketing', 'technical', 'social']),
  body('systemPrompt').optional().notEmpty(),
  body('config.model').optional().isIn(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'claude-2', 'claude-instant', 'gemini-pro', 'gemini-1.5-pro', 'deepseek-chat']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const agentId = req.params.id;
  const updateData = req.body;

  const agent = await Agent.findOneAndUpdate(
    { _id: agentId, userId },
    updateData,
    { new: true }
  );

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  // Clear cache
  await deleteCache(`user:${userId}:agents`);

  res.json({
    success: true,
    message: 'Agent updated successfully',
    data: agent,
  });
}));

// Delete agent
router.delete('/agents/:id', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const agentId = req.params.id;

  const agent = await Agent.findOneAndDelete({
    _id: agentId,
    userId,
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  // Clear cache
  await deleteCache(`user:${userId}:agents`);

  res.json({
    success: true,
    message: 'Agent deleted successfully',
  });
}));

// Set default agent
router.post('/agents/:id/default', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const agentId = req.params.id;

  const agent = await Agent.findOne({
    _id: agentId,
    userId,
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  // Unset default for other agents of the same type
  await Agent.updateMany(
    { userId, type: agent.type, _id: { $ne: agentId } },
    { isDefault: false }
  );

  // Set this agent as default
  agent.isDefault = true;
  await agent.save();

  // Clear cache
  await deleteCache(`user:${userId}:agents`);

  res.json({
    success: true,
    message: 'Default agent set successfully',
    data: agent,
  });
}));

// Test agent
router.post('/agents/:id/test', authenticateToken, [
  body('prompt').notEmpty().withMessage('Test prompt is required'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const userId = req.user!.id;
  const agentId = req.params.id;
  const { prompt } = req.body;

  const agent = await Agent.findOne({
    _id: agentId,
    userId,
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found',
    });
  }

  try {
    const result = await aiService.generateContent(prompt, userId, {
      model: agent.config.model,
      temperature: agent.config.temperature,
      maxTokens: agent.config.maxTokens,
      agentId: agent._id,
      systemPrompt: agent.systemPrompt,
    });

    res.json({
      success: true,
      message: 'Agent test successful',
      data: {
        result,
        agent: {
          name: agent.name,
          type: agent.type,
          model: agent.config.model,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Agent test failed: ${error.message}`,
    });
  }
}));

export default router;