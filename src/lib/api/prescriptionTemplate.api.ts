import api, { ApiResponse } from '../api';

export interface PrescriptionTemplateSymptom {
  symptomId: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months';
}

export interface PrescriptionTemplateMedicine {
  medicineId: string;
  name: string;
  category: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

export interface PrescriptionTemplate {
  _id: string;
  doctorId: string;
  name: string;
  description?: string;
  symptoms: PrescriptionTemplateSymptom[];
  medicines: PrescriptionTemplateMedicine[];
  diagnosis?: string;
  advice?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  symptoms: PrescriptionTemplateSymptom[];
  medicines: PrescriptionTemplateMedicine[];
  diagnosis?: string;
  advice?: string;
}

export const prescriptionTemplateApi = {
  getPrescriptionTemplates: async (): Promise<ApiResponse<PrescriptionTemplate[]>> => {
    const response = await api.get<ApiResponse<PrescriptionTemplate[]>>('/prescription-templates');
    return response.data;
  },

  getPrescriptionTemplate: async (id: string): Promise<ApiResponse<PrescriptionTemplate>> => {
    const response = await api.get<ApiResponse<PrescriptionTemplate>>(`/prescription-templates/${id}`);
    return response.data;
  },

  createPrescriptionTemplate: async (data: CreateTemplateData): Promise<ApiResponse<PrescriptionTemplate>> => {
    const response = await api.post<ApiResponse<PrescriptionTemplate>>('/prescription-templates', data);
    return response.data;
  },

  updatePrescriptionTemplate: async (
    id: string,
    data: Partial<CreateTemplateData>
  ): Promise<ApiResponse<PrescriptionTemplate>> => {
    const response = await api.put<ApiResponse<PrescriptionTemplate>>(`/prescription-templates/${id}`, data);
    return response.data;
  },

  deletePrescriptionTemplate: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/prescription-templates/${id}`);
    return response.data;
  },
};

