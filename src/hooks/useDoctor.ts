import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doctorApi } from '@/lib/api/doctor.api';

interface DoctorInfo {
  id: string;
  name: string;
  clinicName: string | null;
  clinicAddress: string | null;
  qualification: string;
  registrationNo: string;
  specialization: string;
}

export function useDoctor() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // For super_admin, use user ID as doctor ID
        if (user?.role === 'super_admin') {
          setDoctorId(user.id);
          setDoctorInfo({
            id: user.id,
            name: user.name || 'Super Admin',
            clinicName: null,
            clinicAddress: null,
            qualification: 'System Administrator',
            registrationNo: 'ADMIN',
            specialization: 'Administration',
          });
          setLoading(false);
          return;
        }

        // For staff, use assignedDoctorId
        if (user?.role === 'staff' && user?.assignedDoctorId) {
          // For staff, we just need the doctorId for queries
          // Doctor info is not critical for staff dashboard
          console.log('useDoctor: Staff assignedDoctorId:', user.assignedDoctorId);
          setDoctorId(user.assignedDoctorId);
          setDoctorInfo({
            id: user.assignedDoctorId,
            name: 'Assigned Doctor',
            clinicName: null,
            clinicAddress: null,
            qualification: '',
            registrationNo: '',
            specialization: '',
          });
          setLoading(false);
          return;
        }
        
        // If staff but no assignedDoctorId
        if (user?.role === 'staff' && !user?.assignedDoctorId) {
          console.warn('useDoctor: Staff has no assignedDoctorId');
          setLoading(false);
          return;
        }

        // For doctors, fetch doctor profile
        const response = await doctorApi.getMyProfile();
        if (response.success && response.data) {
          const doctor = response.data.doctor;
          setDoctorId(doctor.id);
          setDoctorInfo({
            id: doctor.id,
            name: doctor.name,
            clinicName: doctor.clinicName || null,
            clinicAddress: doctor.clinicAddress || null,
            qualification: doctor.qualification,
            registrationNo: doctor.registrationNo,
            specialization: doctor.specialization,
          });
        }
      } catch (error) {
        console.error('Error fetching doctor:', error);
        // If doctor profile not found but user is doctor, still set user ID
        if (user?.role === 'doctor') {
          setDoctorId(user.id);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [user]);

  return { doctorId, doctorInfo, loading };
}
