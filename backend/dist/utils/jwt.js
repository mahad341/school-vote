import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User.js';
export class JWTService {
    /**
     * Generate access and refresh token pair for a user
     */
    static generateTokenPair(user) {
        const payload = {
            userId: user.id,
            studentId: user.studentId,
            role: user.role,
            permissions: this.getUserPermissions(user.role),
        };
        const accessToken = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRES,
        });
        const refreshToken = jwt.sign({ userId: user.id }, this.REFRESH_TOKEN_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRES });
        return { accessToken, refreshToken };
    }
    /**
     * Generate only access token (for token refresh)
     */
    static generateAccessToken(user) {
        const payload = {
            userId: user.id,
            studentId: user.studentId,
            role: user.role,
            permissions: this.getUserPermissions(user.role),
        };
        return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRES,
        });
    }
    /**
     * Verify and decode access token
     */
    static verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET);
            return decoded;
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Token has expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid token');
            }
            throw new Error('Token verification failed');
        }
    }
    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET);
            return decoded;
        }
        catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Refresh token has expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            throw new Error('Refresh token verification failed');
        }
    }
    /**
     * Extract token from Authorization header
     */
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    /**
     * Get user permissions based on role
     */
    static getUserPermissions(role) {
        switch (role) {
            case UserRole.ICT_ADMIN:
                return [
                    'system_admin',
                    'manage_users',
                    'manage_admins',
                    'manage_posts',
                    'manage_candidates',
                    'view_results',
                    'manage_system',
                    'backup_system',
                    'restore_system',
                    'reset_system',
                    'view_audit_logs',
                    'manage_settings',
                ];
            case UserRole.ADMIN:
                return [
                    'manage_posts',
                    'manage_candidates',
                    'view_results',
                    'manage_users',
                    'import_users',
                    'view_audit_logs',
                ];
            case UserRole.STUDENT:
                return [
                    'vote',
                    'view_profile',
                    'view_candidates',
                    'view_own_votes',
                ];
            default:
                return [];
        }
    }
    /**
     * Check if user has specific permission
     */
    static hasPermission(userPermissions, requiredPermission) {
        return userPermissions.includes(requiredPermission);
    }
    /**
     * Check if user has any of the required permissions
     */
    static hasAnyPermission(userPermissions, requiredPermissions) {
        return requiredPermissions.some(permission => userPermissions.includes(permission));
    }
    /**
     * Check if user has all required permissions
     */
    static hasAllPermissions(userPermissions, requiredPermissions) {
        return requiredPermissions.every(permission => userPermissions.includes(permission));
    }
    /**
     * Get token expiration time in seconds
     */
    static getAccessTokenExpiration() {
        // Parse expires in string (e.g., '24h' -> 86400 seconds)
        const expiresIn = this.ACCESS_TOKEN_EXPIRES;
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return 86400; // Default 24 hours
        const value = parseInt(match[1]);
        const unit = match[2];
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 86400;
        }
    }
}
JWTService.ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
JWTService.REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';
JWTService.ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';
JWTService.REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
