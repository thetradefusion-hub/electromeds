import { api } from "./client";

export type Appointment = {
  _id: string;
  doctorId: string;
  patientId?: string;
  patientName?: string;
  patientMobile?: string;
  appointmentDate: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  bookingType: "online" | "walk_in" | "phone";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patientId?: { _id: string; name?: string; age?: number; gender?: string; mobile?: string };
};

type ApiListResponse<T> = {
  success: boolean;
  count: number;
  data: T[];
};

export async function getAppointments(params?: {
  date?: string; // YYYY-MM-DD
  status?: string;
}): Promise<Appointment[]> {
  const res = await api.get<ApiListResponse<Appointment>>("/appointments", { params });
  return res.data.data ?? [];
}

export type CreateAppointmentPayload = {
  patientId?: string;
  patientName?: string;
  patientMobile?: string;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;
  bookingType: "online" | "walk_in" | "phone";
  notes?: string;
  status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
};

type ApiSingleResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const res = await api.post<ApiSingleResponse<Appointment>>("/appointments", payload);
  if (!res.data?.success || !res.data?.data) {
    throw new Error((res.data as any)?.message ?? "Failed to create appointment.");
  }
  return res.data.data;
}

export type Availability = {
  _id: string;
  doctorId: string;
  dayOfWeek: number; // 0-6 (0=Sunday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  slotDuration: number; // minutes
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAvailability(): Promise<Availability[]> {
  const res = await api.get<ApiListResponse<Availability>>("/appointments/availability");
  return res.data.data ?? [];
}
