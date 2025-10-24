import { Router } from 'express';
import { RealtimeController, realtimeRoutesMiddleware } from '../controllers/RealtimeController.js';

const router = Router();

// GET /api/realtime/stats - Get real-time connection statistics (admin only)
router.get('/stats', realtimeRoutesMiddleware.getStats, RealtimeController.getRealtimeStats);

// GET /api/realtime/results/:postId - Get live results for a specific post
router.get('/results/:postId', realtimeRoutesMiddleware.getLiveResults, RealtimeController.getLiveResults);

// GET /api/realtime/all-results - Get live results for all active posts
router.get('/all-results', realtimeRoutesMiddleware.getAllLiveResults, RealtimeController.getAllLiveResults);

// POST /api/realtime/broadcast-results - Manually broadcast results update (admin only)
router.post('/broadcast-results', realtimeRoutesMiddleware.broadcastResults, RealtimeController.broadcastResults);

// GET /api/realtime/voting-status - Get current voting status for all posts
router.get('/voting-status', realtimeRoutesMiddleware.getVotingStatus, RealtimeController.getVotingStatus);

export default router;