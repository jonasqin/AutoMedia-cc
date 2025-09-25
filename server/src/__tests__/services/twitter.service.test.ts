import { TwitterService } from '../../services/twitterService';
import { Content } from '../../models';
import { cacheData, getCachedData, deleteCache } from '../../config/redis';
import { TwitterApi } from 'twitter-api-v2';

// Mock dependencies
jest.mock('../../config/redis');
jest.mock('twitter-api-v2');
jest.mock('../../models/Content');

const mockedContent = Content as jest.MockedClass<typeof Content>;
const mockedCacheData = cacheData as jest.MockedFunction<typeof cacheData>;
const mockedGetCachedData = getCachedData as jest.MockedFunction<typeof getCachedData>;
const mockedDeleteCache = deleteCache as jest.MockedFunction<typeof deleteCache>;
const MockedTwitterApi = TwitterApi as jest.MockedClass<typeof TwitterApi>;

describe('TwitterService', () => {
  let twitterService: TwitterService;
  let mockTwitterClient: any;
  let mockAppClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock Twitter API clients
    mockAppClient = {
      v2: {
        get: jest.fn(),
        userByUsername: jest.fn(),
        userTimeline: jest.fn(),
        search: jest.fn(),
      },
      v1: {
        trendsByPlace: jest.fn(),
        get: jest.fn(),
      },
    };

    mockTwitterClient = { ...mockAppClient };

    MockedTwitterApi.mockImplementation((config) => {
      if (config && typeof config === 'object' && 'accessToken' in config) {
        return mockTwitterClient;
      }
      return mockAppClient;
    });

    twitterService = new TwitterService();
  });

  describe('Constructor', () => {
    it('should initialize with app client only when no user tokens provided', () => {
      process.env.TWITTER_BEARER_TOKEN = 'test-bearer-token';
      delete process.env.TWITTER_ACCESS_TOKEN;
      delete process.env.TWITTER_ACCESS_SECRET;

      const service = new TwitterService();
      expect(service).toBeDefined();
    });

    it('should initialize with user tokens when provided', () => {
      process.env.TWITTER_BEARER_TOKEN = 'test-bearer-token';
      process.env.TWITTER_ACCESS_TOKEN = 'test-access-token';
      process.env.TWITTER_ACCESS_SECRET = 'test-access-secret';

      const service = new TwitterService();
      expect(service).toBeDefined();
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const mockResponse = { rateLimit: { remaining: 100 } };
      mockAppClient.v2.get.mockResolvedValue(mockResponse);

      const result = await twitterService.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
      expect(result.rateLimit).toEqual(mockResponse.rateLimit);
    });

    it('should handle connection test failure', async () => {
      mockAppClient.v2.get.mockRejectedValue(new Error('API Error'));

      const result = await twitterService.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });
  });

  describe('getUserByUsername', () => {
    it('should get user from cache if available', async () => {
      const cachedUser = {
        id: '123',
        username: 'testuser',
        name: 'Test User',
      };

      mockedGetCachedData.mockResolvedValue(cachedUser);

      const result = await twitterService.getUserByUsername('testuser');

      expect(result).toEqual(cachedUser);
      expect(mockedGetCachedData).toHaveBeenCalledWith('twitter:user:testuser');
      expect(mockAppClient.v2.userByUsername).not.toHaveBeenCalled();
    });

    it('should fetch user from API if not cached', async () => {
      const apiUser = {
        data: {
          id: '123',
          username: 'testuser',
          name: 'Test User',
          profile_image_url: 'https://example.com/avatar.jpg',
          verified: true,
        },
      };

      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.userByUsername.mockResolvedValue(apiUser);

      const result = await twitterService.getUserByUsername('testuser');

      expect(result).toEqual(apiUser.data);
      expect(mockAppClient.v2.userByUsername).toHaveBeenCalledWith('testuser', {
        'user.fields': 'id,name,username,profile_image_url,verified,public_metrics,created_at,description',
      });
      expect(mockedCacheData).toHaveBeenCalledWith('twitter:user:testuser', apiUser.data, 3600);
    });

    it('should handle user not found', async () => {
      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.userByUsername.mockResolvedValue({ data: null });

      await expect(twitterService.getUserByUsername('nonexistent'))
        .rejects.toThrow('Failed to get Twitter user');
    });

    it('should handle API errors', async () => {
      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.userByUsername.mockRejectedValue(new Error('Rate limit exceeded'));

      await expect(twitterService.getUserByUsername('testuser'))
        .rejects.toThrow('Failed to get Twitter user');
    });
  });

  describe('getUserTweets', () => {
    const mockTweetResponse = {
      data: {
        data: [
          {
            id: 'tweet1',
            text: 'Test tweet',
            created_at: '2023-01-01T00:00:00Z',
            author_id: '123',
            public_metrics: { like_count: 10, retweet_count: 5, reply_count: 2, impression_count: 100 },
          },
        ],
        includes: {
          users: [
            { id: '123', username: 'testuser', name: 'Test User', profile_image_url: 'https://example.com/avatar.jpg' },
          ],
        },
      },
    };

    it('should get tweets from cache if available', async () => {
      const cachedTweets = [{ id: 'tweet1', text: 'Cached tweet' }];
      mockedGetCachedData.mockResolvedValue(cachedTweets);

      const result = await twitterService.getUserTweets('123');

      expect(result).toEqual(cachedTweets);
      expect(mockedGetCachedData).toHaveBeenCalledWith('twitter:tweets:123:100::');
    });

    it('should fetch tweets from API if not cached', async () => {
      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.userTimeline.mockResolvedValue(mockTweetResponse);

      const result = await twitterService.getUserTweets('123');

      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe('twitter');
      expect(result[0].platformId).toBe('tweet1');
      expect(result[0].content.text).toBe('Test tweet');
      expect(result[0].author.id).toBe('123');
      expect(result[0].metadata.engagement.likes).toBe(10);
    });

    it('should handle API response with media', async () => {
      const responseWithMedia = {
        data: {
          data: [
            {
              id: 'tweet1',
              text: 'Test tweet with media',
              created_at: '2023-01-01T00:00:00Z',
              author_id: '123',
              public_metrics: { like_count: 10 },
              attachments: { media_keys: ['media1'] },
            },
          ],
          includes: {
            users: [
              { id: '123', username: 'testuser', name: 'Test User' },
            ],
            media: [
              { media_key: 'media1', type: 'photo', url: 'https://example.com/image.jpg' },
            ],
          },
        },
      };

      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.userTimeline.mockResolvedValue(responseWithMedia);

      const result = await twitterService.getUserTweets('123');

      expect(result[0].content.media).toHaveLength(1);
      expect(result[0].content.media[0].url).toBe('https://example.com/image.jpg');
      expect(result[0].content.media[0].type).toBe('photo');
    });

    it('should handle API response with entities', async () => {
      const responseWithEntities = {
        data: {
          data: [
            {
              id: 'tweet1',
              text: 'Test tweet with #hashtag and @mention',
              created_at: '2023-01-01T00:00:00Z',
              author_id: '123',
              public_metrics: { like_count: 10 },
              lang: 'en',
              entities: {
                hashtags: [{ tag: 'hashtag' }],
                mentions: [{ username: 'mention' }],
                urls: [{ expanded_url: 'https://example.com', title: 'Example' }],
              },
            },
          ],
          includes: {
            users: [
              { id: '123', username: 'testuser', name: 'Test User' },
            ],
          },
        },
      };

      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.userTimeline.mockResolvedValue(responseWithEntities);

      const result = await twitterService.getUserTweets('123');

      expect(result[0].metadata.hashtags).toContain('hashtag');
      expect(result[0].metadata.mentions).toContain('mention');
      expect(result[0].metadata.language).toBe('en');
      expect(result[0].content.links).toHaveLength(1);
      expect(result[0].content.links[0].url).toBe('https://example.com');
    });

    it('should handle empty response', async () => {
      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.userTimeline.mockResolvedValue({ data: null });

      const result = await twitterService.getUserTweets('123');

      expect(result).toEqual([]);
    });
  });

  describe('searchTweets', () => {
    const mockSearchResponse = {
      data: {
        data: [
          {
            id: 'search1',
            text: 'Search result tweet',
            created_at: '2023-01-01T00:00:00Z',
            author_id: '123',
            public_metrics: { like_count: 5 },
          },
        ],
        includes: {
          users: [
            { id: '123', username: 'testuser', name: 'Test User' },
          ],
        },
      },
    };

    it('should search tweets with default options', async () => {
      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.search.mockResolvedValue(mockSearchResponse);

      const result = await twitterService.searchTweets('test query');

      expect(result).toHaveLength(1);
      expect(mockAppClient.v2.search).toHaveBeenCalledWith({
        query: 'test query',
        max_results: 100,
        'tweet.fields': 'id,text,created_at,author_id,public_metrics,context_annotations,entities,attachments,referenced_tweets',
        'user.fields': 'id,name,username,profile_image_url,verified',
        'media.fields': 'url,preview_image_url,type,alt_text',
        'expansions': 'author_id,attachments.media_keys,referenced_tweets.id',
      });
    });

    it('should search tweets with custom options', async () => {
      const options = {
        maxResults: 50,
        startTime: new Date('2023-01-01'),
        endTime: new Date('2023-01-02'),
        language: 'es',
        resultType: 'popular' as const,
      };

      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.search.mockResolvedValue(mockSearchResponse);

      await twitterService.searchTweets('test query', options);

      expect(mockAppClient.v2.search).toHaveBeenCalledWith({
        query: 'test query',
        max_results: 50,
        'tweet.fields': 'id,text,created_at,author_id,public_metrics,context_annotations,entities,attachments,referenced_tweets',
        'user.fields': 'id,name,username,profile_image_url,verified',
        'media.fields': 'url,preview_image_url,type,alt_text',
        'expansions': 'author_id,attachments.media_keys,referenced_tweets.id',
        start_time: '2023-01-01T00:00:00.000Z',
        end_time: '2023-01-02T00:00:00.000Z',
      });
    });

    it('should handle search errors', async () => {
      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v2.search.mockRejectedValue(new Error('Search failed'));

      await expect(twitterService.searchTweets('test query'))
        .rejects.toThrow('Failed to search tweets');
    });
  });

  describe('getTrendingTopics', () => {
    it('should get trending topics from cache', async () => {
      const cachedTrends = [
        { name: '#Trending', tweet_volume: 1000 },
      ];

      mockedGetCachedData.mockResolvedValue(cachedTrends);

      const result = await twitterService.getTrendingTopics(1);

      expect(result).toEqual(cachedTrends);
      expect(mockedGetCachedData).toHaveBeenCalledWith('twitter:trends:1');
    });

    it('should fetch trending topics from API if not cached', async () => {
      const apiResponse = [
        {
          trends: [
            { name: '#Trending1', url: 'https://twitter.com/trending1', tweet_volume: 1000 },
            { name: '#Trending2', url: 'https://twitter.com/trending2', tweet_volume: 500 },
          ],
        },
      ];

      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v1.trendsByPlace.mockResolvedValue(apiResponse);

      const result = await twitterService.getTrendingTopics(1);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('#Trending1');
      expect(result[0].tweet_volume).toBe(1000);
      expect(mockedCacheData).toHaveBeenCalledWith('twitter:trends:1', expect.any(Array), 900);
    });

    it('should handle empty trends response', async () => {
      mockedGetCachedData.mockResolvedValue(null);
      mockAppClient.v1.trendsByPlace.mockResolvedValue([]);

      const result = await twitterService.getTrendingTopics(1);

      expect(result).toEqual([]);
    });
  });

  describe('monitorUsers', () => {
    it('should monitor multiple users successfully', async () => {
      const usernames = ['user1', 'user2'];

      const mockUser1 = { id: '1', username: 'user1', name: 'User 1' };
      const mockUser2 = { id: '2', username: 'user2', name: 'User 2' };

      // Mock getUserByUsername
      jest.spyOn(twitterService, 'getUserByUsername')
        .mockResolvedValueOnce(mockUser1)
        .mockResolvedValueOnce(mockUser2);

      // Mock getUserTweets
      jest.spyOn(twitterService, 'getUserTweets')
        .mockResolvedValueOnce([{ id: 'tweet1' }])
        .mockResolvedValueOnce([{ id: 'tweet2' }]);

      const result = await twitterService.monitorUsers(usernames);

      expect(result).toHaveLength(2);
      expect(result[0].user).toEqual(mockUser1);
      expect(result[0].tweets).toHaveLength(1);
      expect(result[1].user).toEqual(mockUser2);
      expect(result[1].tweets).toHaveLength(1);
    });

    it('should handle user monitoring errors gracefully', async () => {
      const usernames = ['user1', 'user2'];

      jest.spyOn(twitterService, 'getUserByUsername')
        .mockRejectedValueOnce(new Error('User not found'))
        .mockResolvedValueOnce({ id: '2', username: 'user2', name: 'User 2' });

      jest.spyOn(twitterService, 'getUserTweets')
        .mockResolvedValueOnce([{ id: 'tweet2' }]);

      const result = await twitterService.monitorUsers(usernames);

      expect(result).toHaveLength(2);
      expect(result[0].error).toContain('User not found');
      expect(result[1].user).toBeDefined();
    });
  });

  describe('saveTweetsToDatabase', () => {
    it('should save new tweets to database', async () => {
      const tweets = [
        {
          platform: 'twitter',
          platformId: 'tweet1',
          type: 'tweet',
          author: { id: '123', username: 'testuser', displayName: 'Test User' },
          content: { text: 'Test tweet', media: [], links: [] },
          metadata: { engagement: { likes: 10 }, sentiment: { score: 0 } },
        },
      ];

      const mockContent = {
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockedContent.findOne.mockResolvedValue(null);
      mockedContent.mockImplementation(() => mockContent);

      const result = await twitterService.saveTweetsToDatabase(tweets, 'user123');

      expect(result).toHaveLength(1);
      expect(mockedContent.findOne).toHaveBeenCalledWith({
        platform: 'twitter',
        platformId: 'tweet1',
      });
      expect(mockContent.save).toHaveBeenCalled();
    });

    it('should not save duplicate tweets', async () => {
      const tweets = [
        {
          platform: 'twitter',
          platformId: 'tweet1',
          type: 'tweet',
          author: { id: '123', username: 'testuser', displayName: 'Test User' },
          content: { text: 'Test tweet', media: [], links: [] },
          metadata: { engagement: { likes: 10 }, sentiment: { score: 0 } },
        },
      ];

      const existingContent = { _id: 'existingId' };
      mockedContent.findOne.mockResolvedValue(existingContent);

      const result = await twitterService.saveTweetsToDatabase(tweets, 'user123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(existingContent);
      expect(mockedContent).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const tweets = [
        {
          platform: 'twitter',
          platformId: 'tweet1',
          type: 'tweet',
          author: { id: '123', username: 'testuser', displayName: 'Test User' },
          content: { text: 'Test tweet', media: [], links: [] },
          metadata: { engagement: { likes: 10 }, sentiment: { score: 0 } },
        },
      ];

      const mockContent = {
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockedContent.findOne.mockResolvedValue(null);
      mockedContent.mockImplementation(() => mockContent);

      const result = await twitterService.saveTweetsToDatabase(tweets, 'user123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should get rate limit status successfully', async () => {
      const mockRateLimit = {
        resources: {
          search: [{ remaining: 100, limit: 300 }],
          users: [{ remaining: 50, limit: 900 }],
        },
      };

      mockAppClient.v1.get.mockResolvedValue(mockRateLimit);

      const result = await twitterService.getRateLimitStatus();

      expect(result).toEqual(mockRateLimit);
      expect(mockAppClient.v1.get).toHaveBeenCalledWith('application/rate_limit_status');
    });

    it('should handle rate limit status errors', async () => {
      mockAppClient.v1.get.mockRejectedValue(new Error('Rate limit endpoint error'));

      await expect(twitterService.getRateLimitStatus())
        .rejects.toThrow('Failed to get rate limit status');
    });
  });
});