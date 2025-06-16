import express from 'express';
import {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription
} from '../controllers/subscriptionController.js';
import { auth } from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/', getSubscriptions);
router.get('/:id', getSubscription);

// Protected routes (Admin only)
router.post('/', [auth, adminAuth], createSubscription);
router.put('/:id', [auth, adminAuth], updateSubscription);
router.delete('/:id', [auth, adminAuth], deleteSubscription);

export default router; 