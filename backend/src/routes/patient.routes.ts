import express from 'express';
import { body } from 'express-validator';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  recordVisit,
} from '../controllers/patient.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin, doctor, and staff can access patient routes
router.use(authorize('super_admin', 'doctor', 'staff'));

// Validation rules
const createPatientValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  body('mobile')
    .matches(/^[0-9]{10}$/)
    .withMessage('Mobile must be 10 digits'),
  body('caseType')
    .optional()
    .isIn(['new', 'old'])
    .withMessage('Invalid case type'),
];

// Routes
router.get('/', getPatients);
router.get('/:id', getPatient);
router.post('/', createPatientValidation, createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);
router.patch('/:id/visit', recordVisit);

export default router;

