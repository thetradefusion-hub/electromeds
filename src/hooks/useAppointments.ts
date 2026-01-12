import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDoctor } from './useDoctor';
import { toast } from 'sonner';
import { format, addMinutes, parse, isBefore } from 'date-fns';
import { appointmentApi, Appointment as BackendAppointment, DoctorAvailability as BackendAvailability, BlockedDate as BackendBlockedDate } from '@/lib/api/appointment.api';

// Map backend types to frontend format
const mapAppointment = (apt: BackendAppointment) => {
  const patient = typeof apt.patientId === 'object' ? apt.patientId : null;
  
  return {
    id: apt._id,
    doctor_id: apt.doctorId,
    patient_id: typeof apt.patientId === 'string' ? apt.patientId : null,
    patient_name: apt.patientName || null,
    patient_mobile: apt.patientMobile || null,
    appointment_date: apt.appointmentDate,
    time_slot: apt.timeSlot,
    status: apt.status,
    notes: apt.notes || null,
    booking_type: apt.bookingType,
    created_at: apt.createdAt,
    patient: patient ? {
      id: patient._id,
      name: patient.name,
      patient_id: patient.patientId,
      mobile: patient.mobile,
    } : undefined,
  };
};

const mapAvailability = (av: BackendAvailability) => ({
  id: av._id,
  doctor_id: av.doctorId,
  day_of_week: av.dayOfWeek,
  start_time: av.startTime,
  end_time: av.endTime,
  slot_duration: av.slotDuration,
  is_active: av.isActive,
});

const mapBlockedDate = (bd: BackendBlockedDate) => ({
  id: bd._id,
  doctor_id: bd.doctorId,
  blocked_date: bd.blockedDate,
  reason: bd.reason || null,
});

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string | null;
  patient_name: string | null;
  patient_mobile: string | null;
  appointment_date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  booking_type: 'online' | 'walk_in' | 'phone';
  created_at: string;
  patient?: {
    id: string;
    name: string;
    patient_id: string;
    mobile: string;
  };
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

export interface BlockedDate {
  id: string;
  doctor_id: string;
  blocked_date: string;
  reason: string | null;
}

export const useAppointments = (date?: Date) => {
  const { doctorId } = useDoctor();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading: loading } = useQuery({
    queryKey: ['appointments', doctorId, date?.toISOString()],
    queryFn: async () => {
      if (!doctorId) return [];
      
      try {
        const params: { date?: string } = {};
        if (date) {
          params.date = format(date, 'yyyy-MM-dd');
        }
        
        const response = await appointmentApi.getAppointments(params);
        if (response.success && response.data) {
          return response.data.map(mapAppointment);
        }
        return [];
      } catch (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }
    },
    enabled: !!doctorId,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      try {
        const response = await appointmentApi.getAvailability();
        if (response.success && response.data) {
          return response.data.map(mapAvailability);
        }
        return [];
      } catch (error) {
        console.error('Error fetching availability:', error);
        return [];
      }
    },
    enabled: !!doctorId,
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      try {
        const response = await appointmentApi.getBlockedDates({
          startDate: format(new Date(), 'yyyy-MM-dd'),
        });
        if (response.success && response.data) {
          return response.data.map(mapBlockedDate);
        }
        return [];
      } catch (error) {
        console.error('Error fetching blocked dates:', error);
        return [];
      }
    },
    enabled: !!doctorId,
  });

  const createAppointment = useMutation({
    mutationFn: async (data: {
      patient_id?: string;
      patient_name?: string;
      patient_mobile?: string;
      appointment_date: string;
      time_slot: string;
      notes?: string;
      booking_type?: 'online' | 'walk_in' | 'phone';
    }) => {
      const response = await appointmentApi.createAppointment({
        patientId: data.patient_id,
        patientName: data.patient_name,
        patientMobile: data.patient_mobile,
        appointmentDate: data.appointment_date,
        timeSlot: data.time_slot,
        notes: data.notes,
        bookingType: data.booking_type || 'walk_in',
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to create appointment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment booked successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to book appointment: ' + (error.response?.data?.message || error.message));
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Appointment> & { id: string }) => {
      const response = await appointmentApi.updateAppointment(id, {
        appointmentDate: data.appointment_date,
        timeSlot: data.time_slot,
        status: data.status,
        notes: data.notes,
        bookingType: data.booking_type,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to update appointment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update: ' + (error.response?.data?.message || error.message));
    },
  });

  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      const response = await appointmentApi.updateAppointment(id, { status: 'cancelled' });
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel appointment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment cancelled');
    },
    onError: (error: any) => {
      toast.error('Failed to cancel: ' + (error.response?.data?.message || error.message));
    },
  });

  const saveAvailability = useMutation({
    mutationFn: async (slots: Omit<DoctorAvailability, 'id' | 'doctor_id'>[]) => {
      // Save each slot individually
      await Promise.all(
        slots.map((slot) =>
          appointmentApi.setAvailability({
            dayOfWeek: slot.day_of_week,
            startTime: slot.start_time,
            endTime: slot.end_time,
            slotDuration: slot.slot_duration,
            isActive: slot.is_active,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] });
      toast.success('Availability saved');
    },
    onError: (error: any) => {
      toast.error('Failed to save: ' + (error.response?.data?.message || error.message));
    },
  });

  const addBlockedDate = useMutation({
    mutationFn: async (data: { blocked_date: string; reason?: string }) => {
      const response = await appointmentApi.blockDate({
        blockedDate: data.blocked_date,
        reason: data.reason,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to block date');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Date blocked');
    },
    onError: (error: any) => {
      toast.error('Failed to block date: ' + (error.response?.data?.message || error.message));
    },
  });

  const removeBlockedDate = useMutation({
    mutationFn: async (id: string) => {
      const response = await appointmentApi.unblockDate(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to unblock date');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Block removed');
    },
    onError: (error: any) => {
      toast.error('Failed to remove block: ' + (error.response?.data?.message || error.message));
    },
  });

  const getAvailableSlots = (selectedDate: Date, existingAppointments: Appointment[]) => {
    const dayOfWeek = selectedDate.getDay();
    const dayAvailability = availability.find((a) => a.day_of_week === dayOfWeek && a.is_active);
    
    if (!dayAvailability) return [];

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const isBlocked = blockedDates.some((b) => b.blocked_date === dateStr);
    if (isBlocked) return [];

    const slots: string[] = [];
    const start = parse(dayAvailability.start_time, 'HH:mm', new Date());
    const end = parse(dayAvailability.end_time, 'HH:mm', new Date());
    const duration = dayAvailability.slot_duration;

    let current = start;
    const now = new Date();
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

    while (isBefore(current, end)) {
      const timeStr = format(current, 'HH:mm');
      const isBooked = existingAppointments.some(
        (a) => a.time_slot === timeStr && a.status !== 'cancelled'
      );
      
      // Skip past slots for today
      if (isToday) {
        const slotTime = parse(timeStr, 'HH:mm', selectedDate);
        if (isBefore(slotTime, now)) {
          current = addMinutes(current, duration);
          continue;
        }
      }

      if (!isBooked) {
        slots.push(timeStr);
      }
      current = addMinutes(current, duration);
    }

    return slots;
  };

  return {
    appointments,
    loading,
    availability,
    blockedDates,
    createAppointment: createAppointment.mutate,
    updateAppointment: updateAppointment.mutate,
    cancelAppointment: cancelAppointment.mutate,
    saveAvailability: saveAvailability.mutate,
    addBlockedDate: addBlockedDate.mutate,
    removeBlockedDate: removeBlockedDate.mutate,
    getAvailableSlots,
  };
};

// Hook for public booking (no auth required)
export const usePublicBooking = (doctorId: string) => {
  const queryClient = useQueryClient();

  const { data: availability = [] } = useQuery({
    queryKey: ['public-availability', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      try {
        // For public booking, we need to fetch availability without auth
        // This would require a public endpoint or we use the appointment API
        // For now, we'll need to handle this differently
        // TODO: Create public availability endpoint
        return [];
      } catch (error) {
        console.error('Error fetching public availability:', error);
        return [];
      }
    },
    enabled: !!doctorId,
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['public-blocked-dates', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      try {
        // TODO: Create public blocked dates endpoint
        return [];
      } catch (error) {
        console.error('Error fetching public blocked dates:', error);
        return [];
      }
    },
    enabled: !!doctorId,
  });

  const getBookedSlots = async (date: Date): Promise<string[]> => {
    if (!doctorId) return [];
    try {
      const response = await appointmentApi.getAppointments({
        date: format(date, 'yyyy-MM-dd'),
      });
      if (response.success && response.data) {
        return response.data
          .filter((apt) => apt.status !== 'cancelled')
          .map((apt) => apt.timeSlot);
      }
      return [];
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      return [];
    }
  };

  const bookAppointment = useMutation({
    mutationFn: async (data: {
      patient_name: string;
      patient_mobile: string;
      appointment_date: string;
      time_slot: string;
      notes?: string;
    }) => {
      const response = await appointmentApi.createAppointment({
        patientName: data.patient_name,
        patientMobile: data.patient_mobile,
        appointmentDate: data.appointment_date,
        timeSlot: data.time_slot,
        notes: data.notes,
        bookingType: 'online',
        status: 'pending',
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to book appointment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-appointments'] });
      toast.success('Appointment request submitted!');
    },
    onError: (error: any) => {
      toast.error('Booking failed: ' + (error.response?.data?.message || error.message));
    },
  });

  return {
    availability: availability.map(mapAvailability),
    blockedDates: blockedDates.map(mapBlockedDate),
    getBookedSlots,
    bookAppointment: bookAppointment.mutateAsync,
    isBooking: bookAppointment.isPending,
  };
};
