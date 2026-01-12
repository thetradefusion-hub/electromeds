import express from 'express';
import { body } from 'express-validator';
import {
  getSupportTickets,
  getSupportTicket,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
} from '../controllers/supportTicket.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// All authenticated users can access support ticket routes
// Authorization is handled in controllers

// Validation rules
const createTicketValidation = [
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').optional().isIn(['general', 'billing', 'technical', 'feature_request', 'bug']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
];

// Routes
router.get('/', getSupportTickets);
router.get('/:id', getSupportTicket);
router.post('/', createTicketValidation, createSupportTicket);
router.put('/:id', updateSupportTicket);
router.delete('/:id', authorize('super_admin'), deleteSupportTicket);

export default router;

