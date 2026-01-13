import api, { ApiResponse } from '../api';

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'super_admin' | 'doctor' | 'staff';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDoctor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  registrationNo: string;
  qualification: string;
  specialization: string;
  clinicName?: string;
  clinicAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalDoctors: number;
  activeDoctors: number;
  totalPatients: number;
  totalPrescriptions: number;
  totalAppointments: number;
  // Classical Homeopathy
  totalCaseRecords?: number;
  totalRemedies?: number;
  totalRubrics?: number;
  // Global symptoms and medicines
  totalGlobalSymptoms?: number;
  totalGlobalMedicines?: number;
  totalSymptoms?: number;
  totalMedicines?: number;
  // Modality breakdown
  prescriptionsByModality?: {
    electro_homeopathy: number;
    classical_homeopathy: number;
  };
  doctorsByModality?: {
    electro_homeopathy: number;
    classical_homeopathy: number;
    both: number;
  };
}

export interface AdminSubscription {
  _id: string;
  doctorId: {
    _id: string;
    name: string;
    specialization: string;
    clinicName?: string;
  };
  planId: {
    _id: string;
    name: string;
    priceMonthly: number;
    priceYearly?: number;
  };
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'pending';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  // User Management
  getAllUsers: async (): Promise<ApiResponse<AdminUser[]>> => {
    const response = await api.get<ApiResponse<AdminUser[]>>('/admin/users');
    return response.data;
  },

  updateUserRole: async (userId: string, role: 'super_admin' | 'doctor' | 'staff'): Promise<ApiResponse<AdminUser>> => {
    const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<ApiResponse<AdminUser>> => {
    const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  assignDoctorToStaff: async (userId: string, doctorId: string): Promise<ApiResponse<AdminUser>> => {
    const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/assign-doctor`, { doctorId });
    return response.data;
  },

  unassignDoctorFromStaff: async (userId: string): Promise<ApiResponse<AdminUser>> => {
    const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}/unassign-doctor`);
    return response.data;
  },

  createStaff: async (data: { name: string; email: string; password: string; phone?: string; doctorId: string }): Promise<ApiResponse<AdminUser>> => {
    const response = await api.post<ApiResponse<AdminUser>>('/admin/staff', data);
    return response.data;
  },

  // Doctor Management
  getAllDoctors: async (): Promise<ApiResponse<AdminDoctor[]>> => {
    const response = await api.get<ApiResponse<AdminDoctor[]>>('/admin/doctors');
    return response.data;
  },

  updateDoctor: async (doctorId: string, data: {
    qualification?: string;
    specialization?: string;
    clinicName?: string;
    clinicAddress?: string;
    name?: string;
    phone?: string;
  }): Promise<ApiResponse<AdminDoctor>> => {
    const response = await api.put<ApiResponse<AdminDoctor>>(`/admin/doctors/${doctorId}`, data);
    return response.data;
  },

  // Global Medicines
  getGlobalMedicines: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/admin/global-medicines');
    return response.data;
  },

  createGlobalMedicine: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/admin/global-medicines', data);
    return response.data;
  },

  updateGlobalMedicine: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>(`/admin/global-medicines/${id}`, data);
    return response.data;
  },

  deleteGlobalMedicine: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/admin/global-medicines/${id}`);
    return response.data;
  },

  // Global Symptoms
  getGlobalSymptoms: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/admin/global-symptoms');
    return response.data;
  },

  createGlobalSymptom: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/admin/global-symptoms', data);
    return response.data;
  },

  updateGlobalSymptom: async (id: string, data: any): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>(`/admin/global-symptoms/${id}`, data);
    return response.data;
  },

  deleteGlobalSymptom: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/admin/global-symptoms/${id}`);
    return response.data;
  },

  // Platform Statistics
  getPlatformStats: async (): Promise<ApiResponse<PlatformStats>> => {
    const response = await api.get<ApiResponse<PlatformStats>>('/admin/stats');
    return response.data;
  },

  // Subscription Management (for Admin)
  getAllSubscriptions: async (): Promise<ApiResponse<AdminSubscription[]>> => {
    const response = await api.get<ApiResponse<AdminSubscription[]>>('/admin/subscriptions');
    return response.data;
  },

  // Payments (for SaaS Admin)
  getAllPayments: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/payments');
    return response.data;
  },

  getPaymentStats: async (): Promise<ApiResponse<{
    totalRevenue: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    growthRate: number;
    totalTransactions: number;
  }>> => {
    const response = await api.get<ApiResponse<{
      totalRevenue: number;
      thisMonthRevenue: number;
      lastMonthRevenue: number;
      growthRate: number;
      totalTransactions: number;
    }>>('/payments/stats');
    return response.data;
  },
};

