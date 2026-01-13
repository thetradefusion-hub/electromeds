import api, { ApiResponse } from '../api';

export interface PrescriptionSymptom {
  symptomId: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months';
}

export interface PrescriptionMedicine {
  medicineId: string;
  name: string;
  category: string;
  modality?: 'electro_homeopathy' | 'classical_homeopathy';
  // Electro Homeopathy
  dosage?: string;
  duration?: string;
  // Classical Homeopathy
  potency?: string;
  repetition?: string;
  instructions?: string;
}

export interface Prescription {
  _id: string;
  prescriptionNo: string;
  patientId: string | {
    _id: string;
    patientId: string;
    name: string;
    age: number;
    gender: string;
    mobile: string;
    address?: string;
  };
  doctorId: string;
  modality?: 'electro_homeopathy' | 'classical_homeopathy';
  symptoms: PrescriptionSymptom[];
  medicines: PrescriptionMedicine[];
  diagnosis?: string;
  advice?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionData {
  patientId: string;
  symptoms: PrescriptionSymptom[];
  medicines: PrescriptionMedicine[];
  diagnosis?: string;
  advice?: string;
  followUpDate?: string;
}

export const prescriptionApi = {
  getPrescriptions: async (): Promise<ApiResponse<Prescription[]>> => {
    const response = await api.get<ApiResponse<Prescription[]>>('/prescriptions');
    return response.data;
  },

  getPrescription: async (id: string): Promise<ApiResponse<Prescription>> => {
    const response = await api.get<ApiResponse<Prescription>>(`/prescriptions/${id}`);
    return response.data;
  },

  createPrescription: async (data: CreatePrescriptionData): Promise<ApiResponse<Prescription>> => {
    const response = await api.post<ApiResponse<Prescription>>('/prescriptions', data);
    return response.data;
  },

  updatePrescription: async (id: string, data: Partial<CreatePrescriptionData>): Promise<ApiResponse<Prescription>> => {
    const response = await api.put<ApiResponse<Prescription>>(`/prescriptions/${id}`, data);
    return response.data;
  },

  deletePrescription: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete<ApiResponse>(`/prescriptions/${id}`);
    return response.data;
  },
};

