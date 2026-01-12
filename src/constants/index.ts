/**
 * Application Constants
 * Centralized constants for better maintainability
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000,
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  DOCTOR: 'doctor',
  STAFF: 'staff',
} as const;

// Patient Case Types
export const CASE_TYPES = {
  NEW: 'new',
  OLD: 'old',
} as const;

// Symptom Severity Levels
export const SYMPTOM_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

// Appointment Status
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Prescription Status
export const PRESCRIPTION_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
} as const;

// Support Ticket Priority
export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Support Ticket Status
export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  FULL: 'dd MMMM yyyy',
  WITH_TIME: 'dd MMM yyyy, HH:mm',
  ISO: 'yyyy-MM-dd',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
} as const;

// Common Symptoms (for quick selection)
export const COMMON_SYMPTOMS = [
  'Fever',
  'Headache',
  'Body Pain',
  'Cold & Cough',
  'Weakness',
  'Acidity',
  'Joint Pain',
  'Skin Problem',
  'Digestive Issue',
  'Anxiety',
] as const;

// Routes
export const ROUTES = {
  LANDING: '/landing',
  AUTH: '/auth',
  DASHBOARD: '/',
  PATIENTS: '/patients',
  NEW_PATIENT: '/patients/new',
  PATIENT_HISTORY: '/patients/history',
  CONSULTATION: '/consultation',
  PRESCRIPTIONS: '/prescriptions',
  APPOINTMENTS: '/appointments',
  BOOK_APPOINTMENT: '/book',
  MEDICINES: '/medicines',
  SYMPTOMS: '/symptoms',
  RULES: '/rules',
  ANALYTICS: '/analytics',
  FOLLOW_UPS: '/follow-ups',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  SAAS_ADMIN: '/saas-admin',
} as const;

