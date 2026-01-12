import express from 'express';
import { body } from 'express-validator';
import {
  getSymptoms,
  getSymptom,
  createSymptom,
  updateSymptom,
  deleteSymptom,
} from '../controllers/symptom.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin and doctor can access symptom routes
router.use(authorize('super_admin', 'doctor'));

// Validation rules
const createSymptomValidation = [
  body('name').trim().notEmpty().withMessage('Symptom name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

// Routes
router.get('/', getSymptoms);
router.get('/:id', getSymptom);
router.post('/', createSymptomValidation, createSymptom);
router.put('/:id', updateSymptom);
router.delete('/:id', deleteSymptom);

export default router;

