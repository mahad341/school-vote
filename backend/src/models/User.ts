import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { Vote } from './Vote.js';
import type { AuditLog } from './AuditLog.js';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
  ICT_ADMIN = 'ict_admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true, length: 20 })
  studentId!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE
  })
  status!: UserStatus;

  @Column({ type: 'varchar', nullable: true, length: 50 })
  house?: string; // For house-specific elections

  @Column({ type: 'varchar', nullable: true, length: 20 })
  class?: string; // Student class/year

  @Column({ type: 'boolean', default: false })
  hasVoted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  votedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany('Vote', 'user')
  votes!: Vote[];

  @OneToMany('AuditLog', 'user')
  auditLogs!: AuditLog[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Methods
  canVote(): boolean {
    return this.status === UserStatus.ACTIVE && !this.hasVoted;
  }

  hasPermission(permission: string): boolean {
    switch (this.role) {
      case UserRole.ICT_ADMIN:
        return true; // Full access
      case UserRole.ADMIN:
        return ['manage_posts', 'manage_candidates', 'view_results', 'manage_users'].includes(permission);
      case UserRole.STUDENT:
        return ['vote', 'view_profile', 'view_candidates'].includes(permission);
      default:
        return false;
    }
  }
}