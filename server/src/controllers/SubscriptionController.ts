import { Request, Response } from 'express';
import { Subscription } from '../models/Subscription';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SubscriptionController {
  /**
   * Create or get user subscription
   */
  async createOrGetSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.body.userId;

      // Check if subscription already exists
      let subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        // Create new subscription with free plan
        subscription = new Subscription({
          userId,
          plan: 'free',
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          paymentMethod: {
            type: 'card',
            id: 'free_trial',
            isDefault: true
          },
          metadata: {
            source: req.body.source || 'web'
          }
        });

        await subscription.save();
        logger.info(`New subscription created for user: ${userId}`);
      }

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription retrieved successfully'
      });
    } catch (error) {
      logger.error('Error creating/getting subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create/get subscription'
      });
    }
  }

  /**
   * Get user subscription
   */
  async getSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      logger.error('Error fetching subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription'
      });
    }
  }

  /**
   * Upgrade subscription plan
   */
  async upgradeSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { plan, billingCycle, paymentMethod } = req.body;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      // Validate plan
      const validPlans = ['free', 'pro', 'team', 'enterprise'];
      if (!validPlans.includes(plan)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid subscription plan'
        });
      }

      // Update subscription
      subscription.plan = plan;
      subscription.status = 'active';
      subscription.billingCycle = billingCycle || 'monthly';
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);

      if (paymentMethod) {
        subscription.paymentMethod = {
          ...paymentMethod,
          isDefault: true
        };
      }

      // Update limits based on plan
      subscription.updateLimitsForPlan(plan);

      await subscription.save();

      logger.info(`Subscription upgraded for user ${userId} to ${plan}`);
      res.json({
        success: true,
        data: subscription,
        message: `Subscription upgraded to ${plan} successfully`
      });
    } catch (error) {
      logger.error('Error upgrading subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upgrade subscription'
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { reason, feedback } = req.body;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      subscription.status = 'cancelled';
      subscription.canceledAt = new Date();

      await subscription.save();

      logger.info(`Subscription cancelled for user ${userId}, reason: ${reason}`);
      res.json({
        success: true,
        data: subscription,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription'
      });
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      subscription.status = 'suspended';
      subscription.pausedAt = new Date();

      await subscription.save();

      logger.info(`Subscription paused for user ${userId}`);
      res.json({
        success: true,
        data: subscription,
        message: 'Subscription paused successfully'
      });
    } catch (error) {
      logger.error('Error pausing subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to pause subscription'
      });
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      subscription.status = 'active';
      subscription.pausedAt = undefined;

      await subscription.save();

      logger.info(`Subscription resumed for user ${userId}`);
      res.json({
        success: true,
        data: subscription,
        message: 'Subscription resumed successfully'
      });
    } catch (error) {
      logger.error('Error resuming subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resume subscription'
      });
    }
  }

  /**
   * Add subscription addon
   */
  async addAddon(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { addon } = req.body;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      const newAddon = {
        id: uuidv4(),
        ...addon,
        status: 'active',
        addedAt: new Date()
      };

      subscription.addons.push(newAddon);
      await subscription.save();

      logger.info(`Addon added for user ${userId}: ${addon.name}`);
      res.json({
        success: true,
        data: subscription,
        message: 'Addon added successfully'
      });
    } catch (error) {
      logger.error('Error adding addon:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add addon'
      });
    }
  }

  /**
   * Remove subscription addon
   */
  async removeAddon(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { addonId } = req.params;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      const addon = subscription.addons.find(a => a.id === addonId);
      if (!addon) {
        return res.status(404).json({
          success: false,
          error: 'Addon not found'
        });
      }

      addon.status = 'cancelled';
      await subscription.save();

      logger.info(`Addon removed for user ${userId}: ${addon.name}`);
      res.json({
        success: true,
        data: subscription,
        message: 'Addon removed successfully'
      });
    } catch (error) {
      logger.error('Error removing addon:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove addon'
      });
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { paymentMethod } = req.body;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      subscription.paymentMethod = {
        ...paymentMethod,
        isDefault: true
      };

      await subscription.save();

      logger.info(`Payment method updated for user ${userId}`);
      res.json({
        success: true,
        data: subscription,
        message: 'Payment method updated successfully'
      });
    } catch (error) {
      logger.error('Error updating payment method:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update payment method'
      });
    }
  }

  /**
   * Get subscription usage
   */
  async getUsage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      res.json({
        success: true,
        data: {
          usage: subscription.usage,
          limits: subscription.limits,
          usagePercentage: subscription.usagePercentage,
          daysUntilRenewal: subscription.daysUntilRenewal
        }
      });
    } catch (error) {
      logger.error('Error fetching subscription usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription usage'
      });
    }
  }

  /**
   * Check feature access
   */
  async checkFeatureAccess(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { feature } = req.params;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      const hasAccess = subscription.canUseFeature(feature);

      res.json({
        success: true,
        data: {
          feature,
          hasAccess,
          plan: subscription.plan,
          reason: hasAccess ? 'Feature available' : 'Feature not available in current plan'
        }
      });
    } catch (error) {
      logger.error('Error checking feature access:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check feature access'
      });
    }
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit = 10, offset = 0 } = req.query;

      // This would typically query a subscription history collection
      // For now, return current subscription info
      const subscription = await Subscription.findOne({ userId });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      const history = [{
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        renewalAmount: subscription.renewalAmount,
        createdAt: subscription.createdAt
      }];

      res.json({
        success: true,
        data: history,
        pagination: {
          total: 1,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: false
        }
      });
    } catch (error) {
      logger.error('Error fetching subscription history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription history'
      });
    }
  }

  /**
   * Process usage request
   */
  async processUsage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { type, amount = 1 } = req.body;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      if (!subscription.hasCapacity(type as any, amount)) {
        return res.status(429).json({
          success: false,
          error: 'Usage limit exceeded',
          data: {
            current: subscription.usage[type as keyof typeof subscription.usage],
            limit: subscription.usage[type as keyof typeof subscription.usage].limit
          }
        });
      }

      await subscription.useResource(type as any, amount);

      res.json({
        success: true,
        data: {
          type,
          amountUsed: amount,
          remaining: subscription.usage[type as keyof typeof subscription.usage].limit - subscription.usage[type as keyof typeof subscription.usage].current,
          totalLimit: subscription.usage[type as keyof typeof subscription.usage].limit
        },
        message: 'Usage processed successfully'
      });
    } catch (error) {
      logger.error('Error processing usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process usage'
      });
    }
  }

  /**
   * Get billing information
   */
  async getBillingInfo(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            billingCycle: subscription.billingCycle,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            renewalAmount: subscription.renewalAmount,
            daysUntilRenewal: subscription.daysUntilRenewal
          },
          user: {
            name: `${user.profile.firstName} ${user.profile.lastName}`,
            email: user.email
          },
          paymentMethod: subscription.paymentMethod,
          addons: subscription.addons.filter(addon => addon.status === 'active')
        }
      });
    } catch (error) {
      logger.error('Error fetching billing information:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch billing information'
      });
    }
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await Subscription.aggregate([
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
            _id: '$plan',
            count: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            totalRevenue: { $sum: '$renewalAmount' }
          }
        }
      ]);

      const totalStats = await Subscription.aggregate([
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
            totalSubscriptions: { $sum: 1 },
            activeSubscriptions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            totalRevenue: { $sum: '$renewalAmount' },
            avgRevenue: { $avg: '$renewalAmount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          byPlan: stats,
          totals: totalStats[0] || {}
        }
      });
    } catch (error) {
      logger.error('Error fetching subscription statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription statistics'
      });
    }
  }
}