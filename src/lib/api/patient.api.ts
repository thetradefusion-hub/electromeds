import api, { ApiResponse } from '../api';

export interface Patient {
  _id: string;
  patientId: string;
  doctorId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  address?: string;
  caseType: 'new' | 'old';
  visitDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientFormData {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  address?: string;
  caseType?: 'new' | 'old';
  doctorId?: string; // Required for super_admin
}

export const patientApi = {
  getPatients: async (): Promise<ApiResponse<Patient[]>> => {
    const response = await api.get<ApiResponse<Patient[]>>('/patients');
    return response.data;
  },

  getPatient: async (id: string): Promise<ApiResponse<Patient>> => {
    const response = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (data: PatientFormData): Promise<ApiResponse<Patient>> => {
    const response = await api.post<ApiResponse<Patient>>('/patients', data);
    return response.data;
  },

  updatePatient: async (id: string, data: Partial<PatientFormData>): Promise<ApiResponse<Patient>> => {
    const response = await api.put<ApiResponse<Patient>>(`/patients/${id}`, data);
    return response.data;
  },

  deletePatient: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/patients/${id}`);
    return response.data;
  },

  recordVisit: async (id: string): Promise<ApiResponse<Patient>> => {
    const response = await api.patch<ApiResponse<Patient>>(`/patients/${id}/visit`);
    return response.data;
  },
};

