import express from 'express';
import {
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  toggleFeatured
} from '../controllers/portfolioController.js';
import { auth } from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../utils/uploadMiddleware.js';
import { validateFileContent, sanitizeFilename } from '../src/middleware/uploadSecurity.js';

const router = express.Router();

// Public routes
router.get('/', getPortfolios);
router.get('/:id', getPortfolio);

// Protected routes (Admin only)
router.post('/', [auth, adminAuth, upload.single('image'), validateFileContent, sanitizeFilename], createPortfolio);
router.put('/:id', [auth, adminAuth, upload.single('image'), validateFileContent, sanitizeFilename], updatePortfolio);
router.patch('/:id/featured', [auth, adminAuth], toggleFeatured);
router.delete('/:id', [auth, adminAuth], deletePortfolio);

export default router;