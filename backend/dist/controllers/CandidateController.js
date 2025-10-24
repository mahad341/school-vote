import { CandidateService } from '../services/CandidateService.js';
import { AuthMiddleware } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
export class CandidateController {
    /**
     * GET /api/candidates
     * Get all candidates
     */
    static async getAllCandidates(req, res) {
        try {
            const { postId, status } = req.query;
            const service = new CandidateService();
            const candidates = await service.getCandidates({
                postId: postId,
                status: status,
            });
            res.json({
                success: true,
                data: candidates,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch candidates';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/candidates/:id
     * Get candidate by ID
     */
    static async getCandidateById(req, res) {
        try {
            const { id } = req.params;
            const service = new CandidateService();
            const candidate = await service.getCandidateById(id);
            if (!candidate) {
                return res.status(404).json({
                    success: false,
                    message: 'Candidate not found',
                });
            }
            res.json({
                success: true,
                data: candidate,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch candidate';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/candidates
     * Create new candidate (admin/ICT admin only)
     */
    static async createCandidate(req, res) {
        try {
            const candidateData = req.body;
            const createdBy = req.user.id;
            const service = new CandidateService();
            const candidate = await service.createCandidate(candidateData, createdBy);
            res.status(201).json({
                success: true,
                message: 'Candidate created successfully',
                data: candidate,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create candidate';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/candidates/:id
     * Update candidate (admin/ICT admin only)
     */
    static async updateCandidate(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedBy = req.user.id;
            const service = new CandidateService();
            const candidate = await service.updateCandidate(id, updateData, updatedBy);
            res.json({
                success: true,
                message: 'Candidate updated successfully',
                data: candidate,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update candidate';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * DELETE /api/candidates/:id
     * Delete candidate (admin/ICT admin only)
     */
    static async deleteCandidate(req, res) {
        try {
            const { id } = req.params;
            const deletedBy = req.user.id;
            const service = new CandidateService();
            await service.deleteCandidate(id, deletedBy);
            res.json({
                success: true,
                message: 'Candidate deleted successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete candidate';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/candidates/:id/status
     * Update candidate status (admin/ICT admin only)
     */
    static async updateCandidateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updatedBy = req.user.id;
            const service = new CandidateService();
            const candidate = await service.updateCandidate(id, { status }, updatedBy);
            res.json({
                success: true,
                message: `Candidate ${status} successfully`,
                data: candidate,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update candidate status';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/candidates/:id/photo
     * Upload candidate photo (admin/ICT admin only)
     */
    static async uploadPhoto(req, res) {
        try {
            const { id } = req.params;
            const updatedBy = req.user.id;
            const service = new CandidateService();
            // Note: File upload middleware should be added to handle req.file
            const photoFile = req.file;
            if (!photoFile) {
                return res.status(400).json({
                    success: false,
                    message: 'Photo file is required',
                });
            }
            const candidate = await service.uploadCandidatePhoto(id, photoFile, updatedBy);
            res.json({
                success: true,
                message: 'Photo uploaded successfully',
                data: candidate,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload photo';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/candidates/:id/votes
     * Get vote count for candidate
     */
    static async getCandidateVotes(req, res) {
        try {
            const { id } = req.params;
            const service = new CandidateService();
            const candidate = await service.getCandidateById(id);
            if (!candidate) {
                return res.status(404).json({
                    success: false,
                    message: 'Candidate not found',
                });
            }
            res.json({
                success: true,
                data: { voteCount: candidate.voteCount },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch vote count';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
// Middleware combinations for routes
export const candidateRoutesMiddleware = {
    getAll: [],
    getById: [],
    create: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    update: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    delete: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    updateStatus: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    uploadPhoto: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
    getVotes: [],
};
