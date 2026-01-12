import api, { ApiResponse } from '../api';

export interface MedicineRule {
  _id: string;
  name: string;
  description?: string;
  symptomIds: string[];
  medicineIds: string[];
  dosage: string;
  duration: string;
  priority: number;
  isGlobal: boolean;
  doctorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineRuleFormData {
  name: string;
  description?: string;
  symptomIds: string[];
  medicineIds: string[];
  dosage: string;
  duration: string;
  priority?: number;
  isGlobal?: boolean;
}

export interface MedicineSuggestion {
  rules: MedicineRule[];
  suggestedMedicineIds: string[];
}

export const medicineRuleApi = {
  getMedicineRules: async (): Promise<ApiResponse<MedicineRule[]>> => {
    const response = await api.get<ApiResponse<MedicineRule[]>>('/rules');
    return response.data;
  },

  getMedicineRule: async (id: string): Promise<ApiResponse<MedicineRule>> => {
    const response = await api.get<ApiResponse<MedicineRule>>(`/rules/${id}`);
    return response.data;
  },

  createMedicineRule: async (data: MedicineRuleFormData): Promise<ApiResponse<MedicineRule>> => {
    const response = await api.post<ApiResponse<MedicineRule>>('/rules', data);
    return response.data;
  },

  updateMedicineRule: async (id: string, data: Partial<MedicineRuleFormData>): Promise<ApiResponse<MedicineRule>> => {
    const response = await api.put<ApiResponse<MedicineRule>>(`/rules/${id}`, data);
    return response.data;
  },

  deleteMedicineRule: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/rules/${id}`);
    return response.data;
  },

  suggestMedicines: async (symptomIds: string[]): Promise<ApiResponse<MedicineSuggestion>> => {
    const response = await api.post<ApiResponse<MedicineSuggestion>>('/rules/suggest', { symptomIds });
    return response.data;
  },
};

