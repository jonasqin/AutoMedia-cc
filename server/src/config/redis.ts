import { createClient } from 'redis';

let redisClient: any;

export const connectRedis = async (): Promise<any> => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err: any) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('reconnecting', () => {
      console.log('⚠️ Redis reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
};

export const getRedisClient = (): any => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      console.log('✅ Redis connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing Redis connection:', error);
  }
};

// Utility functions for common Redis operations
export const cacheData = async (key: string, data: any, ttl: number = 3600): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('❌ Error caching data:', error);
  }
};

export const getCachedData = async (key: string): Promise<any> => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('❌ Error getting cached data:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('❌ Error deleting cache:', error);
  }
};

export const incrementCounter = async (key: string, ttl: number = 3600): Promise<number> => {
  try {
    const client = getRedisClient();
    const result = await client.incr(key);
    if (result === 1) {
      await client.expire(key, ttl);
    }
    return result;
  } catch (error) {
    console.error('❌ Error incrementing counter:', error);
    return 0;
  }
};