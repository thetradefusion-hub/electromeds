import api, { ApiResponse } from '../api';

export interface ReportAnalysis {
  reportType: string;
  findings: Array<{
    parameter: string;
    value: string;
    normalRange?: string;
    status: 'normal' | 'abnormal' | 'critical';
    interpretation: string;
  }>;
  summary: string;
  concernAreas: string[];
  recommendations: string[];
}

export interface AnalyzeReportData {
  imageBase64: string;
  reportType?: string;
  mimeType?: string;
}

export const aiAnalysisApi = {
  analyzeReport: async (data: AnalyzeReportData): Promise<ApiResponse<ReportAnalysis>> => {
    const response = await api.post<ApiResponse<ReportAnalysis>>('/ai/analyze-report', data);
    return response.data;
  },
};

