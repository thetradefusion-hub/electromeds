import express from 'express';
import { body } from 'express-validator';
import { analyzeMedicalReport } from '../controllers/aiAnalysis.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only doctors can analyze reports
router.use(authorize('doctor', 'super_admin'));

// Validation rules
const analyzeValidation = [
  body('imageBase64').notEmpty().withMessage('Image base64 is required'),
  body('reportType').optional().isString(),
  body('mimeType').optional().isString(),
];

// Routes
router.post('/analyze-report', analyzeValidation, analyzeMedicalReport);

export default router;

