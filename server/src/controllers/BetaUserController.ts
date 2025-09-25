import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import { BetaUser } from '../models/BetaUser';
import { UserFeedback } from '../models/UserFeedback';
import { UATScenario } from '../models/UATScenario';

export class BetaUserController {
  /**
   * Register new beta user
   */
  static async registerBetaUser(req: AuthRequest, res: Response) {
    try {
      const {
        email,
        profile,
        testingFocus,
        betaRole = 'beta',
        experience
      } = req.body;

      // Check if user already exists
      const existingUser = await BetaUser.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already registered for beta program'
        });
      }

      // Create beta user
      const betaUser = new BetaUser({
        userId: req.user?.id || `beta_${Date.now()}`,
        email,
        profile: {
          ...profile,
          experience: experience || 'intermediate'
        },
        testingFocus: testingFocus || [],
        betaRole,
        onboardingStatus: 'pending',
        permissions: {
          canAccessBeta: true,
          canViewAnalytics: betaRole === 'alpha',
          canSuggestFeatures: true,
          canReportBugs: true
        }
      });

      await betaUser.save();

      // Send welcome email (implement email service)
      await this.sendWelcomeEmail(betaUser);

      res.status(201).json({
        success: true,
        message: 'Beta user registered successfully',
        data: {
          id: betaUser.id,
          email: betaUser.email,
          betaRole: betaUser.betaRole,
          onboardingStatus: betaUser.onboardingStatus,
          permissions: betaUser.permissions
        }
      });
    } catch (error) {
      console.error('Error registering beta user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register beta user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get beta user profile
   */
  static async getBetaUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user?.id;

      const betaUser = await BetaUser.findOne({ userId })
        .populate('userId', 'email profile')
        .lean();

      if (!betaUser) {
        return res.status(404).json({
          success: false,
          message: 'Beta user not found'
        });
      }

      // Check if user has permission to view this profile
      if (requestingUserId !== userId && !this.isAdmin(requestingUserId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: betaUser
      });
    } catch (error) {
      console.error('Error getting beta user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get beta user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update beta user profile
   */
  static async updateBetaUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user?.id;
      const updates = req.body;

      const betaUser = await BetaUser.findOne({ userId });

      if (!betaUser) {
        return res.status(404).json({
          success: false,
          message: 'Beta user not found'
        });
      }

      // Check if user has permission to update this profile
      if (requestingUserId !== userId && !this.isAdmin(requestingUserId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Update profile
      Object.keys(updates).forEach(key => {
        if (key === 'profile') {
          Object.assign(betaUser.profile, updates.profile);
        } else if (key !== 'userId' && key !== 'email') {
          (betaUser as any)[key] = updates[key];
        }
      });

      await betaUser.save();

      res.json({
        success: true,
        message: 'Beta user updated successfully',
        data: betaUser
      });
    } catch (error) {
      console.error('Error updating beta user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update beta user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Complete onboarding
   */
  static async completeOnboarding(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user?.id;

      const betaUser = await BetaUser.findOne({ userId });

      if (!betaUser) {
        return res.status(404).json({
          success: false,
          message: 'Beta user not found'
        });
      }

      // Check if user has permission to complete onboarding
      if (requestingUserId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await betaUser.completeOnboarding();

      // Send completion email
      await this.sendOnboardingCompleteEmail(betaUser);

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        data: betaUser
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete onboarding',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get active beta users
   */
  static async getActiveBetaUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, betaRole } = req.query;
      const filter: any = { isActive: true };

      if (betaRole) {
        filter.betaRole = betaRole;
      }

      const users = await BetaUser.find(filter)
        .populate('userId', 'email profile')
        .sort({ joinDate: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await BetaUser.countDocuments(filter);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error getting active beta users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active beta users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get beta user statistics
   */
  static async getBetaUserStats(req: Request, res: Response) {
    try {
      const stats = await BetaUser.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            completedOnboarding: { $sum: { $cond: [{ $eq: ['$onboardingStatus', 'completed'] }, 1, 0] } },
            alpha: { $sum: { $cond: [{ $eq: ['$betaRole', 'alpha'] }, 1, 0] } },
            beta: { $sum: { $cond: [{ $eq: ['$betaRole', 'beta'] }, 1, 0] } },
            earlyAdopters: { $sum: { $cond: [{ $eq: ['$betaRole', 'early_adopter'] }, 1, 0] } },
            avgFeedbackScore: { $avg: '$feedbackScore' },
            totalBugsReported: { $sum: '$contributions.bugsReported' },
            totalFeaturesRequested: { $sum: '$contributions.featuresRequested' },
            totalSurveysCompleted: { $sum: '$contributions.surveysCompleted' },
            totalSessions: { $sum: '$contributions.sessionsParticipated' }
          }
        }
      ]);

      // Get feedback stats
      const feedbackStats = await UserFeedback.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
            highPriority: { $sum: { $cond: [{ $in: ['$priority', ['critical', 'urgent']] }, 1, 0] } },
            avgResolutionTime: { $avg: '$resolution.timeToResolve' }
          }
        }
      ]);

      // Get UAT stats
      const uatStats = await UATScenario.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            avgSuccessRate: { $avg: { $divide: [{ $size: '$results' }, { $size: '$steps' }] } }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          users: stats[0] || {},
          feedback: feedbackStats[0] || {},
          uat: uatStats[0] || {}
        }
      });
    } catch (error) {
      console.error('Error getting beta user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get beta user stats',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get top contributors
   */
  static async getTopContributors(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const contributors = await BetaUser.getTopContributors(Number(limit));

      res.json({
        success: true,
        data: contributors
      });
    } catch (error) {
      console.error('Error getting top contributors:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get top contributors',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update user activity
   */
  static async updateActivity(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const requestingUserId = req.user?.id;

      const betaUser = await BetaUser.findOne({ userId });

      if (!betaUser) {
        return res.status(404).json({
          success: false,
          message: 'Beta user not found'
        });
      }

      // Check if user has permission to update activity
      if (requestingUserId !== userId && !this.isAdmin(requestingUserId)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await betaUser.updateActivity();

      res.json({
        success: true,
        message: 'Activity updated successfully',
        data: betaUser
      });
    } catch (error) {
      console.error('Error updating activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update activity',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Deactivate beta user
   */
  static async deactivateBetaUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const betaUser = await BetaUser.findOne({ userId });

      if (!betaUser) {
        return res.status(404).json({
          success: false,
          message: 'Beta user not found'
        });
      }

      betaUser.isActive = false;
      betaUser.onboardingStatus = 'inactive';
      await betaUser.save();

      res.json({
        success: true,
        message: 'Beta user deactivated successfully',
        data: betaUser
      });
    } catch (error) {
      console.error('Error deactivating beta user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate beta user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods
  private static async sendWelcomeEmail(betaUser: any) {
    // Implement email sending logic
    console.log(`Sending welcome email to ${betaUser.email}`);
  }

  private static async sendOnboardingCompleteEmail(betaUser: any) {
    // Implement email sending logic
    console.log(`Sending onboarding complete email to ${betaUser.email}`);
  }

  private static isAdmin(userId: string): boolean {
    // Implement admin check logic
    return false; // Placeholder
  }
}