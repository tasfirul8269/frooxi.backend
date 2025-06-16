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

const router = express.Router();

// Public routes
router.get('/', getPortfolios);
router.get('/:id', getPortfolio);

// Protected routes (Admin only)
router.post('/', [auth, adminAuth, upload.single('image')], createPortfolio);
router.put('/:id', [auth, adminAuth, upload.single('image')], updatePortfolio);
router.patch('/:id/featured', [auth, adminAuth], toggleFeatured);
router.delete('/:id', [auth, adminAuth], deletePortfolio);

export default router;