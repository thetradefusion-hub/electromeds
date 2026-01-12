import { MainLayout } from '@/components/layout/MainLayout';
import { StaffManagement } from '@/components/dashboard/StaffManagement';

export default function StaffManagementPage() {
  return (
    <MainLayout title="Staff Management" subtitle="Manage your clinic staff members">
      <div className="space-y-4 sm:space-y-6">
        <StaffManagement />
      </div>
    </MainLayout>
  );
}

