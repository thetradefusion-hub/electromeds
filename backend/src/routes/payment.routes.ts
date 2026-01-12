import express from 'express';
import { body } from 'express-validator';
import {
  getPayments,
  getPaymentStats,
  createPayment,
} from '../controllers/payment.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createPaymentValidation = [
  body('subscriptionId').notEmpty().withMessage('Subscription ID is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('currency').optional().isString(),
  body('paymentMethod').optional().isString(),
  body('transactionId').optional().isString(),
];

// Routes
router.get('/', authorize('super_admin'), getPayments);
router.get('/stats', authorize('super_admin'), getPaymentStats);
router.post('/', createPaymentValidation, createPayment);

export default router;

