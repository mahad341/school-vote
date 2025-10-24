import { Server as SocketServer, Socket } from 'socket.io';
import { getCache, setCache } from './redis.js';
import { VoteService } from '../services/VoteService.js';
import { ElectionPostService } from '../services/ElectionPostService.js';
import { SystemSettingService } from '../services/SystemSettingService.js';

let io: SocketServer;

// Store active connections with metadata
const activeConnections = new Map<string, {
  userId?: string;
  studentId?: string;
  role?: string;
  joinedRooms: string[];
  connectedAt: Date;
}>();

export const initializeSocket = (socketServer: SocketServer): void => {
  io = socketServer;

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Store connection metadata
    activeConnections.set(socket.id, {
      joinedRooms: [],
      connectedAt: new Date()
    });

    // Join voting room for real-time updates
    socket.on('join-voting', (data) => {
      socket.join('voting-room');
      const conn = activeConnections.get(socket.id);
      if (conn && !conn.joinedRooms.includes('voting-room')) {
        conn.joinedRooms.push('voting-room');
      }
      console.log(`👤 ${socket.id} joined voting room`);
    });

    // Join results room for live results
    socket.on('join-results', (data) => {
      socket.join('results-room');
      const conn = activeConnections.get(socket.id);
      if (conn && !conn.joinedRooms.includes('results-room')) {
        conn.joinedRooms.push('results-room');
      }
      console.log(`📊 ${socket.id} joined results room`);
    });

    // Join admin room for admin notifications
    socket.on('join-admin', (data) => {
      socket.join('admin-room');
      const conn = activeConnections.get(socket.id);
      if (conn && !conn.joinedRooms.includes('admin-room')) {
        conn.joinedRooms.push('admin-room');
      }
      console.log(`👑 ${socket.id} joined admin room`);
    });

    // Join specific post room for targeted updates
    socket.on('join-post', (data: { postId: string }) => {
      if (data.postId) {
        const roomName = `post-${data.postId}`;
        socket.join(roomName);
        const conn = activeConnections.get(socket.id);
        if (conn && !conn.joinedRooms.includes(roomName)) {
          conn.joinedRooms.push(roomName);
        }
        console.log(`📋 ${socket.id} joined post room: ${roomName}`);
      }
    });

    // Leave specific post room
    socket.on('leave-post', (data: { postId: string }) => {
      if (data.postId) {
        const roomName = `post-${data.postId}`;
        socket.leave(roomName);
        const conn = activeConnections.get(socket.id);
        if (conn) {
          conn.joinedRooms = conn.joinedRooms.filter(room => room !== roomName);
        }
        console.log(`📋 ${socket.id} left post room: ${roomName}`);
      }
    });

    // Authenticate socket connection
    socket.on('authenticate', (data: { token: string }) => {
      try {
        // This would validate JWT token and associate user with socket
        // For now, just acknowledge
        socket.emit('authenticated', { success: true });
        console.log(`🔐 ${socket.id} authenticated`);
      } catch (error) {
        socket.emit('authentication-error', { message: 'Invalid token' });
      }
    });

    // Request live statistics
    socket.on('request-stats', async () => {
      try {
        const stats = await getLiveStats();
        socket.emit('live-stats', stats);
      } catch (error) {
        socket.emit('stats-error', { message: 'Failed to fetch statistics' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      activeConnections.delete(socket.id);
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

export const emitVoteUpdate = async (postId: string, candidateId: string): Promise<void> => {
  try {
    // Get updated results for the post
    const postService = new ElectionPostService();
    const postResults = await postService.getPostResults(postId);

    // Emit to voting room for real-time status updates
    io.to('voting-room').emit('vote-cast', {
      postId,
      candidateId,
      timestamp: new Date().toISOString(),
      totalVotes: postResults.totalVotes
    });

    // Emit to results room for live results updates
    io.to('results-room').emit('results-update', {
      postId,
      candidateId,
      results: postResults,
      timestamp: new Date().toISOString()
    });

    // Emit to specific post room for targeted updates
    io.to(`post-${postId}`).emit('post-results-update', {
      postId,
      candidateId,
      results: postResults,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Emitted vote update for post ${postId}, candidate ${candidateId}`);
  } catch (error) {
    console.error('❌ Error emitting vote update:', error);
  }
};

export const emitSystemStatus = (status: 'enabled' | 'disabled', message?: string): void => {
  try {
    io.emit('system-status', {
      status,
      message,
      timestamp: new Date().toISOString()
    });

    // Also emit to admin room for admin notifications
    io.to('admin-room').emit('admin-notification', {
      type: 'system-status-change',
      status,
      message,
      timestamp: new Date().toISOString()
    });

    console.log(`📡 Emitted system status: ${status}`);
  } catch (error) {
    console.error('❌ Error emitting system status:', error);
  }
};

export const emitElectionResults = (results: any): void => {
  try {
    io.to('results-room').emit('election-results', {
      results,
      timestamp: new Date().toISOString()
    });

    // Also emit to admin room for admin monitoring
    io.to('admin-room').emit('admin-notification', {
      type: 'election-results-updated',
      results,
      timestamp: new Date().toISOString()
    });

    console.log('📡 Emitted election results update');
  } catch (error) {
    console.error('❌ Error emitting election results:', error);
  }
};

export const emitAdminNotification = (type: string, data: any): void => {
  try {
    io.to('admin-room').emit('admin-notification', {
      type,
      data,
      timestamp: new Date().toISOString()
    });
    console.log(`📡 Emitted admin notification: ${type}`);
  } catch (error) {
    console.error('❌ Error emitting admin notification:', error);
  }
};

export const emitVotingProgress = (postId: string, progress: {
  totalVoters: number;
  votedCount: number;
  percentage: number;
}): void => {
  try {
    io.to('results-room').emit('voting-progress', {
      postId,
      progress,
      timestamp: new Date().toISOString()
    });

    io.to(`post-${postId}`).emit('post-progress', {
      postId,
      progress,
      timestamp: new Date().toISOString()
    });

    console.log(`📊 Emitted voting progress for post ${postId}: ${progress.percentage}%`);
  } catch (error) {
    console.error('❌ Error emitting voting progress:', error);
  }
};

export const getConnectedClients = (): number => {
  return io.sockets.sockets.size;
};

export const getRoomClients = (room: string): string[] => {
  const roomSockets = io.sockets.adapter.rooms.get(room);
  return roomSockets ? Array.from(roomSockets) : [];
};

export const getActiveConnections = () => {
  return Array.from(activeConnections.entries()).map(([socketId, metadata]) => ({
    socketId,
    ...metadata
  }));
};

// Helper function for live statistics
const getLiveStats = async () => {
  try {
    const userService = new (await import('../services/UserService.js')).UserService();
    const postService = new (await import('../services/ElectionPostService.js')).ElectionPostService();

    const [userStats, postStats] = await Promise.all([
      userService.getUserStats(),
      postService.getPostStats()
    ]);

    return {
      connectedClients: getConnectedClients(),
      activeRooms: {
        voting: getRoomClients('voting-room').length,
        results: getRoomClients('results-room').length,
        admin: getRoomClients('admin-room').length
      },
      userStats,
      postStats,
      totalVotes: 0, // Will be implemented in VoteService
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting live stats:', error);
    return {
      connectedClients: getConnectedClients(),
      error: 'Failed to fetch statistics'
    };
  }
};