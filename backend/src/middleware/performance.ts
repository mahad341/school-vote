import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../config/redis.js';

/**
 * Response caching middleware
 */
export const cacheMiddleware = (duration: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated requests that might contain sensitive data
    if (req.headers.authorization) {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cachedResponse = await getCache(cacheKey);
      
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache response
      res.json = function(data: any) {
        // Cache the response
        setCache(cacheKey, JSON.stringify(data), duration).catch(error => {
          console.warn('Failed to cache response:', error);
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.warn('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Request timing middleware
 */
export const timingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });

  next();
};

/**
 * Response compression for JSON
 */
export const jsonCompressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function(data: any) {
    // Add compression headers for large responses
    const jsonString = JSON.stringify(data);
    if (jsonString.length > 1024) { // 1KB threshold
      res.setHeader('Content-Encoding', 'gzip');
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Database connection pooling optimization
 */
export const dbOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add database query optimization hints
  req.dbHints = {
    useReadReplica: req.method === 'GET',
    enableQueryCache: true,
    maxQueryTime: 5000, // 5 seconds
  };

  next();
};

/**
 * Memory usage monitoring
 */
export const memoryMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const memUsage = process.memoryUsage();
  
  // Log memory warnings
  if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
    console.warn(`High memory usage detected: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }

  // Add memory info to response headers in development
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Memory-Usage', Math.round(memUsage.heapUsed / 1024 / 1024));
  }

  next();
};

/**
 * Request size limiting
 */
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');

    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        maxSize: `${maxSize / 1024 / 1024}MB`,
      });
    }

    next();
  };
};

/**
 * Query optimization middleware
 */
export const queryOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add query optimization hints based on request patterns
  const { page, limit } = req.query;

  // Limit pagination to reasonable values
  if (page && parseInt(page as string) > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Page number too high. Maximum allowed: 1000',
    });
  }

  if (limit && parseInt(limit as string) > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit too high. Maximum allowed: 100',
    });
  }

  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      dbHints?: {
        useReadReplica: boolean;
        enableQueryCache: boolean;
        maxQueryTime: number;
      };
    }
  }
}