import { Request, Response } from 'express';
import {
  FeatureRequest,
  FeatureComment,
  FeatureVote,
  FeaturePriority,
  UserFeedback
} from '../models/FeatureRequest';

export class FeatureRequestController {
  /**
   * Create feature request
   */
  static async createFeatureRequest(req: Request, res: Response) {
    try {
      const requestData = req.body;
      const userId = req.user?.id;

      if (!requestData.title || !requestData.description || !requestData.category) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: title, description, category'
        });
      }

      // Check for duplicates
      const existingRequest = await FeatureRequest.findOne({
        title: { $regex: new RegExp(requestData.title, 'i') },
        status: { $nin: ['declined', 'duplicate'] }
      });

      if (existingRequest) {
        return res.status(409).json({
          success: false,
          message: 'A similar feature request already exists',
          data: {
            existingRequest: existingRequest.id,
            similarity: 'high'
          }
        });
      }

      const featureRequest = new FeatureRequest({
        ...requestData,
        userId,
        status: 'under_review'
      });

      await featureRequest.save();

      // Send notifications
      await this.notifyTeam(featureRequest);

      res.status(201).json({
        success: true,
        message: 'Feature request created successfully',
        data: featureRequest
      });
    } catch (error) {
      console.error('Error creating feature request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create feature request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feature requests
   */
  static async getFeatureRequests(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category,
        priority,
        type,
        userId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter: any = {};

      if (status) filter.status = status;
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (type) filter.type = type;
      if (userId) filter.userId = userId;

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const requests = await FeatureRequest.find(filter)
        .populate('userId betaUserId team.productManager team.developer team.designer team.qa')
        .sort(sort)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await FeatureRequest.countDocuments(filter);

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting feature requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feature requests',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feature request by ID
   */
  static async getFeatureRequestById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const request = await FeatureRequest.findById(id)
        .populate('userId betaUserId team.productManager team.developer team.designer team.qa')
        .populate({
          path: 'comments',
          populate: {
            path: 'userId betaUserId',
            select: 'name email profile'
          }
        })
        .populate('duplicates relatedIssues')
        .lean();

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Feature request not found'
        });
      }

      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      console.error('Error getting feature request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feature request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update feature request
   */
  static async updateFeatureRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.user?.id;

      const request = await FeatureRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Feature request not found'
        });
      }

      // Update request
      Object.assign(request, updates);
      await request.save();

      // Log the update
      if (updates.status) {
        await this.logStatusChange(request, userId);
      }

      res.json({
        success: true,
        message: 'Feature request updated successfully',
        data: request
      });
    } catch (error) {
      console.error('Error updating feature request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update feature request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Vote on feature request
   */
  static async voteFeatureRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { voteType, weight = 1 } = req.body;
      const userId = req.user?.id;

      const request = await FeatureRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Feature request not found'
        });
      }

      if (!['up', 'down'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: 'Vote type must be either "up" or "down"'
        });
      }

      // Record the vote
      const existingVote = await FeatureVote.findOne({
        requestId: id,
        userId
      });

      if (existingVote) {
        existingVote.vote = voteType;
        existingVote.weight = weight;
        await existingVote.save();
      } else {
        const vote = new FeatureVote({
          requestId: id,
          userId,
          vote: voteType,
          weight
        });
        await vote.save();
      }

      // Update request vote counts
      await request.vote(userId, voteType, weight);

      res.json({
        success: true,
        message: 'Vote recorded successfully',
        data: {
          upvotes: request.votes.upvotes,
          downvotes: request.votes.downvotes,
          totalVotes: request.votes.totalVotes,
          voteScore: request.voteScore
        }
      });
    } catch (error) {
      console.error('Error voting on feature request:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to vote on feature request',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Add comment to feature request
   */
  static async addComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content, type = 'comment', attachments = [], mentions = [], isInternal = false } = req.body;
      const userId = req.user?.id;

      const request = await FeatureRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Feature request not found'
        });
      }

      const comment = new FeatureComment({
        requestId: id,
        userId,
        content,
        type,
        attachments,
        mentions,
        isInternal
      });

      await comment.save();

      // Notify mentioned users
      if (mentions.length > 0) {
        await this.notifyMentions(comment, mentions);
      }

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Calculate feature priority
   */
  static async calculatePriority(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { criteria } = req.body;
      const userId = req.user?.id;

      const request = await FeatureRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Feature request not found'
        });
      }

      // Calculate priority score
      const weights = {
        userImpact: 0.25,
        businessValue: 0.25,
        strategicAlignment: 0.2,
        technicalFeasibility: 0.15,
        urgency: 0.1,
        effort: 0.05
      };

      const score = Object.entries(criteria).reduce((total, [key, value]) => {
        return total + (value * (weights as any)[key] || 0);
      }, 0);

      const priority = new FeaturePriority({
        requestId: id,
        score,
        criteria,
        breakdown: {
          userImpact: {
            score: criteria.userImpact,
            reasoning: 'Based on user impact and feature usage potential'
          },
          businessValue: {
            score: criteria.businessValue,
            reasoning: 'Based on business value and revenue potential'
          },
          strategicAlignment: {
            score: criteria.strategicAlignment,
            reasoning: 'Based on alignment with product strategy'
          },
          technicalFeasibility: {
            score: criteria.technicalFeasibility,
            reasoning: 'Based on technical complexity and feasibility'
          },
          urgency: {
            score: criteria.urgency,
            reasoning: 'Based on urgency and time sensitivity'
          },
          effort: {
            score: criteria.effort,
            reasoning: 'Based on development effort and resources'
          }
        },
        calculatedBy: userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      await priority.save();

      res.json({
        success: true,
        message: 'Priority calculated successfully',
        data: priority
      });
    } catch (error) {
      console.error('Error calculating priority:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate priority',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feature request analytics
   */
  static async getFeatureRequestAnalytics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(period as string));

      // Get request statistics
      const stats = await FeatureRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byStatus: {
              $push: '$status'
            },
            byPriority: {
              $push: '$priority'
            },
            byCategory: {
              $push: '$category'
            },
            avgVotes: { $avg: '$votes.totalVotes' },
            totalVotes: { $sum: '$votes.totalVotes' },
            released: { $sum: { $cond: [{ $eq: ['$status', 'released'] }, 1, 0] } }
          }
        }
      ]);

      // Get category breakdown
      const categoryBreakdown = await FeatureRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgVotes: { $avg: '$votes.totalVotes' }
          }
        }
      ]);

      // Get trending features
      const trendingFeatures = await FeatureRequest.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['under_review', 'planned'] }
      })
        .sort({ 'votes.upvotes': -1, createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .lean();

      // Get recent releases
      const recentReleases = await FeatureRequest.find({
        status: 'released',
        'timeline.released': { $gte: startDate }
      })
        .sort({ 'timeline.released': -1 })
        .limit(5)
        .populate('userId', 'name email')
        .lean();

      const analytics = {
        overview: stats[0] || {
          total: 0,
          byStatus: [],
          byPriority: [],
          byCategory: [],
          avgVotes: 0,
          totalVotes: 0,
          released: 0
        },
        categoryBreakdown,
        trendingFeatures,
        recentReleases,
        period: {
          start: startDate,
          end: endDate
        }
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting feature request analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feature request analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Process feedback into feature requests
   */
  static async processFeedbackToFeatures(req: Request, res: Response) {
    try {
      const { feedbackId, action = 'create_request' } = req.body;
      const userId = req.user?.id;

      const feedback = await UserFeedback.findById(feedbackId);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      if (action === 'create_request') {
        // Create feature request from feedback
        const featureRequest = new FeatureRequest({
          title: feedback.title,
          description: feedback.description,
          category: feedback.category,
          priority: feedback.priority,
          type: feedback.type === 'bug' ? 'bug_fix' : 'enhancement',
          impact: {
            users: feedback.impact.users,
            business_value: feedback.impact.business,
            urgency: feedback.priority,
            effort: 'medium' // Default
          },
          relatedIssues: [feedbackId],
          metadata: {
            source: 'feedback',
            referrer: feedbackId
          },
          userId
        });

        await featureRequest.save();

        // Update feedback status
        feedback.status = 'in_progress';
        await feedback.save();

        res.json({
          success: true,
          message: 'Feature request created from feedback successfully',
          data: {
            featureRequest,
            feedback
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid action specified'
        });
      }
    } catch (error) {
      console.error('Error processing feedback to features:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process feedback to features',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feature backlog
   */
  static async getFeatureBacklog(req: Request, res: Response) {
    try {
      const {
        teamMember,
        status = 'planned,in_progress',
        priority,
        category
      } = req.query;

      const filter: any = {
        status: { $in: status.toString().split(',') }
      };

      if (teamMember) {
        filter.$or = [
          { 'team.productManager': teamMember },
          { 'team.developer': teamMember },
          { 'team.designer': teamMember },
          { 'team.qa': teamMember }
        ];
      }

      if (priority) filter.priority = priority;
      if (category) filter.category = category;

      const backlog = await FeatureRequest.find(filter)
        .populate('userId betaUserId team.productManager team.developer team.designer team.qa')
        .sort({ priority: -1, 'impact.urgency': -1 })
        .lean();

      // Group by status
      const grouped = backlog.reduce((acc: any, request) => {
        if (!acc[request.status]) {
          acc[request.status] = [];
        }
        acc[request.status].push(request);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          backlog: grouped,
          total: backlog.length,
          summary: {
            planned: backlog.filter(r => r.status === 'planned').length,
            inProgress: backlog.filter(r => r.status === 'in_progress').length,
            testing: backlog.filter(r => r.status === 'testing').length
          }
        }
      });
    } catch (error) {
      console.error('Error getting feature backlog:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feature backlog',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods
  private static async notifyTeam(request: any) {
    // Implement team notification logic
    console.log(`Notifying team about new feature request: ${request.title}`);
  }

  private static async logStatusChange(request: any, userId: string) {
    // Implement status change logging
    console.log(`Status changed for request ${request.id} by user ${userId}`);
  }

  private static async notifyMentions(comment: any, mentions: string[]) {
    // Implement mention notification logic
    console.log(`Notifying mentioned users: ${mentions.join(', ')}`);
  }
}