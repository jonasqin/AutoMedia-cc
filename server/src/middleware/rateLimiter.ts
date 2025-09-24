import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { createError } from './errorHandler';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Connect to Redis
redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

redisClient.connect().catch((err) => {
  console.error('Redis connection error:', err);
});

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const createRateLimiter = (config: RateLimitConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = config.keyGenerator ? config.keyGenerator(req) : req.ip;
      const windowStart = Math.floor(Date.now() / config.windowMs);
      const redisKey = `rate_limit:${key}:${windowStart}`;

      const current = await redisClient.incr(redisKey);

      if (current === 1) {
        await redisClient.expire(redisKey, Math.ceil(config.windowMs / 1000));
      }

      const remaining = Math.max(0, config.maxRequests - current);
      const resetTime = windowStart * config.windowMs + config.windowMs;

      res.set({
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      });

      if (current > config.maxRequests) {
        throw createError('Too many requests', 429);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// General API rate limiter
export const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // limit each IP to 100 requests per windowMs
});

// Authentication rate limiter
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // limit each IP to 5 auth requests per windowMs
});

// AI generation rate limiter
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // limit each user to 50 AI requests per hour
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || req.ip;
    return `ai_limit:${userId}`;
  },
});

// Twitter API rate limiter
export const twitterRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 300, // Twitter API v2 limit
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || req.ip;
    return `twitter_limit:${userId}`;
  },
});

// File upload rate limiter
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // limit each user to 20 uploads per hour
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || req.ip;
    return `upload_limit:${userId}`;
  },
});