import rateLimit from 'express-rate-limit';
// General API rate limiting
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Stricter rate limiting for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiting for voting endpoints
export const voteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // limit each IP to 3 votes per minute
    message: {
        success: false,
        message: 'Too many voting attempts, please wait before trying again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiting for file uploads
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: {
        success: false,
        message: 'Too many file uploads, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Create account limiter (stricter for registration)
export const createAccountLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 account creations per hour
    message: {
        success: false,
        message: 'Too many account creation attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Password reset limiter
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Admin operations limiter (more restrictive)
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 admin operations per windowMs
    message: {
        success: false,
        message: 'Too many admin operations, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Custom middleware to apply different limits based on user role
export const dynamicRateLimit = (req, res, next) => {
    // If user is authenticated and is admin/ICT admin, use admin limits
    if (req.user && (req.user.role === 'admin' || req.user.role === 'ict_admin')) {
        return adminLimiter(req, res, next);
    }
    // Otherwise use standard API limits
    return apiLimiter(req, res, next);
};
