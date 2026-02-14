import { api } from "./client";

export type PrescriptionMedicine = {
  medicineId: string;
  name: string;
  potency?: string;
  repetition?: string;
  instructions?: string;
};

export type Prescription = {
  _id: string;
  prescriptionNo: string;
  patientId: string | { _id: string; name?: string; age?: number; gender?: string };
  doctorId: string;
  modality?: string;
  medicines: PrescriptionMedicine[];
  symptoms?: Array<{ name: string; severity?: string }>;
  diagnosis?: string;
  advice?: string;
  createdAt: string;
  updatedAt: string;
};

type ApiListResponse<T> = {
  success: boolean;
  count: number;
  data: T[];
};

export async function getPrescriptions(params?: {
  patientId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Prescription[]> {
  const res = await api.get<ApiListResponse<Prescription>>("/prescriptions", { params });
  return res.data.data ?? [];
}
