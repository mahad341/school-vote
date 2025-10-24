import { AppDataSource } from '../config/database.js';
import { Backup, BackupType, BackupStatus } from '../models/Backup.js';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BackupService {
  private backupRepository = AppDataSource.getRepository(Backup);
  private backupDir = process.env.BACKUP_DIR || './backups';

  /**
   * Create a new backup
   */
  async createBackup(type: BackupType, initiatedBy: string, description?: string): Promise<Backup> {
    // Ensure backup directory exists
    await this.ensureBackupDirectory();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${type}-${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);

    const backup = this.backupRepository.create({
      filename,
      filePath,
      type,
      description,
      initiatedBy,
      startedAt: new Date(),
    });

    const savedBackup = await this.backupRepository.save(backup);

    // Start backup process asynchronously
    this.performBackup(savedBackup).catch(error => {
      console.error('Backup failed:', error);
      this.updateBackupStatus(savedBackup.id, BackupStatus.FAILED, error.message);
    });

    return savedBackup;
  }

  /**
   * Get all backups with pagination
   */
  async getBackups(options: { page?: number; limit?: number } = {}): Promise<{
    backups: Backup[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page = 1, limit = 20 } = options;

    const queryBuilder = this.backupRepository.createQueryBuilder('backup');
    queryBuilder.orderBy('backup.createdAt', 'DESC');

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [backups, total] = await queryBuilder.getManyAndCount();

    return {
      backups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get backup by ID
   */
  async getBackupById(id: string): Promise<Backup | null> {
    return this.backupRepository.findOne({ where: { id } });
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string, restoredBy: string): Promise<void> {
    const backup = await this.getBackupById(backupId);

    if (!backup) {
      throw new Error('Backup not found');
    }

    if (backup.status !== BackupStatus.COMPLETED) {
      throw new Error('Cannot restore from incomplete backup');
    }

    // Check if backup file exists
    try {
      await fs.access(backup.filePath);
    } catch (error) {
      throw new Error('Backup file not found');
    }

    // Perform restore
    await this.performRestore(backup);

    // Log restore action
    await this.logAuditEvent({
      action: AuditAction.SYSTEM_RESTORE,
      severity: AuditSeverity.CRITICAL,
      description: `System restored from backup: ${backup.filename}`,
      userId: restoredBy,
      resourceType: 'backup',
      resourceId: backup.id,
    });
  }

  /**
   * Delete old backups based on retention policy
   */
  async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = await this.backupRepository
      .createQueryBuilder('backup')
      .where('backup.createdAt < :cutoffDate', { cutoffDate })
      .andWhere('backup.status = :status', { status: BackupStatus.COMPLETED })
      .getMany();

    let deletedCount = 0;

    for (const backup of oldBackups) {
      try {
        // Delete backup file
        await fs.unlink(backup.filePath);
        
        // Delete backup record
        await this.backupRepository.remove(backup);
        deletedCount++;
      } catch (error) {
        console.warn(`Failed to delete backup ${backup.id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Delete backup
   */
  async deleteBackup(id: string, deletedBy: string): Promise<void> {
    const backup = await this.getBackupById(id);

    if (!backup) {
      throw new Error('Backup not found');
    }

    // Delete backup file
    try {
      await fs.unlink(backup.filePath);
    } catch (error) {
      console.warn('Failed to delete backup file:', error);
    }

    // Delete backup record
    await this.backupRepository.remove(backup);

    // Log deletion
    await this.logAuditEvent({
      action: AuditAction.SYSTEM_BACKUP,
      severity: AuditSeverity.HIGH,
      description: `Backup deleted: ${backup.filename}`,
      userId: deletedBy,
      resourceType: 'backup',
      resourceId: id,
    });
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(): Promise<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    totalSize: number;
    lastBackup?: Date;
  }> {
    const backups = await this.backupRepository.find();

    const stats = {
      total: backups.length,
      completed: backups.filter(b => b.status === BackupStatus.COMPLETED).length,
      failed: backups.filter(b => b.status === BackupStatus.FAILED).length,
      inProgress: backups.filter(b => b.status === BackupStatus.IN_PROGRESS).length,
      totalSize: backups.reduce((sum, b) => sum + (b.fileSize || 0), 0),
      lastBackup: backups
        .filter(b => b.status === BackupStatus.COMPLETED)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt,
    };

    return stats;
  }

  /**
   * Perform the actual backup
   */
  private async performBackup(backup: Backup): Promise<void> {
    try {
      // Update status to in progress
      await this.updateBackupStatus(backup.id, BackupStatus.IN_PROGRESS);

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'e_voting_db',
      };

      let pgDumpCommand: string;

      switch (backup.type) {
        case BackupType.FULL:
          pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f "${backup.filePath}"`;
          break;
        case BackupType.VOTES_ONLY:
          pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -t votes -t candidates -t election_posts -f "${backup.filePath}"`;
          break;
        case BackupType.INCREMENTAL:
          // For incremental, we'll do a full backup for now
          // In a real implementation, you'd track changes since last backup
          pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f "${backup.filePath}"`;
          break;
        default:
          throw new Error(`Unsupported backup type: ${backup.type}`);
      }

      // Set PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: dbConfig.password };

      // Execute backup command
      await execAsync(pgDumpCommand, { env });

      // Get file size
      const stats = await fs.stat(backup.filePath);
      const fileSize = stats.size;

      // Update backup record
      await this.backupRepository.update(backup.id, {
        status: BackupStatus.COMPLETED,
        fileSize,
        completedAt: new Date(),
      });

      // Log successful backup
      await this.logAuditEvent({
        action: AuditAction.SYSTEM_BACKUP,
        severity: AuditSeverity.MEDIUM,
        description: `Backup completed: ${backup.filename} (${fileSize} bytes)`,
        userId: backup.initiatedBy,
        resourceType: 'backup',
        resourceId: backup.id,
      });

    } catch (error) {
      await this.updateBackupStatus(backup.id, BackupStatus.FAILED, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Perform the actual restore
   */
  private async performRestore(backup: Backup): Promise<void> {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'e_voting_db',
    };

    const psqlCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f "${backup.filePath}"`;

    // Set PGPASSWORD environment variable
    const env = { ...process.env, PGPASSWORD: dbConfig.password };

    // Execute restore command
    await execAsync(psqlCommand, { env });
  }

  /**
   * Update backup status
   */
  private async updateBackupStatus(backupId: string, status: BackupStatus, errorMessage?: string): Promise<void> {
    const updateData: any = { status };
    
    if (status === BackupStatus.FAILED && errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await this.backupRepository.update(backupId, updateData);
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
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