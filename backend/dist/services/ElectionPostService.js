import { AppDataSource } from '../config/database.js';
import { ElectionPost, PostType, PostStatus } from '../models/ElectionPost.js';
import { Candidate } from '../models/Candidate.js';
import { Vote } from '../models/Vote.js';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog.js';
import { emitElectionResults } from '../config/socket.js';
export class ElectionPostService {
    constructor() {
        this.postRepository = AppDataSource.getRepository(ElectionPost);
        this.candidateRepository = AppDataSource.getRepository(Candidate);
        this.voteRepository = AppDataSource.getRepository(Vote);
    }
    /**
     * Get all election posts with filtering and pagination
     */
    async getPosts(options = {}) {
        const { page = 1, limit = 20, status, type, includeCandidates = false, includeResults = false } = options;
        const queryBuilder = this.postRepository.createQueryBuilder('post');
        // Apply filters
        if (status) {
            queryBuilder.andWhere('post.status = :status', { status });
        }
        if (type) {
            queryBuilder.andWhere('post.type = :type', { type });
        }
        // Include relations if requested
        if (includeCandidates) {
            queryBuilder.leftJoinAndSelect('post.candidates', 'candidate');
        }
        if (includeResults) {
            queryBuilder.leftJoinAndSelect('post.votes', 'vote');
            queryBuilder.leftJoinAndSelect('vote.candidate', 'voteCandidate');
        }
        // Pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        // Order by display order, then creation date
        queryBuilder.orderBy('post.displayOrder', 'ASC').addOrderBy('post.createdAt', 'DESC');
        const [posts, total] = await queryBuilder.getManyAndCount();
        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get post by ID with optional relations
     */
    async getPostById(id, options = {}) {
        const queryBuilder = this.postRepository.createQueryBuilder('post');
        if (options.includeCandidates) {
            queryBuilder.leftJoinAndSelect('post.candidates', 'candidate');
        }
        if (options.includeResults) {
            queryBuilder.leftJoinAndSelect('post.votes', 'vote');
            queryBuilder.leftJoinAndSelect('vote.candidate', 'voteCandidate');
        }
        return queryBuilder.where('post.id = :id', { id }).getOne();
    }
    /**
     * Create a new election post
     */
    async createPost(postData, createdBy) {
        const post = this.postRepository.create({
            title: postData.title,
            description: postData.description,
            type: postData.type || PostType.GENERAL,
            eligibleHouses: postData.eligibleHouses ? JSON.stringify(postData.eligibleHouses) : undefined,
            maxVotes: postData.maxVotes || 1,
            votingStartsAt: postData.votingStartsAt,
            votingEndsAt: postData.votingEndsAt,
            displayOrder: postData.displayOrder,
        });
        const savedPost = await this.postRepository.save(post);
        // Log the creation
        await this.logAuditEvent({
            action: AuditAction.POST_CREATE,
            severity: AuditSeverity.MEDIUM,
            description: `Election post created: ${savedPost.title}`,
            userId: createdBy,
            resourceType: 'post',
            resourceId: savedPost.id,
            newValues: postData,
        });
        return savedPost;
    }
    /**
     * Update election post
     */
    async updatePost(id, updateData, updatedBy) {
        const post = await this.postRepository.findOne({ where: { id } });
        if (!post) {
            throw new Error('Election post not found');
        }
        // Store old values for audit log
        const oldValues = {
            title: post.title,
            description: post.description,
            type: post.type,
            eligibleHouses: post.eligibleHousesArray,
            maxVotes: post.maxVotes,
            votingStartsAt: post.votingStartsAt,
            votingEndsAt: post.votingEndsAt,
            status: post.status,
            displayOrder: post.displayOrder,
        };
        // Update fields
        if (updateData.title !== undefined)
            post.title = updateData.title;
        if (updateData.description !== undefined)
            post.description = updateData.description;
        if (updateData.type !== undefined)
            post.type = updateData.type;
        if (updateData.eligibleHouses !== undefined)
            post.eligibleHousesArray = updateData.eligibleHouses;
        if (updateData.maxVotes !== undefined)
            post.maxVotes = updateData.maxVotes;
        if (updateData.votingStartsAt !== undefined)
            post.votingStartsAt = updateData.votingStartsAt;
        if (updateData.votingEndsAt !== undefined)
            post.votingEndsAt = updateData.votingEndsAt;
        if (updateData.status !== undefined)
            post.status = updateData.status;
        if (updateData.displayOrder !== undefined)
            post.displayOrder = updateData.displayOrder;
        const updatedPost = await this.postRepository.save(post);
        // Log the update
        await this.logAuditEvent({
            action: AuditAction.POST_UPDATE,
            severity: AuditSeverity.MEDIUM,
            description: `Election post updated: ${updatedPost.title}`,
            userId: updatedBy,
            resourceType: 'post',
            resourceId: updatedPost.id,
            oldValues,
            newValues: updateData,
        });
        return updatedPost;
    }
    /**
     * Delete election post
     */
    async deletePost(id, deletedBy) {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['candidates', 'votes']
        });
        if (!post) {
            throw new Error('Election post not found');
        }
        // Check if post has votes
        if (post.votes && post.votes.length > 0) {
            throw new Error('Cannot delete post that has received votes');
        }
        await this.postRepository.remove(post);
        // Log the deletion
        await this.logAuditEvent({
            action: AuditAction.POST_DELETE,
            severity: AuditSeverity.HIGH,
            description: `Election post deleted: ${post.title}`,
            userId: deletedBy,
            resourceType: 'post',
            resourceId: id,
        });
    }
    /**
     * Activate/deactivate post
     */
    async setPostStatus(id, status, updatedBy) {
        const post = await this.postRepository.findOne({ where: { id } });
        if (!post) {
            throw new Error('Election post not found');
        }
        const oldStatus = post.status;
        post.status = status;
        const updatedPost = await this.postRepository.save(post);
        // Emit real-time status update
        await emitElectionResults({
            postId: updatedPost.id,
            action: 'post_status_changed',
            status: status,
            post: {
                id: updatedPost.id,
                title: updatedPost.title,
                status: updatedPost.status
            }
        });
        // Log the status change
        const action = status === PostStatus.ACTIVE ? AuditAction.POST_ACTIVATE : AuditAction.POST_DEACTIVATE;
        await this.logAuditEvent({
            action,
            severity: AuditSeverity.HIGH,
            description: `Election post ${status}: ${updatedPost.title}`,
            userId: updatedBy,
            resourceType: 'post',
            resourceId: updatedPost.id,
            oldValues: { status: oldStatus },
            newValues: { status },
        });
        return updatedPost;
    }
    /**
     * Get voting results for a post
     */
    async getPostResults(id) {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['candidates', 'votes']
        });
        if (!post) {
            throw new Error('Election post not found');
        }
        const totalVotes = post.totalVotes;
        const candidatesWithResults = post.candidates?.map(candidate => ({
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            voteCount: candidate.voteCount,
            votePercentage: totalVotes > 0 ? parseFloat(((candidate.voteCount / totalVotes) * 100).toFixed(2)) : 0,
        })) || [];
        return {
            post,
            candidates: candidatesWithResults,
            totalVotes,
        };
    }
    /**
     * Get active posts for voting
     */
    async getActivePosts(userHouse) {
        const posts = await this.postRepository.find({
            where: { status: PostStatus.ACTIVE },
            relations: ['candidates'],
            order: { displayOrder: 'ASC', createdAt: 'DESC' },
        });
        // Filter posts based on user house for house-specific elections
        return posts.filter(post => post.canUserVote(userHouse));
    }
    /**
     * Get post statistics
     */
    async getPostStats() {
        const posts = await this.postRepository.find();
        const stats = {
            total: posts.length,
            active: posts.filter(p => p.status === PostStatus.ACTIVE).length,
            inactive: posts.filter(p => p.status === PostStatus.INACTIVE).length,
            completed: posts.filter(p => p.status === PostStatus.COMPLETED).length,
            byType: {},
        };
        // Count by type
        Object.values(PostType).forEach(type => {
            stats.byType[type] = posts.filter(p => p.type === type).length;
        });
        return stats;
    }
    /**
     * Log audit event
     */
    async logAuditEvent(params) {
        try {
            const auditLogRepository = AppDataSource.getRepository(AuditLog);
            const auditLog = AuditLog.createLog(params);
            await auditLogRepository.save(auditLog);
        }
        catch (error) {
            console.error('Failed to log audit event:', error);
        }
    }
}
