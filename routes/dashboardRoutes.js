import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private (temporarily removed admin check for testing)
router.route('/stats')
  .get(protect, getDashboardStats); // Temporarily removed admin middleware

export default router;
