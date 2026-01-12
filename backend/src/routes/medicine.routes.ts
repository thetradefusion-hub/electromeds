import express from 'express';
import { body } from 'express-validator';
import {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from '../controllers/medicine.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin and doctor can access medicine routes
router.use(authorize('super_admin', 'doctor'));

// Validation rules
const createMedicineValidation = [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

// Routes
router.get('/', getMedicines);
router.get('/:id', getMedicine);
router.post('/', createMedicineValidation, createMedicine);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

export default router;

