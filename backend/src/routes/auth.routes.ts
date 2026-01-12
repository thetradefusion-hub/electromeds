import express from 'express';
import { body } from 'express-validator';
import { signUp, login, getMe, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Validation rules
const signUpValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role')
    .isIn(['super_admin', 'doctor', 'staff'])
    .withMessage('Invalid role'),
  body('registration_no')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Registration number is required for doctors'),
  body('qualification')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Qualification is required for doctors'),
  body('clinic_name')
    .if(body('role').equals('doctor'))
    .trim()
    .notEmpty()
    .withMessage('Clinic name is required for doctors'),
  body('phone')
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      // Indian phone number validation: 10 digits starting with 6-9, or +91 followed by 10 digits
      const phoneRegex = /^(\+91[6-9]\d{9}|[6-9]\d{9})$/;
      const cleanedPhone = value.replace(/\s+/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        throw new Error('Please provide a valid Indian phone number (10 digits starting with 6-9)');
      }
      return true;
    }),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/signup', signUpValidation, signUp);
router.post('/login', loginValidation, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;

