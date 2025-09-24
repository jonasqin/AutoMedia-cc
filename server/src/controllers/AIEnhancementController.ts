import { Request, Response } from 'express';
import { AIEnhancement } from '../models/AIEnhancement';
import { logger } from '../utils/logger';

export class AIEnhancementController {
  /**
   * Create AI enhancement
   */
  async createAIEnhancement(req: Request, res: Response) {
    try {
      const enhancement = new AIEnhancement({
        ...req.body,
        status: 'research'
      });

      await enhancement.save();

      logger.info(`AI enhancement created: ${enhancement.name} (${enhancement.type})`);
      res.status(201).json({
        success: true,
        data: enhancement,
        message: 'AI enhancement created successfully'
      });
    } catch (error) {
      logger.error('Error creating AI enhancement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create AI enhancement'
      });
    }
  }

  /**
   * Get all AI enhancements
   */
  async getAIEnhancements(req: Request, res: Response) {
    try {
      const { type, category, status, priority, limit = 10, offset = 0 } = req.query;

      const filter: any = {};
      if (type) filter.type = type;
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;

      const enhancements = await AIEnhancement.find(filter)
        .sort({ priority: -1, updatedAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset));

      const total = await AIEnhancement.countDocuments(filter);

      res.json({
        success: true,
        data: enhancements,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      });
    } catch (error) {
      logger.error('Error fetching AI enhancements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI enhancements'
      });
    }
  }

  /**
   * Get AI enhancement by ID
   */
  async getAIEnhancement(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const enhancement = await AIEnhancement.findById(id);

      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      res.json({
        success: true,
        data: enhancement
      });
    } catch (error) {
      logger.error('Error fetching AI enhancement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI enhancement'
      });
    }
  }

  /**
   * Update AI enhancement
   */
  async updateAIEnhancement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const enhancement = await AIEnhancement.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      logger.info(`AI enhancement updated: ${enhancement.name}`);
      res.json({
        success: true,
        data: enhancement,
        message: 'AI enhancement updated successfully'
      });
    } catch (error) {
      logger.error('Error updating AI enhancement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update AI enhancement'
      });
    }
  }

  /**
   * Delete AI enhancement
   */
  async deleteAIEnhancement(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const enhancement = await AIEnhancement.findByIdAndDelete(id);

      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      logger.info(`AI enhancement deleted: ${enhancement.name}`);
      res.json({
        success: true,
        message: 'AI enhancement deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting AI enhancement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete AI enhancement'
      });
    }
  }

  /**
   * Deploy AI enhancement
   */
  async deployAIEnhancement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { environment, version } = req.body;

      const enhancement = await AIEnhancement.findById(id);
      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      // Validate deployment readiness
      if (!this.validateDeploymentReadiness(enhancement)) {
        return res.status(400).json({
          success: false,
          error: 'Enhancement not ready for deployment'
        });
      }

      enhancement.deployment = {
        environment,
        status: 'deploying',
        version: version || enhancement.version,
        deployedAt: new Date(),
        ...enhancement.deployment
      };

      enhancement.status = environment === 'production' ? 'production' : 'testing';

      await enhancement.save();

      logger.info(`AI enhancement deployed: ${enhancement.name} to ${environment}`);
      res.json({
        success: true,
        data: enhancement,
        message: `AI enhancement deployed to ${environment} successfully`
      });
    } catch (error) {
      logger.error('Error deploying AI enhancement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to deploy AI enhancement'
      });
    }
  }

  /**
   * Get AI models by provider
   */
  async getAIModelsByProvider(req: Request, res: Response) {
    try {
      const { provider } = req.params;

      const enhancements = await AIEnhancement.find({
        'models.provider': provider,
        'models.status': 'available',
        status: { $ne: 'deprecated' }
      });

      const models = enhancements.flatMap(enhancement =>
        enhancement.models
          .filter(model => model.provider === provider && model.status === 'available')
          .map(model => ({
            enhancement: enhancement.name,
            enhancementId: enhancement.id,
            ...model.toObject()
          }))
      );

      res.json({
        success: true,
        data: models
      });
    } catch (error) {
      logger.error('Error fetching AI models by provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI models by provider'
      });
    }
  }

  /**
   * Get AI features by category
   */
  async getAIFeaturesByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;

      const enhancements = await AIEnhancement.find({
        category,
        status: { $ne: 'deprecated' }
      });

      const features = enhancements.flatMap(enhancement =>
        enhancement.features.map(feature => ({
          enhancement: enhancement.name,
          enhancementId: enhancement.id,
          category: enhancement.category,
          ...feature.toObject()
        }))
      );

      res.json({
        success: true,
        data: features
      });
    } catch (error) {
      logger.error('Error fetching AI features by category:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI features by category'
      });
    }
  }

  /**
   * Get cost estimate
   */
  async getCostEstimate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { requests, tokens, model } = req.body;

      const enhancement = await AIEnhancement.findById(id);
      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      const costEstimate = enhancement.getCostEstimate(requests, tokens, model);

      res.json({
        success: true,
        data: {
          enhancement: enhancement.name,
          model,
          requests,
          tokens,
          estimatedCost: costEstimate,
          currency: enhancement.models[0]?.pricing.currency || 'USD'
        }
      });
    } catch (error) {
      logger.error('Error calculating cost estimate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate cost estimate'
      });
    }
  }

  /**
   * Check compliance
   */
  async checkCompliance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { regulation } = req.params;

      const enhancement = await AIEnhancement.findById(id);
      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      const isCompliant = enhancement.isCompliant(regulation);

      res.json({
        success: true,
        data: {
          enhancement: enhancement.name,
          regulation,
          isCompliant,
          complianceInfo: enhancement.compliance
        }
      });
    } catch (error) {
      logger.error('Error checking compliance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check compliance'
      });
    }
  }

  /**
   * Get AI performance metrics
   */
  async getAIPerformanceMetrics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const enhancement = await AIEnhancement.findById(id);
      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      // Filter metrics by date range if provided
      let performance = enhancement.performance;

      if (startDate && endDate) {
        // This would typically involve querying a metrics collection
        // For now, return current performance data
        performance = enhancement.performance;
      }

      res.json({
        success: true,
        data: {
          enhancement: enhancement.name,
          performance,
          usage: enhancement.usage,
          cost: enhancement.cost,
          uptime: enhancement.deployment.monitoring.enabled ?
            enhancement.performance.overall.uptime : null
        }
      });
    } catch (error) {
      logger.error('Error fetching AI performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI performance metrics'
      });
    }
  }

  /**
   * Get AI enhancement roadmap
   */
  async getAIEnhancementRoadmap(req: Request, res: Response) {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const enhancements = await AIEnhancement.find({
        status: { $in: ['research', 'development', 'testing', 'beta'] }
      })
        .sort({ priority: -1, status: 1 })
        .limit(Number(limit))
        .skip(Number(offset));

      const roadmap = {
        research: enhancements.filter(e => e.status === 'research'),
        development: enhancements.filter(e => e.status === 'development'),
        testing: enhancements.filter(e => e.status === 'testing'),
        beta: enhancements.filter(e => e.status === 'beta'),
        production: enhancements.filter(e => e.status === 'production')
      };

      res.json({
        success: true,
        data: roadmap
      });
    } catch (error) {
      logger.error('Error fetching AI enhancement roadmap:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI enhancement roadmap'
      });
    }
  }

  /**
   * Get AI capabilities
   */
  async getAICapabilities(req: Request, res: Response) {
    try {
      const { enhancementId } = req.params;

      const enhancement = await AIEnhancement.findById(enhancementId);
      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      const capabilities = enhancement.capabilities.map(cap => ({
        name: cap.name,
        description: cap.description,
        type: cap.type,
        enabled: cap.enabled,
        performance: cap.performance,
        dependencies: cap.dependencies
      }));

      res.json({
        success: true,
        data: capabilities
      });
    } catch (error) {
      logger.error('Error fetching AI capabilities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI capabilities'
      });
    }
  }

  /**
   * Toggle AI capability
   */
  async toggleAICapability(req: Request, res: Response) {
    try {
      const { enhancementId, capabilityName } = req.params;
      const { enabled } = req.body;

      const enhancement = await AIEnhancement.findById(enhancementId);
      if (!enhancement) {
        return res.status(404).json({
          success: false,
          error: 'AI enhancement not found'
        });
      }

      const capability = enhancement.capabilities.find(cap => cap.name === capabilityName);
      if (!capability) {
        return res.status(404).json({
          success: false,
          error: 'AI capability not found'
        });
      }

      capability.enabled = enabled !== undefined ? enabled : !capability.enabled;

      await enhancement.save();

      logger.info(`AI capability toggled: ${capabilityName} for ${enhancement.name}`);
      res.json({
        success: true,
        data: capability,
        message: `AI capability ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      logger.error('Error toggling AI capability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle AI capability'
      });
    }
  }

  /**
   * Get AI enhancement statistics
   */
  async getAIEnhancementStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await AIEnhancement.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
              $lte: new Date(endDate as string || new Date())
            }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalCost: { $sum: '$cost.total' },
            totalUsage: { $sum: '$usage.total.requests' }
          }
        }
      ]);

      const totalStats = await AIEnhancement.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
              $lte: new Date(endDate as string || new Date())
            }
          }
        },
        {
          $group: {
            _id: null,
            totalEnhancements: { $sum: 1 },
            productionReady: { $sum: { $cond: [{ $eq: ['$status', 'production'] }, 1, 0] } },
            totalCost: { $sum: '$cost.total' },
            totalUsage: { $sum: '$usage.total.requests' },
            avgLatency: { $avg: '$performance.overall.responseTime' }
          }
        }
      ]);

      const categoryStats = await AIEnhancement.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
              $lte: new Date(endDate as string || new Date())
            }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalCost: { $sum: '$cost.total' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          byStatus: stats,
          totals: totalStats[0] || {},
          byCategory: categoryStats
        }
      });
    } catch (error) {
      logger.error('Error fetching AI enhancement statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch AI enhancement statistics'
      });
    }
  }

  /**
   * Validate deployment readiness
   */
  private validateDeploymentReadiness(enhancement: any): boolean {
    // Check if enhancement has models
    if (enhancement.models.length === 0) {
      return false;
    }

    // Check if any models are available
    const hasAvailableModels = enhancement.models.some((model: any) => model.status === 'available');
    if (!hasAvailableModels) {
      return false;
    }

    // Check if features are defined
    if (enhancement.features.length === 0) {
      return false;
    }

    // Check compliance requirements
    if (!enhancement.compliance.dataPrivacy.encryption.atRest ||
        !enhancement.compliance.dataPrivacy.encryption.inTransit) {
      return false;
    }

    return true;
  }
}