import { AppDataSource } from '../config/database.js';
import { Candidate, CandidateStatus } from '../models/Candidate.js';
import { ElectionPost } from '../models/ElectionPost.js';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export interface CreateCandidateData {
  firstName: string;
  lastName: string;
  studentId?: string;
  email?: string;
  bio?: string;
  manifesto?: string;
  house?: string;
  class?: string;
  postId: string;
}

export interface UpdateCandidateData {
  firstName?: string;
  lastName?: string;
  studentId?: string;
  email?: string;
  bio?: string;
  manifesto?: string;
  house?: string;
  class?: string;
  status?: CandidateStatus;
}

export class CandidateService {
  private candidateRepository = AppDataSource.getRepository(Candidate);
  private postRepository = AppDataSource.getRepository(ElectionPost);

  // Configure multer for photo uploads
  private upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `candidate-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  });

  /**
   * Get candidates with filtering and pagination
   */
  async getCandidates(options: {
    page?: number;
    limit?: number;
    postId?: string;
    status?: CandidateStatus;
    house?: string;
    search?: string;
    includePost?: boolean;
  } = {}) {
    const { page = 1, limit = 20, postId, status, house, search, includePost = false } = options;

    const queryBuilder = this.candidateRepository.createQueryBuilder('candidate');

    // Apply filters
    if (postId) {
      queryBuilder.andWhere('candidate.postId = :postId', { postId });
    }

    if (status) {
      queryBuilder.andWhere('candidate.status = :status', { status });
    }

    if (house) {
      queryBuilder.andWhere('candidate.house = :house', { house });
    }

    if (search) {
      queryBuilder.andWhere(
        '(candidate.firstName ILIKE :search OR candidate.lastName ILIKE :search OR candidate.studentId ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Include post relation if requested
    if (includePost) {
      queryBuilder.leftJoinAndSelect('candidate.post', 'post');
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Order by display order, then creation date
    queryBuilder.orderBy('candidate.displayOrder', 'ASC').addOrderBy('candidate.createdAt', 'DESC');

    const [candidates, total] = await queryBuilder.getManyAndCount();

    return {
      candidates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get candidate by ID
   */
  async getCandidateById(id: string, includePost = false): Promise<Candidate | null> {
    const queryBuilder = this.candidateRepository.createQueryBuilder('candidate');

    if (includePost) {
      queryBuilder.leftJoinAndSelect('candidate.post', 'post');
    }

    return queryBuilder.where('candidate.id = :id', { id }).getOne();
  }

  /**
   * Create a new candidate
   */
  async createCandidate(candidateData: CreateCandidateData, createdBy: string): Promise<Candidate> {
    // Verify post exists and is not completed
    const post = await this.postRepository.findOne({ where: { id: candidateData.postId } });

    if (!post) {
      throw new Error('Election post not found');
    }

    if (post.status === 'completed') {
      throw new Error('Cannot add candidates to completed election post');
    }

    const candidate = this.candidateRepository.create({
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      studentId: candidateData.studentId,
      email: candidateData.email,
      bio: candidateData.bio,
      manifesto: candidateData.manifesto,
      house: candidateData.house,
      class: candidateData.class,
      postId: candidateData.postId,
    });

    const savedCandidate = await this.candidateRepository.save(candidate);

    // Log the creation
    await this.logAuditEvent({
      action: AuditAction.CANDIDATE_CREATE,
      severity: AuditSeverity.MEDIUM,
      description: `Candidate created: ${savedCandidate.firstName} ${savedCandidate.lastName} for ${post.title}`,
      userId: createdBy,
      resourceType: 'candidate',
      resourceId: savedCandidate.id,
      newValues: candidateData,
    });

    return savedCandidate;
  }

  /**
   * Update candidate information
   */
  async updateCandidate(id: string, updateData: UpdateCandidateData, updatedBy: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['post']
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Store old values for audit log
    const oldValues = {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      studentId: candidate.studentId,
      email: candidate.email,
      bio: candidate.bio,
      manifesto: candidate.manifesto,
      house: candidate.house,
      class: candidate.class,
      status: candidate.status,
    };

    // Update fields
    if (updateData.firstName !== undefined) candidate.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) candidate.lastName = updateData.lastName;
    if (updateData.studentId !== undefined) candidate.studentId = updateData.studentId;
    if (updateData.email !== undefined) candidate.email = updateData.email;
    if (updateData.bio !== undefined) candidate.bio = updateData.bio;
    if (updateData.manifesto !== undefined) candidate.manifesto = updateData.manifesto;
    if (updateData.house !== undefined) candidate.house = updateData.house;
    if (updateData.class !== undefined) candidate.class = updateData.class;
    if (updateData.status !== undefined) candidate.status = updateData.status;

    const updatedCandidate = await this.candidateRepository.save(candidate);

    // Log the update
    await this.logAuditEvent({
      action: AuditAction.CANDIDATE_UPDATE,
      severity: AuditSeverity.MEDIUM,
      description: `Candidate updated: ${updatedCandidate.firstName} ${updatedCandidate.lastName}`,
      userId: updatedBy,
      resourceType: 'candidate',
      resourceId: updatedCandidate.id,
      oldValues,
      newValues: updateData,
    });

    return updatedCandidate;
  }

  /**
   * Delete candidate
   */
  async deleteCandidate(id: string, deletedBy: string): Promise<void> {
    const candidate = await this.candidateRepository.findOne({
      where: { id },
      relations: ['post', 'votes']
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Check if candidate has votes
    if (candidate.votes && candidate.votes.length > 0) {
      throw new Error('Cannot delete candidate who has received votes');
    }

    // Delete photo file if exists
    if (candidate.photoUrl) {
      try {
        await fs.unlink(candidate.photoUrl);
      } catch (error) {
        console.warn('Failed to delete candidate photo:', error);
      }
    }

    await this.candidateRepository.remove(candidate);

    // Log the deletion
    await this.logAuditEvent({
      action: AuditAction.CANDIDATE_DELETE,
      severity: AuditSeverity.HIGH,
      description: `Candidate deleted: ${candidate.firstName} ${candidate.lastName}`,
      userId: deletedBy,
      resourceType: 'candidate',
      resourceId: id,
    });
  }

  /**
   * Upload candidate photo
   */
  async uploadCandidatePhoto(id: string, photoFile: Express.Multer.File, uploadedBy: string): Promise<Candidate> {
    const candidate = await this.candidateRepository.findOne({ where: { id } });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Delete old photo if exists
    if (candidate.photoUrl) {
      try {
        await fs.unlink(candidate.photoUrl);
      } catch (error) {
        console.warn('Failed to delete old candidate photo:', error);
      }
    }

    // Update photo URL
    candidate.photoUrl = photoFile.path;
    const updatedCandidate = await this.candidateRepository.save(candidate);

    // Log the photo upload
    await this.logAuditEvent({
      action: AuditAction.CANDIDATE_PHOTO_UPLOAD,
      severity: AuditSeverity.LOW,
      description: `Photo uploaded for candidate: ${updatedCandidate.firstName} ${updatedCandidate.lastName}`,
      userId: uploadedBy,
      resourceType: 'candidate',
      resourceId: updatedCandidate.id,
      newValues: { photoUrl: photoFile.filename },
    });

    return updatedCandidate;
  }

  /**
   * Get candidates for a specific post (for voting)
   */
  async getCandidatesForPost(postId: string, userHouse?: string): Promise<Candidate[]> {
    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new Error('Election post not found');
    }

    // Check if user can vote in this post
    if (!post.canUserVote(userHouse)) {
      throw new Error('User is not eligible to vote in this post');
    }

    const candidates = await this.candidateRepository.find({
      where: {
        postId,
        status: CandidateStatus.ACTIVE
      },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });

    return candidates;
  }

  /**
   * Get candidate statistics
   */
  async getCandidateStats(): Promise<{
    total: number;
    active: number;
    withdrawn: number;
    disqualified: number;
    withPhotos: number;
  }> {
    const candidates = await this.candidateRepository.find();

    const stats = {
      total: candidates.length,
      active: candidates.filter(c => c.status === CandidateStatus.ACTIVE).length,
      withdrawn: candidates.filter(c => c.status === CandidateStatus.WITHDRAWN).length,
      disqualified: candidates.filter(c => c.status === CandidateStatus.DISQUALIFIED).length,
      withPhotos: candidates.filter(c => c.photoUrl).length,
    };

    return stats;
  }

  /**
   * Get multer upload middleware
   */
  getUploadMiddleware() {
    return this.upload.single('photo');
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