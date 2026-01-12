import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, MessageSquare, CreditCard, BarChart3 } from 'lucide-react';
import { useSaasAdmin } from '@/hooks/useSaasAdmin';
import SubscribersManagement from '@/components/saas-admin/SubscribersManagement';
import RevenueAnalytics from '@/components/saas-admin/RevenueAnalytics';
import SupportTickets from '@/components/saas-admin/SupportTickets';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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

  const tabConfig = [
    { 
      value: 'revenue', 
      icon: TrendingUp, 
      label: 'Revenue', 
      color: 'from-emerald-500 to-teal-500',
      badge: null
    },
    { 
      value: 'subscribers', 
      icon: Users, 
      label: 'Subscribers', 
      color: 'from-blue-500 to-cyan-500',
      badge: subscriptions.filter(s => s.status === 'active').length
    },
    { 
      value: 'support', 
      icon: MessageSquare, 
      label: 'Support', 
      color: 'from-purple-500 to-pink-500',
      badge: tickets.filter(t => t.status === 'open').length
    },
  ];

  return (
    <MainLayout 
      title="SaaS Admin" 
      subtitle="Manage subscriptions, revenue, and support"
    >
      <div className="space-y-4">
        {/* Compact Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              SaaS Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">Platform subscriptions, revenue & support management</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="relative">
            <TabsList className="inline-flex h-auto w-full flex-wrap gap-2 bg-muted/50 p-2 rounded-xl border border-border/50 shadow-sm">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "group relative gap-2 px-4 py-2.5 rounded-lg transition-all duration-200",
                      "data-[state=active]:bg-gradient-to-r data-[state=active]:shadow-lg",
                      "data-[state=active]:text-white data-[state=active]:border-0",
                      "data-[state=inactive]:bg-background/50 data-[state=inactive]:hover:bg-background",
                      "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
                      "border border-border/50",
                      isActive && `bg-gradient-to-r ${tab.color}`
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isActive && "scale-110"
                    )} />
                    <span className="hidden sm:inline font-medium">{tab.label}</span>
                    {tab.badge !== null && tab.badge > 0 && (
                      <span className={cn(
                        "text-xs rounded-full px-2 py-0.5 font-semibold",
                        isActive 
                          ? "bg-white/20 text-white" 
                          : "bg-primary/10 text-primary"
                      )}>
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 rounded-lg bg-white/20 blur-sm -z-10" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="revenue" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <RevenueAnalytics 
                payments={payments}
                revenueStats={revenueStats}
                subscriptionsCount={subscriptions.filter(s => s.status === 'active').length}
              />
            </div>
          </TabsContent>

          <TabsContent value="subscribers" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <SubscribersManagement 
                subscriptions={subscriptions}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="support" className="mt-0">
            <div className="animate-in fade-in-50 duration-300">
              <SupportTickets 
                tickets={tickets}
                isLoading={isLoading}
                onUpdateStatus={updateTicketStatus}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SaasAdmin;
