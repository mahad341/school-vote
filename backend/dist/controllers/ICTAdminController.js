import { UserService } from '../services/UserService.js';
import { ElectionPostService } from '../services/ElectionPostService.js';
import { VoteService } from '../services/VoteService.js';
import { SystemSettingService } from '../services/SystemSettingService.js';
import { BackupService } from '../services/BackupService.js';
import { AuthMiddleware } from '../middleware/auth.js';
import { UserRole, UserStatus } from '../models/User.js';
import { emitSystemStatus } from '../config/socket.js';
export class ICTAdminController {
    /**
     * GET /api/ict-admin/dashboard
     * Get ICT admin dashboard overview
     */
    static async getDashboard(req, res) {
        try {
            const userService = new UserService();
            const postService = new ElectionPostService();
            const voteService = new VoteService();
            // Get system statistics
            const [userStats, postStats, voteStats] = await Promise.all([
                userService.getUserStats(),
                postService.getPostStats(),
                voteService.getVotingStats(),
            ]);
            // Get recent activity (last 24 hours)
            const recentActivity = await userService.getRecentActivity(24);
            res.json({
                success: true,
                data: {
                    statistics: {
                        users: userStats,
                        posts: postStats,
                        votes: voteStats,
                    },
                    recentActivity,
                    systemStatus: 'operational',
                    lastUpdated: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch dashboard';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/ict-admin/users
     * Get all users with advanced filtering
     */
    static async getAllUsers(req, res) {
        try {
            const { page, limit, role, status, search, house, class: userClass } = req.query;
            const userService = new UserService();
            // Normalize and validate role query into UserRole | undefined
            const roleParam = role;
            const roleEnum = roleParam && Object.values(UserRole).includes(roleParam)
                ? roleParam
                : undefined;
            // Normalize and validate status query into UserStatus | undefined
            const statusParam = status;
            const statusEnum = statusParam && Object.values(UserStatus).includes(statusParam)
                ? statusParam
                : undefined;
            const result = await userService.getUsers({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50,
                role: roleEnum,
                status: statusEnum,
                search: search,
                house: house,
                class: userClass,
            });
            res.json({
                success: true,
                data: result.users,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch users';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict-admin/users/bulk-import
     * Bulk import users from CSV
     */
    static async bulkImportUsers(req, res) {
        try {
            const { users } = req.body;
            const importedBy = req.user.id;
            const userService = new UserService();
            const result = await userService.bulkImportUsers(users, importedBy);
            res.json({
                success: true,
                message: 'Users imported successfully',
                data: {
                    imported: result.imported,
                    failed: result.failed,
                    total: users.length,
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to import users';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/ict-admin/users/:id/role
     * Update user role
     */
    static async updateUserRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const updatedBy = req.user.id;
            const userService = new UserService();
            const user = await userService.updateUserRole(id, role, updatedBy);
            res.json({
                success: true,
                message: 'User role updated successfully',
                data: user,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update user role';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/ict-admin/users/:id/status
     * Update user status (suspend/activate)
     */
    static async updateUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, reason } = req.body;
            const updatedBy = req.user.id;
            const userService = new UserService();
            const user = await userService.updateUserStatus(id, status, updatedBy, reason);
            res.json({
                success: true,
                message: `User ${status} successfully`,
                data: user,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update user status';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict-admin/system/reset-votes
     * Reset all votes (emergency function)
     */
    static async resetAllVotes(req, res) {
        try {
            const { confirmation } = req.body;
            const resetBy = req.user.id;
            if (confirmation !== 'RESET_ALL_VOTES') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid confirmation code',
                });
            }
            const voteService = new VoteService();
            await voteService.resetAllVotes(resetBy);
            // Emit system status update
            emitSystemStatus('disabled', 'All votes have been reset');
            res.json({
                success: true,
                message: 'All votes have been reset successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reset votes';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/ict-admin/system/settings
     * Get all system settings
     */
    static async getSystemSettings(req, res) {
        try {
            const settingService = new SystemSettingService();
            const settings = await settingService.getAllSettings();
            res.json({
                success: true,
                data: settings,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch system settings';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/ict-admin/system/settings/:key
     * Update system setting
     */
    static async updateSystemSetting(req, res) {
        try {
            const { key } = req.params;
            const { value, description } = req.body;
            const updatedBy = req.user.id;
            const settingService = new SystemSettingService();
            const setting = await settingService.updateSetting(key, value, updatedBy, description);
            res.json({
                success: true,
                message: 'System setting updated successfully',
                data: setting,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update system setting';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict-admin/system/backup
     * Create system backup
     */
    static async createBackup(req, res) {
        try {
            const { type, description } = req.body;
            const initiatedBy = req.user.id;
            const backupService = new BackupService();
            const backup = await backupService.createBackup(type, initiatedBy, description);
            res.json({
                success: true,
                message: 'Backup initiated successfully',
                data: backup,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create backup';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/ict-admin/system/backups
     * Get all backups
     */
    static async getBackups(req, res) {
        try {
            const { page, limit } = req.query;
            const backupService = new BackupService();
            const result = await backupService.getBackups({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 20,
            });
            res.json({
                success: true,
                data: result.backups,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch backups';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict-admin/system/restore/:backupId
     * Restore from backup
     */
    static async restoreBackup(req, res) {
        try {
            const { backupId } = req.params;
            const { confirmation } = req.body;
            const restoredBy = req.user.id;
            if (confirmation !== 'RESTORE_BACKUP') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid confirmation code',
                });
            }
            const backupService = new BackupService();
            await backupService.restoreBackup(backupId, restoredBy);
            // Emit system status update
            emitSystemStatus('disabled', 'System restore in progress');
            res.json({
                success: true,
                message: 'System restore initiated successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to restore backup';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/ict-admin/audit-logs
     * Get audit logs with filtering
     */
    static async getAuditLogs(req, res) {
        try {
            const { page, limit, action, severity, userId, startDate, endDate } = req.query;
            const userService = new UserService();
            const result = await userService.getAuditLogs({
                page: page ? parseInt(page) : 1,
                limit: limit ? parseInt(limit) : 50,
                action: action,
                severity: severity,
                userId: userId,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });
            res.json({
                success: true,
                data: result.logs,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch audit logs';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict-admin/system/maintenance
     * Toggle system maintenance mode
     */
    static async toggleMaintenanceMode(req, res) {
        try {
            const { enabled, message: maintenanceMessage } = req.body;
            const settingService = new SystemSettingService();
            await settingService.updateSetting('maintenance_mode', enabled.toString(), req.user.id);
            // Emit system status update
            emitSystemStatus(enabled ? 'disabled' : 'enabled', maintenanceMessage);
            res.json({
                success: true,
                message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to toggle maintenance mode';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * PUT /api/ict/system-status
     * Update system enabled/disabled status
     */
    static async updateSystemStatus(req, res) {
        try {
            const { enabled } = req.body;
            const updatedBy = req.user.id;
            const settingService = new SystemSettingService();
            await settingService.updateSetting('system_enabled', enabled.toString(), updatedBy);
            // Emit system status update
            emitSystemStatus(enabled ? 'enabled' : 'disabled', `System ${enabled ? 'enabled' : 'disabled'} by ICT Admin`);
            res.json({
                success: true,
                message: `System ${enabled ? 'enabled' : 'disabled'} successfully`,
                data: { enabled },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update system status';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/ict/system-status
     * Get current system status
     */
    static async getSystemStatus(req, res) {
        try {
            const settingService = new SystemSettingService();
            const enabled = await settingService.getSetting('system_enabled');
            const maintenance = await settingService.getSetting('maintenance_mode');
            res.json({
                success: true,
                data: {
                    enabled: enabled?.value === 'true',
                    maintenance: maintenance?.value === 'true',
                    lastUpdated: new Date().toISOString(),
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch system status';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict/import-voters
     * Import voter data from CSV
     */
    static async importVoters(req, res) {
        try {
            const { voters } = req.body;
            const importedBy = req.user.id;
            const userService = new UserService();
            const result = await userService.bulkImportUsers(voters, importedBy);
            res.json({
                success: true,
                message: 'Voters imported successfully',
                data: {
                    imported: result.imported,
                    failed: result.failed,
                    total: voters.length,
                },
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to import voters';
            res.status(400).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict/reset-votes
     * Clear all votes
     */
    static async resetVotes(req, res) {
        try {
            const { confirmation } = req.body;
            const resetBy = req.user.id;
            if (confirmation !== 'RESET_VOTES') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid confirmation code',
                });
            }
            const voteService = new VoteService();
            await voteService.resetAllVotes(resetBy);
            // Emit system status update
            emitSystemStatus('disabled', 'All votes have been reset');
            res.json({
                success: true,
                message: 'All votes have been reset successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reset votes';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict/reset-voters
     * Reset voter statuses
     */
    static async resetVoterStatuses(req, res) {
        try {
            const { confirmation } = req.body;
            const resetBy = req.user.id;
            if (confirmation !== 'RESET_VOTERS') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid confirmation code',
                });
            }
            const userService = new UserService();
            await userService.resetAllVoterStatuses(resetBy);
            res.json({
                success: true,
                message: 'All voter statuses have been reset successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reset voter statuses';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * POST /api/ict/reset-system
     * Complete system reset
     */
    static async resetSystem(req, res) {
        try {
            const { confirmation } = req.body;
            const resetBy = req.user.id;
            if (confirmation !== 'RESET_SYSTEM') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid confirmation code',
                });
            }
            // Reset votes
            const voteService = new VoteService();
            await voteService.resetAllVotes(resetBy);
            // Reset voter statuses
            const userService = new UserService();
            await userService.resetAllVoterStatuses(resetBy);
            // Emit system status update
            emitSystemStatus('disabled', 'Complete system reset performed');
            res.json({
                success: true,
                message: 'Complete system reset completed successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reset system';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * DELETE /api/ict/cache
     * Clear system cache
     */
    static async clearCache(req, res) {
        try {
            // Clear any cached data (this would depend on your caching implementation)
            // For now, just return success
            res.json({
                success: true,
                message: 'System cache cleared successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to clear cache';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/ict/export
     * Export system data
     */
    static async exportSystemData(req, res) {
        try {
            const userService = new UserService();
            const postService = new ElectionPostService();
            const voteService = new VoteService();
            const [users, posts, votes] = await Promise.all([
                userService.getUsers({ limit: 10000 }),
                postService.getPosts({ limit: 1000 }),
                voteService.getVotes({ limit: 10000 }),
            ]);
            const exportData = {
                timestamp: new Date().toISOString(),
                system_data: {
                    users: users.users,
                    posts: posts.posts,
                    votes: votes.votes,
                },
                metadata: {
                    total_users: users.pagination.total,
                    total_posts: posts.pagination.total,
                    total_votes: votes.pagination.total,
                    exported_by: req.user.id,
                    exported_at: new Date().toISOString(),
                },
            };
            res.json({
                success: true,
                data: exportData,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to export system data';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    /**
     * GET /api/ict/performance-metrics
     * Get system performance data
     */
    static async getPerformanceMetrics(req, res) {
        try {
            const userService = new UserService();
            const postService = new ElectionPostService();
            const voteService = new VoteService();
            const [userStats, postStats, voteStats] = await Promise.all([
                userService.getUserStats(),
                postService.getPostStats(),
                voteService.getVotingStats(),
            ]);
            const metrics = {
                timestamp: new Date().toISOString(),
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                },
                database: {
                    users: userStats,
                    posts: postStats,
                    votes: voteStats,
                },
                performance: {
                    response_time: 'N/A', // Would need middleware to track this
                    throughput: 'N/A', // Would need monitoring system
                    error_rate: 'N/A', // Would need error tracking
                },
            };
            res.json({
                success: true,
                data: metrics,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch performance metrics';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
// Middleware combinations for routes
export const ictAdminRoutesMiddleware = {
    all: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ICT_ADMIN)],
};
