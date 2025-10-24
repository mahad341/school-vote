import { AppDataSource } from '../config/database.js';
import { Vote, VoteStatus } from '../models/Vote.js';
import { User } from '../models/User.js';
import { ElectionPost } from '../models/ElectionPost.js';
import { Candidate } from '../models/Candidate.js';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog.js';
import { emitVoteUpdate, emitElectionResults } from '../config/socket.js';
import crypto from 'crypto';

export interface CastVoteData {
  voterId: string;
  postId: string;
  candidateId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class VoteService {
  private voteRepository = AppDataSource.getRepository(Vote);
  private userRepository = AppDataSource.getRepository(User);
  private postRepository = AppDataSource.getRepository(ElectionPost);
  private candidateRepository = AppDataSource.getRepository(Candidate);

  /**
   * Cast a vote
   */
  async castVote(voteData: CastVoteData): Promise<Vote> {
    const { voterId, postId, candidateId, ipAddress, userAgent } = voteData;

    // Verify voter exists and is active
    const voter = await this.userRepository.findOne({
      where: { id: voterId, status: 'active' as any }
    });

    if (!voter) {
      throw new Error('Voter not found or inactive');
    }

    // Check if user has already voted in this post
    const existingVote = await this.voteRepository.findOne({
      where: { userId: voterId, postId }
    });

    if (existingVote) {
      throw new Error('You have already voted in this election post');
    }

    // Verify post exists and is active
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new Error('Election post not found');
    }

    if (post.status !== 'active') {
      throw new Error('Election post is not active for voting');
    }

    // Check voting time window
    const now = new Date();
    if (post.votingStartsAt && now < post.votingStartsAt) {
      throw new Error('Voting has not started yet');
    }

    if (post.votingEndsAt && now > post.votingEndsAt) {
      throw new Error('Voting has ended');
    }

    // Check if user is eligible to vote in this post
    if (!post.canUserVote(voter.house)) {
      throw new Error('You are not eligible to vote in this election post');
    }

    // Verify candidate exists and is active
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId, status: 'active' as any }
    });

    if (!candidate) {
      throw new Error('Candidate not found or not active');
    }

    if (candidate.postId !== postId) {
      throw new Error('Candidate does not belong to this election post');
    }

    // Generate verification hash
    const verificationData = `${voterId}-${postId}-${candidateId}-${Date.now()}`;
    const verificationHash = crypto.createHash('sha256').update(verificationData).digest('hex');

    // Create vote
    const vote = this.voteRepository.create({
      userId: voterId,
      postId,
      candidateId,
      verificationHash,
      ipAddress,
      userAgent,
      metadata: {
        voterHouse: voter.house,
        voterClass: voter.class,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        postTitle: post.title,
      },
    });

    const savedVote = await this.voteRepository.save(vote);

    // Update vote counts
    await this.updateVoteCounts(postId);

    // Update user voting status
    voter.hasVoted = true;
    voter.votedAt = new Date();
    await this.userRepository.save(voter);

    // Emit real-time updates
    await emitVoteUpdate(postId, candidateId);

    // Log the vote
    await this.logAuditEvent({
      action: AuditAction.VOTE_CAST,
      severity: AuditSeverity.MEDIUM,
      description: `Vote cast by ${voter.firstName} ${voter.lastName} for ${candidate.firstName} ${candidate.lastName} in ${post.title}`,
      userId: voterId,
      resourceType: 'vote',
      resourceId: savedVote.id,
      ipAddress,
      userAgent,
      newValues: {
        postId,
        candidateId,
        verificationHash,
      },
    });

    return savedVote;
  }

  /**
   * Get user's votes
   */
  async getUserVotes(userId: string): Promise<Vote[]> {
    return this.voteRepository.find({
      where: { userId },
      relations: ['post', 'candidate'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get votes by post
   */
  async getVotesByPost(postId: string, options: { page?: number; limit?: number } = {}): Promise<{
    votes: Vote[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page = 1, limit = 50 } = options;

    const queryBuilder = this.voteRepository.createQueryBuilder('vote')
      .leftJoinAndSelect('vote.user', 'user')
      .leftJoinAndSelect('vote.candidate', 'candidate')
      .where('vote.postId = :postId', { postId })
      .orderBy('vote.createdAt', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [votes, total] = await queryBuilder.getManyAndCount();

    return {
      votes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get votes by candidate
   */
  async getVotesByCandidate(candidateId: string, options: { page?: number; limit?: number } = {}): Promise<{
    votes: Vote[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page = 1, limit = 50 } = options;

    const queryBuilder = this.voteRepository.createQueryBuilder('vote')
      .leftJoinAndSelect('vote.user', 'user')
      .where('vote.candidateId = :candidateId', { candidateId })
      .orderBy('vote.createdAt', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [votes, total] = await queryBuilder.getManyAndCount();

    return {
      votes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Verify a vote
   */
  async verifyVote(voteId: string, verifiedBy: string): Promise<Vote> {
    const vote = await this.voteRepository.findOne({ where: { id: voteId } });

    if (!vote) {
      throw new Error('Vote not found');
    }

    if (vote.status === VoteStatus.VERIFIED) {
      throw new Error('Vote is already verified');
    }

    vote.status = VoteStatus.VERIFIED;
    const updatedVote = await this.voteRepository.save(vote);

    // Log verification
    await this.logAuditEvent({
      action: AuditAction.VOTE_VERIFY,
      severity: AuditSeverity.MEDIUM,
      description: `Vote ${voteId} verified`,
      userId: verifiedBy,
      resourceType: 'vote',
      resourceId: voteId,
      oldValues: { status: vote.status },
      newValues: { status: VoteStatus.VERIFIED },
    });

    return updatedVote;
  }

  /**
   * Invalidate a vote
   */
  async invalidateVote(voteId: string, invalidatedBy: string, reason?: string): Promise<Vote> {
    const vote = await this.voteRepository.findOne({
      where: { id: voteId },
      relations: ['user', 'post', 'candidate']
    });

    if (!vote) {
      throw new Error('Vote not found');
    }

    const oldStatus = vote.status;
    vote.status = VoteStatus.INVALID;

    // Add invalidation reason to metadata
    vote.metadata = {
      ...vote.metadata,
      invalidatedAt: new Date(),
      invalidatedBy,
      invalidationReason: reason,
    };

    const updatedVote = await this.voteRepository.save(vote);

    // Update vote counts
    await this.updateVoteCounts(vote.postId);

    // Emit real-time results update after vote invalidation
    await emitElectionResults({ postId: vote.postId, action: 'vote_invalidated' });

    // Log invalidation
    await this.logAuditEvent({
      action: AuditAction.VOTE_INVALIDATE,
      severity: AuditSeverity.HIGH,
      description: `Vote ${voteId} invalidated: ${reason || 'No reason provided'}`,
      userId: invalidatedBy,
      resourceType: 'vote',
      resourceId: voteId,
      oldValues: { status: oldStatus },
      newValues: { status: VoteStatus.INVALID, invalidationReason: reason },
    });

    return updatedVote;
  }

  /**
   * Verify vote by hash
   */
  async verifyVoteByHash(hash: string): Promise<Vote | null> {
    return this.voteRepository.findOne({
      where: { verificationHash: hash },
      select: ['id', 'postId', 'candidateId', 'status', 'createdAt'],
    });
  }

  /**
   * Get voting statistics
   */
  async getVotingStats(): Promise<{
    totalVotes: number;
    verifiedVotes: number;
    invalidVotes: number;
    castVotes: number;
    votesByPost: Array<{ postId: string; postTitle: string; voteCount: number }>;
    votesByCandidate: Array<{ candidateId: string; candidateName: string; voteCount: number }>;
  }> {
    const votes = await this.voteRepository.find({
      relations: ['post', 'candidate']
    });

    const stats = {
      totalVotes: votes.length,
      verifiedVotes: votes.filter(v => v.status === VoteStatus.VERIFIED).length,
      invalidVotes: votes.filter(v => v.status === VoteStatus.INVALID).length,
      castVotes: votes.filter(v => v.status === VoteStatus.CAST).length,
      votesByPost: [] as Array<{ postId: string; postTitle: string; voteCount: number }>,
      votesByCandidate: [] as Array<{ candidateId: string; candidateName: string; voteCount: number }>,
    };

    // Group votes by post
    const postVotes = new Map<string, { postId: string; postTitle: string; voteCount: number }>();
    const candidateVotes = new Map<string, { candidateId: string; candidateName: string; voteCount: number }>();

    votes.forEach(vote => {
      if (vote.post) {
        const key = vote.post.id;
        if (!postVotes.has(key)) {
          postVotes.set(key, {
            postId: vote.post.id,
            postTitle: vote.post.title,
            voteCount: 0,
          });
        }
        postVotes.get(key)!.voteCount++;
      }

      if (vote.candidate) {
        const key = vote.candidate.id;
        if (!candidateVotes.has(key)) {
          candidateVotes.set(key, {
            candidateId: vote.candidate.id,
            candidateName: `${vote.candidate.firstName} ${vote.candidate.lastName}`,
            voteCount: 0,
          });
        }
        candidateVotes.get(key)!.voteCount++;
      }
    });

    stats.votesByPost = Array.from(postVotes.values());
    stats.votesByCandidate = Array.from(candidateVotes.values());

    return stats;
  }

  /**
   * Reset all votes (emergency function)
   */
  async resetAllVotes(resetBy: string): Promise<void> {
    // Delete all votes
    await this.voteRepository.delete({});

    // Reset all user voting status
    await this.userRepository.update({}, { hasVoted: false, votedAt: undefined });

    // Reset all candidate vote counts
    await this.candidateRepository.update({}, { voteCount: 0, votePercentage: 0 });

    // Reset all post total votes
    await this.postRepository.update({}, { totalVotes: 0 });

    // Log the reset
    await this.logAuditEvent({
      action: AuditAction.SYSTEM_RESET,
      severity: AuditSeverity.CRITICAL,
      description: 'All votes have been reset',
      userId: resetBy,
      resourceType: 'system',
    });
  }

  /**
   * Update vote counts for all candidates in a post
   */
  private async updateVoteCounts(postId: string): Promise<void> {
    const candidates = await this.candidateRepository.find({
      where: { postId }
    });

    for (const candidate of candidates) {
      const voteCount = await this.voteRepository.count({
        where: {
          candidateId: candidate.id,
          status: VoteStatus.VERIFIED
        }
      });

      candidate.voteCount = voteCount;
      await this.candidateRepository.save(candidate);
    }

    // Update post total votes
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (post) {
      const totalVotes = await this.voteRepository.count({
        where: { postId, status: VoteStatus.VERIFIED }
      });

      post.totalVotes = totalVotes;
      await this.postRepository.save(post);
    }
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(params: {
    action: AuditAction;
    severity: AuditSeverity;
    description?: string;
    details?: object;
    ipAddress?: string;
    userAgent?: string;
    userId?: string;
    resourceId?: string;
    resourceType?: string;
    oldValues?: object;
    newValues?: object;
  }): Promise<void> {
    try {
      const auditLogRepository = AppDataSource.getRepository(AuditLog);
      const auditLog = AuditLog.createLog(params);
      await auditLogRepository.save(auditLog);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}