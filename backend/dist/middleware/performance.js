import { getCache, setCache } from '../config/redis.js';
/**
 * Response caching middleware
 */
export const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
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
            res.json = function (data) {
                // Cache the response
                setCache(cacheKey, JSON.stringify(data), duration).catch(error => {
                    console.warn('Failed to cache response:', error);
                });
                // Call original json method
                return originalJson.call(this, data);
            };
            next();
        }
        catch (error) {
            console.warn('Cache middleware error:', error);
            next();
        }
    };
};
/**
 * Request timing middleware
 */
export const timingMiddleware = (req, res, next) => {
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
export const jsonCompressionMiddleware = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
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
export const dbOptimizationMiddleware = (req, res, next) => {
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
export const memoryMonitoringMiddleware = (req, res, next) => {
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
export const requestSizeLimiter = (maxSize = 10 * 1024 * 1024) => {
    return (req, res, next) => {
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
export const queryOptimizationMiddleware = (req, res, next) => {
    // Add query optimization hints based on request patterns
    const { page, limit } = req.query;
    // Limit pagination to reasonable values
    if (page && parseInt(page) > 1000) {
        return res.status(400).json({
            success: false,
            message: 'Page number too high. Maximum allowed: 1000',
        });
    }
    if (limit && parseInt(limit) > 100) {
        return res.status(400).json({
            success: false,
            message: 'Limit too high. Maximum allowed: 100',
        });
    }
    next();
};
