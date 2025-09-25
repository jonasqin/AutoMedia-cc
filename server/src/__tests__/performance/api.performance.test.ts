import request from 'supertest';
import express from 'express';
import { User, Topic, Content } from '../../models';
import { authenticateToken } from '../../middleware/auth';

// Performance test utilities
const performanceTestUtils = {
  measureResponseTime: async (fn: () => Promise<any>): Promise<number> => {
    const start = Date.now();
    await fn();
    const end = Date.now();
    return end - start;
  },

  measureMemoryUsage: (): NodeJS.MemoryUsage => {
    return process.memoryUsage();
  },

  runLoadTest: async (
    fn: () => Promise<any>,
    concurrentUsers: number,
    requestsPerUser: number
  ): Promise<{ totalTime: number; avgTime: number; successRate: number }> => {
    const startTime = Date.now();
    const promises = [];
    let successCount = 0;

    for (let i = 0; i < concurrentUsers; i++) {
      const userPromises = [];
      for (let j = 0; j < requestsPerUser; j++) {
        userPromises.push(
          fn().then(() => successCount++).catch(() => {})
        );
      }
      promises.push(Promise.all(userPromises));
    }

    await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const totalRequests = concurrentUsers * requestsPerUser;

    return {
      totalTime,
      avgTime: totalTime / totalRequests,
      successRate: (successCount / totalRequests) * 100,
    };
  },
};

describe('API Performance Tests', () => {
  let app: express.Application;
  let testUsers: any[] = [];
  let accessTokens: string[] = [];
  let testTopics: any[] = [];
  let testContent: any[] = [];

  beforeEach(async () => {
    // Create test app
    app = express();
    app.use(express.json());

    // Setup performance monitoring middleware
    app.use((req, res, next) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) { // Log slow requests
          console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
        }
      });

      next();
    });

    // Setup auth routes
    app.post('/api/auth/register', async (req, res) => {
      try {
        const user = new User({
          email: req.body.email,
          password: req.body.password,
          profile: req.body.profile,
        });
        await user.save();

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { userId: user._id.toString(), email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        res.status(201).json({
          success: true,
          data: {
            user: {
              id: user._id,
              email: user.email,
              profile: user.profile,
            },
            accessToken: token,
          },
        });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      try {
        const user = await User.findOne({ email: req.body.email }).select('+password');
        if (!user || !(await user.comparePassword(req.body.password))) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        user.lastLogin = new Date();
        await user.save();

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { userId: user._id.toString(), email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        res.json({
          success: true,
          data: {
            user: {
              id: user._id,
              email: user.email,
              profile: user.profile,
              lastLogin: user.lastLogin,
            },
            accessToken: token,
          },
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Setup topic routes
    app.get('/api/topics', authenticateToken, async (req, res) => {
      try {
        const topics = await Topic.find({
          userId: req.user!.id,
          isActive: true
        }).sort({ weight: -1, name: 1 });
        res.json({ success: true, data: topics });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    app.post('/api/topics', authenticateToken, async (req, res) => {
      try {
        const topic = new Topic({
          ...req.body,
          userId: req.user!.id,
        });
        await topic.save();
        res.status(201).json({ success: true, data: topic });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Setup content routes
    app.get('/api/content', authenticateToken, async (req, res) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [content, total] = await Promise.all([
          Content.find({ source: req.user!.id, isActive: true })
            .sort({ collectedAt: -1 })
            .skip(skip)
            .limit(limit),
          Content.countDocuments({ source: req.user!.id, isActive: true }),
        ]);

        res.json({
          success: true,
          data: {
            content,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          },
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Setup search route
    app.get('/api/content/search', authenticateToken, async (req, res) => {
      try {
        const { q, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const searchQuery = {
          source: req.user!.id,
          isActive: true,
          $text: { $search: q as string },
        };

        const [content, total] = await Promise.all([
          Content.find(searchQuery)
            .sort({ score: { $meta: 'textScore' }, collectedAt: -1 })
            .skip(skip)
            .limit(limit),
          Content.countDocuments(searchQuery),
        ]);

        res.json({
          success: true,
          data: {
            content,
            pagination: {
              page: parseInt(page as string),
              limit: parseInt(limit as string),
              total,
              pages: Math.ceil(total / limit),
            },
          },
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    // Create test users and data
    for (let i = 0; i < 10; i++) {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `perfuser${i}@example.com`,
          password: 'Password123!',
          profile: { firstName: `Perf${i}`, lastName: 'User' },
        });

      testUsers.push(response.body.data.user);
      accessTokens.push(response.body.data.accessToken);

      // Create topics for each user
      const topicResponse = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${response.body.data.accessToken}`)
        .send({
          name: `Perf Topic ${i}`,
          keywords: [`perf${i}`, `test${i}`],
          weight: Math.floor(Math.random() * 10) + 1,
        });

      testTopics.push(topicResponse.body.data);

      // Create content for each user
      for (let j = 0; j < 20; j++) {
        const content = new Content({
          platform: 'twitter',
          platformId: `tweet${i}-${j}`,
          type: 'tweet',
          author: {
            id: `author${i}`,
            username: `perfauthor${i}`,
            displayName: `Perf Author ${i}`,
          },
          content: {
            text: `Performance test content ${i}-${j} with keywords perf${i} and test${i}`,
            media: [],
            links: [],
          },
          metadata: {
            engagement: {
              likes: Math.floor(Math.random() * 100),
              retweets: Math.floor(Math.random() * 50),
              replies: Math.floor(Math.random() * 20),
              views: Math.floor(Math.random() * 500),
            },
            sentiment: {
              score: Math.random() * 2 - 1,
              label: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
            },
            topics: [topicResponse.body.data._id],
            hashtags: [`#perf${i}`, `#test${i}`],
            mentions: [],
            language: 'en',
          },
          source: testUsers[i].id,
          collectedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });

        await content.save();
        testContent.push(content);
      }
    }
  });

  describe('Authentication Performance', () => {
    it('should handle user registration under 500ms', async () => {
      const registrationTime = await performanceTestUtils.measureResponseTime(async () => {
        await request(app)
          .post('/api/auth/register')
          .send({
            email: 'perfreg@example.com',
            password: 'Password123!',
            profile: { firstName: 'Perf', lastName: 'Reg' },
          });
      });

      expect(registrationTime).toBeLessThan(500);
      console.log(`User registration time: ${registrationTime}ms`);
    });

    it('should handle user login under 300ms', async () => {
      const loginTime = await performanceTestUtils.measureResponseTime(async () => {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'perfuser0@example.com',
            password: 'Password123!',
          });
      });

      expect(loginTime).toBeLessThan(300);
      console.log(`User login time: ${loginTime}ms`);
    });

    it('should handle concurrent login requests', async () => {
      const results = await performanceTestUtils.runLoadTest(
        async () => {
          await request(app)
            .post('/api/auth/login')
            .send({
              email: 'perfuser0@example.com',
              password: 'Password123!',
            });
        },
        10, // concurrent users
        5   // requests per user
      );

      expect(results.successRate).toBeGreaterThan(95);
      expect(results.avgTime).toBeLessThan(500);
      console.log(`Concurrent login test - Success rate: ${results.successRate}%, Avg time: ${results.avgTime}ms`);
    });
  });

  describe('Topic Management Performance', () => {
    it('should create topics under 200ms', async () => {
      const topicCreationTime = await performanceTestUtils.measureResponseTime(async () => {
        await request(app)
          .post('/api/topics')
          .set('Authorization', `Bearer ${accessTokens[0]}`)
          .send({
            name: 'Perf Test Topic',
            keywords: ['perf', 'test'],
            weight: 5,
          });
      });

      expect(topicCreationTime).toBeLessThan(200);
      console.log(`Topic creation time: ${topicCreationTime}ms`);
    });

    it('should retrieve topics under 100ms', async () => {
      const topicRetrievalTime = await performanceTestUtils.measureResponseTime(async () => {
        await request(app)
          .get('/api/topics')
          .set('Authorization', `Bearer ${accessTokens[0]}`);
      });

      expect(topicRetrievalTime).toBeLessThan(100);
      console.log(`Topic retrieval time: ${topicRetrievalTime}ms`);
    });

    it('should handle concurrent topic operations', async () => {
      const results = await performanceTestUtils.runLoadTest(
        async () => {
          await request(app)
            .get('/api/topics')
            .set('Authorization', `Bearer ${accessTokens[0]}`);
        },
        20, // concurrent users
        10  // requests per user
      );

      expect(results.successRate).toBeGreaterThan(98);
      expect(results.avgTime).toBeLessThan(150);
      console.log(`Concurrent topic operations - Success rate: ${results.successRate}%, Avg time: ${results.avgTime}ms`);
    });
  });

  describe('Content Management Performance', () => {
    it('should retrieve content with pagination under 200ms', async () => {
      const contentRetrievalTime = await performanceTestUtils.measureResponseTime(async () => {
        await request(app)
          .get('/api/content?page=1&limit=20')
          .set('Authorization', `Bearer ${accessTokens[0]}`);
      });

      expect(contentRetrievalTime).toBeLessThan(200);
      console.log(`Content retrieval time: ${contentRetrievalTime}ms`);
    });

    it('should handle content search under 300ms', async () => {
      const searchTime = await performanceTestUtils.measureResponseTime(async () => {
        await request(app)
          .get('/api/content/search?q=perf0')
          .set('Authorization', `Bearer ${accessTokens[0]}`);
      });

      expect(searchTime).toBeLessThan(300);
      console.log(`Content search time: ${searchTime}ms`);
    });

    it('should handle large content datasets efficiently', async () => {
      const startTime = Date.now();
      const memoryBefore = performanceTestUtils.measureMemoryUsage();

      // Create additional content for performance testing
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/topics')
          .set('Authorization', `Bearer ${accessTokens[0]}`)
          .send({
            name: `Bulk Topic ${i}`,
            keywords: [`bulk${i}`, `perf${i}`],
          });

        for (let j = 0; j < 50; j++) {
          const content = new Content({
            platform: 'twitter',
            platformId: `bulk-tweet-${i}-${j}`,
            type: 'tweet',
            author: {
              id: `bulk-author-${i}`,
              username: `bulkauthor${i}`,
              displayName: `Bulk Author ${i}`,
            },
            content: {
              text: `Bulk content ${i}-${j} with keywords bulk${i} and perf${i}`,
              media: [],
              links: [],
            },
            metadata: {
              engagement: {
                likes: Math.floor(Math.random() * 1000),
                retweets: Math.floor(Math.random() * 500),
                replies: Math.floor(Math.random() * 200),
                views: Math.floor(Math.random() * 5000),
              },
              sentiment: {
                score: Math.random() * 2 - 1,
                label: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
              },
              hashtags: [`#bulk${i}`, `#perf${i}`],
              mentions: [],
              language: 'en',
            },
            source: testUsers[0].id,
            collectedAt: new Date(),
          });

          await content.save();
        }
      }

      const creationTime = Date.now() - startTime;
      const memoryAfter = performanceTestUtils.measureMemoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      console.log(`Bulk content creation time: ${creationTime}ms`);
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

      // Test retrieval performance with large dataset
      const retrievalTime = await performanceTestUtils.measureResponseTime(async () => {
        await request(app)
          .get('/api/content?page=1&limit=50')
          .set('Authorization', `Bearer ${accessTokens[0]}`);
      });

      expect(retrievalTime).toBeLessThan(500);
      console.log(`Large dataset retrieval time: ${retrievalTime}ms`);

      // Test search performance with large dataset
      const searchTime = await performanceTestUtils.measureResponseTime(async () => {
        await request(app)
          .get('/api/content/search?q=bulk0')
          .set('Authorization', `Bearer ${accessTokens[0]}`);
      });

      expect(searchTime).toBeLessThan(400);
      console.log(`Large dataset search time: ${searchTime}ms`);
    });

    it('should handle concurrent content requests', async () => {
      const results = await performanceTestUtils.runLoadTest(
        async () => {
          await request(app)
            .get('/api/content?page=1&limit=20')
            .set('Authorization', `Bearer ${accessTokens[0]}`);
        },
        50, // concurrent users
        5   // requests per user
      );

      expect(results.successRate).toBeGreaterThan(95);
      expect(results.avgTime).toBeLessThan(300);
      console.log(`Concurrent content requests - Success rate: ${results.successRate}%, Avg time: ${results.avgTime}ms`);
    });
  });

  describe('Memory Usage Analysis', () => {
    it('should maintain stable memory usage during operations', async () => {
      const memoryBefore = performanceTestUtils.measureMemoryUsage();

      // Perform various operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/topics')
          .set('Authorization', `Bearer ${accessTokens[i % accessTokens.length]}`);

        await request(app)
          .get('/api/content?page=1&limit=10')
          .set('Authorization', `Bearer ${accessTokens[i % accessTokens.length]}`);

        if (i % 10 === 0) {
          await request(app)
            .post('/api/topics')
            .set('Authorization', `Bearer ${accessTokens[0]}`)
            .send({
              name: `Memory Test Topic ${i}`,
              keywords: [`memory${i}`, `test${i}`],
            });
        }
      }

      const memoryAfter = performanceTestUtils.measureMemoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      console.log(`Memory increase after operations: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);

      // Memory increase should be reasonable (less than 50MB for these operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Database Query Performance', () => {
    it('should use indexes efficiently for user-specific queries', async () => {
      const queryTime = await performanceTestUtils.measureResponseTime(async () => {
        // Query that should use index on userId + isActive
        await Content.find({ source: testUsers[0].id, isActive: true })
          .sort({ collectedAt: -1 })
          .limit(20)
          .lean()
          .exec();
      });

      expect(queryTime).toBeLessThan(50);
      console.log(`Indexed query time: ${queryTime}ms`);
    });

    it('should handle complex aggregation queries efficiently', async () => {
      const aggregationTime = await performanceTestUtils.measureResponseTime(async () => {
        await Content.aggregate([
          { $match: { source: testUsers[0].id, isActive: true } },
          {
            $group: {
              _id: '$platform',
              count: { $sum: 1 },
              avgLikes: { $avg: '$metadata.engagement.likes' },
              totalViews: { $sum: '$metadata.engagement.views' },
            },
          },
          { $sort: { count: -1 } },
        ]);
      });

      expect(aggregationTime).toBeLessThan(100);
      console.log(`Aggregation query time: ${aggregationTime}ms`);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limits efficiently', async () => {
      const startTime = Date.now();
      let blockedRequests = 0;
      let successfulRequests = 0;

      // Make many rapid requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .get('/api/topics')
            .set('Authorization', `Bearer ${accessTokens[0]}`)
            .then(() => successfulRequests++)
            .catch((error) => {
              if (error.status === 429) blockedRequests++;
            })
        );
      }

      await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      console.log(`Rate limiting test - Successful: ${successfulRequests}, Blocked: ${blockedRequests}, Time: ${totalTime}ms`);

      // Some requests should be blocked due to rate limiting
      expect(blockedRequests).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(5000); // Should complete quickly
    });
  });
});