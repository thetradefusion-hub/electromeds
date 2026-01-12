import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useDoctor } from './useDoctor';
import { prescriptionApi } from '@/lib/api/prescription.api';
import { isBefore, startOfDay } from 'date-fns';

interface FollowUp {
  id: string;
  prescriptionNo: string;
  followUpDate: Date;
  diagnosis: string | null;
  patientId: string;
  patientName: string;
  patientMobile: string;
  patientPatientId: string;
  status: 'pending' | 'completed' | 'missed';
}

export function useFollowUps() {
  const { doctorId } = useDoctor();
  const queryClient = useQueryClient();

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['follow-ups', doctorId],
    queryFn: async (): Promise<FollowUp[]> => {
      if (!doctorId) return [];

      try {
        const response = await prescriptionApi.getPrescriptions();
        if (!response.success || !response.data) return [];

        const today = startOfDay(new Date());

        return response.data
          .filter((rx) => rx.followUpDate)
          .map((prescription) => {
            const followUpDate = new Date(prescription.followUpDate!);
            const isPast = isBefore(followUpDate, today);
            const patient = typeof prescription.patientId === 'object' ? prescription.patientId : null;
            
            return {
              id: prescription._id,
              prescriptionNo: prescription.prescriptionNo,
              followUpDate,
              diagnosis: prescription.diagnosis || null,
              patientId: typeof prescription.patientId === 'string' ? prescription.patientId : patient?._id || '',
              patientName: patient?.name || 'Unknown',
              patientMobile: patient?.mobile || '',
              patientPatientId: patient?.patientId || '',
              status: isPast ? 'missed' : 'pending',
            };
          })
          .sort((a, b) => a.followUpDate.getTime() - b.followUpDate.getTime());
      } catch (error) {
        console.error('Error fetching follow-ups:', error);
        return [];
      }
    },
    enabled: !!doctorId,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (prescriptionId: string) => {
      const response = await prescriptionApi.updatePrescription(prescriptionId, {
        followUpDate: undefined,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark as complete');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });

  const cancelFollowUpMutation = useMutation({
    mutationFn: async (prescriptionId: string) => {
      const response = await prescriptionApi.updatePrescription(prescriptionId, {
        followUpDate: undefined,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel follow-up');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-ups', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', doctorId] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
    },
  });

  return {
    followUps,
    isLoading,
    markComplete: markCompleteMutation.mutate,
    cancelFollowUp: cancelFollowUpMutation.mutate,
    isMarkingComplete: markCompleteMutation.isPending,
    isCancelling: cancelFollowUpMutation.isPending,
  };
}
