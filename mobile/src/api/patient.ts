import { api } from "./client";

export type Patient = {
  _id: string;
  patientId: string;
  doctorId: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  mobile: string;
  address?: string;
  caseType: "new" | "old";
  visitDate?: string;
  createdAt: string;
  updatedAt: string;
};

type ApiListResponse<T> = {
  success: boolean;
  count: number;
  data: T[];
};

type ApiSingleResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type CreatePatientPayload = {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  mobile: string;
  address?: string;
  caseType?: "new" | "old";
};

export async function fetchPatients(): Promise<Patient[]> {
  const res = await api.get<ApiListResponse<Patient>>("/patients");
  return res.data.data;
}

export async function createPatient(payload: CreatePatientPayload): Promise<Patient> {
  const res = await api.post<ApiSingleResponse<Patient>>("/patients", payload);
  if (!res.data?.success || !res.data?.data) {
    throw new Error((res.data as any)?.message ?? "Failed to add patient.");
  }
  return res.data.data;
}