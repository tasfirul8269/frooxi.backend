import express from 'express';
import { 
  submitContactForm, 
  getContacts, 
  getContact, 
  deleteContact, 
  toggleReadStatus 
} from '../controllers/contactController.js';
import { validateContact } from '../middleware/validateContact.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/', validateContact, submitContactForm);

// Protected admin routes
router.get('/', protect, admin, getContacts);
router.get('/:id', protect, admin, getContact);
router.delete('/:id', protect, admin, deleteContact);
router.patch('/:id/read', protect, admin, toggleReadStatus);

export default router;
