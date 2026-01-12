import api, { ApiResponse } from '../api';

export interface ReportFinding {
  parameter: string;
  value: string;
  normalRange?: string;
  status: 'normal' | 'abnormal' | 'critical';
  interpretation: string;
}

export interface ReportAnalysis {
  reportType: string;
  findings: ReportFinding[];
  summary: string;
  concernAreas: string[];
  recommendations: string[];
}

export interface PatientMedicalReport {
  _id: string;
  patientId: string | { _id: string; name: string; patientId: string; age: number; gender: string };
  doctorId: string | { _id: string; name: string; specialization: string };
  reportType: string;
  fileName: string;
  fileUrl: string;
  analysis: ReportAnalysis;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportData {
  patientId: string;
  reportType: string;
  fileName: string;
  fileUrl: string;
  analysis?: ReportAnalysis;
  notes?: string;
}

export const medicalReportApi = {
  getMedicalReports: async (patientId?: string): Promise<ApiResponse<PatientMedicalReport[]>> => {
    const params = patientId ? { patientId } : {};
    const response = await api.get<ApiResponse<PatientMedicalReport[]>>('/medical-reports', { params });
    return response.data;
  },

  getMedicalReport: async (id: string): Promise<ApiResponse<PatientMedicalReport>> => {
    const response = await api.get<ApiResponse<PatientMedicalReport>>(`/medical-reports/${id}`);
    return response.data;
  },

  createMedicalReport: async (data: CreateReportData): Promise<ApiResponse<PatientMedicalReport>> => {
    const response = await api.post<ApiResponse<PatientMedicalReport>>('/medical-reports', data);
    return response.data;
  },

  updateMedicalReport: async (
    id: string,
    data: Partial<CreateReportData>
  ): Promise<ApiResponse<PatientMedicalReport>> => {
    const response = await api.put<ApiResponse<PatientMedicalReport>>(`/medical-reports/${id}`, data);
    return response.data;
  },

  deleteMedicalReport: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/medical-reports/${id}`);
    return response.data;
  },
};

