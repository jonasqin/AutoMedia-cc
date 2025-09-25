import { Content } from '../../models/Content';
import mongoose from 'mongoose';

describe('Content Model', () => {
  describe('Content Schema', () => {
    it('should create a content document with required fields', () => {
      const contentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
        metadata: {
          engagement: {
            likes: 10,
            retweets: 5,
            replies: 2,
            views: 100,
          },
          sentiment: {
            score: 0.5,
            label: 'positive',
          },
          topics: ['test'],
          hashtags: ['#test'],
          mentions: [],
          language: 'en',
        },
        aiGenerated: false,
        tags: ['test'],
        collections: [],
        isActive: true,
      };

      const content = new Content(contentData);
      const savedContent = content.toObject();

      expect(savedContent.platform).toBe('twitter');
      expect(savedContent.type).toBe('tweet');
      expect(savedContent.author.username).toBe('testuser');
      expect(savedContent.content.text).toBe('This is a test tweet');
      expect(savedContent.metadata.engagement.likes).toBe(10);
      expect(savedContent.metadata.sentiment.label).toBe('positive');
      expect(savedContent.isActive).toBe(true);
    });

    it('should require platform field', () => {
      const contentData = {
        // missing required platform field
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
      };

      const content = new Content(contentData);
      const validationError = content.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors['platform']).toBeDefined();
    });

    it('should validate platform enum values', () => {
      const invalidContentData = {
        platform: 'invalid-platform', // invalid enum value
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
      };

      const content = new Content(invalidContentData);
      const validationError = content.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors['platform']).toBeDefined();
    });

    it('should validate content type enum values', () => {
      const invalidContentData = {
        platform: 'twitter',
        type: 'invalid-type', // invalid enum value
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
      };

      const content = new Content(invalidContentData);
      const validationError = content.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors['type']).toBeDefined();
    });

    it('should validate sentiment score range', () => {
      const invalidContentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
        metadata: {
          engagement: {
            likes: 10,
            retweets: 5,
            replies: 2,
            views: 100,
          },
          sentiment: {
            score: 2, // invalid score (should be between -1 and 1)
            label: 'positive',
          },
          topics: ['test'],
          hashtags: ['#test'],
          mentions: [],
          language: 'en',
        },
      };

      const content = new Content(invalidContentData);
      const validationError = content.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors['metadata.sentiment.score']).toBeDefined();
    });

    it('should prevent negative engagement metrics', () => {
      const invalidContentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
        metadata: {
          engagement: {
            likes: -10, // negative likes (invalid)
            retweets: 5,
            replies: 2,
            views: 100,
          },
          sentiment: {
            score: 0.5,
            label: 'positive',
          },
          topics: ['test'],
          hashtags: ['#test'],
          mentions: [],
          language: 'en',
        },
      };

      const content = new Content(invalidContentData);
      const validationError = content.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors['metadata.engagement.likes']).toBeDefined();
    });

    it('should validate content text length', () => {
      const longText = 'x'.repeat(10001); // exceeds 10000 character limit

      const invalidContentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: longText,
          media: [],
          links: [],
        },
      };

      const content = new Content(invalidContentData);
      const validationError = content.validateSync();

      expect(validationError).toBeDefined();
      expect(validationError?.errors['content.text']).toBeDefined();
    });

    it('should set default values for optional fields', () => {
      const minimalContentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
      };

      const content = new Content(minimalContentData);
      const savedContent = content.toObject();

      expect(savedContent.metadata.engagement.likes).toBe(0);
      expect(savedContent.metadata.engagement.retweets).toBe(0);
      expect(savedContent.metadata.engagement.replies).toBe(0);
      expect(savedContent.metadata.engagement.views).toBe(0);
      expect(savedContent.metadata.sentiment.score).toBe(0);
      expect(savedContent.metadata.sentiment.label).toBe('neutral');
      expect(savedContent.metadata.language).toBe('en');
      expect(savedContent.aiGenerated).toBe(false);
      expect(savedContent.isActive).toBe(true);
    });

    it('should calculate engagement rate virtual field', () => {
      const contentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
        metadata: {
          engagement: {
            likes: 100,
            retweets: 50,
            replies: 25,
            views: 1000,
          },
          sentiment: {
            score: 0.8,
            label: 'positive',
          },
          topics: ['test'],
          hashtags: ['#test'],
          mentions: [],
          language: 'en',
        },
        aiGenerated: false,
        tags: ['test'],
        collections: [],
        isActive: true,
      };

      const content = new Content(contentData);
      const engagementRate = content.get('engagementRate');

      expect(engagementRate).toBe(175); // 100 + 50 + 25
    });

    it('should handle empty engagement data', () => {
      const contentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a test tweet',
          media: [],
          links: [],
        },
        metadata: {
          sentiment: {
            score: 0,
            label: 'neutral',
          },
          topics: [],
          hashtags: [],
          mentions: [],
          language: 'en',
        },
        aiGenerated: false,
        tags: [],
        collections: [],
        isActive: true,
      };

      const content = new Content(contentData);
      const engagementRate = content.get('engagementRate');

      expect(engagementRate).toBe(0);
    });

    it('should support media uploads', () => {
      const contentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'This is a tweet with media',
          media: [
            {
              url: 'https://example.com/image.jpg',
              type: 'image',
              altText: 'A test image',
            },
            {
              url: 'https://example.com/video.mp4',
              type: 'video',
              altText: 'A test video',
            },
          ],
          links: [],
        },
        metadata: {
          engagement: {
            likes: 50,
            retweets: 25,
            replies: 10,
            views: 500,
          },
          sentiment: {
            score: 0.6,
            label: 'positive',
          },
          topics: ['media'],
          hashtags: ['#media'],
          mentions: [],
          language: 'en',
        },
        aiGenerated: false,
        tags: ['media'],
        collections: [],
        isActive: true,
      };

      const content = new Content(contentData);
      const savedContent = content.toObject();

      expect(savedContent.content.media).toHaveLength(2);
      expect(savedContent.content.media[0].type).toBe('image');
      expect(savedContent.content.media[1].type).toBe('video');
    });

    it('should support links in content', () => {
      const contentData = {
        platform: 'twitter',
        type: 'tweet',
        author: {
          id: '123456789',
          username: 'testuser',
          displayName: 'Test User',
          verified: false,
        },
        content: {
          text: 'Check out this link: https://example.com',
          media: [],
          links: [
            {
              url: 'https://example.com',
              title: 'Example Website',
              description: 'This is an example website',
            },
          ],
        },
        metadata: {
          engagement: {
            likes: 30,
            retweets: 15,
            replies: 5,
            views: 300,
          },
          sentiment: {
            score: 0.4,
            label: 'neutral',
          },
          topics: ['web'],
          hashtags: ['#web'],
          mentions: [],
          language: 'en',
        },
        aiGenerated: false,
        tags: ['web'],
        collections: [],
        isActive: true,
      };

      const content = new Content(contentData);
      const savedContent = content.toObject();

      expect(savedContent.content.links).toHaveLength(1);
      expect(savedContent.content.links[0].url).toBe('https://example.com');
      expect(savedContent.content.links[0].title).toBe('Example Website');
    });
  });

  describe('Content Indexes', () => {
    it('should have text search index', () => {
      const indexes = Content.schema.indexes();

      const textIndex = indexes.find(index =>
        index['content.text'] === 'text'
      );

      expect(textIndex).toBeDefined();
      expect(textIndex!['author.username']).toBe('text');
      expect(textIndex!['author.displayName']).toBe('text');
      expect(textIndex!['metadata.topics']).toBe('text');
      expect(textIndex!['metadata.hashtags']).toBe('text');
      expect(textIndex!['tags']).toBe('text');
    });

    it('should have compound indexes for performance', () => {
      const indexes = Content.schema.indexes();

      const platformIndex = indexes.find(index =>
        index.platform === 1 && index.collectedAt === -1
      );
      expect(platformIndex).toBeDefined();

      const authorIndex = indexes.find(index =>
        index['author.id'] === 1 && index.collectedAt === -1
      );
      expect(authorIndex).toBeDefined();

      const sentimentIndex = indexes.find(index =>
        index.platform === 1 && index['metadata.sentiment.label'] === 1
      );
      expect(sentimentIndex).toBeDefined();

      const aiGeneratedIndex = indexes.find(index =>
        index.aiGenerated === 1 && index.collectedAt === -1
      );
      expect(aiGeneratedIndex).toBeDefined();
    });

    it('should have unique sparse index for platformId', () => {
      const indexes = Content.schema.indexes();

      const platformIdIndex = indexes.find(index =>
        index.platformId === 1 && index.sparse === true && index.unique === true
      );
      expect(platformIdIndex).toBeDefined();
    });
  });
});