import api, { ApiResponse } from '../api';

export interface AISettings {
  _id: string;
  aiProvider: 'lovable' | 'openai' | 'google' | 'custom';
  apiEndpoint?: string;
  modelName: string;
  isActive: boolean;
  apiKeyConfigured: boolean;
  apiKeyPreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAISettingsData {
  aiProvider: 'lovable' | 'openai' | 'google' | 'custom';
  apiKey: string;
  apiEndpoint?: string;
  modelName?: string;
}

export const aiSettingsApi = {
  getAISettings: async (): Promise<ApiResponse<AISettings | null>> => {
    const response = await api.get<ApiResponse<AISettings | null>>('/admin/ai-settings');
    return response.data;
  },

  updateAISettings: async (data: UpdateAISettingsData): Promise<ApiResponse<AISettings>> => {
    const response = await api.post<ApiResponse<AISettings>>('/admin/ai-settings', data);
    return response.data;
  },

  deleteAISettings: async (): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>('/admin/ai-settings');
    return response.data;
  },
};

