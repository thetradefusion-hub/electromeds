import api, { ApiResponse } from '../api';

export interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  registrationNo: string;
  qualification: string;
  specialization: string;
  clinicName?: string;
  clinicAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicDoctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  clinicName: string | null;
  clinicAddress: string | null;
  specialization: string;
  qualification: string;
  registrationNo: string;
}

export interface UpdateDoctorProfileData {
  qualification?: string;
  specialization?: string;
  clinicName?: string;
  clinicAddress?: string;
  name?: string;
  phone?: string;
}

export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'staff';
  assignedDoctorId?: string | {
    _id: string;
    registrationNo?: string;
    specialization?: string;
    clinicName?: string;
  };
  createdBy?: string | {
    _id: string;
    name?: string;
    email?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export const doctorApi = {
  // Public endpoint (no auth required)
  getPublicDoctors: async (): Promise<ApiResponse<PublicDoctor[]>> => {
    const response = await api.get<ApiResponse<PublicDoctor[]>>('/doctors/public');
    return response.data;
  },

  getMyProfile: async (): Promise<ApiResponse<{ doctor: DoctorProfile }>> => {
    const response = await api.get<ApiResponse<{ doctor: DoctorProfile }>>('/doctors/me');
    return response.data;
  },

  updateMyProfile: async (data: UpdateDoctorProfileData): Promise<ApiResponse<{ doctor: DoctorProfile }>> => {
    const response = await api.put<ApiResponse<{ doctor: DoctorProfile }>>('/doctors/me', data);
    return response.data;
  },

  // Staff Management
  createStaff: async (data: CreateStaffData): Promise<ApiResponse<StaffMember>> => {
    const response = await api.post<ApiResponse<StaffMember>>('/doctors/staff', data);
    return response.data;
  },

  getMyStaff: async (): Promise<ApiResponse<StaffMember[]>> => {
    const response = await api.get<ApiResponse<StaffMember[]>>('/doctors/staff');
    return response.data;
  },

  updateStaffStatus: async (staffId: string, isActive: boolean): Promise<ApiResponse<StaffMember>> => {
    const response = await api.put<ApiResponse<StaffMember>>(`/doctors/staff/${staffId}/status`, { isActive });
    return response.data;
  },
};

