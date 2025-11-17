// middleware/cache.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { getRedisClient, CacheService } from '../config/redis';
import { logger } from '../utils/logger';

let cacheService: CacheService | null = null;

async function getCacheService(): Promise<CacheService | null> {
  try {
    if (!cacheService) {
      const client = await getRedisClient();
      cacheService = new CacheService(client);
    }
    return cacheService;
  } catch (error) {
    logger.warn('Redis not available, caching disabled', { error });
    return null;
  }
}

/**
 * Cache middleware for GET requests
 * Usage: app.get('/route', cacheMiddleware(300), handler)
 */
export function cacheMiddleware(ttlSeconds: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cache = await getCacheService();
    if (!cache) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Store original json function
      const originalJson = res.json.bind(res);
      
      // Override json to cache the response
      res.json = function (body: any) {
        cache.set(cacheKey, body, ttlSeconds).catch((err) => {
          logger.error('Failed to cache response', { error: err, key: cacheKey });
        });
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error });
      next();
    }
  };
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const cache = await getCacheService();
  if (cache) {
    await cache.invalidatePattern(`cache:${pattern}`);
  }
}

