import { Request, Response } from 'express';
import { InternationalConfig } from '../models/InternationalConfig';
import { logger } from '../utils/logger';

export class InternationalController {
  /**
   * Create international configuration
   */
  async createInternationalConfig(req: Request, res: Response) {
    try {
      const config = new InternationalConfig({
        ...req.body,
        status: 'pending'
      });

      await config.save();

      logger.info(`International config created: ${config.region} - ${config.country}`);
      res.status(201).json({
        success: true,
        data: config,
        message: 'International configuration created successfully'
      });
    } catch (error) {
      logger.error('Error creating international configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create international configuration'
      });
    }
  }

  /**
   * Get all international configurations
   */
  async getInternationalConfigs(req: Request, res: Response) {
    try {
      const { region, status, limit = 10, offset = 0 } = req.query;

      const filter: any = {};
      if (region) filter.region = region;
      if (status) filter.status = status;

      const configs = await InternationalConfig.find(filter)
        .sort({ launchDate: 1 })
        .limit(Number(limit))
        .skip(Number(offset));

      const total = await InternationalConfig.countDocuments(filter);

      res.json({
        success: true,
        data: configs,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      });
    } catch (error) {
      logger.error('Error fetching international configurations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch international configurations'
      });
    }
  }

  /**
   * Get international configuration by ID
   */
  async getInternationalConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const config = await InternationalConfig.findById(id);

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'International configuration not found'
        });
      }

      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error fetching international configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch international configuration'
      });
    }
  }

  /**
   * Update international configuration
   */
  async updateInternationalConfig(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const config = await InternationalConfig.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'International configuration not found'
        });
      }

      logger.info(`International config updated: ${config.region} - ${config.country}`);
      res.json({
        success: true,
        data: config,
        message: 'International configuration updated successfully'
      });
    } catch (error) {
      logger.error('Error updating international configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update international configuration'
      });
    }
  }

  /**
   * Launch international region
   */
  async launchRegion(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const config = await InternationalConfig.findById(id);
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'International configuration not found'
        });
      }

      // Validate readiness
      if (!this.validateReadiness(config)) {
        return res.status(400).json({
          success: false,
          error: 'Region not ready for launch'
        });
      }

      config.status = 'active';
      config.launchDate = new Date();

      await config.save();

      logger.info(`Region launched: ${config.region} - ${config.country}`);
      res.json({
        success: true,
        data: config,
        message: 'Region launched successfully'
      });
    } catch (error) {
      logger.error('Error launching region:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to launch region'
      });
    }
  }

  /**
   * Get regions by language
   */
  async getRegionsByLanguage(req: Request, res: Response) {
    try {
      const { language } = req.params;

      const regions = await InternationalConfig.find({
        language,
        status: 'active'
      });

      res.json({
        success: true,
        data: regions
      });
    } catch (error) {
      logger.error('Error fetching regions by language:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch regions by language'
      });
    }
  }

  /**
   * Get localized content
   */
  async getLocalizedContent(req: Request, res: Response) {
    try {
      const { region, key, type = 'interface' } = req.params;

      const config = await InternationalConfig.findOne({ region, status: 'active' });
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Region configuration not found'
        });
      }

      const content = config.getLocalizedContent(key, type);

      res.json({
        success: true,
        data: {
          key,
          type,
          content,
          language: config.language,
          region: config.region
        }
      });
    } catch (error) {
      logger.error('Error fetching localized content:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch localized content'
      });
    }
  }

  /**
   * Get regional pricing
   */
  async getRegionalPricing(req: Request, res: Response) {
    try {
      const { region } = req.params;

      const config = await InternationalConfig.findOne({ region, status: 'active' });
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Region configuration not found'
        });
      }

      res.json({
        success: true,
        data: {
          region: config.region,
          pricing: config.pricing,
          currency: config.currency,
          tax: config.pricing.tax
        }
      });
    } catch (error) {
      logger.error('Error fetching regional pricing:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch regional pricing'
      });
    }
  }

  /**
   * Get regional compliance info
   */
  async getRegionalCompliance(req: Request, res: Response) {
    try {
      const { region } = req.params;

      const config = await InternationalConfig.findOne({ region, status: 'active' });
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Region configuration not found'
        });
      }

      res.json({
        success: true,
        data: {
          region: config.region,
          compliance: config.compliance
        }
      });
    } catch (error) {
      logger.error('Error fetching regional compliance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch regional compliance'
      });
    }
  }

  /**
   * Get regional marketing campaigns
   */
  async getRegionalCampaigns(req: Request, res: Response) {
    try {
      const { region } = req.params;
      const { status, limit = 10, offset = 0 } = req.query;

      const config = await InternationalConfig.findOne({ region, status: 'active' });
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Region configuration not found'
        });
      }

      let campaigns = config.marketing.campaigns;

      if (status) {
        campaigns = campaigns.filter((campaign: any) => campaign.status === status);
      }

      const total = campaigns.length;
      const paginatedCampaigns = campaigns.slice(Number(offset), Number(offset) + Number(limit));

      res.json({
        success: true,
        data: paginatedCampaigns,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total
        }
      });
    } catch (error) {
      logger.error('Error fetching regional campaigns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch regional campaigns'
      });
    }
  }

  /**
   * Create regional campaign
   */
  async createRegionalCampaign(req: Request, res: Response) {
    try {
      const { region } = req.params;
      const campaign = req.body;

      const config = await InternationalConfig.findOne({ region });
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Region configuration not found'
        });
      }

      config.marketing.campaigns.push({
        ...campaign,
        id: Math.random().toString(36).substr(2, 9),
        status: 'planning'
      });

      await config.save();

      logger.info(`Regional campaign created: ${campaign.name} in ${region}`);
      res.status(201).json({
        success: true,
        data: config.marketing.campaigns[config.marketing.campaigns.length - 1],
        message: 'Regional campaign created successfully'
      });
    } catch (error) {
      logger.error('Error creating regional campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create regional campaign'
      });
    }
  }

  /**
   * Update regional campaign
   */
  async updateRegionalCampaign(req: Request, res: Response) {
    try {
      const { region, campaignId } = req.params;
      const updates = req.body;

      const config = await InternationalConfig.findOne({ region });
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Region configuration not found'
        });
      }

      const campaign = config.marketing.campaigns.find((c: any) => c.id === campaignId);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      Object.assign(campaign, updates);
      await config.save();

      logger.info(`Regional campaign updated: ${campaign.name} in ${region}`);
      res.json({
        success: true,
        data: campaign,
        message: 'Regional campaign updated successfully'
      });
    } catch (error) {
      logger.error('Error updating regional campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update regional campaign'
      });
    }
  }

  /**
   * Get regional performance metrics
   */
  async getRegionalPerformance(req: Request, res: Response) {
    try {
      const { region } = req.params;
      const { startDate, endDate } = req.query;

      const config = await InternationalConfig.findOne({ region, status: 'active' });
      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Region configuration not found'
        });
      }

      // Filter metrics by date range if provided
      let performance = config.performance;

      if (startDate && endDate) {
        // This would typically involve querying a metrics collection
        // For now, return current performance data
        performance = config.performance;
      }

      res.json({
        success: true,
        data: {
          region: config.region,
          country: config.country,
          language: config.language,
          currency: config.currency,
          performance,
          marketing: config.marketing.performance,
          infrastructure: config.infrastructure.services,
          support: config.support.performance
        }
      });
    } catch (error) {
      logger.error('Error fetching regional performance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch regional performance'
      });
    }
  }

  /**
   * Get global dashboard
   */
  async getGlobalDashboard(req: Request, res: Response) {
    try {
      const activeRegions = await InternationalConfig.find({ status: 'active' });
      const pendingRegions = await InternationalConfig.find({ status: 'pending' });

      const globalMetrics = {
        totalRegions: activeRegions.length + pendingRegions.length,
        activeRegions: activeRegions.length,
        pendingRegions: pendingRegions.length,
        totalUsers: activeRegions.reduce((sum, region) => sum + region.performance.users.total, 0),
        totalRevenue: activeRegions.reduce((sum, region) => sum + region.performance.revenue.total, 0),
        averageSatisfaction: activeRegions.reduce((sum, region) => sum + region.support.performance.satisfaction, 0) / activeRegions.length,
        averageUptime: activeRegions.reduce((sum, region) => sum + region.infrastructure.services.uptime, 0) / activeRegions.length
      };

      const regionBreakdown = activeRegions.map(region => ({
        region: region.region,
        country: region.country,
        language: region.language,
        users: region.performance.users.total,
        revenue: region.performance.revenue.total,
        satisfaction: region.support.performance.satisfaction,
        uptime: region.infrastructure.services.uptime
      }));

      res.json({
        success: true,
        data: {
          overview: globalMetrics,
          regions: regionBreakdown,
          topPerformers: regionBreakdown
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5),
          growthOpportunities: pendingRegions
            .map(region => ({
              region: region.region,
              country: region.country,
              launchDate: region.launchDate,
              estimatedMarketSize: region.marketing.budget.total
            }))
        }
      });
    } catch (error) {
      logger.error('Error fetching global dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch global dashboard'
      });
    }
  }

  /**
   * Validate region readiness
   */
  private validateReadiness(config: any): boolean {
    // Check infrastructure readiness
    if (config.infrastructure.services.status !== 'operational') {
      return false;
    }

    // Check localization completeness
    if (!config.localization.translations.interface.size) {
      return false;
    }

    // Check compliance setup
    if (!config.compliance.dataPrivacy.regulation) {
      return false;
    }

    // Check marketing readiness
    if (config.marketing.campaigns.length === 0) {
      return false;
    }

    // Check support setup
    if (config.support.languages.length === 0) {
      return false;
    }

    return true;
  }
}