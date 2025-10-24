import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../utils/jwt.js';
import { User, UserRole } from '../models/User.js';
import { AppDataSource } from '../config/database.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  tokenPayload?: JWTPayload;
}

// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      user?: User;
      tokenPayload?: JWTPayload;
    }
  }
}

export class AuthMiddleware {
  /**
   * Authenticate JWT token and attach user to request
   */
  static authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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
        where: { id: payload.userId, status: 'active' as any }
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
    } catch (error) {
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
  static requireRole = (...allowedRoles: UserRole[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
  static requirePermission = (...requiredPermissions: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
  static requireAllPermissions = (...requiredPermissions: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
  static optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = JWTService.extractTokenFromHeader(authHeader);

      if (token) {
        const payload = JWTService.verifyAccessToken(token);

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
          where: { id: payload.userId, status: 'active' as any }
        });

        if (user) {
          req.user = user;
          req.tokenPayload = payload;
        }
      }

      next();
    } catch (error) {
      // Ignore authentication errors for optional auth
      next();
    }
  };

  /**
   * Check if user is the resource owner or has admin permissions
   */
  static isOwnerOrAdmin = (resourceUserId: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
  static authRateLimit = (req: Request, res: Response, next: NextFunction): void => {
    // This would be implemented with express-rate-limit
    // For now, just pass through
    next();
  };

  /**
   * Predefined middleware combinations
   */
  static readonly studentOnly = [this.authenticate, this.requireRole(UserRole.STUDENT)];
  static readonly adminOnly = [this.authenticate, this.requireRole(UserRole.ADMIN)];
  static readonly ictAdminOnly = [this.authenticate, this.requireRole(UserRole.ICT_ADMIN)];
  static readonly adminOrHigher = [this.authenticate, this.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)];
  static readonly anyAuthenticated = [this.authenticate];
}