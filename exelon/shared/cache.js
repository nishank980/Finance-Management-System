const redis = require('./redis');

// In-memory cache
const memoryCache = new Map();
const MEMORY_TTL = 60000; // 1 minute

class Cache {
  static async get(key) {
    // Check in-memory cache first
    const memoryData = memoryCache.get(key);
    if (memoryData && Date.now() < memoryData.expires) {
      return memoryData.value;
    }
    
    // Check Redis cache
    try {
      const redisData = await redis.get(key);
      if (redisData) {
        // Store in memory cache
        memoryCache.set(key, {
          value: redisData,
          expires: Date.now() + MEMORY_TTL
        });
        return redisData;
      }
    } catch (error) {
      console.error('Redis error:', error.message);
    }
    
    return null;
  }
  
  static async set(key, value, ttl = 300) {
    // Store in memory cache
    memoryCache.set(key, {
      value,
      expires: Date.now() + MEMORY_TTL
    });
    
    // Store in Redis cache
    try {
      await redis.setEx(key, ttl, value);
    } catch (error) {
      console.error('Redis error:', error.message);
    }
  }
  
  static async del(key) {
    // Delete from memory cache
    memoryCache.delete(key);
    
    // Delete from Redis cache
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis error:', error.message);
    }
  }
}

module.exports = Cache;