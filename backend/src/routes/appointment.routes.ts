import express from 'express';
import { body } from 'express-validator';
import {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailability,
  setAvailability,
  getBlockedDates,
  blockDate,
  unblockDate,
} from '../controllers/appointment.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only super_admin, doctor, and staff can access appointment routes
router.use(authorize('super_admin', 'doctor', 'staff'));

// Validation rules
const createAppointmentValidation = [
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeSlot').trim().notEmpty().withMessage('Time slot is required'),
  body('bookingType')
    .optional()
    .isIn(['online', 'walk_in', 'phone'])
    .withMessage('Invalid booking type'),
  body('status')
    .optional()
    .isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show'])
    .withMessage('Invalid status'),
];

const setAvailabilityValidation = [
  body('dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be 0-6 (0=Sunday, 6=Saturday)'),
  body('startTime')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:mm format'),
  body('endTime')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:mm format'),
];

// Appointment routes
router.get('/', getAppointments);
router.get('/availability', getAvailability);
router.post('/availability', setAvailabilityValidation, setAvailability);
router.get('/blocked-dates', getBlockedDates);
router.post('/blocked-dates', blockDate);
router.delete('/blocked-dates/:id', unblockDate);
router.get('/:id', getAppointment);
router.post('/', createAppointmentValidation, createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
