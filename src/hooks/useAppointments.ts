import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDoctor } from './useDoctor';
import { toast } from 'sonner';
import { format, addMinutes, parse, isBefore, startOfDay } from 'date-fns';

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
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(id, name, patient_id, mobile)
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true })
        .order('time_slot', { ascending: true });

      if (date) {
        query = query.eq('appointment_date', format(date, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!doctorId,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['doctor-availability', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week');
      if (error) throw error;
      return data as DoctorAvailability[];
    },
    enabled: !!doctorId,
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['blocked-dates', doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('blocked_date', format(new Date(), 'yyyy-MM-dd'));
      if (error) throw error;
      return data as BlockedDate[];
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
      if (!doctorId) throw new Error('Doctor not found');
      const { error } = await supabase.from('appointments').insert({
        doctor_id: doctorId,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment booked successfully');
    },
    onError: (error) => {
      toast.error('Failed to book appointment: ' + error.message);
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Appointment> & { id: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment cancelled');
    },
  });

  const saveAvailability = useMutation({
    mutationFn: async (slots: Omit<DoctorAvailability, 'id' | 'doctor_id'>[]) => {
      if (!doctorId) throw new Error('Doctor not found');
      
      // Delete existing and insert new
      await supabase.from('doctor_availability').delete().eq('doctor_id', doctorId);
      
      if (slots.length > 0) {
        const { error } = await supabase.from('doctor_availability').insert(
          slots.map((slot) => ({ ...slot, doctor_id: doctorId }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-availability'] });
      toast.success('Availability saved');
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
  });

  const addBlockedDate = useMutation({
    mutationFn: async (data: { blocked_date: string; reason?: string }) => {
      if (!doctorId) throw new Error('Doctor not found');
      const { error } = await supabase.from('blocked_dates').insert({
        doctor_id: doctorId,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Date blocked');
    },
  });

  const removeBlockedDate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-dates'] });
      toast.success('Block removed');
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
    const start = parse(dayAvailability.start_time, 'HH:mm:ss', new Date());
    const end = parse(dayAvailability.end_time, 'HH:mm:ss', new Date());
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
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('is_active', true);
      if (error) throw error;
      return data as DoctorAvailability[];
    },
    enabled: !!doctorId,
  });

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['public-blocked-dates', doctorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('blocked_date', format(new Date(), 'yyyy-MM-dd'));
      if (error) throw error;
      return data as BlockedDate[];
    },
    enabled: !!doctorId,
  });

  const getBookedSlots = async (date: Date) => {
    const { data } = await supabase
      .from('appointments')
      .select('time_slot')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', format(date, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');
    return data?.map((a) => a.time_slot) || [];
  };

  const bookAppointment = useMutation({
    mutationFn: async (data: {
      patient_name: string;
      patient_mobile: string;
      appointment_date: string;
      time_slot: string;
      notes?: string;
    }) => {
      const { error } = await supabase.from('appointments').insert({
        doctor_id: doctorId,
        booking_type: 'online',
        status: 'pending',
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-appointments'] });
      toast.success('Appointment request submitted!');
    },
    onError: (error) => {
      toast.error('Booking failed: ' + error.message);
    },
  });

  return {
    availability,
    blockedDates,
    getBookedSlots,
    bookAppointment: bookAppointment.mutateAsync,
    isBooking: bookAppointment.isPending,
  };
};
