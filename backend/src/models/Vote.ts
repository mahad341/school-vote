import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './User.js';
import type { ElectionPost } from './ElectionPost.js';
import type { Candidate } from './Candidate.js';

export enum VoteStatus {
  CAST = 'cast',
  VERIFIED = 'verified',
  INVALID = 'invalid'
}

@Entity('votes')
@Index(['userId', 'postId'], { unique: true }) // One vote per user per post
@Index(['postId', 'candidateId']) // For result calculations
@Index(['createdAt']) // For audit trails
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Foreign keys
  @Column({ name: 'userId' })
  userId!: string;

  @Column({ name: 'postId' })
  postId!: string;

  @Column({ name: 'candidateId' })
  candidateId!: string;

  @Column({
    type: 'enum',
    enum: VoteStatus,
    default: VoteStatus.CAST
  })
  status!: VoteStatus;

  @Column({ type: 'text', nullable: true })
  verificationHash?: string; // For vote integrity verification

  @Column({ type: 'json', nullable: true })
  metadata?: object; // Additional vote metadata

  @Column({ type: 'varchar', nullable: true })
  ipAddress?: string; // For audit and security

  @Column({ length: 500, nullable: true })
  userAgent?: string; // Browser/device info

  @CreateDateColumn()
  createdAt!: Date;

  // Relations
  @ManyToOne(() => User, (user: User) => user.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne('ElectionPost', 'votes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: ElectionPost;

  @ManyToOne('Candidate', 'votes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate!: Candidate;

  // Virtual properties
  get isValid(): boolean {
    return this.status === VoteStatus.VERIFIED;
  }

  // Methods
  verify(): void {
    this.status = VoteStatus.VERIFIED;
  }

  invalidate(): void {
    this.status = VoteStatus.INVALID;
  }

  generateVerificationHash(): string {
    // Simple hash for vote integrity (in production, use cryptographic hash)
    const data = `${this.userId}-${this.postId}-${this.candidateId}-${this.createdAt.getTime()}`;
    this.verificationHash = Buffer.from(data).toString('base64');
    return this.verificationHash;
  }

  validateIntegrity(): boolean {
    if (!this.verificationHash) return false;
    const expectedHash = this.generateVerificationHash();
    return this.verificationHash === expectedHash;
  }
}