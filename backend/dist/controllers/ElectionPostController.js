import { ElectionPostService } from '../services/ElectionPostService.js';
import { AuthMiddleware } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
export class ElectionPostController {
    /**
     * GET /api/posts
     * Get all election posts
     */
    static async getAllPosts(req, res) {
        try {
            const { status, type, page, limit } = req.query;
            const service = new ElectionPostService();
            const result = await service.getPosts({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
                status: status,
                type: type,
                includeCandidates: true,
            });
            res.json({
                success: true,
                data: result.posts,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch posts';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/posts/:id
     * Get election post by ID
     */
    static async getPostById(req, res) {
        try {
            const { id } = req.params;
            const service = new ElectionPostService();
            const post = await service.getPostById(id, { includeCandidates: true });
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: 'Election post not found',
                });
            }
            res.json({
                success: true,
                data: post,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch post';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/posts
     * Create new election post (admin/ICT admin only)
     */
    static async createPost(req, res) {
        try {
            const postData = req.body;
            const createdBy = req.user.id;
            const service = new ElectionPostService();
            const post = await service.createPost(postData, createdBy);
            res.status(201).json({
                success: true,
                message: 'Election post created successfully',
                data: post,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create post';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/posts/:id
     * Update election post (admin/ICT admin only)
     */
    static async updatePost(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedBy = req.user.id;
            const service = new ElectionPostService();
            const post = await service.updatePost(id, updateData, updatedBy);
            res.json({
                success: true,
                message: 'Election post updated successfully',
                data: post,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update post';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * DELETE /api/posts/:id
     * Delete election post (admin/ICT admin only)
     */
    static async deletePost(req, res) {
        try {
            const { id } = req.params;
            const deletedBy = req.user.id;
            const service = new ElectionPostService();
            await service.deletePost(id, deletedBy);
            res.json({
                success: true,
                message: 'Election post deleted successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete post';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/posts/:id/status
     * Activate/deactivate election post (admin/ICT admin only)
     */
    static async updatePostStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updatedBy = req.user.id;
            const service = new ElectionPostService();
            const post = await service.setPostStatus(id, status, updatedBy);
            res.json({
                success: true,
                message: `Election post ${status} successfully`,
                data: post,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update post status';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/posts/:id/results
     * Get election results for a post
     */
    static async getPostResults(req, res) {
        try {
            const { id } = req.params;
            const service = new ElectionPostService();
            const results = await service.getPostResults(id);
            res.json({
                success: true,
                data: results,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch results';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
// Middleware combinations for routes
export const postRoutesMiddleware = {
    getAll: [],
    getById: [],
    create: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    update: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    delete: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    updateStatus: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    getResults: [],
};
