import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { UpcomingFollowups } from '@/components/dashboard/UpcomingFollowups';
import { TopMedicines } from '@/components/dashboard/TopMedicines';
import { SubscriptionStatus } from '@/components/dashboard/SubscriptionStatus';
import { SupportWidget } from '@/components/dashboard/SupportWidget';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDoctor } from '@/hooks/useDoctor';
import { Users, UserPlus, CalendarCheck, FileText, AlertCircle, Loader2, Stethoscope, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { doctorId, doctorInfo, loading: doctorLoading } = useDoctor();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(doctorId ?? undefined);

  const isLoading = doctorLoading || statsLoading;
  const doctorName = doctorInfo?.name || 'Doctor';

  return (
    <MainLayout title="Dashboard" subtitle={`Welcome back, ${doctorName}`}>
      <div className="space-y-4 sm:space-y-6">
        {/* Enhanced Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-4 sm:p-6 shadow-sm">
          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome back, {doctorName}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Here's what's happening at your clinic today
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Active</span>
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Subscription Status Banner */}
        <div>
          <SubscriptionStatus />
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <div className="animate-in fade-in-50 duration-300" style={{ animationDelay: '0ms' }}>
            <StatCard
              title="Total Patients"
              value={isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : stats?.totalPatients ?? 0}
              subtitle="All time"
              icon={Users}
              variant="primary"
            />
          </div>
          <div className="animate-in fade-in-50 duration-300" style={{ animationDelay: '100ms' }}>
            <StatCard
              title="Today's Patients"
              value={isLoading ? <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> : stats?.todayPatients ?? 0}
              subtitle="Consultations"
              icon={UserPlus}
              variant="accent"
            />
          </div>
          <div className="animate-in fade-in-50 duration-300" style={{ animationDelay: '200ms' }}>
            <StatCard
              title="Follow-ups"
              value={isLoading ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : stats?.pendingFollowUps ?? 0}
              subtitle="This week"
              icon={CalendarCheck}
              variant="warning"
            />
          </div>
          <div className="animate-in fade-in-50 duration-300" style={{ animationDelay: '300ms' }}>
            <StatCard
              title="Prescriptions"
              value={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.totalPrescriptions ?? 0}
              subtitle="Total"
              icon={FileText}
            />
          </div>
        </div>

        {/* Enhanced Disclaimer Banner */}
        <div className="relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 p-4 sm:p-5 shadow-sm">
          <div className="relative z-10 flex items-start gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm sm:text-base font-semibold text-foreground mb-1">Medical Disclaimer</p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                This software provides suggestions based on symptoms. Final prescription decision lies with the doctor.
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Left Column - Recent Patients & Activity */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="animate-in fade-in-50 duration-500" style={{ animationDelay: '400ms' }}>
              <RecentPatients />
            </div>
            <div className="animate-in fade-in-50 duration-500" style={{ animationDelay: '500ms' }}>
              <ActivityTimeline />
            </div>
          </div>

          {/* Right Column - Quick Actions, Follow-ups, Support */}
          <div className="space-y-4 sm:space-y-6">
            <div className="animate-in fade-in-50 duration-500" style={{ animationDelay: '400ms' }}>
              <QuickActions />
            </div>
            <div className="animate-in fade-in-50 duration-500" style={{ animationDelay: '500ms' }}>
              <UpcomingFollowups />
            </div>
            <div className="animate-in fade-in-50 duration-500" style={{ animationDelay: '600ms' }}>
              <TopMedicines />
            </div>
            <div className="animate-in fade-in-50 duration-500" style={{ animationDelay: '700ms' }}>
              <SupportWidget />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
