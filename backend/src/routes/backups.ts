import { Router } from 'express';
import { BackupController, backupRoutesMiddleware } from '../controllers/BackupController.js';

const router = Router();

// POST /api/backups - Create a new backup (ICT admin only)
router.post('/', backupRoutesMiddleware.create, BackupController.createBackup);

// GET /api/backups - Get all backups (admin/ICT admin)
router.get('/', backupRoutesMiddleware.getAll, BackupController.getAllBackups);

// GET /api/backups/stats - Get backup statistics (admin/ICT admin)
router.get('/stats', backupRoutesMiddleware.getStats, BackupController.getBackupStats);

// POST /api/backups/cleanup - Clean up old backups (ICT admin only)
router.post('/cleanup', backupRoutesMiddleware.cleanup, BackupController.cleanupBackups);

// GET /api/backups/:id - Get backup by ID (admin/ICT admin)
router.get('/:id', backupRoutesMiddleware.getById, BackupController.getBackupById);

// POST /api/backups/:id/restore - Restore from backup (ICT admin only)
router.post('/:id/restore', backupRoutesMiddleware.restore, BackupController.restoreBackup);

// DELETE /api/backups/:id - Delete backup (ICT admin only)
router.delete('/:id', backupRoutesMiddleware.delete, BackupController.deleteBackup);

export default router;