import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics.api';

interface DashboardStats {
  totalPatients: number;
  todayPatients: number;
  pendingFollowUps: number;
  totalPrescriptions: number;
}

export function useDashboardStats(doctorId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', doctorId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!doctorId) {
        console.log('useDashboardStats: doctorId is undefined');
        return {
          totalPatients: 0,
          todayPatients: 0,
          pendingFollowUps: 0,
          totalPrescriptions: 0,
        };
      }

      console.log('useDashboardStats: Fetching stats for doctorId:', doctorId);
      try {
        const response = await analyticsApi.getDashboardStats();
        console.log('useDashboardStats: Response:', response);
        if (response.success && response.data) {
          return response.data;
        }
        return {
          totalPatients: 0,
          todayPatients: 0,
          pendingFollowUps: 0,
          totalPrescriptions: 0,
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
          totalPatients: 0,
          todayPatients: 0,
          pendingFollowUps: 0,
          totalPrescriptions: 0,
        };
      }
    },
    enabled: !!doctorId,
    staleTime: 2 * 60 * 1000, // 2 minutes - stats can be cached
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Use cached data if fresh
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes in background
  });
}
