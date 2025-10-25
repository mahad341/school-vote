import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<void> => {
  try {
    // Use REDIS_URL if available (Render provides this), otherwise fallback to individual config
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      redisClient = createClient({
        url: redisUrl,
      });
    } else {
      redisClient = createClient({
        password: process.env.REDIS_PASSWORD || undefined,
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          connectTimeout: 60000,
        },
      });
    }

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔴 Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('🔴 Redis client ready');
    });

    redisClient.on('end', () => {
      console.log('🔴 Redis client disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    // Don't exit process, allow app to continue without Redis
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.disconnect();
      console.log('🔴 Redis client disconnected');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from Redis:', error);
  }
};

// Cache helper functions
export const setCache = async (key: string, value: any, ttl?: number): Promise<void> => {
  try {
    const serializedValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, serializedValue);
    } else {
      await redisClient.set(key, serializedValue);
    }
  } catch (error) {
    console.error('❌ Error setting cache:', error);
  }
};

export const getCache = async (key: string): Promise<any> => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('❌ Error getting cache:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('❌ Error deleting cache:', error);
  }
};

export const clearCache = async (): Promise<void> => {
  try {
    await redisClient.flushAll();
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};