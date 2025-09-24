import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Generation, Agent, User } from '../models';
import { cacheData, getCachedData, deleteCache } from '../config/redis';
import { IGeneration } from '../types';

interface AIProvider {
  name: string;
  generate: (prompt: string, options: any) => Promise<string>;
  estimateCost: (inputTokens: number, outputTokens: number) => number;
}

interface AIGenerationOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  context?: string;
  stream?: boolean;
}

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      this.providers.set('openai', {
        name: 'OpenAI',
        generate: this.generateWithOpenAI.bind(this),
        estimateCost: this.estimateOpenAICost.bind(this),
      });
    }

    // Initialize Google Gemini
    if (process.env.GOOGLE_AI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

      this.providers.set('google', {
        name: 'Google',
        generate: this.generateWithGemini.bind(this),
        estimateCost: this.estimateGeminiCost.bind(this),
      });
    }

    // Add more providers as needed
  }

  async generateContent(
    prompt: string,
    userId: string,
    options: AIGenerationOptions & { agentId?: string }
  ): Promise<{ content: string; metadata: any; cost: number; tokens: any }> {
    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt,
      context,
      agentId,
    } = options;

    // Get agent if specified
    let agent: any = null;
    if (agentId) {
      agent = await Agent.findById(agentId);
      if (!agent || agent.userId.toString() !== userId) {
        throw new Error('Agent not found or access denied');
      }
    }

    // Create generation record
    const generation = new Generation({
      userId,
      agentId,
      prompt,
      input: {
        content: prompt,
        context,
        parameters: { model, temperature, maxTokens },
      },
      model,
      provider: this.getProviderFromModel(model),
      status: 'processing',
    });

    await generation.save();

    try {
      const startTime = Date.now();

      // Prepare the full prompt
      let fullPrompt = prompt;
      if (systemPrompt) {
        fullPrompt = `${systemPrompt}\n\n${prompt}`;
      }
      if (context) {
        fullPrompt = `Context: ${context}\n\nTask: ${fullPrompt}`;
      }

      // Get the provider
      const provider = this.getProviderFromModel(model);
      const aiProvider = this.providers.get(provider);

      if (!aiProvider) {
        throw new Error(`AI provider '${provider}' not available`);
      }

      // Generate content
      const content = await aiProvider.generate(fullPrompt, {
        model,
        temperature,
        maxTokens,
        systemPrompt,
      });

      // Calculate cost (simplified)
      const inputTokens = this.estimateTokens(fullPrompt);
      const outputTokens = this.estimateTokens(content);
      const cost = aiProvider.estimateCost(inputTokens, outputTokens);

      // Update generation record
      generation.output = {
        content,
        metadata: {
          provider,
          model,
          temperature,
          maxTokens,
          duration: Date.now() - startTime,
        },
      };
      generation.tokens = {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      };
      generation.cost = cost;
      generation.duration = Date.now() - startTime;
      generation.status = 'completed';

      await generation.save();

      // Update agent usage count
      if (agent) {
        agent.usageCount += 1;
        await agent.save();
      }

      // Clear relevant cache
      await deleteCache(`user:${userId}:generations`);

      return {
        content,
        metadata: generation.output.metadata,
        cost,
        tokens: generation.tokens,
      };
    } catch (error) {
      // Update generation record with error
      generation.status = 'failed';
      generation.error = error.message;
      await generation.save();

      throw error;
    }
  }

  private async generateWithOpenAI(prompt: string, options: AIGenerationOptions): Promise<string> {
    const { model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 1000 } = options;

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  private async generateWithGemini(prompt: string, options: AIGenerationOptions): Promise<string> {
    const { model = 'gemini-pro', temperature = 0.7, maxTokens = 1000 } = options;

    try {
      const geminiModel = this.gemini.getGenerativeModel({ model });
      const result = await geminiModel.generateContent(prompt);

      return result.response.text() || '';
    } catch (error) {
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  private getProviderFromModel(model: string): string {
    if (model.startsWith('gpt')) return 'openai';
    if (model.startsWith('gemini')) return 'google';
    if (model.startsWith('claude')) return 'anthropic';
    if (model.startsWith('deepseek')) return 'deepseek';
    return 'openai'; // Default
  }

  private estimateTokens(text: string): number {
    // Simple token estimation (rough approximation)
    return Math.ceil(text.length / 4);
  }

  private estimateOpenAICost(inputTokens: number, outputTokens: number): number {
    // Simplified cost calculation for OpenAI models
    const rates: Record<string, { input: number; output: number }> = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
    };

    const model = Object.keys(rates).find(key => key.includes('gpt')) || 'gpt-3.5-turbo';
    const rate = rates[model];

    return (inputTokens * rate.input + outputTokens * rate.output) / 1000;
  }

  private estimateGeminiCost(inputTokens: number, outputTokens: number): number {
    // Simplified cost calculation for Gemini models
    return (inputTokens * 0.0001 + outputTokens * 0.0002) / 1000;
  }

  async getAvailableProviders(): Promise<string[]> {
    return Array.from(this.providers.keys());
  }

  async getModelsForProvider(provider: string): Promise<string[]> {
    const models: Record<string, string[]> = {
      openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
      google: ['gemini-pro', 'gemini-1.5-pro'],
      anthropic: ['claude-2', 'claude-instant'],
      deepseek: ['deepseek-chat', 'deepseek-coder'],
    };

    return models[provider] || [];
  }

  async getUserGenerations(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      model?: string;
    } = {}
  ): Promise<{ generations: IGeneration[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, status, model } = options;
    const skip = (page - 1) * limit;

    const query: any = { userId };
    if (status) query.status = status;
    if (model) query.model = model;

    const [generations, total] = await Promise.all([
      Generation.find(query)
        .populate('agentId', 'name type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Generation.countDocuments(query),
    ]);

    return {
      generations,
      total,
      page,
      limit,
    };
  }

  async getGenerationStats(userId: string): Promise<any> {
    const cacheKey = `user:${userId}:generation-stats`;
    const cached = await getCachedData(cacheKey);

    if (cached) {
      return cached;
    }

    const stats = await Generation.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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

    const result = stats[0] || {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalTokens: 0,
      totalCost: 0,
      averageDuration: 0,
      mostUsedModel: 'gpt-3.5-turbo',
    };

    await cacheData(cacheKey, result, 3600); // Cache for 1 hour

    return result;
  }
}

export const aiService = new AIService();