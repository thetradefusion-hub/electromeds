import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { subscriptionApi } from '@/lib/api/subscription.api';
import { supportTicketApi, SupportTicket } from '@/lib/api/supportTicket.api';

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
  const queryClient = useQueryClient();

  const subscriptionsQuery = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const response = await adminApi.getAllSubscriptions();
      if (!response.success) throw new Error(response.message || 'Failed to fetch subscriptions');
      
      // Map backend format to frontend format
      return (response.data || []).map((sub: any) => ({
        id: sub._id,
        doctor_id: typeof sub.doctorId === 'string' ? sub.doctorId : sub.doctorId?._id,
        plan_id: typeof sub.planId === 'string' ? sub.planId : sub.planId?._id,
        status: sub.status,
        billing_cycle: sub.billingCycle,
        current_period_start: sub.currentPeriodStart,
        current_period_end: sub.currentPeriodEnd,
        trial_ends_at: sub.trialEndsAt || null,
        cancelled_at: sub.cancelledAt || null,
        created_at: sub.createdAt,
        plan: typeof sub.planId === 'object' ? {
          id: sub.planId._id,
          name: sub.planId.name,
          price_monthly: sub.planId.priceMonthly,
          price_yearly: sub.planId.priceYearly || null,
          features: sub.planId.features || [],
          patient_limit: sub.planId.patientLimit || null,
          doctor_limit: sub.planId.doctorLimit,
          ai_analysis_quota: sub.planId.aiAnalysisQuota,
        } : null,
        doctor: typeof sub.doctorId === 'object' ? {
          id: sub.doctorId._id,
          clinic_name: sub.doctorId.clinicName || null,
          user_id: sub.doctorId.userId,
          profile: {
            name: sub.doctorId.name,
            email: sub.doctorId.email,
            phone: sub.doctorId.phone,
          },
        } : null,
      })) as Subscription[];
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const response = await adminApi.getAllPayments();
      if (!response.success) throw new Error(response.message || 'Failed to fetch payments');
      
      // Map backend format to frontend format
      return (response.data || []).map((p: any) => ({
        id: p._id,
        subscription_id: typeof p.subscriptionId === 'string' ? p.subscriptionId : p.subscriptionId?._id,
        doctor_id: typeof p.doctorId === 'string' ? p.doctorId : p.doctorId?._id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        payment_method: p.paymentMethod || null,
        transaction_id: p.transactionId || null,
        created_at: p.createdAt,
      })) as Payment[];
    },
  });

  const ticketsQuery = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const response = await supportTicketApi.getSupportTickets();
      if (!response.success) throw new Error(response.message || 'Failed to fetch tickets');
      
      // Map backend format to frontend format
      return (response.data || []).map((t: any) => ({
        id: t._id,
        doctor_id: typeof t.doctorId === 'string' ? t.doctorId : t.doctorId?._id,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
        assigned_to: typeof t.assignedTo === 'string' ? t.assignedTo : t.assignedTo?._id || null,
        resolved_at: t.resolvedAt || null,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
        doctor: typeof t.doctorId === 'object' ? {
          id: t.doctorId._id,
          clinic_name: t.doctorId.clinicName || null,
          profile: {
            name: t.doctorId.name,
            email: t.doctorId.email,
          },
        } : null,
      })) as SupportTicket[];
    },
  });

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await subscriptionApi.getSubscriptionPlans();
      if (!response.success) throw new Error(response.message || 'Failed to fetch plans');
      
      // Map backend format to frontend format
      return (response.data || []).map((p: any) => ({
        id: p._id,
        name: p.name,
        price_monthly: p.priceMonthly,
        price_yearly: p.priceYearly || null,
        features: p.features || [],
        patient_limit: p.patientLimit || null,
        doctor_limit: p.doctorLimit,
        ai_analysis_quota: p.aiAnalysisQuota,
        is_active: p.isActive,
      })) as SubscriptionPlan[];
    },
  });

  const revenueStats = useQuery({
    queryKey: ['admin-revenue-stats'],
    queryFn: async () => {
      const response = await adminApi.getPaymentStats();
      if (!response.success) throw new Error(response.message || 'Failed to fetch revenue stats');
      
      return {
        totalRevenue: response.data.totalRevenue,
        thisMonthRevenue: response.data.thisMonthRevenue,
        lastMonthRevenue: response.data.lastMonthRevenue,
        growthRate: response.data.growthRate.toString(),
        totalTransactions: response.data.totalTransactions,
      };
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: SupportTicket['status'] }) => {
      const response = await supportTicketApi.updateSupportTicket(ticketId, { status });
      if (!response.success) throw new Error(response.message || 'Failed to update ticket');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });

  return {
    subscriptions: subscriptionsQuery.data || [],
    payments: paymentsQuery.data || [],
    tickets: ticketsQuery.data || [],
    plans: plansQuery.data || [],
    revenueStats: revenueStats.data,
    isLoading: subscriptionsQuery.isLoading || paymentsQuery.isLoading || ticketsQuery.isLoading || plansQuery.isLoading || revenueStats.isLoading,
    updateTicketStatus: (ticketId: string, status: SupportTicket['status']) => {
      updateTicketStatus.mutate({ ticketId, status });
    },
    refetchTickets: ticketsQuery.refetch,
  };
}
