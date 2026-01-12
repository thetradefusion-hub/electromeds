import api, { ApiResponse } from '../api';

export interface Medicine {
  _id: string;
  name: string;
  category: string;
  indications?: string;
  defaultDosage?: string;
  contraIndications?: string;
  notes?: string;
  isGlobal: boolean;
  doctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineFormData {
  name: string;
  category: string;
  indications?: string;
  defaultDosage?: string;
  contraIndications?: string;
  notes?: string;
  isGlobal?: boolean;
}

export const medicineApi = {
  getMedicines: async (): Promise<ApiResponse<Medicine[]>> => {
    const response = await api.get<ApiResponse<Medicine[]>>('/medicines');
    return response.data;
  },

  getMedicine: async (id: string): Promise<ApiResponse<Medicine>> => {
    const response = await api.get<ApiResponse<Medicine>>(`/medicines/${id}`);
    return response.data;
  },

  createMedicine: async (data: MedicineFormData): Promise<ApiResponse<Medicine>> => {
    const response = await api.post<ApiResponse<Medicine>>('/medicines', data);
    return response.data;
  },

  updateMedicine: async (id: string, data: Partial<MedicineFormData>): Promise<ApiResponse<Medicine>> => {
    const response = await api.put<ApiResponse<Medicine>>(`/medicines/${id}`, data);
    return response.data;
  },

  deleteMedicine: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/medicines/${id}`);
    return response.data;
  },
};

