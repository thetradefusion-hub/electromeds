import { useQuery } from '@tanstack/react-query';
import { useDoctor } from './useDoctor';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { analyticsApi } from '@/lib/api/analytics.api';

interface MonthlyData {
  month: string;
  patients: number;
  prescriptions: number;
}

interface WeeklyData {
  day: string;
  patients: number;
}

interface CategoryData {
  name: string;
  count: number;
}

interface MedicineUsage {
  name: string;
  count: number;
}

interface AnalyticsData {
  monthlyTrend: MonthlyData[];
  weeklyOverview: WeeklyData[];
  symptomCategories: CategoryData[];
  topMedicines: MedicineUsage[];
  totalPatients: number;
  thisMonthPatients: number;
  totalPrescriptions: number;
  thisMonthPrescriptions: number;
}

export function useAnalytics() {
  const { doctorId } = useDoctor();

  return useQuery({
    queryKey: ['analytics', doctorId],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!doctorId) {
        return {
          monthlyTrend: [],
          weeklyOverview: [],
          symptomCategories: [],
          topMedicines: [],
          totalPatients: 0,
          thisMonthPatients: 0,
          totalPrescriptions: 0,
          thisMonthPrescriptions: 0,
        };
      }

      const now = new Date();
      const thisMonthStart = startOfMonth(now).toISOString();
      const thisMonthEnd = endOfMonth(now).toISOString();

      // Fetch analytics data from backend
      const [patientAnalytics, prescriptionAnalytics] = await Promise.all([
        analyticsApi.getPatientAnalytics(),
        analyticsApi.getPrescriptionAnalytics(),
      ]);

      // For now, we'll use simplified data structure
      // In a real scenario, you might need to fetch patient/prescription lists separately
      // or enhance the backend analytics endpoints
      const totalPatients = patientAnalytics.success ? patientAnalytics.data.totalPatients : 0;
      const thisMonthPatients = patientAnalytics.success ? patientAnalytics.data.newPatients : 0;
      const totalPrescriptions = prescriptionAnalytics.success ? prescriptionAnalytics.data.totalPrescriptions : 0;
      const thisMonthPrescriptions = prescriptionAnalytics.success 
        ? prescriptionAnalytics.data.monthlyTrend
            .filter((m) => m._id.year === now.getFullYear() && m._id.month === now.getMonth() + 1)
            .reduce((sum, m) => sum + m.count, 0)
        : 0;

      // Use backend analytics data
      const topMedicines = prescriptionAnalytics.success 
        ? prescriptionAnalytics.data.topMedicines.map((m) => ({ name: m._id, count: m.count }))
        : [];

      // Calculate monthly trend from backend data
      const monthlyTrend: MonthlyData[] = [];
      if (prescriptionAnalytics.success) {
        const prescriptionTrend = prescriptionAnalytics.data.monthlyTrend;
        for (let i = 11; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          const monthLabel = format(monthDate, 'MMM');
          const year = monthDate.getFullYear();
          const month = monthDate.getMonth() + 1;

          const monthData = prescriptionTrend.find(
            (m) => m._id.year === year && m._id.month === month
          );

          monthlyTrend.push({
            month: monthLabel,
            patients: 0, // Backend doesn't provide patient trend yet
            prescriptions: monthData?.count || 0,
          });
        }
      } else {
        // Fallback: empty trend
        for (let i = 11; i >= 0; i--) {
          const monthDate = subMonths(now, i);
          monthlyTrend.push({
            month: format(monthDate, 'MMM'),
            patients: 0,
            prescriptions: 0,
          });
        }
      }

      // Weekly overview - simplified (can be enhanced with backend data)
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      const weeklyOverview: WeeklyData[] = daysOfWeek.map((day) => ({
        day,
        patients: 0, // Backend doesn't provide daily patient data yet
      }));

      // Symptom categories - use top symptoms from backend
      const symptomCategories: CategoryData[] = prescriptionAnalytics.success
        ? prescriptionAnalytics.data.topSymptoms
            .slice(0, 6)
            .map((s) => ({ name: s._id, count: s.count }))
        : [];

      return {
        monthlyTrend,
        weeklyOverview,
        symptomCategories,
        topMedicines,
        totalPatients,
        thisMonthPatients,
        totalPrescriptions,
        thisMonthPrescriptions,
      };
    },
    enabled: !!doctorId,
  });
}
