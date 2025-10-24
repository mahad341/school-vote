import { Router } from 'express';
import { ElectionPostController, postRoutesMiddleware } from '../controllers/ElectionPostController.js';
const router = Router();
// GET /api/posts - Get all election posts
router.get('/', postRoutesMiddleware.getAll, ElectionPostController.getAllPosts);
// GET /api/posts/:id - Get election post by ID
router.get('/:id', postRoutesMiddleware.getById, ElectionPostController.getPostById);
// POST /api/posts - Create new election post (admin/ICT admin only)
router.post('/', postRoutesMiddleware.create, ElectionPostController.createPost);
// PUT /api/posts/:id - Update election post (admin/ICT admin only)
router.put('/:id', postRoutesMiddleware.update, ElectionPostController.updatePost);
// DELETE /api/posts/:id - Delete election post (admin/ICT admin only)
router.delete('/:id', postRoutesMiddleware.delete, ElectionPostController.deletePost);
// PUT /api/posts/:id/status - Activate/deactivate election post (admin/ICT admin only)
router.put('/:id/status', postRoutesMiddleware.updateStatus, ElectionPostController.updatePostStatus);
// GET /api/posts/:id/results - Get election results for a post
router.get('/:id/results', postRoutesMiddleware.getResults, ElectionPostController.getPostResults);
export default router;
