import api, { ApiResponse } from '../api';

export interface SupportTicket {
  _id: string;
  doctorId?: string | { _id: string; name: string; specialization: string };
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'billing' | 'technical' | 'feature_request' | 'bug';
  assignedTo?: string | { _id: string; name: string; email: string };
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  category?: 'general' | 'billing' | 'technical' | 'feature_request' | 'bug';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const supportTicketApi = {
  getSupportTickets: async (): Promise<ApiResponse<SupportTicket[]>> => {
    const response = await api.get<ApiResponse<SupportTicket[]>>('/support-tickets');
    return response.data;
  },

  getSupportTicket: async (id: string): Promise<ApiResponse<SupportTicket>> => {
    const response = await api.get<ApiResponse<SupportTicket>>(`/support-tickets/${id}`);
    return response.data;
  },

  createSupportTicket: async (data: CreateTicketData): Promise<ApiResponse<SupportTicket>> => {
    const response = await api.post<ApiResponse<SupportTicket>>('/support-tickets', data);
    return response.data;
  },

  updateSupportTicket: async (
    id: string,
    data: Partial<CreateTicketData & { status: SupportTicket['status'] }>
  ): Promise<ApiResponse<SupportTicket>> => {
    const response = await api.put<ApiResponse<SupportTicket>>(`/support-tickets/${id}`, data);
    return response.data;
  },

  deleteSupportTicket: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/support-tickets/${id}`);
    return response.data;
  },
};

