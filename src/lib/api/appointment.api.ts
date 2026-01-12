import api, { ApiResponse } from '../api';

export interface Appointment {
  _id: string;
  doctorId: string;
  patientId?: string;
  patientName?: string;
  patientMobile?: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  bookingType: 'online' | 'walk_in' | 'phone';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patientId?: {
    _id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string;
    mobile: string;
  };
}

export interface CreateAppointmentData {
  patientId?: string;
  patientName?: string;
  patientMobile?: string;
  appointmentDate: string;
  timeSlot: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  bookingType?: 'online' | 'walk_in' | 'phone';
  notes?: string;
}

export interface DoctorAvailability {
  _id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockedDate {
  _id: string;
  doctorId: string;
  blockedDate: string;
  reason?: string;
  createdAt: string;
}

export const appointmentApi = {
  getAppointments: async (params?: { date?: string; status?: string }): Promise<ApiResponse<Appointment[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append('date', params.date);
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<Appointment[]>>(url);
    return response.data;
  },

  getAppointment: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: CreateAppointmentData): Promise<ApiResponse<Appointment>> => {
    const response = await api.post<ApiResponse<Appointment>>('/appointments', data);
    return response.data;
  },

  updateAppointment: async (id: string, data: Partial<CreateAppointmentData>): Promise<ApiResponse<Appointment>> => {
    const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}`, data);
    return response.data;
  },

  deleteAppointment: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/appointments/${id}`);
    return response.data;
  },

  getAvailability: async (): Promise<ApiResponse<DoctorAvailability[]>> => {
    const response = await api.get<ApiResponse<DoctorAvailability[]>>('/appointments/availability');
    return response.data;
  },

  setAvailability: async (data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<DoctorAvailability>> => {
    const response = await api.post<ApiResponse<DoctorAvailability>>('/appointments/availability', data);
    return response.data;
  },

  getBlockedDates: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<BlockedDate[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `/appointments/blocked-dates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<ApiResponse<BlockedDate[]>>(url);
    return response.data;
  },

  blockDate: async (data: { blockedDate: string; reason?: string }): Promise<ApiResponse<BlockedDate>> => {
    const response = await api.post<ApiResponse<BlockedDate>>('/appointments/blocked-dates', data);
    return response.data;
  },

  unblockDate: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/appointments/blocked-dates/${id}`);
    return response.data;
  },
};

