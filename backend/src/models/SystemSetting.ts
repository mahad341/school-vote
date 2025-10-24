import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SystemStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  MAINTENANCE = 'maintenance'
}

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 100 })
  key!: string; // e.g., 'system_status', 'voting_enabled', 'max_votes_per_hour'

  @Column({ length: 255 })
  value!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: string; // e.g., 'system', 'voting', 'security'

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: object; // Additional configuration data

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Static methods for common settings
  static async getSystemStatus(): Promise<SystemStatus> {
    // This would be implemented in a service/repository
    return SystemStatus.ENABLED;
  }

  static async isVotingEnabled(): Promise<boolean> {
    // This would be implemented in a service/repository
    return true;
  }

  static async getMaxVotesPerHour(): Promise<number> {
    // This would be implemented in a service/repository
    return 1000;
  }
}