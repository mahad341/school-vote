import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { User } from './User.js';

export enum AuditAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',

  // User Management
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_IMPORT = 'user_import',

  // Election Management
  POST_CREATE = 'post_create',
  POST_UPDATE = 'post_update',
  POST_DELETE = 'post_delete',
  POST_ACTIVATE = 'post_activate',
  POST_DEACTIVATE = 'post_deactivate',

  // Candidate Management
  CANDIDATE_CREATE = 'candidate_create',
  CANDIDATE_UPDATE = 'candidate_update',
  CANDIDATE_DELETE = 'candidate_delete',
  CANDIDATE_PHOTO_UPLOAD = 'candidate_photo_upload',

  // Voting
  VOTE_CAST = 'vote_cast',
  VOTE_VERIFY = 'vote_verify',
  VOTE_INVALIDATE = 'vote_invalidate',

  // System
  SYSTEM_BACKUP = 'system_backup',
  SYSTEM_RESTORE = 'system_restore',
  SYSTEM_RESET = 'system_reset',
  SYSTEM_STATUS_CHANGE = 'system_status_change',

  // Security
  FAILED_LOGIN = 'failed_login',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['severity', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action!: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.LOW
  })
  severity!: AuditSeverity;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: object; // Additional context data

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ length: 500, nullable: true })
  userAgent?: string;

  @Column({ name: 'userId', nullable: true })
  userId?: string;

  @ManyToOne('User', 'auditLogs', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', nullable: true })
  resourceId?: string; // ID of affected resource (post, candidate, etc.)

  @Column({ type: 'varchar', nullable: true })
  resourceType?: string; // Type of affected resource

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: object; // Previous state for updates

  @Column({ type: 'jsonb', nullable: true })
  newValues?: object; // New state for updates

  @CreateDateColumn()
  createdAt!: Date;

  // Virtual properties
  get isSecurityEvent(): boolean {
    return [
      AuditAction.FAILED_LOGIN,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.PASSWORD_CHANGE
    ].includes(this.action);
  }

  get isVotingEvent(): boolean {
    return [
      AuditAction.VOTE_CAST,
      AuditAction.VOTE_VERIFY,
      AuditAction.VOTE_INVALIDATE
    ].includes(this.action);
  }

  // Methods
  static createLog(params: {
    action: AuditAction;
    userId?: string;
    description?: string;
    details?: object;
    ipAddress?: string;
    userAgent?: string;
    resourceId?: string;
    resourceType?: string;
    oldValues?: object;
    newValues?: object;
    severity?: AuditSeverity;
  }): AuditLog {
    const log = new AuditLog();
    log.action = params.action;
    log.userId = params.userId;
    log.description = params.description;
    log.details = params.details;
    log.ipAddress = params.ipAddress;
    log.userAgent = params.userAgent;
    log.resourceId = params.resourceId;
    log.resourceType = params.resourceType;
    log.oldValues = params.oldValues;
    log.newValues = params.newValues;
    log.severity = params.severity || AuditSeverity.LOW;
    return log;
  }
}