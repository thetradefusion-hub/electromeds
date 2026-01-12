import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown } from 'lucide-react';
import DoctorsManagement from '@/components/superadmin/DoctorsManagement';
import ClinicAnalytics from '@/components/superadmin/ClinicAnalytics';
import SymptomsManagement from '@/components/superadmin/SymptomsManagement';
import MedicinesManagement from '@/components/superadmin/MedicinesManagement';
import RulesManagement from '@/components/superadmin/RulesManagement';
import ActivityFeed from '@/components/superadmin/ActivityFeed';
import DoctorPerformance from '@/components/superadmin/DoctorPerformance';
import UserRolesManagement from '@/components/superadmin/UserRolesManagement';
import AISettingsManagement from '@/components/superadmin/AISettingsManagement';
import SubscriptionManagement from '@/components/superadmin/SubscriptionManagement';
import { cn } from '@/lib/utils';

const SuperAdmin = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('analytics');

  // Set active tab from URL hash
  useEffect(() => {
    if (location.hash) {
      const tabFromHash = location.hash.substring(1); // Remove #
      if (tabFromHash && ['analytics', 'activity', 'performance', 'doctors', 'symptoms', 'medicines', 'rules', 'roles', 'ai-settings', 'subscriptions'].includes(tabFromHash)) {
        setActiveTab(tabFromHash);
      }
    } else {
      // If no hash, default to analytics
      setActiveTab('analytics');
    }
  }, [location.hash, location.pathname]);

  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL hash without page reload
    window.history.replaceState(null, '', `/admin#${value}`);
  };


  return (
    <MainLayout title="Super Admin" subtitle="Manage doctors, analytics, and global configurations">
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <Crown className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Super Admin Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Platform management and analytics</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">

          <TabsContent value="analytics" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <ClinicAnalytics />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <div className="grid gap-6 lg:grid-cols-2 animate-in fade-in-50 duration-300">
              <ActivityFeed />
              <div className="space-y-6">
                <DoctorPerformance />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <DoctorPerformance />
            </div>
          </TabsContent>

          <TabsContent value="doctors" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <DoctorsManagement />
            </div>
          </TabsContent>

          <TabsContent value="symptoms" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <SymptomsManagement />
            </div>
          </TabsContent>

          <TabsContent value="medicines" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <MedicinesManagement />
            </div>
          </TabsContent>

          <TabsContent value="rules" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <RulesManagement />
            </div>
          </TabsContent>

          <TabsContent value="roles" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <UserRolesManagement />
            </div>
          </TabsContent>

          <TabsContent value="ai-settings" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <AISettingsManagement />
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <SubscriptionManagement />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SuperAdmin;
