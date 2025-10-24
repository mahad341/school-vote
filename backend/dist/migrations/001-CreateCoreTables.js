import { Table, TableForeignKey } from 'typeorm';
export class CreateCoreTables001 {
    constructor() {
        this.name = 'CreateCoreTables001';
    }
    async up(queryRunner) {
        // Create enum types first
        await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM('student', 'admin', 'ict_admin');
      CREATE TYPE "user_status_enum" AS ENUM('active', 'inactive', 'suspended');
      CREATE TYPE "post_type_enum" AS ENUM('general', 'house_specific');
      CREATE TYPE "post_status_enum" AS ENUM('active', 'inactive', 'completed');
      CREATE TYPE "candidate_status_enum" AS ENUM('active', 'withdrawn', 'disqualified');
      CREATE TYPE "vote_status_enum" AS ENUM('cast', 'verified', 'invalid');
      CREATE TYPE "audit_action_enum" AS ENUM(
        'login', 'logout', 'password_change', 'user_create', 'user_update', 'user_delete', 'user_import',
        'post_create', 'post_update', 'post_delete', 'post_activate', 'post_deactivate',
        'candidate_create', 'candidate_update', 'candidate_delete', 'candidate_photo_upload',
        'vote_cast', 'vote_verify', 'vote_invalidate',
        'system_backup', 'system_restore', 'system_reset', 'system_status_change',
        'failed_login', 'suspicious_activity'
      );
      CREATE TYPE "audit_severity_enum" AS ENUM('low', 'medium', 'high', 'critical');
      CREATE TYPE "system_status_enum" AS ENUM('enabled', 'disabled', 'maintenance');
      CREATE TYPE "backup_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'failed');
      CREATE TYPE "backup_type_enum" AS ENUM('full', 'incremental', 'votes_only');
    `);
        // Create users table
        await queryRunner.createTable(new Table({
            name: 'users',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'studentId',
                    type: 'varchar',
                    length: '20',
                    isUnique: true,
                },
                {
                    name: 'firstName',
                    type: 'varchar',
                    length: '100',
                },
                {
                    name: 'lastName',
                    type: 'varchar',
                    length: '100',
                },
                {
                    name: 'email',
                    type: 'varchar',
                    length: '255',
                    isUnique: true,
                },
                {
                    name: 'password',
                    type: 'varchar',
                    length: '255',
                },
                {
                    name: 'role',
                    type: 'enum',
                    enum: ['student', 'admin', 'ict_admin'],
                    enumName: 'user_role_enum',
                    default: "'student'",
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['active', 'inactive', 'suspended'],
                    enumName: 'user_status_enum',
                    default: "'active'",
                },
                {
                    name: 'house',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                },
                {
                    name: 'class',
                    type: 'varchar',
                    length: '20',
                    isNullable: true,
                },
                {
                    name: 'hasVoted',
                    type: 'boolean',
                    default: false,
                },
                {
                    name: 'lastLoginAt',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'votedAt',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        // Create election_posts table
        await queryRunner.createTable(new Table({
            name: 'election_posts',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'title',
                    type: 'varchar',
                    length: '100',
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'type',
                    type: 'enum',
                    enum: ['general', 'house_specific'],
                    enumName: 'post_type_enum',
                    default: "'general'",
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['active', 'inactive', 'completed'],
                    enumName: 'post_status_enum',
                    default: "'inactive'",
                },
                {
                    name: 'eligibleHouses',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'maxVotes',
                    type: 'int',
                    default: 1,
                },
                {
                    name: 'votingStartsAt',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'votingEndsAt',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'totalVotes',
                    type: 'int',
                    default: 0,
                },
                {
                    name: 'displayOrder',
                    type: 'int',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        // Create candidates table
        await queryRunner.createTable(new Table({
            name: 'candidates',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'firstName',
                    type: 'varchar',
                    length: '100',
                },
                {
                    name: 'lastName',
                    type: 'varchar',
                    length: '100',
                },
                {
                    name: 'studentId',
                    type: 'varchar',
                    length: '20',
                    isNullable: true,
                },
                {
                    name: 'email',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'bio',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'manifesto',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'photoUrl',
                    type: 'varchar',
                    length: '500',
                    isNullable: true,
                },
                {
                    name: 'house',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                },
                {
                    name: 'class',
                    type: 'varchar',
                    length: '20',
                    isNullable: true,
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['active', 'withdrawn', 'disqualified'],
                    enumName: 'candidate_status_enum',
                    default: "'active'",
                },
                {
                    name: 'voteCount',
                    type: 'int',
                    default: 0,
                },
                {
                    name: 'votePercentage',
                    type: 'decimal',
                    precision: 5,
                    scale: 2,
                    default: 0,
                },
                {
                    name: 'displayOrder',
                    type: 'int',
                    isNullable: true,
                },
                {
                    name: 'postId',
                    type: 'uuid',
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        // Create votes table
        await queryRunner.createTable(new Table({
            name: 'votes',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'userId',
                    type: 'uuid',
                },
                {
                    name: 'postId',
                    type: 'uuid',
                },
                {
                    name: 'candidateId',
                    type: 'uuid',
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['cast', 'verified', 'invalid'],
                    enumName: 'vote_status_enum',
                    default: "'cast'",
                },
                {
                    name: 'verificationHash',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'ipAddress',
                    type: 'inet',
                    isNullable: true,
                },
                {
                    name: 'userAgent',
                    type: 'varchar',
                    length: '500',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        // Create audit_logs table
        await queryRunner.createTable(new Table({
            name: 'audit_logs',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'action',
                    type: 'enum',
                    enum: [
                        'login', 'logout', 'password_change', 'user_create', 'user_update', 'user_delete', 'user_import',
                        'post_create', 'post_update', 'post_delete', 'post_activate', 'post_deactivate',
                        'candidate_create', 'candidate_update', 'candidate_delete', 'candidate_photo_upload',
                        'vote_cast', 'vote_verify', 'vote_invalidate',
                        'system_backup', 'system_restore', 'system_reset', 'system_status_change',
                        'failed_login', 'suspicious_activity'
                    ],
                    enumName: 'audit_action_enum',
                },
                {
                    name: 'severity',
                    type: 'enum',
                    enum: ['low', 'medium', 'high', 'critical'],
                    enumName: 'audit_severity_enum',
                    default: "'low'",
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'details',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'ipAddress',
                    type: 'inet',
                    isNullable: true,
                },
                {
                    name: 'userAgent',
                    type: 'varchar',
                    length: '500',
                    isNullable: true,
                },
                {
                    name: 'userId',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'resourceId',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'resourceType',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'oldValues',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'newValues',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        // Create system_settings table
        await queryRunner.createTable(new Table({
            name: 'system_settings',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'key',
                    type: 'varchar',
                    length: '100',
                    isUnique: true,
                },
                {
                    name: 'value',
                    type: 'varchar',
                    length: '255',
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'category',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                },
                {
                    name: 'isActive',
                    type: 'boolean',
                    default: true,
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        // Create backups table
        await queryRunner.createTable(new Table({
            name: 'backups',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'filename',
                    type: 'varchar',
                    length: '255',
                },
                {
                    name: 'filePath',
                    type: 'varchar',
                    length: '500',
                },
                {
                    name: 'type',
                    type: 'enum',
                    enum: ['full', 'incremental', 'votes_only'],
                    enumName: 'backup_type_enum',
                    default: "'full'",
                },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['pending', 'in_progress', 'completed', 'failed'],
                    enumName: 'backup_status_enum',
                    default: "'pending'",
                },
                {
                    name: 'fileSize',
                    type: 'bigint',
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'startedAt',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'completedAt',
                    type: 'timestamp',
                    isNullable: true,
                },
                {
                    name: 'initiatedBy',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'errorMessage',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        // Create foreign key constraints
        await queryRunner.createForeignKey('candidates', new TableForeignKey({
            columnNames: ['postId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'election_posts',
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('votes', new TableForeignKey({
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('votes', new TableForeignKey({
            columnNames: ['postId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'election_posts',
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('votes', new TableForeignKey({
            columnNames: ['candidateId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'candidates',
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('audit_logs', new TableForeignKey({
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
        }));
        // Create indexes for performance
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_votes_user_post" ON "votes" ("userId", "postId")`);
        await queryRunner.query(`CREATE INDEX "IDX_votes_post_candidate" ON "votes" ("postId", "candidateId")`);
        await queryRunner.query(`CREATE INDEX "IDX_votes_created_at" ON "votes" ("createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_created" ON "audit_logs" ("userId", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_action_created" ON "audit_logs" ("action", "createdAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_severity_created" ON "audit_logs" ("severity", "createdAt")`);
        // Enable uuid-ossp extension for UUID generation
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    }
    async down(queryRunner) {
        // Drop foreign keys
        const candidatesTable = await queryRunner.getTable('candidates');
        const votesTable = await queryRunner.getTable('votes');
        const auditLogsTable = await queryRunner.getTable('audit_logs');
        const candidatePostForeignKey = candidatesTable?.foreignKeys.find(fk => fk.columnNames.indexOf('postId') !== -1);
        const voteUserForeignKey = votesTable?.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
        const votePostForeignKey = votesTable?.foreignKeys.find(fk => fk.columnNames.indexOf('postId') !== -1);
        const voteCandidateForeignKey = votesTable?.foreignKeys.find(fk => fk.columnNames.indexOf('candidateId') !== -1);
        const auditUserForeignKey = auditLogsTable?.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
        if (candidatePostForeignKey)
            await queryRunner.dropForeignKey('candidates', candidatePostForeignKey);
        if (voteUserForeignKey)
            await queryRunner.dropForeignKey('votes', voteUserForeignKey);
        if (votePostForeignKey)
            await queryRunner.dropForeignKey('votes', votePostForeignKey);
        if (voteCandidateForeignKey)
            await queryRunner.dropForeignKey('votes', voteCandidateForeignKey);
        if (auditUserForeignKey)
            await queryRunner.dropForeignKey('audit_logs', auditUserForeignKey);
        // Drop tables
        await queryRunner.dropTable('backups');
        await queryRunner.dropTable('system_settings');
        await queryRunner.dropTable('audit_logs');
        await queryRunner.dropTable('votes');
        await queryRunner.dropTable('candidates');
        await queryRunner.dropTable('election_posts');
        await queryRunner.dropTable('users');
        // Drop enum types
        await queryRunner.query(`
      DROP TYPE IF EXISTS "backup_type_enum";
      DROP TYPE IF EXISTS "backup_status_enum";
      DROP TYPE IF EXISTS "system_status_enum";
      DROP TYPE IF EXISTS "audit_severity_enum";
      DROP TYPE IF EXISTS "audit_action_enum";
      DROP TYPE IF EXISTS "vote_status_enum";
      DROP TYPE IF EXISTS "candidate_status_enum";
      DROP TYPE IF EXISTS "post_status_enum";
      DROP TYPE IF EXISTS "post_type_enum";
      DROP TYPE IF EXISTS "user_status_enum";
      DROP TYPE IF EXISTS "user_role_enum";
    `);
    }
}
