import express from 'express';
import { body } from 'express-validator';
import {
  getPrescriptionTemplates,
  getPrescriptionTemplate,
  createPrescriptionTemplate,
  updatePrescriptionTemplate,
  deletePrescriptionTemplate,
} from '../controllers/prescriptionTemplate.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin and doctor can access prescription template routes
router.use(authorize('super_admin', 'doctor'));

// Validation rules
const createTemplateValidation = [
  body('name').trim().notEmpty().withMessage('Template name is required'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('medicines').optional().isArray().withMessage('Medicines must be an array'),
];

// Routes
router.get('/', getPrescriptionTemplates);
router.get('/:id', getPrescriptionTemplate);
router.post('/', createTemplateValidation, createPrescriptionTemplate);
router.put('/:id', updatePrescriptionTemplate);
router.delete('/:id', deletePrescriptionTemplate);

export default router;

