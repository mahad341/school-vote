import { AppDataSource } from '../config/database.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog.js';

export class SystemSettingService {
  private settingRepository = AppDataSource.getRepository(SystemSetting);

  /**
   * Get all system settings
   */
  async getAllSettings(): Promise<SystemSetting[]> {
    return this.settingRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  /**
   * Get setting by key
   */
  async getSetting(key: string): Promise<SystemSetting | null> {
    return this.settingRepository.findOne({
      where: { key, isActive: true }
    });
  }

  /**
   * Get setting value by key
   */
  async getSettingValue(key: string, defaultValue?: string): Promise<string | undefined> {
    const setting = await this.getSetting(key);
    return setting?.value || defaultValue;
  }

  /**
   * Update or create setting
   */
  async updateSetting(key: string, value: string, updatedBy: string, description?: string): Promise<SystemSetting> {
    let setting = await this.settingRepository.findOne({ where: { key } });

    const oldValue = setting?.value;

    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
    } else {
      setting = this.settingRepository.create({
        key,
        value,
        description,
        category: 'general',
      });
    }

    const savedSetting = await this.settingRepository.save(setting);

    // Log the setting change
    await this.logAuditEvent({
      action: AuditAction.SYSTEM_STATUS_CHANGE,
      severity: AuditSeverity.HIGH,
      description: `System setting updated: ${key}`,
      userId: updatedBy,
      resourceType: 'system_setting',
      resourceId: savedSetting.id,
      oldValues: { value: oldValue },
      newValues: { value },
    });

    return savedSetting;
  }

  /**
   * Get settings by category
   */
  async getSettingsByCategory(category: string): Promise<SystemSetting[]> {
    return this.settingRepository.find({
      where: { category, isActive: true },
      order: { key: 'ASC' },
    });
  }

  /**
   * Initialize default settings
   */
  async initializeDefaultSettings(): Promise<void> {
    const defaultSettings = [
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable/disable maintenance mode',
        category: 'system',
      },
      {
        key: 'voting_enabled',
        value: 'true',
        description: 'Enable/disable voting functionality',
        category: 'voting',
      },
      {
        key: 'max_votes_per_user',
        value: '10',
        description: 'Maximum votes a user can cast across all posts',
        category: 'voting',
      },
      {
        key: 'vote_verification_required',
        value: 'false',
        description: 'Require admin verification for votes',
        category: 'voting',
      },
      {
        key: 'auto_backup_enabled',
        value: 'true',
        description: 'Enable automatic backups',
        category: 'backup',
      },
      {
        key: 'backup_retention_days',
        value: '30',
        description: 'Number of days to retain backups',
        category: 'backup',
      },
      {
        key: 'session_timeout_minutes',
        value: '60',
        description: 'User session timeout in minutes',
        category: 'security',
      },
      {
        key: 'max_login_attempts',
        value: '5',
        description: 'Maximum login attempts before lockout',
        category: 'security',
      },
    ];

    for (const settingData of defaultSettings) {
      const existing = await this.settingRepository.findOne({
        where: { key: settingData.key }
      });

      if (!existing) {
        const setting = this.settingRepository.create(settingData);
        await this.settingRepository.save(setting);
      }
    }
  }

  /**
   * Check if maintenance mode is enabled
   */
  async isMaintenanceModeEnabled(): Promise<boolean> {
    const value = await this.getSettingValue('maintenance_mode', 'false');
    return value === 'true';
  }

  /**
   * Check if voting is enabled
   */
  async isVotingEnabled(): Promise<boolean> {
    const value = await this.getSettingValue('voting_enabled', 'true');
    return value === 'true';
  }

  /**
   * Get numeric setting value
   */
  async getNumericSetting(key: string, defaultValue: number): Promise<number> {
    const value = await this.getSettingValue(key, defaultValue.toString());
    return parseInt(value || defaultValue.toString(), 10);
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