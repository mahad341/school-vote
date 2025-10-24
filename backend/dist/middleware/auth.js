var _a;
import { JWTService } from '../utils/jwt.js';
import { User, UserRole } from '../models/User.js';
import { AppDataSource } from '../config/database.js';
export class AuthMiddleware {
}
_a = AuthMiddleware;
/**
 * Authenticate JWT token and attach user to request
 */
AuthMiddleware.authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTService.extractTokenFromHeader(authHeader);
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
            return;
        }
        // Verify token
        const payload = JWTService.verifyAccessToken(token);
        // Get user from database
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { id: payload.userId, status: 'active' }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
            return;
        }
        // Attach user and token payload to request
        req.user = user;
        req.tokenPayload = payload;
        next();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        res.status(401).json({
            success: false,
            message
        });
    }
};
/**
 * Require specific role(s)
 */
AuthMiddleware.requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
            return;
        }
        next();
    };
};
/**
 * Require specific permission(s)
 */
AuthMiddleware.requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.tokenPayload) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const userPermissions = req.tokenPayload.permissions;
        if (!JWTService.hasAnyPermission(userPermissions, requiredPermissions)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                requiredPermissions,
                userPermissions
            });
            return;
        }
        next();
    };
};
/**
 * Require all specified permissions
 */
AuthMiddleware.requireAllPermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.tokenPayload) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        const userPermissions = req.tokenPayload.permissions;
        if (!JWTService.hasAllPermissions(userPermissions, requiredPermissions)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions - all permissions required',
                requiredPermissions,
                userPermissions
            });
            return;
        }
        next();
    };
};
/**
 * Optional authentication - doesn't fail if no token provided
 */
AuthMiddleware.optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = JWTService.extractTokenFromHeader(authHeader);
        if (token) {
            const payload = JWTService.verifyAccessToken(token);
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: payload.userId, status: 'active' }
            });
            if (user) {
                req.user = user;
                req.tokenPayload = payload;
            }
        }
        next();
    }
    catch (error) {
        // Ignore authentication errors for optional auth
        next();
    }
};
/**
 * Check if user is the resource owner or has admin permissions
 */
AuthMiddleware.isOwnerOrAdmin = (resourceUserId) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        // Allow if user is the owner
        if (req.user.id === resourceUserId) {
            next();
            return;
        }
        // Allow if user has admin or ICT admin role
        if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.ICT_ADMIN) {
            next();
            return;
        }
        res.status(403).json({
            success: false,
            message: 'Access denied - not the owner or admin'
        });
    };
};
/**
 * Rate limiting for authentication endpoints
 */
AuthMiddleware.authRateLimit = (req, res, next) => {
    // This would be implemented with express-rate-limit
    // For now, just pass through
    next();
};
/**
 * Predefined middleware combinations
 */
AuthMiddleware.studentOnly = [_a.authenticate, _a.requireRole(UserRole.STUDENT)];
AuthMiddleware.adminOnly = [_a.authenticate, _a.requireRole(UserRole.ADMIN)];
AuthMiddleware.ictAdminOnly = [_a.authenticate, _a.requireRole(UserRole.ICT_ADMIN)];
AuthMiddleware.adminOrHigher = [_a.authenticate, _a.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)];
AuthMiddleware.anyAuthenticated = [_a.authenticate];
