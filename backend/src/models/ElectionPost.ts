import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Candidate } from './Candidate.js';
import { Vote } from './Vote.js';

export enum PostType {
  GENERAL = 'general', // All students can vote
  HOUSE_SPECIFIC = 'house_specific' // Only students from specific houses can vote
}

export enum PostStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed'
}

@Entity('election_posts')
export class ElectionPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  title!: string; // e.g., "President", "Secretary", "House Prefect"

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.GENERAL
  })
  type!: PostType;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.INACTIVE
  })
  status!: PostStatus;

  @Column({ type: 'text', nullable: true })
  eligibleHouses?: string; // JSON array of eligible houses for house-specific posts

  @Column({ default: 1 })
  maxVotes!: number; // Usually 1, but could be more for some positions

  @Column({ type: 'timestamp', nullable: true })
  votingStartsAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  votingEndsAt?: Date;

  @Column({ default: 0 })
  totalVotes!: number;

  @Column({ type: 'int', nullable: true })
  displayOrder?: number; // For ordering posts in UI

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany('Candidate', 'post')
  candidates!: Candidate[];

  @OneToMany(() => Vote, (vote: Vote) => vote.post)
  votes!: Vote[];

  // Virtual properties
  get isActive(): boolean {
    return this.status === PostStatus.ACTIVE;
  }

  get isVotingOpen(): boolean {
    const now = new Date();
    return this.isActive &&
           !!this.votingStartsAt && !!this.votingEndsAt &&
           now >= this.votingStartsAt && now <= this.votingEndsAt;
  }

  get eligibleHousesArray(): string[] {
    return this.eligibleHouses ? JSON.parse(this.eligibleHouses) : [];
  }

  set eligibleHousesArray(houses: string[]) {
    this.eligibleHouses = JSON.stringify(houses);
  }

  // Methods
  canUserVote(userHouse?: string): boolean {
    if (!this.isVotingOpen) return false;

    if (this.type === PostType.GENERAL) return true;

    if (this.type === PostType.HOUSE_SPECIFIC && userHouse) {
      return this.eligibleHousesArray.includes(userHouse);
    }

    return false;
  }

  addVote(): void {
    this.totalVotes++;
  }
}