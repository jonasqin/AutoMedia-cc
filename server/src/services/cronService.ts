import cron from 'node-cron';
import { twitterService } from './twitterService';
import { Topic, Content, User } from '../models';
import { cacheData, deleteCache } from '../config/redis';
import { setupSocket } from './socketService';

export class CronService {
  private socketService: any;

  constructor(socketService?: any) {
    this.socketService = socketService;
    this.setupCronJobs();
  }

  private setupCronJobs(): void {
    // Fetch trending topics every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('Running trending topics fetch job...');
      await this.fetchTrendingTopics();
    });

    // Monitor user topics every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('Running topic monitoring job...');
      await this.monitorUserTopics();
    });

    // Clean up old content every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Running content cleanup job...');
      await this.cleanupOldContent();
    });

    // Update user statistics every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running user statistics update job...');
      await this.updateUserStatistics();
    });

    // Check API rate limits every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('Running API rate limit check job...');
      await this.checkApiRateLimits();
    });

    // Send daily digest at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily digest job...');
      await this.sendDailyDigest();
    });
  }

  private async fetchTrendingTopics(): Promise<void> {
    try {
      const locations = [1, 23424977, 44418]; // Global, US, UK
      const allTrends = [];

      for (const location of locations) {
        try {
          const trends = await twitterService.getTrendingTopics(location);
          allTrends.push({
            location,
            trends,
            timestamp: new Date(),
          });

          // Broadcast trends via WebSocket
          if (this.socketService) {
            await this.socketService.broadcastTrendUpdated(trends, `location:${location}`);
          }

          // Cache trends
          await cacheData(`trends:${location}`, trends, 1800); // 30 minutes
        } catch (error) {
          console.error(`Failed to fetch trends for location ${location}:`, error);
        }
      }

      console.log(`Fetched trends for ${allTrends.length} locations`);
    } catch (error) {
      console.error('Error in trending topics fetch job:', error);
    }
  }

  private async monitorUserTopics(): Promise<void> {
    try {
      // Get all active topics with autoCollect enabled
      const topics = await Topic.find({
        isActive: true,
        'settings.autoCollect': true,
      }).populate('userId');

      for (const topic of topics) {
        try {
          await this.collectContentForTopic(topic);
        } catch (error) {
          console.error(`Failed to collect content for topic ${topic.name}:`, error);
        }
      }

      console.log(`Monitored ${topics.length} topics`);
    } catch (error) {
      console.error('Error in topic monitoring job:', error);
    }
  }

  private async collectContentForTopic(topic: any): Promise<void> {
    const { keywords, userId, _id: topicId } = topic;

    // Build search query from keywords
    const searchQuery = keywords.join(' OR ');

    try {
      // Search for recent tweets
      const tweets = await twitterService.searchTweets(searchQuery, {
        maxResults: 50,
        language: 'en',
        resultType: 'recent',
      });

      if (tweets.length > 0) {
        // Save tweets to database
        const savedTweets = await twitterService.saveTweetsToDatabase(tweets, userId);

        // Update topic content count
        topic.contentCount += savedTweets.length;
        topic.lastUpdated = new Date();
        await topic.save();

        // Clear topic cache
        await deleteCache(`topic:${topicId}`);

        // Broadcast new content via WebSocket
        if (this.socketService) {
          for (const tweet of savedTweets) {
            await this.socketService.broadcastTweetCollected(tweet, {
              userIds: [userId],
              topics: [topicId],
            });
          }
        }

        console.log(`Collected ${savedTweets.length} new tweets for topic: ${topic.name}`);
      }
    } catch (error) {
      console.error(`Error collecting content for topic ${topic.name}:`, error);
    }
  }

  private async cleanupOldContent(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete content older than 30 days
      const result = await Content.deleteMany({
        collectedAt: { $lt: thirtyDaysAgo },
        aiGenerated: false, // Only delete collected content, not generated content
      });

      console.log(`Cleaned up ${result.deletedCount} old content items`);
    } catch (error) {
      console.error('Error in content cleanup job:', error);
    }
  }

  private async updateUserStatistics(): Promise<void> {
    try {
      const users = await User.find({ isActive: true });

      for (const user of users) {
        try {
          // Update user statistics
          const stats = await this.calculateUserStats(user._id);

          // Cache user statistics
          await cacheData(`user:${user._id}:stats`, stats, 21600); // 6 hours

          // Clear user cache
          await deleteCache(`user:${user._id}`);

          console.log(`Updated statistics for user: ${user.email}`);
        } catch (error) {
          console.error(`Failed to update statistics for user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in user statistics update job:', error);
    }
  }

  private async calculateUserStats(userId: string): Promise<any> {
    const [
      totalContent,
      totalTopics,
      totalAgents,
      totalGenerations,
      recentContent,
    ] = await Promise.all([
      Content.countDocuments({ source: userId }),
      Topic.countDocuments({ userId }),
      Topic.countDocuments({ userId }),
      Topic.countDocuments({ userId }),
      Content.countDocuments({
        source: userId,
        collectedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      }),
    ]);

    return {
      contentCount: totalContent,
      topicCount: totalTopics,
      agentCount: totalAgents,
      generationCount: totalGenerations,
      recentContentCount: recentContent,
      lastUpdated: new Date(),
    };
  }

  private async checkApiRateLimits(): Promise<void> {
    try {
      const rateLimitStatus = await twitterService.getRateLimitStatus();

      // Cache rate limit status
      await cacheData('twitter:rate-limit', rateLimitStatus, 300); // 5 minutes

      // Check for low rate limits and send alerts
      if (rateLimitStatus && rateLimitStatus.resources) {
        for (const [endpoint, limits] of Object.entries(rateLimitStatus.resources)) {
          if (Array.isArray(limits)) {
            for (const limit of limits) {
              if (limit.remaining < limit.limit * 0.1) { // Less than 10% remaining
                console.warn(`Twitter API rate limit low for ${endpoint}: ${limit.remaining}/${limit.limit}`);

                // Send alert via WebSocket if available
                if (this.socketService) {
                  await this.socketService.broadcastSystemStatus({
                    type: 'rate_limit_warning',
                    endpoint,
                    remaining: limit.remaining,
                    limit: limit.limit,
                    reset: limit.reset,
                  });
                }
              }
            }
          }
        }
      }

      console.log('Checked API rate limits');
    } catch (error) {
      console.error('Error in API rate limit check job:', error);
    }
  }

  private async sendDailyDigest(): Promise<void> {
    try {
      const users = await User.find({
        isActive: true,
        'profile.preferences.notifications': true,
      });

      for (const user of users) {
        try {
          const digest = await this.generateDailyDigest(user._id);

          // Send digest via WebSocket
          if (this.socketService) {
            await this.socketService.sendNotification(user._id, {
              type: 'daily_digest',
              title: 'Daily Digest',
              message: 'Your daily content digest is ready',
              data: digest,
            });
          }

          console.log(`Sent daily digest to user: ${user.email}`);
        } catch (error) {
          console.error(`Failed to send daily digest to user ${user.email}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in daily digest job:', error);
    }
  }

  private async generateDailyDigest(userId: string): Promise<any> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      newContent,
      activeTopics,
      trendingTopics,
    ] = await Promise.all([
      Content.countDocuments({
        source: userId,
        collectedAt: { $gte: yesterday },
      }),
      Topic.countDocuments({
        userId,
        isActive: true,
      }),
      Topic.find({
        userId,
        isActive: true,
      })
        .sort({ contentCount: -1 })
        .limit(5)
        .select('name contentCount keywords'),
    ]);

    const locationTrends = await twitterService.getTrendingTopics(1);

    return {
      date: new Date().toISOString().split('T')[0],
      stats: {
        newContent,
        activeTopics,
      },
      topTopics: trendingTopics,
      trendingTopics: locationTrends.slice(0, 5),
    };
  }
}

export const setupCron = (socketService?: any): CronService => {
  return new CronService(socketService);
};