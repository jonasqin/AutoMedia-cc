import request from 'supertest';
import express from 'express';
import { Topic, Content, User } from '../../models';
import { CronService } from '../../services/cronService';
import { twitterService } from '../../services/twitterService';

// Mock external services
jest.mock('../../services/twitterService');
jest.mock('../../config/redis');

const mockedTwitterService = twitterService as jest.Mocked<typeof twitterService>;

describe('Topic Management Integration Tests', () => {
  let app: express.Application;
  let testUser: any;
  let accessToken: string;

  beforeEach(async () => {
    // Create test app
    app = express();
    app.use(express.json());

    // Setup basic auth routes for testing
    app.post('/api/auth/register', async (req, res) => {
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
    });

    // Setup topic routes
    app.get('/api/topics', async (req, res) => {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ success: false, message: 'Token required' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const topics = await Topic.find({ userId: decoded.userId, isActive: true });
        res.json({ success: true, data: topics });
      } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
      }
    });

    app.post('/api/topics', async (req, res) => {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ success: false, message: 'Token required' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const topic = new Topic({
          ...req.body,
          userId: decoded.userId,
        });
        await topic.save();
        res.status(201).json({ success: true, data: topic });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    });

    app.put('/api/topics/:id', async (req, res) => {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ success: false, message: 'Token required' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const topic = await Topic.findOneAndUpdate(
          { _id: req.params.id, userId: decoded.userId },
          req.body,
          { new: true }
        );

        if (!topic) {
          return res.status(404).json({ success: false, message: 'Topic not found' });
        }

        res.json({ success: true, data: topic });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    });

    app.delete('/api/topics/:id', async (req, res) => {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ success: false, message: 'Token required' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const topic = await Topic.findOneAndUpdate(
          { _id: req.params.id, userId: decoded.userId },
          { isActive: false },
          { new: true }
        );

        if (!topic) {
          return res.status(404).json({ success: false, message: 'Topic not found' });
        }

        res.json({ success: true, data: topic });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    });

    app.get('/api/topics/:id/content', async (req, res) => {
      const jwt = require('jsonwebtoken');
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ success: false, message: 'Token required' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const content = await Content.find({
          source: decoded.userId,
          'metadata.topics': req.params.id,
          isActive: true,
        }).sort({ collectedAt: -1 });

        res.json({ success: true, data: content });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
    });

    // Create test user and get token
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'topicuser@example.com',
        password: 'Password123!',
        profile: { firstName: 'Topic', lastName: 'User' },
      });

    testUser = userResponse.body.data.user;
    accessToken = userResponse.body.data.accessToken;
  });

  describe('Topic CRUD Operations', () => {
    it('should create a new topic', async () => {
      const topicData = {
        name: 'AI Technology',
        description: 'Latest developments in AI technology',
        keywords: ['AI', 'artificial intelligence', 'machine learning'],
        weight: 8,
        category: 'Technology',
        priority: 'high',
        emoji: '🤖',
        color: '#007bff',
        settings: {
          updateFrequency: '15min',
          notificationEnabled: true,
          autoCollect: true,
        },
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(topicData.name);
      expect(response.body.data.userId).toBe(testUser.id);
      expect(response.body.data.keywords).toEqual(topicData.keywords);
      expect(response.body.data.weight).toBe(topicData.weight);
      expect(response.body.data.priority).toBe(topicData.priority);
      expect(response.body.data.emoji).toBe(topicData.emoji);
      expect(response.body.data.color).toBe(topicData.color);
      expect(response.body.data.settings.updateFrequency).toBe(topicData.settings.updateFrequency);
    });

    it('should create topic with minimal required fields', async () => {
      const minimalTopicData = {
        name: 'Minimal Topic',
        keywords: ['minimal'],
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(minimalTopicData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(minimalTopicData.name);
      expect(response.body.data.keywords).toEqual(minimalTopicData.keywords);
      expect(response.body.data.weight).toBe(1); // Default value
      expect(response.body.data.priority).toBe('medium'); // Default value
      expect(response.body.data.settings.updateFrequency).toBe('1hour'); // Default value
    });

    it('should validate topic name length', async () => {
      const invalidTopicData = {
        name: 'A'.repeat(101), // Too long
        keywords: ['test'],
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidTopicData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require keywords for topic', async () => {
      const invalidTopicData = {
        name: 'No Keywords Topic',
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidTopicData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent duplicate topic names for same user', async () => {
      const topicData = {
        name: 'Duplicate Topic',
        keywords: ['test'],
      };

      // Create first topic
      await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should get user topics', async () => {
      // Create test topics
      const topic1Data = {
        name: 'Topic 1',
        keywords: ['test1'],
        weight: 5,
      };

      const topic2Data = {
        name: 'Topic 2',
        keywords: ['test2'],
        weight: 8,
      };

      await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topic1Data);

      await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topic2Data);

      const response = await request(app)
        .get('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Topic 1');
      expect(response.body.data[1].name).toBe('Topic 2');
    });

    it('should get only active topics', async () => {
      // Create topics
      const topic1Data = { name: 'Active Topic', keywords: ['active'] };
      const topic2Data = { name: 'Inactive Topic', keywords: ['inactive'] };

      const topic1Response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topic1Data);

      const topic2Response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topic2Data);

      // Deactivate one topic
      await request(app)
        .delete(`/api/topics/${topic2Response.body.data._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const response = await request(app)
        .get('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Active Topic');
    });

    it('should update topic', async () => {
      // Create topic
      const topicData = {
        name: 'Original Topic',
        keywords: ['original'],
      };

      const createResponse = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData);

      const topicId = createResponse.body.data._id;

      // Update topic
      const updateData = {
        name: 'Updated Topic',
        keywords: ['updated', 'new'],
        weight: 9,
        priority: 'high',
      };

      const updateResponse = await request(app)
        .put(`/api/topics/${topicId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe(updateData.name);
      expect(updateResponse.body.data.keywords).toEqual(updateData.keywords);
      expect(updateResponse.body.data.weight).toBe(updateData.weight);
      expect(updateResponse.body.data.priority).toBe(updateData.priority);
      expect(updateResponse.body.data.lastUpdated).not.toBeUndefined();
    });

    it('should not allow updating other user\'s topic', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other@example.com',
          password: 'Password123!',
          profile: { firstName: 'Other', lastName: 'User' },
        });

      const otherAccessToken = otherUserResponse.body.data.accessToken;

      // Create topic with other user
      const topicData = {
        name: 'Other User Topic',
        keywords: ['other'],
      };

      const createResponse = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send(topicData);

      const topicId = createResponse.body.data._id;

      // Try to update with first user
      const response = await request(app)
        .put(`/api/topics/${topicId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should deactivate topic (soft delete)', async () => {
      // Create topic
      const topicData = {
        name: 'To Delete',
        keywords: ['delete'],
      };

      const createResponse = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData);

      const topicId = createResponse.body.data._id;

      // Deactivate topic
      const deleteResponse = await request(app)
        .delete(`/api/topics/${topicId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.data.isActive).toBe(false);

      // Verify topic is not returned in list
      const listResponse = await request(app)
        .get('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.data).toHaveLength(0);
    });
  });

  describe('Topic Content Collection', () => {
    let testTopic: any;

    beforeEach(async () => {
      // Create test topic
      const topicData = {
        name: 'Test Collection Topic',
        keywords: ['AI', 'technology'],
        settings: {
          autoCollect: true,
          updateFrequency: '15min',
        },
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData);

      testTopic = response.body.data;
    });

    it('should get content associated with topic', async () => {
      // Create test content associated with topic
      const content = new Content({
        platform: 'twitter',
        platformId: 'tweet1',
        type: 'tweet',
        author: { id: 'author1', username: 'testauthor', displayName: 'Test Author' },
        content: { text: 'AI is amazing!', media: [], links: [] },
        metadata: {
          engagement: { likes: 10, retweets: 5, replies: 2, views: 100 },
          sentiment: { score: 0.8, label: 'positive' },
          topics: [testTopic._id],
          hashtags: ['#AI'],
          mentions: [],
          language: 'en',
        },
        source: testUser.id,
        collectedAt: new Date(),
      });

      await content.save();

      const response = await request(app)
        .get(`/api/topics/${testTopic._id}/content`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].content.text).toBe('AI is amazing!');
      expect(response.body.data[0].metadata.topics).toContain(testTopic._id);
    });

    it('should return empty array for topic with no content', async () => {
      const response = await request(app)
        .get(`/api/topics/${testTopic._id}/content`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should not allow accessing other user\'s topic content', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other2@example.com',
          password: 'Password123!',
          profile: { firstName: 'Other2', lastName: 'User' },
        });

      const otherAccessToken = otherUserResponse.body.data.accessToken;

      const response = await request(app)
        .get(`/api/topics/${testTopic._id}/content`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0); // No content for other user
    });
  });

  describe('Topic Monitoring with Cron Service', () => {
    let cronService: CronService;
    let testTopic: any;

    beforeEach(async () => {
      // Create test topic
      const topicData = {
        name: 'Monitoring Topic',
        keywords: ['test', 'monitoring'],
        settings: {
          autoCollect: true,
          updateFrequency: '15min',
        },
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData);

      testTopic = response.body.data;

      // Create cron service
      cronService = new CronService();
    });

    it('should collect content for active topics with autoCollect enabled', async () => {
      // Mock Twitter service responses
      const mockTweets = [
        {
          platform: 'twitter',
          platformId: 'tweet1',
          type: 'tweet',
          author: { id: 'author1', username: 'testauthor', displayName: 'Test Author' },
          content: { text: 'Test tweet about monitoring', media: [], links: [] },
          metadata: {
            engagement: { likes: 5, retweets: 2, replies: 1, views: 50 },
            sentiment: { score: 0.5, label: 'neutral' },
            topics: [],
            hashtags: ['#test'],
            mentions: [],
            language: 'en',
          },
          publishedAt: new Date(),
          collectedAt: new Date(),
        },
      ];

      mockedTwitterService.searchTweets.mockResolvedValue(mockTweets);
      mockedTwitterService.saveTweetsToDatabase.mockResolvedValue(mockTweets);

      // Get topic from database with populated user
      const topicFromDb = await Topic.findById(testTopic._id).populate('userId');

      // Simulate cron service collecting content
      await (cronService as any).collectContentForTopic(topicFromDb);

      // Verify Twitter service was called with correct search query
      expect(mockedTwitterService.searchTweets).toHaveBeenCalledWith(
        'test OR monitoring',
        {
          maxResults: 50,
          language: 'en',
          resultType: 'recent',
        }
      );

      // Verify tweets were saved
      expect(mockedTwitterService.saveTweetsToDatabase).toHaveBeenCalledWith(
        mockTweets,
        testUser.id
      );

      // Verify topic was updated
      const updatedTopic = await Topic.findById(testTopic._id);
      expect(updatedTopic.contentCount).toBe(1);
      expect(updatedTopic.lastUpdated).not.toBe(testTopic.lastUpdated);
    });

    it('should handle Twitter API errors gracefully', async () => {
      // Mock Twitter service error
      mockedTwitterService.searchTweets.mockRejectedValue(new Error('Twitter API Error'));

      const topicFromDb = await Topic.findById(testTopic._id).populate('userId');

      // Should not throw error
      await expect((cronService as any).collectContentForTopic(topicFromDb))
        .resolves.not.toThrow();

      // Topic should not be updated on error
      const updatedTopic = await Topic.findById(testTopic._id);
      expect(updatedTopic.contentCount).toBe(0);
    });

    it('should not collect content for inactive topics', async () => {
      // Deactivate topic
      await Topic.findByIdAndUpdate(testTopic._id, { isActive: false });

      const topicFromDb = await Topic.findById(testTopic._id).populate('userId');

      await (cronService as any).collectContentForTopic(topicFromDb);

      // Twitter service should not be called
      expect(mockedTwitterService.searchTweets).not.toHaveBeenCalled();
    });

    it('should not collect content for topics with autoCollect disabled', async () => {
      // Disable auto collection
      await Topic.findByIdAndUpdate(testTopic._id, { 'settings.autoCollect': false });

      const topicFromDb = await Topic.findById(testTopic._id).populate('userId');

      await (cronService as any).collectContentForTopic(topicFromDb);

      // Twitter service should not be called
      expect(mockedTwitterService.searchTweets).not.toHaveBeenCalled();
    });

    it('should handle empty search results', async () => {
      // Mock empty search results
      mockedTwitterService.searchTweets.mockResolvedValue([]);

      const topicFromDb = await Topic.findById(testTopic._id).populate('userId');

      await (cronService as any).collectContentForTopic(topicFromDb);

      // Should not throw error
      expect(mockedTwitterService.searchTweets).toHaveBeenCalled();
      expect(mockedTwitterService.saveTweetsToDatabase).not.toHaveBeenCalled();
    });

    it('should handle topics with no keywords', async () => {
      // Create topic without keywords
      const topicNoKeywords = new Topic({
        userId: testUser.id,
        name: 'No Keywords Topic',
        keywords: [],
        settings: { autoCollect: true },
      });

      await topicNoKeywords.save();

      const topicFromDb = await Topic.findById(topicNoKeywords._id).populate('userId');

      await (cronService as any).collectContentForTopic(topicFromDb);

      // Should not call Twitter service with empty query
      expect(mockedTwitterService.searchTweets).not.toHaveBeenCalled();
    });
  });

  describe('Topic Virtual Properties', () => {
    it('should return formatted name with emoji', async () => {
      const topicData = {
        name: 'Technology',
        keywords: ['tech'],
        emoji: '💻',
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData);

      expect(response.body.data.formattedName).toBe('💻 Technology');
    });

    it('should return name without emoji when no emoji set', async () => {
      const topicData = {
        name: 'Technology',
        keywords: ['tech'],
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData);

      expect(response.body.data.formattedName).toBe('Technology');
    });

    it('should return correct keyword count', async () => {
      const topicData = {
        name: 'Multiple Keywords',
        keywords: ['AI', 'ML', 'tech', 'innovation'],
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData);

      expect(response.body.data.keywordCount).toBe(4);
    });

    it('should return keyword count 0 for empty keywords', async () => {
      const topicData = {
        name: 'Empty Keywords',
        keywords: [],
      };

      const response = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(topicData);

      expect(response.body.data.keywordCount).toBe(0);
    });
  });
});