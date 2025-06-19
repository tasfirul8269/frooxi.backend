import express from 'express';
import { body } from 'express-validator';
import {
  createConsultation,
  getConsultations,
  updateConsultationStatus,
  addConsultationNote
} from '../controllers/consultationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation middleware
const validateConsultation = [
  body('name', 'Name is required')
    .notEmpty()
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email', 'Please include a valid email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 }),
    
  body('location', 'Location is required')
    .notEmpty()
    .trim()
    .escape()
    .isLength({ min: 2, max: 255 }),
    
  body('whatsapp', 'WhatsApp number is required')
    .notEmpty()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Please enter a valid WhatsApp number'),
    
  body('website', 'Please enter a valid URL')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Please enter a valid URL')
    .trim(),
    
  body('projectDetails', 'Project details are required')
    .notEmpty()
    .trim()
    .isLength({ min: 20 })
    .withMessage('Please provide more details about your project (at least 20 characters)')
];

// Public routes
router.post('/', validateConsultation, createConsultation);

// Protected admin routes
router.get('/', protect, admin, getConsultations);
router.put('/:id/status', protect, admin, updateConsultationStatus);
router.post('/:id/notes', protect, admin, addConsultationNote);

export default router;
