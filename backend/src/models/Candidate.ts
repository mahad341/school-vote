import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import type { ElectionPost } from './ElectionPost.js';
import { Vote } from './Vote.js';

export enum CandidateStatus {
  ACTIVE = 'active',
  WITHDRAWN = 'withdrawn',
  DISQUALIFIED = 'disqualified'
}

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ length: 20, nullable: true })
  studentId?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'text', nullable: true })
  manifesto?: string;

  @Column({ nullable: true })
  photoUrl?: string; // Path to uploaded photo

  @Column({ nullable: true, length: 50 })
  house?: string; // Candidate's house

  @Column({ nullable: true, length: 20 })
  class?: string; // Candidate's class/year

  @Column({
    type: 'enum',
    enum: CandidateStatus,
    default: CandidateStatus.ACTIVE
  })
  status!: CandidateStatus;

  @Column({ default: 0 })
  voteCount!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  votePercentage!: number;

  @Column({ type: 'int', nullable: true })
  displayOrder?: number; // For ordering candidates in UI

  // Foreign key to ElectionPost
  @Column({ name: 'postId' })
  postId!: string;

  @ManyToOne('ElectionPost', 'candidates', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post!: ElectionPost;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Vote, (vote: Vote) => vote.candidate)
  votes!: Vote[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === CandidateStatus.ACTIVE;
  }

  // Methods
  addVote(): void {
    this.voteCount++;
  }

  updatePercentage(totalVotes: number): void {
    if (totalVotes > 0) {
      this.votePercentage = parseFloat(((this.voteCount / totalVotes) * 100).toFixed(2));
    } else {
      this.votePercentage = 0;
    }
  }

  canReceiveVotes(): boolean {
    return this.isActive && this.post?.isVotingOpen;
  }
}