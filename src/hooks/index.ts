/**
 * Custom Hooks - Centralized exports
 * All custom hooks are exported from here for better organization
 */

// Auth hooks
export { useAuth, AuthProvider } from './useAuth';

// Data fetching hooks
export { usePatients } from './usePatients';
export { useAppointments } from './useAppointments';
export { usePrescriptions } from './usePrescriptions';
export { usePrescriptionTemplates } from './usePrescriptionTemplates';
export { useSymptoms } from './useSymptoms';
export { useMedicines } from './useMedicines';
export { useMedicineSuggestions } from './useMedicineSuggestions';
export { useFollowUps } from './useFollowUps';
export { useDoctor } from './useDoctor';
export { useNotifications } from './useNotifications';
export { useSubscription } from './useSubscription';

// Analytics hooks
export { useAnalytics } from './useAnalytics';
export { useDashboardStats } from './useDashboardStats';
export { useSaasAdmin } from './useSaasAdmin';

// Utility hooks
export { useApiError } from './useApiError';
export { useWhatsAppShare } from './useWhatsAppShare';
export { useMobile } from './use-mobile';
export { useToast } from './use-toast';

