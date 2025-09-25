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
   * Get all campaigns
   */
  static async getCampaigns(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, status, type } = req.query;

      const filter: any = {};
      if (status) filter.status = status;
      if (type) filter.type = type;

      const campaigns = await MarketingCampaign.find(filter)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email');

      const total = await MarketingCampaign.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: campaigns,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting campaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campaigns',
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
    } catch (error) {
      console.error('Error creating audience segment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create audience segment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .sort({ createdAt: -1 });

      const total = await AudienceSegment.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: segments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
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
}
