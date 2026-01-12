import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { patientApi, Patient, PatientFormData } from '@/lib/api/patient.api';

// Map backend Patient to frontend Patient format
const mapPatient = (patient: Patient) => ({
  id: patient._id,
  patient_id: patient.patientId,
  doctor_id: patient.doctorId,
  name: patient.name,
  age: patient.age,
  gender: patient.gender,
  mobile: patient.mobile,
  address: patient.address || null,
  case_type: patient.caseType,
  visit_date: patient.visitDate,
  created_at: patient.createdAt,
  updated_at: patient.updatedAt,
});

export type { Patient, PatientFormData };

export const usePatients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  // Fetch patients
  const fetchPatients = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await patientApi.getPatients();
      if (response.success && response.data) {
        setPatients(response.data.map(mapPatient));
      } else {
        toast.error('Failed to load patients');
      }
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  // Create patient
  const createPatient = async (formData: PatientFormData): Promise<boolean> => {
    try {
      const response = await patientApi.createPatient({
        ...formData,
        caseType: formData.caseType || 'new',
        doctorId: formData.doctorId, // Include doctorId if provided (for admin)
      });

      if (response.success && response.data) {
        toast.success(`Patient registered with ID: ${response.data.patientId}`);
        await fetchPatients();
        return true;
      } else {
        toast.error(response.message || 'Failed to register patient');
        return false;
      }
    } catch (error: any) {
      console.error('Error creating patient:', error);
      toast.error(error.response?.data?.message || 'Failed to register patient');
      return false;
    }
  };

  // Update patient
  const updatePatient = async (id: string, formData: Partial<PatientFormData>): Promise<boolean> => {
    try {
      const response = await patientApi.updatePatient(id, formData);
      if (response.success) {
        toast.success('Patient updated successfully');
        await fetchPatients();
        return true;
      } else {
        toast.error(response.message || 'Failed to update patient');
        return false;
      }
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(error.response?.data?.message || 'Failed to update patient');
      return false;
    }
  };

  // Delete patient
  const deletePatient = async (id: string): Promise<boolean> => {
    try {
      const response = await patientApi.deletePatient(id);
      if (response.success) {
        toast.success('Patient deleted successfully');
        await fetchPatients();
        return true;
      } else {
        toast.error(response.message || 'Failed to delete patient');
        return false;
      }
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast.error(error.response?.data?.message || 'Failed to delete patient');
      return false;
    }
  };

  // Update visit date (for follow-ups)
  const recordVisit = async (id: string): Promise<boolean> => {
    try {
      const response = await patientApi.recordVisit(id);
      if (response.success) {
        toast.success('Visit recorded');
        await fetchPatients();
        return true;
      } else {
        toast.error(response.message || 'Failed to record visit');
        return false;
      }
    } catch (error: any) {
      console.error('Error recording visit:', error);
      toast.error(error.response?.data?.message || 'Failed to record visit');
      return false;
    }
  };

  return {
    patients,
    loading,
    doctorId,
    createPatient,
    updatePatient,
    deletePatient,
    recordVisit,
    refetch: fetchPatients,
  };
};
