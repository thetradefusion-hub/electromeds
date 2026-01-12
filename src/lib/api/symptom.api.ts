import api, { ApiResponse } from '../api';

export interface Symptom {
  _id: string;
  name: string;
  category: string;
  description?: string;
  isGlobal: boolean;
  doctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SymptomFormData {
  name: string;
  category: string;
  description?: string;
  isGlobal?: boolean;
}

export const symptomApi = {
  getSymptoms: async (): Promise<ApiResponse<Symptom[]>> => {
    const response = await api.get<ApiResponse<Symptom[]>>('/symptoms');
    return response.data;
  },

  getSymptom: async (id: string): Promise<ApiResponse<Symptom>> => {
    const response = await api.get<ApiResponse<Symptom>>(`/symptoms/${id}`);
    return response.data;
  },

  createSymptom: async (data: SymptomFormData): Promise<ApiResponse<Symptom>> => {
    const response = await api.post<ApiResponse<Symptom>>('/symptoms', data);
    return response.data;
  },

  updateSymptom: async (id: string, data: Partial<SymptomFormData>): Promise<ApiResponse<Symptom>> => {
    const response = await api.put<ApiResponse<Symptom>>(`/symptoms/${id}`, data);
    return response.data;
  },

  deleteSymptom: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/symptoms/${id}`);
    return response.data;
  },
};

