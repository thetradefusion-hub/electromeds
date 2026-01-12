import express from 'express';
import { body } from 'express-validator';
import { 
  getPublicDoctors, 
  getMyProfile, 
  updateMyProfile,
  createStaff,
  getMyStaff,
  updateStaffStatus,
} from '../controllers/doctor.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route (no auth required)
router.get('/public', getPublicDoctors);

// All other routes require authentication
router.use(authenticate);

// Only doctors can access their profile
router.use(authorize('super_admin', 'doctor'));

// Validation rules
const updateProfileValidation = [
  body('qualification').optional().trim().notEmpty(),
  body('specialization').optional().trim().notEmpty(),
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
];

const createStaffValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
];

const updateStaffStatusValidation = [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];

// Routes
router.get('/me', getMyProfile);
router.put('/me', updateProfileValidation, updateMyProfile);

// Staff Management Routes (Doctor only)
router.post('/staff', createStaffValidation, createStaff);
router.get('/staff', getMyStaff);
router.put('/staff/:id/status', updateStaffStatusValidation, updateStaffStatus);

export default router;
