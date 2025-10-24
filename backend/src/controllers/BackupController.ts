import { Request, Response } from 'express';
import { BackupService } from '../services/BackupService.js';
import { AuthMiddleware } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

export class BackupController {
  /**
   * POST /api/backups
   * Create a new backup
   */
  static async createBackup(req: Request, res: Response) {
    try {
      const { type, description } = req.body;
      const initiatedBy = req.user!.id;
      const backupService = new BackupService();

      const backup = await backupService.createBackup(type, initiatedBy, description);

      res.status(201).json({
        success: true,
        message: 'Backup initiated successfully',
        data: backup,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create backup';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * GET /api/backups
   * Get all backups
   */
  static async getAllBackups(req: Request, res: Response) {
    try {
      const { page, limit } = req.query;
      const backupService = new BackupService();

      const result = await backupService.getBackups({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.json({
        success: true,
        data: result.backups,
        pagination: result.pagination,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch backups';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * GET /api/backups/:id
   * Get backup by ID
   */
  static async getBackupById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const backupService = new BackupService();
      const backup = await backupService.getBackupById(id);

      if (!backup) {
        return res.status(404).json({
          success: false,
          message: 'Backup not found',
        });
      }

      res.json({
        success: true,
        data: backup,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch backup';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * POST /api/backups/:id/restore
   * Restore from backup
   */
  static async restoreBackup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { confirmation } = req.body;
      const restoredBy = req.user!.id;

      if (confirmation !== 'RESTORE_BACKUP') {
        return res.status(400).json({
          success: false,
          message: 'Invalid confirmation code. Use "RESTORE_BACKUP" to confirm.',
        });
      }

      const backupService = new BackupService();
      await backupService.restoreBackup(id, restoredBy);

      res.json({
        success: true,
        message: 'System restore initiated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore backup';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * DELETE /api/backups/:id
   * Delete backup
   */
  static async deleteBackup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletedBy = req.user!.id;
      const backupService = new BackupService();

      await backupService.deleteBackup(id, deletedBy);

      res.json({
        success: true,
        message: 'Backup deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete backup';
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * GET /api/backups/stats
   * Get backup statistics
   */
  static async getBackupStats(req: Request, res: Response) {
    try {
      const backupService = new BackupService();
      const stats = await backupService.getBackupStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch backup stats';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * POST /api/backups/cleanup
   * Clean up old backups
   */
  static async cleanupBackups(req: Request, res: Response) {
    try {
      const { retentionDays } = req.body;
      const backupService = new BackupService();

      const deletedCount = await backupService.cleanupOldBackups(retentionDays || 30);

      res.json({
        success: true,
        message: `Cleanup completed. ${deletedCount} old backups deleted.`,
        data: { deletedCount },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cleanup backups';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

// Middleware combinations for routes
export const backupRoutesMiddleware = {
  create: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ICT_ADMIN)],
  getAll: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
  getById: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
  restore: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ICT_ADMIN)],
  delete: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ICT_ADMIN)],
  getStats: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ADMIN, UserRole.ICT_ADMIN)],
  cleanup: [AuthMiddleware.authenticate, AuthMiddleware.requireRole(UserRole.ICT_ADMIN)],
};