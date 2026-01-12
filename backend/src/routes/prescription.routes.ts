import express from 'express';
import { body } from 'express-validator';
import {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescription.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin and doctor can access prescription routes
router.use(authorize('super_admin', 'doctor'));

// Validation rules
const createPrescriptionValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('symptoms')
    .isArray({ min: 1 })
    .withMessage('At least one symptom is required'),
  body('medicines')
    .isArray({ min: 1 })
    .withMessage('At least one medicine is required'),
];

// Routes
router.get('/', getPrescriptions);
router.get('/:id', getPrescription);
router.post('/', createPrescriptionValidation, createPrescription);
router.put('/:id', updatePrescription);
router.delete('/:id', deletePrescription);

export default router;

