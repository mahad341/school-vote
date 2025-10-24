import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum BackupType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
  VOTES_ONLY = 'votes_only'
}

@Entity('backups')
export class Backup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  filename!: string; // Name of the backup file

  @Column({ length: 500 })
  filePath!: string; // Full path to backup file

  @Column({
    type: 'enum',
    enum: BackupType,
    default: BackupType.FULL
  })
  type!: BackupType;

  @Column({
    type: 'enum',
    enum: BackupStatus,
    default: BackupStatus.PENDING
  })
  status!: BackupStatus;

  @Column({ type: 'bigint' })
  fileSize!: number; // Size in bytes

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: object; // Backup details (tables included, record counts, etc.)

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  initiatedBy?: string; // User ID who initiated the backup

  @Column({ type: 'text', nullable: true })
  errorMessage?: string; // Error details if backup failed

  @CreateDateColumn()
  createdAt!: Date;

  // Virtual properties
  get duration(): number | null {
    if (this.startedAt && this.completedAt) {
      return this.completedAt.getTime() - this.startedAt.getTime();
    }
    return null;
  }

  get isCompleted(): boolean {
    return this.status === BackupStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.status === BackupStatus.FAILED;
  }

  // Methods
  start(): void {
    this.status = BackupStatus.IN_PROGRESS;
    this.startedAt = new Date();
  }

  complete(): void {
    this.status = BackupStatus.COMPLETED;
    this.completedAt = new Date();
  }

  fail(errorMessage?: string): void {
    this.status = BackupStatus.FAILED;
    this.completedAt = new Date();
    this.errorMessage = errorMessage;
  }
}