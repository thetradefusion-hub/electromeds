import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  assignDoctorToStaff,
  unassignDoctorFromStaff,
  createStaffByAdmin,
  getAllDoctors,
  updateDoctor,
  getGlobalMedicines,
  createGlobalMedicine,
  updateGlobalMedicine,
  deleteGlobalMedicine,
  getGlobalSymptoms,
  createGlobalSymptom,
  updateGlobalSymptom,
  deleteGlobalSymptom,
  getPlatformStats,
  getAllSubscriptions,
} from '../controllers/admin.controller.js';
import {
  getAISettings,
  updateAISettings,
  deleteAISettings,
} from '../controllers/aiSettings.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// Validation rules
const updateRoleValidation = [
  body('role')
    .isIn(['super_admin', 'doctor', 'staff'])
    .withMessage('Invalid role'),
];

const updateStatusValidation = [
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
];

const assignDoctorValidation = [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
];

const createStaffValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
];

const createMedicineValidation = [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

const createSymptomValidation = [
  body('name').trim().notEmpty().withMessage('Symptom name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

// User Management Routes
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateRoleValidation, updateUserRole);
router.put('/users/:id/status', updateStatusValidation, updateUserStatus);
router.put('/users/:id/assign-doctor', assignDoctorValidation, assignDoctorToStaff);
router.put('/users/:id/unassign-doctor', unassignDoctorFromStaff);
router.post('/staff', createStaffValidation, createStaffByAdmin);

// Doctor Management Routes
router.get('/doctors', getAllDoctors);
router.put('/doctors/:id', updateDoctor);

// Global Medicines Routes
router.get('/global-medicines', getGlobalMedicines);
router.post('/global-medicines', createMedicineValidation, createGlobalMedicine);
router.put('/global-medicines/:id', updateGlobalMedicine);
router.delete('/global-medicines/:id', deleteGlobalMedicine);

// Global Symptoms Routes
router.get('/global-symptoms', getGlobalSymptoms);
router.post('/global-symptoms', createSymptomValidation, createGlobalSymptom);
router.put('/global-symptoms/:id', updateGlobalSymptom);
router.delete('/global-symptoms/:id', deleteGlobalSymptom);

// Platform Statistics
router.get('/stats', getPlatformStats);

// Subscription Management Routes
router.get('/subscriptions', getAllSubscriptions);

// AI Settings Routes
router.get('/ai-settings', getAISettings);
router.post('/ai-settings', updateAISettings);
router.delete('/ai-settings', deleteAISettings);

export default router;

