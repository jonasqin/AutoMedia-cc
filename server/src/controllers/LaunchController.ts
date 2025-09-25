import { Request, Response } from 'express';
import { LaunchConfig } from '../models/LaunchConfig';
import { Subscription } from '../models/Subscription';
import { UserAnalytics } from '../models/UserAnalytics';
import { MarketingCampaign } from '../models/MarketingCampaign';
import logger from '../utils/logger';

export class LaunchController {
  /**
   * Create a new launch configuration
   */
  async createLaunchConfig(req: Request, res: Response) {
    try {
      const launchConfig = new LaunchConfig({
        ...req.body,
        createdBy: req.user?.id,
        status: 'planning'
      });

      await launchConfig.save();

      logger.info(`Launch configuration created: ${launchConfig.name}`);
      res.status(201).json({
        success: true,
        data: launchConfig,
        message: 'Launch configuration created successfully'
      });
    } catch (error) {
      logger.error('Error creating launch configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create launch configuration'
      });
    }
  }

  /**
   * Get all launch configurations
   */
  async getLaunchConfigs(req: Request, res: Response) {
    try {
      const { status, limit = 10, offset = 0 } = req.query;

      const filter: any = {};
      if (status) filter.status = status;

      const launchConfigs = await LaunchConfig.find(filter)
        .sort({ launchDate: -1 })
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('team.members.userId', 'name email')
        .populate('team.lead', 'name email');

      const total = await LaunchConfig.countDocuments(filter);

      res.json({
        success: true,
        data: launchConfigs,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      });
    } catch (error) {
      logger.error('Error fetching launch configurations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch launch configurations'
      });
    }
  }

  /**
   * Get launch configuration by ID
   */
  async getLaunchConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const launchConfig = await LaunchConfig.findById(id)
        .populate('team.members.userId', 'name email')
        .populate('team.lead', 'name email');

      if (!launchConfig) {
        return res.status(404).json({
          success: false,
          error: 'Launch configuration not found'
        });
      }

      res.json({
        success: true,
        data: launchConfig
      });
    } catch (error) {
      logger.error('Error fetching launch configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch launch configuration'
      });
    }
  }

  /**
   * Update launch configuration
   */
  async updateLaunchConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const launchConfig = await LaunchConfig.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).populate('team.members.userId', 'name email');

      if (!launchConfig) {
        return res.status(404).json({
          success: false,
          error: 'Launch configuration not found'
        });
      }

      logger.info(`Launch configuration updated: ${launchConfig.name}`);
      res.json({
        success: true,
        data: launchConfig,
        message: 'Launch configuration updated successfully'
      });
    } catch (error) {
      logger.error('Error updating launch configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update launch configuration'
      });
    }
  }

  /**
   * Delete launch configuration
   */
  async deleteLaunchConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const launchConfig = await LaunchConfig.findByIdAndDelete(id);

      if (!launchConfig) {
        return res.status(404).json({
          success: false,
          error: 'Launch configuration not found'
        });
      }

      logger.info(`Launch configuration deleted: ${launchConfig.name}`);
      res.json({
        success: true,
        message: 'Launch configuration deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting launch configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete launch configuration'
      });
    }
  }

  /**
   * Execute launch phase
   */
  async executeLaunchPhase(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { phaseName, action } = req.body;

      const launchConfig = await LaunchConfig.findById(id);
      if (!launchConfig) {
        return res.status(404).json({
          success: false,
          error: 'Launch configuration not found'
        });
      }

      const phase = launchConfig.phases.find(p => p.name === phaseName);
      if (!phase) {
        return res.status(404).json({
          success: false,
          error: 'Launch phase not found'
        });
      }

      switch (action) {
        case 'start':
          phase.status = 'in_progress';
          break;
        case 'complete':
          phase.status = 'completed';
          break;
        case 'pause':
          phase.status = 'pending';
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid action'
          });
      }

      await launchConfig.save();

      // Log phase execution
      logger.info(`Launch phase ${action}: ${launchConfig.name} - ${phaseName}`);

      // Execute phase-specific actions
      if (action === 'start') {
        await this.executePhaseActions(launchConfig, phase);
      }

      res.json({
        success: true,
        data: launchConfig,
        message: `Launch phase ${action} successfully`
      });
    } catch (error) {
      logger.error('Error executing launch phase:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute launch phase'
      });
    }
  }

  /**
   * Get launch metrics
   */
  async getLaunchMetrics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const launchConfig = await LaunchConfig.findById(id);
      if (!launchConfig) {
        return res.status(404).json({
          success: false,
          error: 'Launch configuration not found'
        });
      }

      // Get user acquisition metrics
      const userMetrics = await UserAnalytics.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate as string || launchConfig.launchDate),
              $lte: new Date(endDate as string || new Date())
            }
          }
        },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
            avgSessionDuration: { $avg: '$sessionDuration' }
          }
        }
      ]);

      // Get subscription metrics
      const subscriptionMetrics = await Subscription.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate as string || launchConfig.launchDate),
              $lte: new Date(endDate as string || new Date())
            }
          }
        },
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$renewalAmount' }
          }
        }
      ]);

      // Get campaign metrics
      const campaignMetrics = await MarketingCampaign.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(startDate as string || launchConfig.launchDate),
              $lte: new Date(endDate as string || new Date())
            }
          }
        },
        {
          $group: {
            _id: null,
            totalCampaigns: { $sum: 1 },
            totalBudget: { $sum: '$budget' },
            totalSpent: { $sum: '$spent' },
            avgROI: { $avg: '$metrics.roi' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          launchConfig: {
            name: launchConfig.name,
            launchDate: launchConfig.launchDate,
            status: launchConfig.status,
            progress: launchConfig.progress,
            budgetUtilization: launchConfig.budgetUtilization
          },
          userMetrics: userMetrics[0] || {},
          subscriptionMetrics,
          campaignMetrics: campaignMetrics[0] || {},
          realTimeMetrics: launchConfig.metrics
        }
      });
    } catch (error) {
      logger.error('Error fetching launch metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch launch metrics'
      });
    }
  }

  /**
   * Get launch dashboard
   */
  async getLaunchDashboard(req: Request, res: Response) {
    try {
      const { limit = 5 } = req.query;

      // Get active launches
      const activeLaunches = await LaunchConfig.find({
        status: { $in: ['ready', 'active'] }
      })
        .sort({ launchDate: 1 })
        .limit(Number(limit));

      // Get upcoming launches
      const upcomingLaunches = await LaunchConfig.find({
        status: 'ready',
        launchDate: { $gt: new Date() }
      })
        .sort({ launchDate: 1 })
        .limit(Number(limit));

      // Get completed launches
      const completedLaunches = await LaunchConfig.find({
        status: 'completed'
      })
        .sort({ launchDate: -1 })
        .limit(Number(limit));

      // Get overall metrics
      const totalLaunches = await LaunchConfig.countDocuments();
      const activeLaunchesCount = await LaunchConfig.countDocuments({ status: 'active' });
      const completedLaunchesCount = await LaunchConfig.countDocuments({ status: 'completed' });

      res.json({
        success: true,
        data: {
          overview: {
            totalLaunches,
            activeLaunches: activeLaunchesCount,
            completedLaunches: completedLaunchesCount,
            successRate: totalLaunches > 0 ? (completedLaunchesCount / totalLaunches) * 100 : 0
          },
          activeLaunches,
          upcomingLaunches,
          completedLaunches
        }
      });
    } catch (error) {
      logger.error('Error fetching launch dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch launch dashboard'
      });
    }
  }

  /**
   * Execute phase-specific actions
   */
  private async executePhaseActions(launchConfig: any, phase: any) {
    switch (phase.name.toLowerCase()) {
      case 'infrastructure validation':
        await this.validateInfrastructure(launchConfig);
        break;
      case 'marketing activation':
        await this.activateMarketingCampaigns(launchConfig);
        break;
      case 'beta migration':
        await this.migrateBetaUsers(launchConfig);
        break;
      case 'monitoring setup':
        await this.setupMonitoring(launchConfig);
        break;
      default:
        logger.info(`No specific actions for phase: ${phase.name}`);
    }
  }

  /**
   * Validate launch infrastructure
   */
  private async validateInfrastructure(launchConfig: any) {
    logger.info(`Validating infrastructure for launch: ${launchConfig.name}`);

    // Check infrastructure status
    const infrastructureStatus = launchConfig.infrastructure.status;
    if (infrastructureStatus !== 'ready') {
      throw new Error(`Infrastructure not ready for launch: ${infrastructureStatus}`);
    }

    // Validate all components
    const components = launchConfig.infrastructure.components;
    Object.entries(components).forEach(([component, status]: [string, any]) => {
      if (status.status === 'critical') {
        throw new Error(`Critical infrastructure component: ${component}`);
      }
    });

    logger.info(`Infrastructure validation completed for: ${launchConfig.name}`);
  }

  /**
   * Activate marketing campaigns
   */
  private async activateMarketingCampaigns(launchConfig: any) {
    logger.info(`Activating marketing campaigns for launch: ${launchConfig.name}`);

    const activeCampaigns = launchConfig.marketing.campaigns.filter(
      (campaign: any) => campaign.status === 'draft'
    );

    for (const campaign of activeCampaigns) {
      campaign.status = 'active';
      logger.info(`Activated campaign: ${campaign.name}`);
    }

    await launchConfig.save();
  }

  /**
   * Migrate beta users
   */
  private async migrateBetaUsers(launchConfig: any) {
    logger.info(`Migrating beta users for launch: ${launchConfig.name}`);

    // This would involve actual beta user migration logic
    // For now, just log the action
    logger.info(`Beta user migration completed for: ${launchConfig.name}`);
  }

  /**
   * Setup monitoring
   */
  private async setupMonitoring(launchConfig: any) {
    logger.info(`Setting up monitoring for launch: ${launchConfig.name}`);

    // This would involve setting up monitoring and alerting
    // For now, just log the action
    logger.info(`Monitoring setup completed for: ${launchConfig.name}`);
  }
}