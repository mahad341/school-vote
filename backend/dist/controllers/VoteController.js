import { VoteService } from '../services/VoteService.js';
import { AuthMiddleware } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
export class VoteController {
    /**
     * POST /api/votes
     * Cast a vote (authenticated users only)
     */
    static async castVote(req, res) {
        try {
            const { postId, candidateId } = req.body;
            const voterId = req.user.id;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            const service = new VoteService();
            const vote = await service.castVote({
                voterId,
                postId,
                candidateId,
                ipAddress,
                userAgent,
            });
            res.status(201).json({
                success: true,
                message: 'Vote cast successfully',
                data: {
                    id: vote.id,
                    postId: vote.postId,
                    candidateId: vote.candidateId,
                    status: vote.status,
                    createdAt: vote.createdAt,
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to cast vote';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/votes/my-votes
     * Get current user's votes
     */
    static async getMyVotes(req, res) {
        try {
            const userId = req.user.id;
            const service = new VoteService();
            const votes = await service.getUserVotes(userId);
            res.json({
                success: true,
                data: votes,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch votes';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/votes/post/:postId
     * Get votes for a specific post (admin/ICT admin only)
     */
    static async getVotesByPost(req, res) {
        try {
            const { postId } = req.params;
            const { page, limit } = req.query;
            const service = new VoteService();
            const result = await service.getVotesByPost(postId, {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50,
            });
            res.json({
                success: true,
                data: result.votes,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch votes';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/votes/candidate/:candidateId
     * Get votes for a specific candidate (admin/ICT admin only)
     */
    static async getVotesByCandidate(req, res) {
        try {
            const { candidateId } = req.params;
            const { page, limit } = req.query;
            const service = new VoteService();
            const result = await service.getVotesByCandidate(candidateId, {
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50,
            });
            res.json({
                success: true,
                data: result.votes,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch votes';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/votes/:id/verify
     * Verify a vote (admin/ICT admin only)
     */
    static async verifyVote(req, res) {
        try {
            const { id } = req.params;
            const verifiedBy = req.user.id;
            const service = new VoteService();
            const vote = await service.verifyVote(id, verifiedBy);
            res.json({
                success: true,
                message: 'Vote verified successfully',
                data: vote,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to verify vote';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/votes/:id/invalidate
     * Invalidate a vote (admin/ICT admin only)
     */
    static async invalidateVote(req, res) {
        try {
            const { id } = req.params;
            const invalidatedBy = req.user.id;
            const { reason } = req.body;
            const service = new VoteService();
            const vote = await service.invalidateVote(id, invalidatedBy, reason);
            res.json({
                success: true,
                message: 'Vote invalidated successfully',
                data: vote,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to invalidate vote';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/votes/stats
     * Get voting statistics (admin/ICT admin only)
     */
    static async getVotingStats(req, res) {
        try {
            const service = new VoteService();
            const stats = await service.getVotingStats();
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch voting stats';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/votes/verify/:hash
     * Verify vote by hash (public endpoint for transparency)
     */
    static async verifyVoteByHash(req, res) {
        try {
            const { hash } = req.params;
            const service = new VoteService();
            const vote = await service.verifyVoteByHash(hash);
            if (!vote) {
                return res.status(404).json({
                    success: false,
                    message: 'Vote not found',
                });
            }
            res.json({
                success: true,
                data: {
                    id: vote.id,
                    postId: vote.postId,
                    candidateId: vote.candidateId,
                    status: vote.status,
                    createdAt: vote.createdAt,
                    verified: vote.status === 'verified',
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to verify vote';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
// Middleware combinations for routes
export const voteRoutesMiddleware = {
    castVote: [AuthMiddleware.authenticate],
    getMyVotes: [AuthMiddleware.authenticate],
    getVotesByPost: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    getVotesByCandidate: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    verifyVote: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    invalidateVote: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    getVotingStats: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    verifyVoteByHash: [],
};
