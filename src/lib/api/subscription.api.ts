import api, { ApiResponse } from '../api';

export interface SubscriptionPlan {
  _id: string;
  name: string;
  priceMonthly: number;
  priceYearly?: number;
  features: string[];
  patientLimit?: number;
  doctorLimit: number;
  aiAnalysisQuota: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  doctorId: string;
  planId: string | SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'pending';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  patientsCount: number;
  prescriptionsCount: number;
  aiAnalysisCount: number;
}

export const subscriptionApi = {
  getMySubscription: async (): Promise<ApiResponse<Subscription | null>> => {
    const response = await api.get<ApiResponse<Subscription | null>>('/subscriptions/me');
    return response.data;
  },

  getUsageStats: async (): Promise<ApiResponse<UsageStats>> => {
    const response = await api.get<ApiResponse<UsageStats>>('/subscriptions/usage');
    return response.data;
  },

  getSubscriptionPlans: async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
    const response = await api.get<ApiResponse<SubscriptionPlan[]>>('/subscriptions/plans');
    return response.data;
  },

  createSubscription: async (data: {
    planId: string;
    billingCycle?: 'monthly' | 'yearly';
  }): Promise<ApiResponse<Subscription>> => {
    const response = await api.post<ApiResponse<Subscription>>('/subscriptions', data);
    return response.data;
  },

  cancelSubscription: async (id: string): Promise<ApiResponse> => {
    const response = await api.put<ApiResponse>(`/subscriptions/${id}/cancel`);
    return response.data;
  },
};

