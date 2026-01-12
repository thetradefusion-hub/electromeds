import api, { ApiResponse } from '../api';

export interface DashboardStats {
  totalPatients: number;
  todayPatients: number;
  pendingFollowUps: number;
  totalPrescriptions: number;
}

export interface PatientAnalytics {
  totalPatients: number;
  newPatients: number;
  oldPatients: number;
  genderDistribution: Array<{ _id: string; count: number }>;
  ageDistribution: Array<{ _id: string; count: number }>;
}

export interface PrescriptionAnalytics {
  totalPrescriptions: number;
  monthlyTrend: Array<{ _id: { year: number; month: number }; count: number }>;
  topMedicines: Array<{ _id: string; count: number }>;
  topSymptoms: Array<{ _id: string; count: number }>;
}

export interface AppointmentAnalytics {
  totalAppointments: number;
  statusDistribution: Array<{ _id: string; count: number }>;
  bookingTypeDistribution: Array<{ _id: string; count: number }>;
  dailyTrend: Array<{ _id: string; count: number }>;
}

export const analyticsApi = {
  getDashboardStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const response = await api.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
    return response.data;
  },

  getPatientAnalytics: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<PatientAnalytics>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `/analytics/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<PatientAnalytics>>(url);
    return response.data;
  },

  getPrescriptionAnalytics: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<PrescriptionAnalytics>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `/analytics/prescriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<PrescriptionAnalytics>>(url);
    return response.data;
  },

  getAppointmentAnalytics: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<AppointmentAnalytics>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `/analytics/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<AppointmentAnalytics>>(url);
    return response.data;
  },
};

