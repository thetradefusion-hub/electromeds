import express from 'express';
import { body } from 'express-validator';
import {
  getMedicineRules,
  getMedicineRule,
  createMedicineRule,
  updateMedicineRule,
  deleteMedicineRule,
  suggestMedicines,
} from '../controllers/medicineRule.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin and doctor can access medicine rules
router.use(authorize('super_admin', 'doctor'));

// Validation rules
const createRuleValidation = [
  body('name').trim().notEmpty().withMessage('Rule name is required'),
  body('symptomIds').isArray().withMessage('Symptom IDs must be an array'),
  body('medicineIds').isArray().withMessage('Medicine IDs must be an array'),
  body('dosage').trim().notEmpty().withMessage('Dosage is required'),
  body('duration').trim().notEmpty().withMessage('Duration is required'),
];

const suggestValidation = [
  body('symptomIds')
    .isArray({ min: 1 })
    .withMessage('At least one symptom ID is required'),
];

// Routes
router.get('/', getMedicineRules);
router.get('/:id', getMedicineRule);
router.post('/', createRuleValidation, createMedicineRule);
router.put('/:id', updateMedicineRule);
router.delete('/:id', deleteMedicineRule);
router.post('/suggest', suggestValidation, suggestMedicines);

export default router;

