import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createTransaction,
  getTransactions,
  getTransactionSummary,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// Routes for /api/transactions
router
  .route('/')
  .post(createTransaction)
  .get(getTransactions);

// Routes for /api/transactions/summary
router.get('/summary', getTransactionSummary);

// Routes for /api/transactions/:id
router
  .route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

export default router;
