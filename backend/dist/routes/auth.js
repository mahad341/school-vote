import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../utils/auth.js';
import { AuthMiddleware } from '../middleware/auth.js';
import { JWTService } from '../utils/jwt.js';
import { authLimiter } from '../middleware/rateLimit.js';
const router = Router();
// Input validation middleware
const loginValidation = [
    body()
        .custom((value, { req }) => {
        if (!req.body.studentId && !req.body.username) {
            throw new Error('Either studentId or username is required');
        }
        return true;
    }),
    body('studentId')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Student ID must be between 3 and 20 characters'),
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters'),
];
const changePasswordValidation = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
];
/**
  * POST /api/auth/login
  * Login user with credentials
  */
router.post('/login', authLimiter, loginValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }
        const credentials = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        const result = await AuthService.login(credentials, ipAddress, userAgent);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: result.user.id,
                    studentId: result.user.studentId,
                    firstName: result.user.firstName,
                    lastName: result.user.lastName,
                    email: result.user.email,
                    role: result.user.role,
                    house: result.user.house,
                    class: result.user.class,
                    hasVoted: result.user.hasVoted,
                    lastLoginAt: result.user.lastLoginAt,
                },
                tokens: result.tokens,
                expiresIn: JWTService.getAccessTokenExpiration(),
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        res.status(401).json({
            success: false,
            message
        });
    }
});
/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
            return;
        }
        const tokens = await AuthService.refreshToken(refreshToken);
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                tokens,
                expiresIn: JWTService.getAccessTokenExpiration(),
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Token refresh failed';
        res.status(401).json({
            success: false,
            message
        });
    }
});
/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', AuthMiddleware.authenticate, async (req, res) => {
    try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        await AuthService.logout(req.user.id, ipAddress, userAgent);
        res.json({
            success: true,
            message: 'Logout successful'
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Logout failed';
        res.status(500).json({
            success: false,
            message
        });
    }
});
/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', AuthMiddleware.authenticate, changePasswordValidation, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        await AuthService.changePassword(req.user.id, currentPassword, newPassword);
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Password change failed';
        res.status(400).json({
            success: false,
            message
        });
    }
});
/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', AuthMiddleware.authenticate, async (req, res) => {
    try {
        const user = await AuthService.getCurrentUser(req.user.id);
        res.json({
            success: true,
            data: {
                id: user.id,
                studentId: user.studentId,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                house: user.house,
                class: user.class,
                hasVoted: user.hasVoted,
                lastLoginAt: user.lastLoginAt,
                votedAt: user.votedAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get user profile';
        res.status(404).json({
            success: false,
            message
        });
    }
});
export default router;
