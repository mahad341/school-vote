import { AppDataSource } from '../config/database.js';
import { User, UserRole, UserStatus } from '../models/User.js';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog.js';
import { AuthService } from '../utils/auth.js';
export class UserService {
    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }
    /**
     * Get all users with pagination and filtering
     */
    async getUsers(options = {}) {
        const { page = 1, limit = 20, role, status, house, class: className, search } = options;
        const queryBuilder = this.userRepository.createQueryBuilder('user');
        // Apply filters
        if (role) {
            queryBuilder.andWhere('user.role = :role', { role });
        }
        if (status) {
            queryBuilder.andWhere('user.status = :status', { status });
        }
        if (house) {
            queryBuilder.andWhere('user.house = :house', { house });
        }
        if (className) {
            queryBuilder.andWhere('user.class = :class', { class: className });
        }
        if (search) {
            queryBuilder.andWhere('(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.studentId ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` });
        }
        // Pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        // Order by creation date
        queryBuilder.orderBy('user.createdAt', 'DESC');
        const [users, total] = await queryBuilder.getManyAndCount();
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get user by ID
     */
    async getUserById(id) {
        return this.userRepository.findOne({
            where: { id },
            relations: ['votes', 'auditLogs'],
        });
    }
    /**
     * Create a new user
     */
    async createUser(userData, createdBy) {
        // Use AuthService for registration to ensure consistency
        return AuthService.register(userData, createdBy);
    }
    /**
     * Update user information
     */
    async updateUser(id, updateData, updatedBy) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }
        // Store old values for audit log
        const oldValues = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            house: user.house,
            class: user.class,
            status: user.status,
            role: user.role,
        };
        // Update user fields
        if (updateData.firstName !== undefined)
            user.firstName = updateData.firstName;
        if (updateData.lastName !== undefined)
            user.lastName = updateData.lastName;
        if (updateData.email !== undefined)
            user.email = updateData.email;
        if (updateData.house !== undefined)
            user.house = updateData.house;
        if (updateData.class !== undefined)
            user.class = updateData.class;
        if (updateData.status !== undefined)
            user.status = updateData.status;
        if (updateData.role !== undefined)
            user.role = updateData.role;
        const updatedUser = await this.userRepository.save(user);
        // Log the update
        await this.logAuditEvent({
            action: AuditAction.USER_UPDATE,
            severity: AuditSeverity.MEDIUM,
            description: `User updated: ${updatedUser.firstName} ${updatedUser.lastName}`,
            userId: updatedBy,
            resourceType: 'user',
            resourceId: updatedUser.id,
            oldValues,
            newValues: updateData,
        });
        return updatedUser;
    }
    /**
     * Delete user (soft delete by setting status to inactive)
     */
    async deleteUser(id, deletedBy) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }
        // Instead of hard delete, set status to inactive
        user.status = UserStatus.INACTIVE;
        await this.userRepository.save(user);
        // Log the deletion
        await this.logAuditEvent({
            action: AuditAction.USER_DELETE,
            severity: AuditSeverity.HIGH,
            description: `User deactivated: ${user.firstName} ${user.lastName}`,
            userId: deletedBy,
            resourceType: 'user',
            resourceId: user.id,
            oldValues: { status: UserStatus.ACTIVE },
            newValues: { status: UserStatus.INACTIVE },
        });
    }
    /**
     * Get user statistics
     */
    async getUserStats() {
        const users = await this.userRepository.find();
        const stats = {
            total: users.length,
            active: users.filter(u => u.status === UserStatus.ACTIVE).length,
            inactive: users.filter(u => u.status === UserStatus.INACTIVE).length,
            suspended: users.filter(u => u.status === UserStatus.SUSPENDED).length,
            byRole: {},
            byHouse: {},
        };
        // Count by role
        Object.values(UserRole).forEach(role => {
            stats.byRole[role] = users.filter(u => u.role === role).length;
        });
        // Count by house
        const houses = users
            .map(u => u.house)
            .filter(house => house)
            .reduce((acc, house) => {
            acc[house] = (acc[house] || 0) + 1;
            return acc;
        }, {});
        stats.byHouse = houses;
        return stats;
    }
    /**
     * Import users from CSV data
     */
    async importUsers(csvData, importedBy) {
        let success = 0;
        let failed = 0;
        const errors = [];
        for (const userData of csvData) {
            try {
                await this.createUser(userData, importedBy);
                success++;
            }
            catch (error) {
                failed++;
                const message = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Failed to import ${userData.studentId}: ${message}`);
            }
        }
        // Log the import
        await this.logAuditEvent({
            action: AuditAction.USER_IMPORT,
            severity: AuditSeverity.HIGH,
            description: `User import completed: ${success} successful, ${failed} failed`,
            userId: importedBy,
            resourceType: 'user',
            details: { success, failed, errors },
        });
        return { success, failed, errors };
    }
    /**
     * Reset user voting status (for new election cycle)
     */
    async resetVotingStatus(resetBy) {
        const result = await this.userRepository.update({ hasVoted: true }, { hasVoted: false, votedAt: undefined });
        // Log the reset
        await this.logAuditEvent({
            action: AuditAction.SYSTEM_RESET,
            severity: AuditSeverity.CRITICAL,
            description: `Voting status reset for ${result.affected} users`,
            userId: resetBy,
            resourceType: 'system',
            details: { affectedUsers: result.affected },
        });
        return result.affected || 0;
    }
    /**
     * Reset all voter statuses (set hasVoted to false for all users)
     */
    async resetAllVoterStatuses(resetBy) {
        const result = await this.userRepository.update({}, { hasVoted: false, votedAt: undefined });
        // Log the reset
        await this.logAuditEvent({
            action: AuditAction.SYSTEM_RESET,
            severity: AuditSeverity.CRITICAL,
            description: `All voter statuses reset for ${result.affected} users`,
            userId: resetBy,
            resourceType: 'system',
            details: { affectedUsers: result.affected },
        });
        return result.affected || 0;
    }
    /**
     * Bulk import users
     */
    async bulkImportUsers(users, importedBy) {
        const result = await this.importUsers(users, importedBy);
        return {
            imported: result.success,
            failed: result.failed,
            errors: result.errors,
        };
    }
    /**
     * Update user role
     */
    async updateUserRole(id, role, updatedBy) {
        return this.updateUser(id, { role }, updatedBy);
    }
    /**
     * Update user status
     */
    async updateUserStatus(id, status, updatedBy, reason) {
        const user = await this.updateUser(id, { status }, updatedBy);
        // Log additional details for status changes
        if (reason) {
            await this.logAuditEvent({
                action: AuditAction.USER_UPDATE,
                severity: AuditSeverity.HIGH,
                description: `User status changed to ${status}: ${reason}`,
                userId: updatedBy,
                resourceType: 'user',
                resourceId: id,
                details: { reason, newStatus: status },
            });
        }
        return user;
    }
    /**
     * Get recent activity (audit logs)
     */
    async getRecentActivity(hours = 24) {
        const auditLogRepository = AppDataSource.getRepository(AuditLog);
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - hours);
        return auditLogRepository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.user', 'user')
            .where('log.createdAt >= :cutoffDate', { cutoffDate })
            .orderBy('log.createdAt', 'DESC')
            .take(50)
            .getMany();
    }
    /**
     * Get audit logs with filtering
     */
    async getAuditLogs(options = {}) {
        const { page = 1, limit = 50, action, severity, userId, startDate, endDate } = options;
        const auditLogRepository = AppDataSource.getRepository(AuditLog);
        const queryBuilder = auditLogRepository.createQueryBuilder('log');
        // Apply filters
        if (action) {
            queryBuilder.andWhere('log.action = :action', { action });
        }
        if (severity) {
            queryBuilder.andWhere('log.severity = :severity', { severity });
        }
        if (userId) {
            queryBuilder.andWhere('log.userId = :userId', { userId });
        }
        if (startDate) {
            queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
        }
        if (endDate) {
            queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
        }
        // Include user relation
        queryBuilder.leftJoinAndSelect('log.user', 'user');
        // Pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        // Order by creation date
        queryBuilder.orderBy('log.createdAt', 'DESC');
        const [logs, total] = await queryBuilder.getManyAndCount();
        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Log audit event
     */
    async logAuditEvent(params) {
        try {
            const auditLogRepository = AppDataSource.getRepository(AuditLog);
            const auditLog = AuditLog.createLog(params);
            await auditLogRepository.save(auditLog);
        }
        catch (error) {
            console.error('Failed to log audit event:', error);
        }
    }
}
