import express from 'express';
import { body } from 'express-validator';
import {
  getMedicalReports,
  getMedicalReport,
  createMedicalReport,
  updateMedicalReport,
  deleteMedicalReport,
} from '../controllers/medicalReport.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin and doctor can access medical report routes
router.use(authorize('super_admin', 'doctor'));

// Validation rules
const createReportValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('reportType').trim().notEmpty().withMessage('Report type is required'),
  body('fileName').trim().notEmpty().withMessage('File name is required'),
  body('fileUrl').optional().trim(), // Optional - file storage not required
  body('analysis').notEmpty().withMessage('Analysis is required'),
];

// Routes
router.get('/', getMedicalReports);
router.get('/:id', getMedicalReport);
router.post('/', createReportValidation, createMedicalReport);
router.put('/:id', updateMedicalReport);
router.delete('/:id', deleteMedicalReport);

export default router;

