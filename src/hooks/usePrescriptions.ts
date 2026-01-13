import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { prescriptionApi, Prescription, CreatePrescriptionData, PrescriptionSymptom, PrescriptionMedicine } from '@/lib/api/prescription.api';
import { doctorApi } from '@/lib/api/doctor.api';

// Map backend Prescription to frontend format
const mapPrescription = (rx: Prescription) => {
  const patient = typeof rx.patientId === 'object' ? rx.patientId : null;
  
  return {
    id: rx._id,
    prescription_no: rx.prescriptionNo,
    patient_id: typeof rx.patientId === 'string' ? rx.patientId : patient?._id || '',
    doctor_id: rx.doctorId,
    symptoms: rx.symptoms.map((s) => ({
      id: s.symptomId,
      name: s.name,
      severity: s.severity,
      duration: s.duration,
      durationUnit: s.durationUnit,
    })),
    medicines: rx.medicines.map((m) => ({
      id: m.medicineId,
      name: m.name,
      category: m.category,
      modality: m.modality || 'electro_homeopathy',
      dosage: m.dosage,
      duration: m.duration,
      potency: m.potency,
      repetition: m.repetition,
      instructions: m.instructions,
    })),
    diagnosis: rx.diagnosis || null,
    advice: rx.advice || null,
    follow_up_date: rx.followUpDate || null,
    created_at: rx.createdAt,
    updated_at: rx.updatedAt,
    patient: patient ? {
      id: patient._id,
      patient_id: patient.patientId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      mobile: patient.mobile,
      address: patient.address || null,
    } : undefined,
  };
};

export type { PrescriptionSymptom, PrescriptionMedicine, CreatePrescriptionData };

export interface Prescription {
  id: string;
  prescription_no: string;
  patient_id: string;
  doctor_id: string;
  symptoms: PrescriptionSymptom[];
  medicines: PrescriptionMedicine[];
  diagnosis: string | null;
  advice: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    patient_id: string;
    name: string;
    age: number;
    gender: string;
    mobile: string;
    address: string | null;
  };
}

export const usePrescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorInfo, setDoctorInfo] = useState<{
    id: string;
    name: string;
    clinic_name: string | null;
    clinic_address: string | null;
    qualification: string;
    registration_no: string;
    specialization: string;
  } | null>(null);

  // Fetch doctor info
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!user) return;

      try {
        const response = await doctorApi.getMyProfile();
        if (response.success && response.data) {
          const doctor = response.data.doctor;
          setDoctorId(doctor.id);
          setDoctorInfo({
            id: doctor.id,
            name: doctor.name,
            clinic_name: doctor.clinicName || null,
            clinic_address: doctor.clinicAddress || null,
            qualification: doctor.qualification,
            registration_no: doctor.registrationNo,
            specialization: doctor.specialization,
          });
        }
      } catch (error) {
        console.error('Error fetching doctor:', error);
      }
    };

    fetchDoctor();
  }, [user]);

  // Fetch prescriptions
  const fetchPrescriptions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await prescriptionApi.getPrescriptions();
      if (response.success && response.data) {
        setPrescriptions(response.data.map(mapPrescription));
      } else {
        toast.error('Failed to load prescriptions');
      }
    } catch (error: any) {
      console.error('Error fetching prescriptions:', error);
      toast.error(error.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  // Create prescription
  const createPrescription = async (formData: CreatePrescriptionData): Promise<Prescription | null> => {
    try {
      const response = await prescriptionApi.createPrescription({
        patientId: formData.patient_id,
        symptoms: formData.symptoms.map((s) => ({
          symptomId: s.id,
          name: s.name,
          severity: s.severity as 'low' | 'medium' | 'high',
          duration: s.duration,
          durationUnit: s.durationUnit as 'days' | 'weeks' | 'months',
        })),
        medicines: formData.medicines.map((m) => ({
          medicineId: m.id,
          name: m.name,
          category: m.category,
          modality: m.modality || 'electro_homeopathy', // Add modality field
          dosage: m.dosage,
          duration: m.duration,
          instructions: m.instructions,
        })),
        diagnosis: formData.diagnosis,
        advice: formData.advice,
        followUpDate: formData.follow_up_date,
      });

      if (response.success && response.data) {
        toast.success(`Prescription ${response.data.prescriptionNo} created successfully`);
        await fetchPrescriptions();
        return mapPrescription(response.data);
      } else {
        toast.error(response.message || 'Failed to create prescription');
        return null;
      }
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast.error(error.response?.data?.message || 'Failed to create prescription');
      return null;
    }
  };

  // Get prescription by ID
  const getPrescription = async (id: string): Promise<Prescription | null> => {
    try {
      const response = await prescriptionApi.getPrescription(id);
      if (response.success && response.data) {
        return mapPrescription(response.data);
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching prescription:', error);
      return null;
    }
  };

  return {
    prescriptions,
    loading,
    doctorId,
    doctorInfo,
    createPrescription,
    getPrescription,
    refetch: fetchPrescriptions,
  };
};
