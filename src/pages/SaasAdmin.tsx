import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, MessageSquare, CreditCard } from 'lucide-react';
import { useSaasAdmin } from '@/hooks/useSaasAdmin';
import SubscribersManagement from '@/components/saas-admin/SubscribersManagement';
import RevenueAnalytics from '@/components/saas-admin/RevenueAnalytics';
import SupportTickets from '@/components/saas-admin/SupportTickets';
import { useTranslation } from 'react-i18next';

const SaasAdmin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('revenue');
  const { 
    subscriptions, 
    payments, 
    tickets, 
    revenueStats, 
    isLoading,
    updateTicketStatus 
  } = useSaasAdmin();

  return (
    <MainLayout 
      title="SaaS Admin" 
      subtitle="Manage subscriptions, revenue, and support"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SaaS Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your doctor platform subscriptions and support
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="revenue" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Subscribers</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Support</span>
              {tickets.filter(t => t.status === 'open').length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5">
                  {tickets.filter(t => t.status === 'open').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <RevenueAnalytics 
              payments={payments}
              revenueStats={revenueStats}
              subscriptionsCount={subscriptions.filter(s => s.status === 'active').length}
            />
          </TabsContent>

          <TabsContent value="subscribers">
            <SubscribersManagement 
              subscriptions={subscriptions}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="support">
            <SupportTickets 
              tickets={tickets}
              isLoading={isLoading}
              onUpdateStatus={updateTicketStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SaasAdmin;
