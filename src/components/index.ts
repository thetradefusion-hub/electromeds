/**
 * Components - Centralized exports
 * Main components exported from here for better organization
 */

// Layout components
export { MainLayout } from './layout/MainLayout';
export { Header } from './layout/Header';
export { Sidebar } from './layout/Sidebar';
export { MobileNav } from './layout/MobileNav';
export { MobileDrawer } from './layout/MobileDrawer';

// Common components
export { ErrorBoundary } from './ErrorBoundary';
export { ProtectedRoute } from './ProtectedRoute';
export { LanguageSwitcher } from './LanguageSwitcher';
export { NavLink } from './NavLink';

// Dashboard components
export { StatCard } from './dashboard/StatCard';
export { RecentPatients } from './dashboard/RecentPatients';
export { QuickActions } from './dashboard/QuickActions';
export { ActivityTimeline } from './dashboard/ActivityTimeline';
export { UpcomingFollowups } from './dashboard/UpcomingFollowups';
export { TopMedicines } from './dashboard/TopMedicines';
export { SubscriptionStatus } from './dashboard/SubscriptionStatus';
export { SupportWidget } from './dashboard/SupportWidget';

// Consultation components
export { MedicalReportAnalyzer } from './consultation/MedicalReportAnalyzer';

// Patient components
export { PatientSearchFilters } from './patients/PatientSearchFilters';

// Appointment components
export { AvailabilityManager } from './appointments/AvailabilityManager';

// Notification components
export { NotificationsDropdown } from './notifications/NotificationsDropdown';

// Admin components
export { ClinicAnalytics } from './superadmin/ClinicAnalytics';
export { DoctorsManagement } from './superadmin/DoctorsManagement';
export { SymptomsManagement } from './superadmin/SymptomsManagement';
export { MedicinesManagement } from './superadmin/MedicinesManagement';
export { RulesManagement } from './superadmin/RulesManagement';
export { UserRolesManagement } from './superadmin/UserRolesManagement';
export { AISettingsManagement } from './superadmin/AISettingsManagement';
export { DoctorPerformance } from './superadmin/DoctorPerformance';
export { ActivityFeed } from './superadmin/ActivityFeed';

// SaaS Admin components
export { RevenueAnalytics } from './saas-admin/RevenueAnalytics';
export { SubscribersManagement } from './saas-admin/SubscribersManagement';
export { SupportTickets } from './saas-admin/SupportTickets';

