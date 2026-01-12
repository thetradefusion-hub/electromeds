import api, { ApiResponse } from '../api';

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'super_admin' | 'doctor' | 'staff';
  registration_no?: string;
  qualification?: string;
  specialization?: string;
  clinic_name?: string;
  clinic_address?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: string;
  assignedDoctorId?: string; // For staff: assigned doctor ID
}

export const authApi = {
  signUp: async (data: SignUpData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data;
  },
};

