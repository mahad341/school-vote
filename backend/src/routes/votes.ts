import { Router } from 'express';
import { VoteController, voteRoutesMiddleware } from '../controllers/VoteController.js';
import { voteLimiter } from '../middleware/rateLimit.js';

const router = Router();

// POST /api/votes - Cast a vote (authenticated users only)
router.post('/', voteLimiter, voteRoutesMiddleware.castVote, VoteController.castVote);

// GET /api/votes/my-votes - Get current user's votes
router.get('/my-votes', voteRoutesMiddleware.getMyVotes, VoteController.getMyVotes);

// GET /api/votes/post/:postId - Get votes for a specific post (admin/ICT admin only)
router.get('/post/:postId', voteRoutesMiddleware.getVotesByPost, VoteController.getVotesByPost);

// GET /api/votes/candidate/:candidateId - Get votes for a specific candidate (admin/ICT admin only)
router.get('/candidate/:candidateId', voteRoutesMiddleware.getVotesByCandidate, VoteController.getVotesByCandidate);

// PUT /api/votes/:id/verify - Verify a vote (admin/ICT admin only)
router.put('/:id/verify', voteRoutesMiddleware.verifyVote, VoteController.verifyVote);

// PUT /api/votes/:id/invalidate - Invalidate a vote (admin/ICT admin only)
router.put('/:id/invalidate', voteRoutesMiddleware.invalidateVote, VoteController.invalidateVote);

// GET /api/votes/stats - Get voting statistics (admin/ICT admin only)
router.get('/stats', voteRoutesMiddleware.getVotingStats, VoteController.getVotingStats);

// GET /api/votes/verify/:hash - Verify vote by hash (public endpoint for transparency)
router.get('/verify/:hash', voteRoutesMiddleware.verifyVoteByHash, VoteController.verifyVoteByHash);

export default router;