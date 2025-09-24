import { Request, Response } from 'express';
import { MarketingCampaign, MarketingContent, MarketingChannel, AudienceSegment } from '../models/MarketingCampaign';

export class MarketingController {
  /**
   * Create new marketing campaign
   */
  static async createCampaign(req: Request, res: Response) {
    try {
      const campaignData = req.body;
      const userId = req.user?.id;

      // Validate campaign data
      if (!campaignData.name || !campaignData.type || !campaignData.category) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: name, type, category'
        });
      }

      // Calculate budget allocation percentages
      if (campaignData.budget && campaignData.budget.allocated) {
        const total = campaignData.budget.total;
        campaignData.budget.allocated = campaignData.budget.allocated.map((allocation: any) => ({
          ...allocation,
          percentage: (allocation.amount / total) * 100
        }));
      }

      const campaign = new MarketingCampaign({
        ...campaignData,
        createdBy: userId,
        status: 'draft'
      });

      await campaign.save();

      res.status(201).json({
        success: true,
        message: 'Marketing campaign created successfully',
        data: campaign
      });
    } catch (error) {
      console.error('Error creating marketing campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create marketing campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get marketing campaigns
   */
  static async getCampaigns(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        category,
        status,
        startDate,
        endDate
      } = req.query;

      const filter: any = {};

      if (type) filter.type = type;
      if (category) filter.category = category;
      if (status) filter.status = status;

      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate as string);
        if (endDate) filter.startDate.$lte = new Date(endDate as string);
      }

      const campaigns = await MarketingCampaign.find(filter)
        .populate('targetAudience channels content createdBy managedBy')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await MarketingCampaign.countDocuments(filter);

      res.json({
        success: true,
        data: {
          campaigns,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting marketing campaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get marketing campaigns',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get campaign by ID
   */
  static async getCampaignById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const campaign = await MarketingCampaign.findById(id)
        .populate('targetAudience channels content createdBy managedBy reviewedBy approvedBy collaborators')
        .lean();

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      res.json({
        success: true,
        data: campaign
      });
    } catch (error) {
      console.error('Error getting campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update campaign
   */
  static async updateCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const campaign = await MarketingCampaign.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Update campaign
      Object.assign(campaign, updates);
      await campaign.save();

      res.json({
        success: true,
        message: 'Campaign updated successfully',
        data: campaign
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Launch campaign
   */
  static async launchCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const campaign = await MarketingCampaign.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Validate campaign is ready to launch
      if (campaign.status !== 'planned') {
        return res.status(400).json({
          success: false,
          message: 'Campaign must be in planned status to launch'
        });
      }

      await campaign.launch();

      // Trigger campaign launch tasks
      await this.executeCampaignLaunch(campaign);

      res.json({
        success: true,
        message: 'Campaign launched successfully',
        data: campaign
      });
    } catch (error) {
      console.error('Error launching campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to launch campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Pause campaign
   */
  static async pauseCampaign(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const campaign = await MarketingCampaign.findById(id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      await campaign.pause();

      res.json({
        success: true,
        message: 'Campaign paused successfully',
        data: campaign
      });
    } catch (error) {
      console.error('Error pausing campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to pause campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const campaign = await MarketingCampaign.findById(id)
        .populate('content')
        .lean();

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Calculate analytics
      const analytics = {
        overview: {
          totalReach: campaign.keyMetrics.reach,
          totalEngagement: campaign.keyMetrics.engagement,
          totalConversions: campaign.keyMetrics.conversions,
          totalRevenue: campaign.keyMetrics.revenue,
          roi: campaign.keyMetrics.roi
        },
        budget: {
          total: campaign.budget.total,
          spent: campaign.budget.spent,
          remaining: campaign.budget.remaining,
          utilization: campaign.budgetUtilization
        },
        content: {
          totalPieces: campaign.content.length,
          publishedPieces: campaign.content.filter((c: any) => c.status === 'published').length,
          totalViews: campaign.content.reduce((sum: number, c: any) => sum + c.performance.views, 0),
          totalClicks: campaign.content.reduce((sum: number, c: any) => sum + c.performance.clicks, 0),
          avgCTR: campaign.content.length > 0
            ? campaign.content.reduce((sum: number, c: any) => sum + (c.performance.views > 0 ? (c.performance.clicks / c.performance.views) * 100 : 0), 0) / campaign.content.length
            : 0
        },
        timeline: {
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          daysRemaining: campaign.daysRemaining,
          isActive: campaign.isActiveCampaign,
          phasesCompleted: campaign.timeline.filter(phase => phase.status === 'completed').length,
          totalPhases: campaign.timeline.length
        }
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campaign analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create marketing content
   */
  static async createContent(req: Request, res: Response) {
    try {
      const contentData = req.body;
      const userId = req.user?.id;

      if (!contentData.type || !contentData.title || !contentData.content) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: type, title, content'
        });
      }

      const content = new MarketingContent({
        ...contentData,
        createdBy: userId
      });

      await content.save();

      res.status(201).json({
        success: true,
        message: 'Marketing content created successfully',
        data: content
      });
    } catch (error) {
      console.error('Error creating marketing content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create marketing content',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get marketing content
   */
  static async getContent(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        campaignId
      } = req.query;

      const filter: any = {};

      if (type) filter.type = type;
      if (status) filter.status = status;
      if (campaignId) filter.campaign = campaignId;

      const content = await MarketingContent.find(filter)
        .populate('createdBy reviewedBy approvedBy')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await MarketingContent.countDocuments(filter);

      res.json({
        success: true,
        data: {
          content,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting marketing content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get marketing content',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create audience segment
   */
  static async createAudienceSegment(req: Request, res: Response) {
    try {
      const segmentData = req.body;

      if (!segmentData.name || !segmentData.description || !segmentData.estimatedSize) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: name, description, estimatedSize'
        });
      }

      const segment = new AudienceSegment(segmentData);
      await segment.save();

      res.status(201).json({
        success: true,
        message: 'Audience segment created successfully',
        data: segment
      });
    } getAudienceSegments
  } catch (error) {
    console.error('Error creating audience segment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create audience segment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  /**
   * Get audience segments
   */
  static async getAudienceSegments(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, isActive } = req.query;

      const filter: any = {};
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const segments = await AudienceSegment.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await AudienceSegment.countDocuments(filter);

      res.json({
        success: true,
        data: {
          segments,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting audience segments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audience segments',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get marketing dashboard
   */
  static async getMarketingDashboard(req: Request, res: Response) {
    try {
      // Get campaign statistics
      const campaignStats = await MarketingCampaign.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            planned: { $sum: { $cond: [{ $eq: ['$status', 'planned'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalBudget: { $sum: '$budget.total' },
            totalSpent: { $sum: '$budget.spent' },
            totalReach: { $sum: '$keyMetrics.reach' },
            totalConversions: { $sum: '$keyMetrics.conversions' },
            totalRevenue: { $sum: '$keyMetrics.revenue' }
          }
        }
      ]);

      // Get content statistics
      const contentStats = await MarketingContent.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
            totalViews: { $sum: '$performance.views' },
            totalClicks: { $sum: '$performance.clicks' },
            totalConversions: { $sum: '$performance.conversions' },
            avgCTR: { $avg: { $cond: ['$performance.views', { $divide: ['$performance.clicks', '$performance.views'] }, 0] } }
          }
        }
      ]);

      // Get audience segment statistics
      const segmentStats = await AudienceSegment.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            totalEstimatedSize: { $sum: '$estimatedSize' }
          }
        }
      ]);

      // Get recent campaigns
      const recentCampaigns = await MarketingCampaign.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdBy', 'name email')
        .lean();

      // Get top performing content
      const topContent = await MarketingContent.find({ status: 'published' })
        .sort({ 'performance.views': -1 })
        .limit(5)
        .populate('createdBy', 'name email')
        .lean();

      res.json({
        success: true,
        data: {
          campaigns: campaignStats[0] || {},
          content: contentStats[0] || {},
          segments: segmentStats[0] || {},
          recentCampaigns,
          topContent
        }
      });
    } catch (error) {
      console.error('Error getting marketing dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get marketing dashboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods
  private static async executeCampaignLaunch(campaign: any) {
    // Implement campaign launch logic
    console.log(`Executing campaign launch for: ${campaign.name}`);

    // Send notifications to team members
    // Schedule content publishing
    // Initialize tracking parameters
    // Setup monitoring and alerts
  }
}