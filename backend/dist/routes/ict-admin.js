import { Router } from 'express';
import { ICTAdminController, ictAdminRoutesMiddleware } from '../controllers/ICTAdminController.js';
const router = Router();
// Apply ICT admin authentication to all routes
router.use(ictAdminRoutesMiddleware.all);
// GET /api/ict-admin/dashboard - Get ICT admin dashboard overview
router.get('/dashboard', ICTAdminController.getDashboard);
// GET /api/ict-admin/users - Get all users with advanced filtering
router.get('/users', ICTAdminController.getAllUsers);
// POST /api/ict-admin/users/bulk-import - Bulk import users from CSV
router.post('/users/bulk-import', ICTAdminController.bulkImportUsers);
// PUT /api/ict-admin/users/:id/role - Update user role
router.put('/users/:id/role', ICTAdminController.updateUserRole);
// PUT /api/ict-admin/users/:id/status - Update user status (suspend/activate)
router.put('/users/:id/status', ICTAdminController.updateUserStatus);
// POST /api/ict-admin/system/reset-votes - Reset all votes (emergency function)
router.post('/system/reset-votes', ICTAdminController.resetAllVotes);
// GET /api/ict-admin/system/settings - Get all system settings
router.get('/system/settings', ICTAdminController.getSystemSettings);
// PUT /api/ict-admin/system/settings/:key - Update system setting
router.put('/system/settings/:key', ICTAdminController.updateSystemSetting);
// POST /api/ict-admin/system/backup - Create system backup
router.post('/system/backup', ICTAdminController.createBackup);
// GET /api/ict-admin/system/backups - Get all backups
router.get('/system/backups', ICTAdminController.getBackups);
// POST /api/ict-admin/system/restore/:backupId - Restore from backup
router.post('/system/restore/:backupId', ICTAdminController.restoreBackup);
// GET /api/ict-admin/audit-logs - Get audit logs with filtering
router.get('/audit-logs', ICTAdminController.getAuditLogs);
// POST /api/ict-admin/system/maintenance - Toggle system maintenance mode
router.post('/system/maintenance', ICTAdminController.toggleMaintenanceMode);
export default router;
