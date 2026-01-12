/**
 * API Services - Centralized exports
 * All API services are exported from here for better organization
 */

// Base API client and types
export { default as api, type ApiResponse, type ApiError } from '../api';

// Auth API
export { authApi, type SignUpData, type LoginData, type AuthResponse, type User } from './auth.api';

// Patient API
export { patientApi, type Patient, type PatientFormData } from './patient.api';

// Doctor API
export { doctorApi, type Doctor, type UpdateDoctorProfileData } from './doctor.api';

// Appointment API
export {
  appointmentApi,
  type Appointment,
  type CreateAppointmentData,
  type DoctorAvailability,
  type BlockedDate,
} from './appointment.api';

// Prescription API
export {
  prescriptionApi,
  type Prescription,
  type CreatePrescriptionData,
  type PrescriptionSymptom,
  type PrescriptionMedicine,
} from './prescription.api';

// Prescription Template API
export {
  prescriptionTemplateApi,
  type PrescriptionTemplate,
  type CreateTemplateData,
} from './prescriptionTemplate.api';

// Symptom API
export { symptomApi, type Symptom, type SymptomFormData } from './symptom.api';

// Medicine API
export { medicineApi, type Medicine, type MedicineFormData } from './medicine.api';

// Medicine Rule API
export {
  medicineRuleApi,
  type MedicineRule,
  type MedicineRuleFormData,
  type MedicineSuggestion,
} from './medicineRule.api';

// Medical Report API
export {
  medicalReportApi,
  type MedicalReport,
  type CreateReportData,
  type AIAnalysisResult,
} from './medicalReport.api';

// Analytics API
export {
  analyticsApi,
  type DashboardStats,
  type AppointmentAnalytics,
  type PrescriptionAnalytics,
  type RevenueAnalytics,
} from './analytics.api';

// Admin API
export {
  adminApi,
  type PlatformStats,
  type DoctorStats,
  type ActivityLog,
} from './admin.api';

// AI Settings API
export {
  aiSettingsApi,
  type AISettings,
  type AISettingsFormData,
} from './aiSettings.api';

// AI Analysis API
export { aiAnalysisApi, type AIAnalysisRequest, type AIAnalysisResponse } from './aiAnalysis.api';

// Subscription API
export {
  subscriptionApi,
  type Subscription,
  type SubscriptionPlan,
  type UsageStats,
} from './subscription.api';

// Support Ticket API
export {
  supportTicketApi,
  type SupportTicket,
  type CreateTicketData,
  type TicketMessage,
} from './supportTicket.api';

