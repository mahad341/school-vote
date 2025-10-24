import { Request, Response } from 'express';
import { ElectionPostService } from '../services/ElectionPostService.js';
import { VoteService } from '../services/VoteService.js';
import { AuthMiddleware } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { getConnectedClients, getRoomClients, emitElectionResults } from '../config/socket.js';

export class RealtimeController {
  /**
   * GET /api/realtime/stats
   * Get real-time connection statistics
   */
  static async getRealtimeStats(req: Request, res: Response) {
    try {
      const totalClients = getConnectedClients();
      const votingRoomClients = getRoomClients('voting-room').length;
      const resultsRoomClients = getRoomClients('results-room').length;

      res.json({
        success: true,
        data: {
          totalConnectedClients: totalClients,
          votingRoomClients,
          resultsRoomClients,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch realtime stats';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * GET /api/realtime/results/:postId
   * Get live results for a specific post
   */
  static async getLiveResults(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const service = new ElectionPostService();
      const results = await service.getPostResults(postId);

      res.json({
        success: true,
        data: {
          ...results,
          isLive: true,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch live results';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * GET /api/realtime/all-results
   * Get live results for all active posts
   */
  static async getAllLiveResults(req: Request, res: Response) {
    try {
      const postService = new ElectionPostService();
      const voteService = new VoteService();

      // Get all active posts
      const posts = await postService.getPosts({ status: 'active' as any, includeCandidates: true });

      // Get results for each post
      const resultsPromises = posts.posts.map(async (post) => {
        try {
          const results = await postService.getPostResults(post.id);
          return results;
        } catch (error) {
          console.warn(`Failed to get results for post ${post.id}:`, error);
          return null;
        }
      });

      const results = (await Promise.all(resultsPromises)).filter(result => result !== null);

      res.json({
        success: true,
        data: {
          results,
          totalPosts: posts.posts.length,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch all live results';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * POST /api/realtime/broadcast-results
   * Manually broadcast results update (admin only)
   */
  static async broadcastResults(req: Request, res: Response) {
    try {
      const { postId, message } = req.body;

      if (postId) {
        // Broadcast specific post results
        const service = new ElectionPostService();
        const results = await service.getPostResults(postId);

        await emitElectionResults({
          postId,
          action: 'manual_broadcast',
          results,
          message,
        });
      } else {
        // Broadcast all results
        const service = new ElectionPostService();
        const posts = await service.getPosts({ status: 'active' as any });

        await emitElectionResults({
          action: 'manual_broadcast_all',
          message,
          totalActivePosts: posts.posts.length,
        });
      }

      res.json({
        success: true,
        message: 'Results broadcast successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to broadcast results';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * GET /api/realtime/voting-status
   * Get current voting status for all posts
   */
  static async getVotingStatus(req: Request, res: Response) {
    try {
      const service = new ElectionPostService();
      const posts = await service.getPosts({ includeCandidates: true });

      const status = posts.posts.map(post => ({
        id: post.id,
        title: post.title,
        status: post.status,
        type: post.type,
        votingStartsAt: post.votingStartsAt,
        votingEndsAt: post.votingEndsAt,
        totalVotes: post.totalVotes,
        candidateCount: post.candidates?.length || 0,
        isVotingOpen: post.isVotingOpen,
        timeUntilStart: null, // TODO: Implement time calculations
        timeUntilEnd: null, // TODO: Implement time calculations
      }));

      res.json({
        success: true,
        data: {
          posts: status,
          summary: {
            totalPosts: status.length,
            activePosts: status.filter(p => p.status === 'active').length,
            completedPosts: status.filter(p => p.status === 'completed').length,
            openForVoting: status.filter(p => p.isVotingOpen).length,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch voting status';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

// Middleware combinations for routes
export const realtimeRoutesMiddleware = {
  getStats: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
  getLiveResults: [],
  getAllLiveResults: [],
  broadcastResults: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
  getVotingStatus: [],
};