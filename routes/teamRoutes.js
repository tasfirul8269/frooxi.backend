import express from 'express';
import {
  getTeamMembers,
  getTeamMember,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember
} from '../controllers/teamController.js';
import { auth } from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import upload from '../utils/uploadMiddleware.js';
import { validateFileContent, sanitizeFilename } from '../src/middleware/uploadSecurity.js';

const router = express.Router();

// Public routes
router.get('/', getTeamMembers);
router.get('/:id', getTeamMember);

// Protected routes
router.post('/', auth, adminAuth, upload.single('image'), validateFileContent, sanitizeFilename, createTeamMember);
router.put('/:id', auth, adminAuth, upload.single('image'), validateFileContent, sanitizeFilename, updateTeamMember);
router.delete('/:id', auth, adminAuth, deleteTeamMember);

export default router; 