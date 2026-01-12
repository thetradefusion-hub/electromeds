import { useQuery } from '@tanstack/react-query';
import { subscriptionApi, Subscription, SubscriptionPlan, UsageStats } from '@/lib/api/subscription.api';

export function useSubscription() {
  const { data: subscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await subscriptionApi.getMySubscription();
      if (!response.success || !response.data) {
        return null;
      }
      
      // Map backend format to frontend format
      const sub = response.data;
      const plan = typeof sub.planId === 'object' ? sub.planId : null;
      
      return {
        id: sub._id,
        doctor_id: sub.doctorId,
        plan_id: typeof sub.planId === 'string' ? sub.planId : sub.planId._id,
        status: sub.status,
        billing_cycle: sub.billingCycle,
        current_period_start: sub.currentPeriodStart,
        current_period_end: sub.currentPeriodEnd,
        trial_ends_at: sub.trialEndsAt || null,
        plan: plan ? {
          id: plan._id,
          name: plan.name,
          price_monthly: plan.priceMonthly,
          price_yearly: plan.priceYearly || null,
          patient_limit: plan.patientLimit || null,
          doctor_limit: plan.doctorLimit,
          ai_analysis_quota: plan.aiAnalysisQuota,
          features: plan.features,
        } : null,
      } as any;
    },
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['usage-stats'],
    queryFn: async (): Promise<UsageStats> => {
      const response = await subscriptionApi.getUsageStats();
      if (!response.success || !response.data) {
        return { patientsCount: 0, prescriptionsCount: 0, aiAnalysisCount: 0 };
      }
      return response.data;
    },
  });

  const subscriptionData = subscription as any;
  const isTrialActive = subscriptionData?.trial_ends_at 
    ? new Date(subscriptionData.trial_ends_at) > new Date() 
    : false;

  const daysUntilRenewal = subscriptionData?.current_period_end
    ? Math.ceil((new Date(subscriptionData.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const patientLimitReached = subscriptionData?.plan?.patient_limit 
    ? (usage?.patientsCount || 0) >= subscriptionData.plan.patient_limit 
    : false;

  const aiQuotaReached = subscriptionData?.plan?.ai_analysis_quota
    ? (usage?.aiAnalysisCount || 0) >= subscriptionData.plan.ai_analysis_quota
    : false;

  return {
    subscription: subscriptionData,
    usage,
    isLoading: subscriptionLoading || usageLoading,
    isTrialActive,
    daysUntilRenewal,
    patientLimitReached,
    aiQuotaReached,
    planName: subscriptionData?.plan?.name || 'Free',
    refetch: refetchSubscription,
  };
}
