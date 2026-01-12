import express from 'express';
import {
  getDashboardStats,
  getPatientAnalytics,
  getPrescriptionAnalytics,
  getAppointmentAnalytics,
  getRevenueAnalytics,
} from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin and doctor can access analytics
router.use(authorize('super_admin', 'doctor'));

// Routes
router.get('/dashboard', getDashboardStats);
router.get('/patients', getPatientAnalytics);
router.get('/prescriptions', getPrescriptionAnalytics);
router.get('/appointments', getAppointmentAnalytics);
router.get('/revenue', getRevenueAnalytics);

export default router;
