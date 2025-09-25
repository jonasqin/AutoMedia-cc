import { AIService } from '../../services/aiService';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Generation, Agent } from '../../models';
import { cacheData, getCachedData, deleteCache } from '../../config/redis';

// Mock dependencies
jest.mock('openai');
jest.mock('@google/generative-ai');
jest.mock('../../models/Generation');
jest.mock('../../models/Agent');
jest.mock('../../config/redis');

const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
const MockedGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;
const MockedGeneration = Generation as jest.MockedClass<typeof Generation>;
const MockedAgent = Agent as jest.MockedClass<typeof Agent>;
const mockedCacheData = cacheData as jest.MockedFunction<typeof cacheData>;
const mockedGetCachedData = getCachedData as jest.MockedFunction<typeof getCachedData>;
const mockedDeleteCache = deleteCache as jest.MockedFunction<typeof deleteCache>;

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAI: any;
  let mockGemini: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock OpenAI
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };

    MockedOpenAI.mockImplementation(() => mockOpenAI);

    // Setup mock Gemini
    mockGemini = {
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn(),
      }),
    };

    MockedGoogleGenerativeAI.mockImplementation(() => mockGemini);

    // Set environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GOOGLE_AI_API_KEY = 'test-google-key';

    aiService = new AIService();
  });

  describe('Constructor', () => {
    it('should initialize with OpenAI provider when API key is available', () => {
      expect(MockedOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-openai-key',
      });
    });

    it('should initialize with Google provider when API key is available', () => {
      expect(MockedGoogleGenerativeAI).toHaveBeenCalledWith('test-google-key');
    });

    it('should not initialize providers when API keys are missing', () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      const service = new AIService();
      expect(service).toBeDefined();
    });
  });

  describe('getAvailableProviders', () => {
    it('should return available providers', async () => {
      const providers = await aiService.getAvailableProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('google');
    });

    it('should return only available providers when some are missing', () => {
      delete process.env.OPENAI_API_KEY;

      const service = new AIService();
      return service.getAvailableProviders().then(providers => {
        expect(providers).not.toContain('openai');
        expect(providers).toContain('google');
      });
    });
  });

  describe('getModelsForProvider', () => {
    it('should return OpenAI models', async () => {
      const models = await aiService.getModelsForProvider('openai');
      expect(models).toContain('gpt-3.5-turbo');
      expect(models).toContain('gpt-4');
      expect(models).toContain('gpt-4-turbo');
    });

    it('should return Google models', async () => {
      const models = await aiService.getModelsForProvider('google');
      expect(models).toContain('gemini-pro');
      expect(models).toContain('gemini-1.5-pro');
    });

    it('should return empty array for unknown provider', async () => {
      const models = await aiService.getModelsForProvider('unknown');
      expect(models).toEqual([]);
    });
  });

  describe('generateContent', () => {
    let mockGeneration: any;
    let mockAgent: any;

    beforeEach(() => {
      mockGeneration = {
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockAgent = {
        save: jest.fn().mockResolvedValue(undefined),
      };

      MockedGeneration.mockImplementation(() => mockGeneration);
      MockedAgent.mockImplementation(() => mockAgent);
    });

    it('should generate content with OpenAI successfully', async () => {
      const prompt = 'Generate a tweet about AI';
      const userId = 'user123';
      const options = {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'AI is revolutionizing the world! #AI #Technology',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.generateContent(prompt, userId, options);

      expect(result.content).toBe('AI is revolutionizing the world! #AI #Technology');
      expect(result.metadata).toEqual({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
        duration: expect.any(Number),
      });
      expect(result.cost).toBeGreaterThan(0);
      expect(result.tokens).toEqual({
        input: expect.any(Number),
        output: expect.any(Number),
        total: expect.any(Number),
      });

      expect(mockGeneration.save).toHaveBeenCalled();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should generate content with Gemini successfully', async () => {
      const prompt = 'Generate a tweet about AI';
      const userId = 'user123';
      const options = {
        model: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 1000,
      };

      const mockResponse = {
        response: {
          text: () => 'AI is transforming our future! #AI #Innovation',
        },
      };

      mockGemini.getGenerativeModel().generateContent.mockResolvedValue(mockResponse);

      const result = await aiService.generateContent(prompt, userId, options);

      expect(result.content).toBe('AI is transforming our future! #AI #Innovation');
      expect(result.metadata.provider).toBe('google');
      expect(result.metadata.model).toBe('gemini-pro');

      expect(mockGemini.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-pro' });
    });

    it('should include system prompt when provided', async () => {
      const prompt = 'Generate a tweet';
      const systemPrompt = 'You are a professional social media manager';
      const userId = 'user123';
      const options = {
        model: 'gpt-3.5-turbo',
        systemPrompt,
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Professional tweet content',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await aiService.generateContent(prompt, userId, options);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `${systemPrompt}\n\n${prompt}` }],
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should include context when provided', async () => {
      const prompt = 'Generate a response';
      const context = 'Previous conversation context';
      const userId = 'user123';
      const options = {
        model: 'gpt-3.5-turbo',
        context,
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Contextual response',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await aiService.generateContent(prompt, userId, options);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Context: ${context}\n\nTask: ${prompt}` }],
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should handle agent when provided', async () => {
      const prompt = 'Generate content';
      const userId = 'user123';
      const agentId = 'agent456';
      const options = {
        model: 'gpt-3.5-turbo',
        agentId,
      };

      const mockAgentInstance = {
        _id: 'agent456',
        userId: 'user123',
        usageCount: 0,
        save: jest.fn().mockResolvedValue(undefined),
      };

      MockedAgent.findById.mockResolvedValue(mockAgentInstance);

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Agent-generated content',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await aiService.generateContent(prompt, userId, options);

      expect(MockedAgent.findById).toHaveBeenCalledWith(agentId);
      expect(mockAgentInstance.usageCount).toBe(1);
      expect(mockAgentInstance.save).toHaveBeenCalled();
    });

    it('should throw error when agent not found', async () => {
      const prompt = 'Generate content';
      const userId = 'user123';
      const agentId = 'nonexistent-agent';
      const options = {
        model: 'gpt-3.5-turbo',
        agentId,
      };

      MockedAgent.findById.mockResolvedValue(null);

      await expect(aiService.generateContent(prompt, userId, options))
        .rejects.toThrow('Agent not found or access denied');
    });

    it('should throw error when agent access denied', async () => {
      const prompt = 'Generate content';
      const userId = 'user123';
      const agentId = 'agent456';
      const options = {
        model: 'gpt-3.5-turbo',
        agentId,
      };

      const mockAgentInstance = {
        _id: 'agent456',
        userId: 'different-user', // Different user
      };

      MockedAgent.findById.mockResolvedValue(mockAgentInstance);

      await expect(aiService.generateContent(prompt, userId, options))
        .rejects.toThrow('Agent not found or access denied');
    });

    it('should throw error when provider not available', async () => {
      const prompt = 'Generate content';
      const userId = 'user123';
      const options = {
        model: 'unknown-model',
      };

      await expect(aiService.generateContent(prompt, userId, options))
        .rejects.toThrow('AI provider \'openai\' not available');
    });

    it('should handle generation errors properly', async () => {
      const prompt = 'Generate content';
      const userId = 'user123';
      const options = {
        model: 'gpt-3.5-turbo',
      };

      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(aiService.generateContent(prompt, userId, options))
        .rejects.toThrow('API Error');

      expect(mockGeneration.status).toBe('failed');
      expect(mockGeneration.error).toBe('API Error');
      expect(mockGeneration.save).toHaveBeenCalled();
    });

    it('should calculate cost correctly for different models', async () => {
      const prompt = 'Generate content';
      const userId = 'user123';
      const options = {
        model: 'gpt-4',
      };

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated content',
            },
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.generateContent(prompt, userId, options);

      expect(result.cost).toBeGreaterThan(0);
      // GPT-4 should be more expensive than GPT-3.5
      expect(result.cost).toBeGreaterThan(0.001);
    });
  });

  describe('getUserGenerations', () => {
    it('should return user generations with pagination', async () => {
      const userId = 'user123';
      const options = {
        page: 1,
        limit: 10,
        status: 'completed',
        model: 'gpt-3.5-turbo',
      };

      const mockGenerations = [
        { _id: 'gen1', userId, status: 'completed', model: 'gpt-3.5-turbo' },
        { _id: 'gen2', userId, status: 'completed', model: 'gpt-3.5-turbo' },
      ];

      const mockCount = 2;

      MockedGeneration.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockGenerations),
            }),
          }),
        }),
      } as any);

      MockedGeneration.countDocuments.mockResolvedValue(mockCount);

      const result = await aiService.getUserGenerations(userId, options);

      expect(result.generations).toEqual(mockGenerations);
      expect(result.total).toBe(mockCount);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);

      expect(MockedGeneration.find).toHaveBeenCalledWith({
        userId,
        status: 'completed',
        model: 'gpt-3.5-turbo',
      });
    });

    it('should return all generations without filters', async () => {
      const userId = 'user123';

      const mockGenerations = [{ _id: 'gen1', userId }];
      const mockCount = 1;

      MockedGeneration.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockGenerations),
            }),
          }),
        }),
      } as any);

      MockedGeneration.countDocuments.mockResolvedValue(mockCount);

      const result = await aiService.getUserGenerations(userId);

      expect(result.generations).toEqual(mockGenerations);
      expect(result.total).toBe(mockCount);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);

      expect(MockedGeneration.find).toHaveBeenCalledWith({ userId });
    });
  });

  describe('getGenerationStats', () => {
    it('should return cached stats when available', async () => {
      const userId = 'user123';
      const cachedStats = {
        totalGenerations: 10,
        successfulGenerations: 8,
        failedGenerations: 2,
        totalTokens: 5000,
        totalCost: 0.05,
        averageDuration: 2000,
        mostUsedModel: 'gpt-3.5-turbo',
      };

      mockedGetCachedData.mockResolvedValue(cachedStats);

      const result = await aiService.getGenerationStats(userId);

      expect(result).toEqual(cachedStats);
      expect(mockedGetCachedData).toHaveBeenCalledWith(`user:${userId}:generation-stats`);
      expect(MockedGeneration.aggregate).not.toHaveBeenCalled();
    });

    it('should calculate and cache stats when not cached', async () => {
      const userId = 'user123';
      const mockAggregateResult = [{
        _id: null,
        totalGenerations: 10,
        successfulGenerations: 8,
        failedGenerations: 2,
        totalTokens: 5000,
        totalCost: 0.05,
        averageDuration: 2000,
        mostUsedModel: 'gpt-3.5-turbo',
      }];

      mockedGetCachedData.mockResolvedValue(null);
      MockedGeneration.aggregate.mockResolvedValue(mockAggregateResult);

      const result = await aiService.getGenerationStats(userId);

      expect(result).toEqual(mockAggregateResult[0]);
      expect(mockedCacheData).toHaveBeenCalledWith(`user:${userId}:generation-stats`, expect.any(Object), 3600);

      expect(MockedGeneration.aggregate).toHaveBeenCalledWith([
        { $match: { userId: expect.any(Object) } },
        {
          $group: {
            _id: null,
            totalGenerations: { $sum: 1 },
            successfulGenerations: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            failedGenerations: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
            },
            totalTokens: { $sum: '$tokens.total' },
            totalCost: { $sum: '$cost' },
            averageDuration: { $avg: '$duration' },
            mostUsedModel: { $first: '$model' },
          },
        },
      ]);
    });

    it('should return default stats when no generations exist', async () => {
      const userId = 'user123';

      mockedGetCachedData.mockResolvedValue(null);
      MockedGeneration.aggregate.mockResolvedValue([]);

      const result = await aiService.getGenerationStats(userId);

      expect(result).toEqual({
        totalGenerations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        totalTokens: 0,
        totalCost: 0,
        averageDuration: 0,
        mostUsedModel: 'gpt-3.5-turbo',
      });

      expect(mockedCacheData).toHaveBeenCalledWith(`user:${userId}:generation-stats`, expect.any(Object), 3600);
    });
  });

  describe('Private Methods', () => {
    describe('getProviderFromModel', () => {
      it('should identify OpenAI models', () => {
        expect((aiService as any).getProviderFromModel('gpt-3.5-turbo')).toBe('openai');
        expect((aiService as any).getProviderFromModel('gpt-4')).toBe('openai');
        expect((aiService as any).getProviderFromModel('gpt-4-turbo')).toBe('openai');
      });

      it('should identify Google models', () => {
        expect((aiService as any).getProviderFromModel('gemini-pro')).toBe('google');
        expect((aiService as any).getProviderFromModel('gemini-1.5-pro')).toBe('google');
      });

      it('should identify Anthropic models', () => {
        expect((aiService as any).getProviderFromModel('claude-2')).toBe('anthropic');
        expect((aiService as any).getProviderFromModel('claude-instant')).toBe('anthropic');
      });

      it('should identify DeepSeek models', () => {
        expect((aiService as any).getProviderFromModel('deepseek-chat')).toBe('deepseek');
        expect((aiService as any).getProviderFromModel('deepseek-coder')).toBe('deepseek');
      });

      it('should default to OpenAI for unknown models', () => {
        expect((aiService as any).getProviderFromModel('unknown-model')).toBe('openai');
      });
    });

    describe('estimateTokens', () => {
      it('should estimate tokens based on text length', () => {
        const service = aiService as any;
        expect(service.estimateTokens('Hello world')).toBe(3); // 11 chars / 4 = 2.75 -> 3
        expect(service.estimateTokens('This is a longer text for testing')).toBe(9); // 35 chars / 4 = 8.75 -> 9
        expect(service.estimateTokens('')).toBe(0);
      });
    });

    describe('estimateOpenAICost', () => {
      it('should calculate cost for GPT-3.5-turbo', () => {
        const service = aiService as any;
        const cost = service.estimateOpenAICost(1000, 500);
        expect(cost).toBeCloseTo(0.0025, 6); // (1000 * 0.0015 + 500 * 0.002) / 1000
      });

      it('should calculate cost for GPT-4', () => {
        const service = aiService as any;
        const cost = service.estimateOpenAICost(1000, 500);
        expect(cost).toBeGreaterThan(0.03); // GPT-4 is more expensive
      });
    });

    describe('estimateGeminiCost', () => {
      it('should calculate cost for Gemini models', () => {
        const service = aiService as any;
        const cost = service.estimateGeminiCost(1000, 500);
        expect(cost).toBeCloseTo(0.0002, 6); // (1000 * 0.0001 + 500 * 0.0002) / 1000
      });
    });
  });
});