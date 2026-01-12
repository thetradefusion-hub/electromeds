import express from 'express';
import { body } from 'express-validator';
import {
  getMySubscription,
  getUsageStats,
  getSubscriptionPlans,
  createSubscription,
  cancelSubscription,
} from '../controllers/subscription.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only doctors can access subscription routes
router.use(authorize('doctor', 'super_admin'));

// Validation rules
const createSubscriptionValidation = [
  body('planId').notEmpty().withMessage('Plan ID is required'),
  body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle'),
];

// Routes
router.get('/me', getMySubscription);
router.get('/usage', getUsageStats);
router.get('/plans', getSubscriptionPlans);
router.post('/', createSubscriptionValidation, createSubscription);
router.put('/:id/cancel', cancelSubscription);

export default router;

