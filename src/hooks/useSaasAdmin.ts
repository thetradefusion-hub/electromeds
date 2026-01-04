import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  patient_limit: number | null;
  doctor_limit: number | null;
  ai_analysis_quota: number | null;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  doctor_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'pending';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  plan?: SubscriptionPlan;
  doctor?: {
    id: string;
    clinic_name: string | null;
    user_id: string;
    profile?: {
      name: string;
      email: string;
      phone: string | null;
    };
  };
}

export interface Payment {
  id: string;
  subscription_id: string;
  doctor_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  doctor_id: string | null;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'billing' | 'technical' | 'feature_request' | 'bug';
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  doctor?: {
    clinic_name: string | null;
    profile?: {
      name: string;
      email: string;
    };
  };
}

export function useSaasAdmin() {
  const subscriptionsQuery = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*),
          doctor:doctors(
            id,
            clinic_name,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each doctor
      const doctorUserIds = data?.map(s => s.doctor?.user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email, phone')
        .in('user_id', doctorUserIds);

      return data?.map(sub => ({
        ...sub,
        doctor: sub.doctor ? {
          ...sub.doctor,
          profile: profiles?.find(p => p.user_id === sub.doctor?.user_id)
        } : null
      })) as Subscription[];
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Payment[];
    },
  });

  const ticketsQuery = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch doctor info for tickets
      const doctorIds = data?.map(t => t.doctor_id).filter(Boolean) || [];
      if (doctorIds.length > 0) {
        const { data: doctors } = await supabase
          .from('doctors')
          .select('id, clinic_name, user_id')
          .in('id', doctorIds);

        const userIds = doctors?.map(d => d.user_id).filter(Boolean) || [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, email')
          .in('user_id', userIds);

        return data?.map(ticket => ({
          ...ticket,
          doctor: doctors?.find(d => d.id === ticket.doctor_id) ? {
            ...doctors?.find(d => d.id === ticket.doctor_id),
            profile: profiles?.find(p => p.user_id === doctors?.find(d => d.id === ticket.doctor_id)?.user_id)
          } : null
        })) as SupportTicket[];
      }

      return data as SupportTicket[];
    },
  });

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const revenueStats = useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, status, created_at')
        .eq('status', 'completed');

      if (error) throw error;

      const now = new Date();
      const thisMonth = payments?.filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }) || [];

      const lastMonth = payments?.filter(p => {
        const date = new Date(p.created_at);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
        return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
      }) || [];

      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const thisMonthRevenue = thisMonth.reduce((sum, p) => sum + p.amount, 0);
      const lastMonthRevenue = lastMonth.reduce((sum, p) => sum + p.amount, 0);
      const growthRate = lastMonthRevenue > 0 
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : 0;

      return {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        growthRate,
        totalTransactions: payments?.length || 0
      };
    },
  });

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        status, 
        resolved_at: status === 'resolved' ? new Date().toISOString() : null 
      })
      .eq('id', ticketId);

    if (error) throw error;
    ticketsQuery.refetch();
  };

  return {
    subscriptions: subscriptionsQuery.data || [],
    payments: paymentsQuery.data || [],
    tickets: ticketsQuery.data || [],
    plans: plansQuery.data || [],
    revenueStats: revenueStats.data,
    isLoading: subscriptionsQuery.isLoading || paymentsQuery.isLoading || ticketsQuery.isLoading,
    updateTicketStatus,
    refetchTickets: ticketsQuery.refetch,
  };
}
