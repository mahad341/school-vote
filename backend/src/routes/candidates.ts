import { Router } from 'express';
import { CandidateController, candidateRoutesMiddleware } from '../controllers/CandidateController.js';
import multer from 'multer';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Configure multer for photo uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = process.env.UPLOAD_PATH || './uploads';
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `candidate-${uniqueSuffix}${require('path').extname(file.originalname)}`);
    }
  }),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// GET /api/candidates - Get all candidates
router.get('/', candidateRoutesMiddleware.getAll, CandidateController.getAllCandidates);

// GET /api/candidates/:id - Get candidate by ID
router.get('/:id', candidateRoutesMiddleware.getById, CandidateController.getCandidateById);

// POST /api/candidates - Create new candidate (admin/ICT admin only)
router.post('/', candidateRoutesMiddleware.create, CandidateController.createCandidate);

// PUT /api/candidates/:id - Update candidate (admin/ICT admin only)
router.put('/:id', candidateRoutesMiddleware.update, CandidateController.updateCandidate);

// DELETE /api/candidates/:id - Delete candidate (admin/ICT admin only)
router.delete('/:id', candidateRoutesMiddleware.delete, CandidateController.deleteCandidate);

// PUT /api/candidates/:id/status - Update candidate status (admin/ICT admin only)
router.put('/:id/status', candidateRoutesMiddleware.updateStatus, CandidateController.updateCandidateStatus);

// POST /api/candidates/:id/photo - Upload candidate photo (admin/ICT admin only)
router.post('/:id/photo', uploadLimiter, candidateRoutesMiddleware.uploadPhoto, upload.single('photo'), CandidateController.uploadPhoto);

// GET /api/candidates/:id/votes - Get vote count for candidate
router.get('/:id/votes', candidateRoutesMiddleware.getVotes, CandidateController.getCandidateVotes);

export default router;