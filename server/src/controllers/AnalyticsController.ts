import { Request, Response } from 'express';
import {
  SessionData,
  PageView,
  AnalyticsEvent,
  FeatureUsage,
  BehaviorMetrics,
  ConversionData,
  FunnelAnalysis,
  RetentionMetrics
} from '../models/UserAnalytics';

export class AnalyticsController {
  /**
   * Track session start
   */
  static async trackSessionStart(req: Request, res: Response) {
    try {
      const {
        sessionId,
        userId,
        deviceInfo,
        location,
        referrer,
        utmParameters
      } = req.body;

      const session = new SessionData({
        sessionId,
        userId,
        deviceInfo,
        location,
        referrer,
        utmParameters,
        isMobile: deviceInfo.deviceType === 'mobile',
        startTime: new Date()
      });

      await session.save();

      res.json({
        success: true,
        message: 'Session tracked successfully',
        data: { sessionId: session.sessionId }
      });
    } catch (error) {
      console.error('Error tracking session start:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track session',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Track page view
   */
  static async trackPageView(req: Request, res: Response) {
    try {
      const {
        sessionId,
        path,
        title,
        referrer,
        metadata
      } = req.body;

      const pageView = new PageView({
        sessionId,
        path,
        title,
        referrer,
        metadata,
        timestamp: new Date()
      });

      await pageView.save();

      // Update session with page view
      await SessionData.findOneAndUpdate(
        { sessionId },
        { $push: { pageViews: pageView._id } }
      );

      res.json({
        success: true,
        message: 'Page view tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track page view',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Track event
   */
  static async trackEvent(req: Request, res: Response) {
    try {
      const {
        sessionId,
        userId,
        type,
        category,
        action,
        label,
        value,
        metadata
      } = req.body;

      const event = new AnalyticsEvent({
        sessionId,
        userId,
        type,
        category,
        action,
        label,
        value,
        metadata,
        timestamp: new Date()
      });

      await event.save();

      // Update session with event
      await SessionData.findOneAndUpdate(
        { sessionId },
        { $push: { events: event._id } }
      );

      // Track feature usage if applicable
      if (type === 'click' && category === 'feature') {
        await this.trackFeatureUsage(userId, action, metadata);
      }

      res.json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track event',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Track feature usage
   */
  static async trackFeatureUsage(userId: string, featureName: string, metadata?: any) {
    try {
      const featureId = metadata?.featureId || featureName.toLowerCase().replace(/\s+/g, '_');
      const category = metadata?.category || 'general';

      // Update existing feature usage or create new
      await FeatureUsage.findOneAndUpdate(
        { userId, featureId },
        {
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date() },
          $push: {
            interactions: {
              type: 'usage',
              timestamp: new Date(),
              metadata
            }
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }

  /**
   * Track conversion
   */
  static async trackConversion(req: Request, res: Response) {
    try {
      const {
        userId,
        conversionType,
        conversionGoal,
        conversionValue,
        conversionSource,
        conversionPath
      } = req.body;

      const conversion = new ConversionData({
        userId,
        conversionType,
        conversionGoal,
        conversionValue,
        conversionSource,
        conversionPath,
        conversionDate: new Date()
      });

      await conversion.save();

      res.json({
        success: true,
        message: 'Conversion tracked successfully',
        data: conversion
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track conversion',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user analytics dashboard
   */
  static async getUserAnalytics(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { period = '7d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(period as string));

      // Get session analytics
      const sessionStats = await SessionData.aggregate([
        {
          $match: {
            userId,
            startTime: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
            totalPageViews: { $sum: { $size: '$pageViews' } },
            totalEvents: { $sum: { $size: '$events' } }
          }
        }
      ]);

      // Get feature usage
      const featureUsage = await FeatureUsage.find({ userId })
        .sort({ usageCount: -1 })
        .limit(10)
        .lean();

      // Get conversions
      const conversions = await ConversionData.find({
        userId,
        conversionDate: { $gte: startDate, $lte: endDate }
      })
        .sort({ conversionDate: -1 })
        .lean();

      // Get behavior metrics
      const behaviorMetrics = await BehaviorMetrics.find({
        userId,
        period: this.getPeriodFromDays(parseInt(period as string)),
        startDate: { $gte: startDate }
      })
        .sort({ startDate: -1 })
        .limit(1)
        .lean();

      const analytics = {
        overview: sessionStats[0] || {
          totalSessions: 0,
          avgDuration: 0,
          totalPageViews: 0,
          totalEvents: 0
        },
        featureUsage,
        conversions,
        behaviorMetrics: behaviorMetrics[0] || null,
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
      console.error('Error getting user analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get feature analytics
   */
  static async getFeatureAnalytics(req: Request, res: Response) {
    try {
      const { period = '7d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(period as string));

      // Get feature usage statistics
      const featureStats = await FeatureUsage.aggregate([
        {
          $match: {
            lastUsed: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$featureId',
            featureName: { $first: '$featureName' },
            category: { $first: '$category' },
            totalUsage: { $sum: '$usageCount' },
            uniqueUsers: { $sum: 1 },
            avgUsageDuration: { $avg: '$usageDuration' },
            avgSuccessRate: { $avg: '$successRate' },
            totalErrors: { $sum: '$errorCount' }
          }
        },
        {
          $sort: { totalUsage: -1 }
        }
      ]);

      // Get feature adoption rates
      const adoptionStats = await FeatureUsage.aggregate([
        {
          $match: {
            firstUsed: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            newUsers: { $sum: 1 },
            totalUsage: { $sum: '$usageCount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          featureStats,
          adoptionStats,
          period: {
            start: startDate,
            end: endDate
          }
        }
      });
    } catch (error) {
      console.error('Error getting feature analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get feature analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get funnel analysis
   */
  static async getFunnelAnalysis(req: Request, res: Response) {
    try {
      const { funnelId } = req.params;

      const funnel = await FunnelAnalysis.findById(funnelId)
        .populate('steps')
        .lean();

      if (!funnel) {
        return res.status(404).json({
          success: false,
          message: 'Funnel not found'
        });
      }

      res.json({
        success: true,
        data: funnel
      });
    } catch (error) {
      console.error('Error getting funnel analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get funnel analysis',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get retention analytics
   */
  static async getRetentionAnalytics(req: Request, res: Response) {
    try {
      const { period = '30d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(period as string));

      // Get retention metrics by cohort
      const retentionStats = await RetentionMetrics.aggregate([
        {
          $match: {
            lastActive: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$cohort',
            users: { $sum: 1 },
            avgRetentionRate: { $avg: '$retentionRate' },
            highChurnRisk: { $sum: { $cond: [{ $eq: ['$churnRisk', 'high'] }, 1, 0] } },
            criticalChurnRisk: { $sum: { $cond: [{ $eq: ['$churnRisk', 'critical'] }, 1, 0] } }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Get churn risk distribution
      const churnDistribution = await RetentionMetrics.aggregate([
        {
          $match: {
            lastActive: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$churnRisk',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          retentionStats,
          churnDistribution,
          period: {
            start: startDate,
            end: endDate
          }
        }
      });
    } catch (error) {
      console.error('Error getting retention analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get retention analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get real-time analytics
   */
  static async getRealTimeAnalytics(req: Request, res: Response) {
    try {
      const now = new Date();
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
      const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get active sessions
      const activeSessions = await SessionData.countDocuments({
        isActive: true,
        startTime: { $gte: lastHour }
      });

      // Get events in last hour
      const recentEvents = await AnalyticsEvent.countDocuments({
        timestamp: { $gte: lastHour }
      });

      // Get page views in last hour
      const recentPageViews = await PageView.countDocuments({
        timestamp: { $gte: lastHour }
      });

      // Get conversions in last 24 hours
      const recentConversions = await ConversionData.countDocuments({
        conversionDate: { $gte: lastDay }
      });

      // Get top active features
      const activeFeatures = await FeatureUsage.find({
        lastUsed: { $gte: lastHour }
      })
        .sort({ usageCount: -1 })
        .limit(5)
        .lean();

      const realTimeData = {
        activeSessions,
        recentEvents,
        recentPageViews,
        recentConversions,
        activeFeatures,
        timestamp: now
      };

      res.json({
        success: true,
        data: realTimeData
      });
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get real-time analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate behavior report
   */
  static async generateBehaviorReport(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { period = '7d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(period as string));

      // Get user sessions
      const sessions = await SessionData.find({
        userId,
        startTime: { $gte: startDate, $lte: endDate }
      })
        .populate('pageViews events')
        .lean();

      // Get user events
      const events = await AnalyticsEvent.find({
        userId,
        timestamp: { $gte: startDate, $lte: endDate }
      })
        .sort({ timestamp: 1 })
        .lean();

      // Get user conversions
      const conversions = await ConversionData.find({
        userId,
        conversionDate: { $gte: startDate, $lte: endDate }
      })
        .lean();

      // Generate report
      const report = {
        summary: {
          totalSessions: sessions.length,
          totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
          totalPageViews: sessions.reduce((sum, s) => sum + s.pageViews.length, 0),
          totalEvents: events.length,
          totalConversions: conversions.length
        },
        sessions,
        events,
        conversions,
        patterns: {
          mostActiveTime: this.calculateMostActiveTime(sessions),
          preferredDevices: this.calculatePreferredDevices(sessions),
          commonPaths: this.calculateCommonPaths(sessions)
        },
        period: {
          start: startDate,
          end: endDate
        }
      };

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error generating behavior report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate behavior report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods
  private static getPeriodFromDays(days: number): string {
    if (days <= 1) return 'daily';
    if (days <= 7) return 'weekly';
    return 'monthly';
  }

  private static calculateMostActiveTime(sessions: any[]): string {
    const hourCounts: { [key: number]: number } = {};
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostActiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return mostActiveHour ? `${mostActiveHour}:00 - ${parseInt(mostActiveHour) + 1}:00` : 'N/A';
  }

  private static calculatePreferredDevices(sessions: any[]): string[] {
    const deviceCounts: { [key: string]: number } = {};
    sessions.forEach(session => {
      const deviceType = session.deviceInfo.deviceType;
      deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
    });

    return Object.entries(deviceCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([device]) => device);
  }

  private static calculateCommonPaths(sessions: any[]): string[] {
    const pathCounts: { [key: string]: number } = {};
    sessions.forEach(session => {
      session.pageViews.forEach((pageView: any) => {
        const path = pageView.path;
        pathCounts[path] = (pathCounts[path] || 0) + 1;
      });
    });

    return Object.entries(pathCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([path]) => path);
  }
}