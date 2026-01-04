import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePublicBooking, DoctorAvailability } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { format, addMinutes, parse, isBefore, startOfDay, isPast, isToday } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Building,
  CheckCircle,
  Loader2,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DoctorInfo {
  id: string;
  clinic_name: string | null;
  clinic_address: string | null;
  specialization: string;
  profile?: {
    name: string;
    email: string;
  };
}

export default function BookAppointment() {
  const [searchParams] = useSearchParams();
  const doctorIdParam = searchParams.get('doctor');

  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>(doctorIdParam || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booked, setBooked] = useState(false);

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    notes: '',
  });

  const { availability, blockedDates, getBookedSlots, bookAppointment, isBooking } =
    usePublicBooking(selectedDoctor);

  // Fetch doctors list
  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from('doctors')
        .select(`
          id,
          clinic_name,
          clinic_address,
          specialization,
          profile:profiles!doctors_user_id_fkey(name, email)
        `);
      
      if (data) {
        // Transform the data to handle the profile array
        const transformedData = data.map(doctor => ({
          ...doctor,
          profile: Array.isArray(doctor.profile) ? doctor.profile[0] : doctor.profile
        }));
        setDoctors(transformedData as DoctorInfo[]);
        if (doctorIdParam && transformedData.some((d) => d.id === doctorIdParam)) {
          setSelectedDoctor(doctorIdParam);
        }
      }
    };
    fetchDoctors();
  }, [doctorIdParam]);

  // Calculate available slots when date changes
  useEffect(() => {
    const calculateSlots = async () => {
      if (!selectedDate || !selectedDoctor || availability.length === 0) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      const dayOfWeek = selectedDate.getDay();
      const dayAvail = availability.find((a) => a.day_of_week === dayOfWeek && a.is_active);

      if (!dayAvail) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const isBlocked = blockedDates.some((b) => b.blocked_date === dateStr);
      if (isBlocked) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      const bookedSlots = await getBookedSlots(selectedDate);
      const slots: string[] = [];
      const start = parse(dayAvail.start_time.slice(0, 5), 'HH:mm', new Date());
      const end = parse(dayAvail.end_time.slice(0, 5), 'HH:mm', new Date());
      const duration = dayAvail.slot_duration;
      const now = new Date();
      const isTodayDate = isToday(selectedDate);

      let current = start;
      while (isBefore(current, end)) {
        const timeStr = format(current, 'HH:mm');
        const isBooked = bookedSlots.includes(timeStr);

        if (isTodayDate) {
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

      setAvailableSlots(slots);
      setLoadingSlots(false);
    };

    calculateSlots();
  }, [selectedDate, selectedDoctor, availability, blockedDates]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!form.mobile.trim() || form.mobile.length < 10) {
      toast.error('Please enter a valid mobile number');
      return;
    }
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      await bookAppointment({
        patient_name: form.name,
        patient_mobile: form.mobile,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedSlot,
        notes: form.notes || undefined,
      });
      setBooked(true);
    } catch {
      // Error handled in hook
    }
  };

  const selectedDoctorInfo = doctors.find((d) => d.id === selectedDoctor);

  if (booked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="medical-card py-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Appointment Requested!</h1>
            <p className="mt-4 text-muted-foreground">
              Your appointment request for{' '}
              <span className="font-medium text-foreground">
                {format(selectedDate!, 'EEEE, MMMM d, yyyy')}
              </span>{' '}
              at{' '}
              <span className="font-medium text-foreground">{selectedSlot}</span>{' '}
              has been submitted.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              The clinic will confirm your appointment shortly. You may receive a call or SMS.
            </p>
            <button
              onClick={() => {
                setBooked(false);
                setSelectedSlot('');
                setSelectedDate(undefined);
                setForm({ name: '', mobile: '', notes: '' });
              }}
              className="mt-8 medical-btn-primary"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Book an Appointment</h1>
              <p className="text-sm text-muted-foreground">Select your preferred date and time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Side - Selection */}
          <div className="space-y-6">
            {/* Doctor Selection */}
            {!doctorIdParam && (
              <div className="medical-card">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                  <User className="h-5 w-5 text-primary" />
                  Select Doctor
                </h3>
                <div className="space-y-2">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => {
                        setSelectedDoctor(doctor.id);
                        setSelectedDate(undefined);
                        setSelectedSlot('');
                      }}
                      className={cn(
                        'w-full rounded-lg border p-4 text-left transition-all',
                        selectedDoctor === doctor.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <p className="font-medium text-foreground">{doctor.profile?.name || 'Doctor'}</p>
                      <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      {doctor.clinic_name && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Building className="h-3 w-3" />
                          {doctor.clinic_name}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Doctor Info */}
            {selectedDoctorInfo && (
              <div className="medical-card bg-primary/5 border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-primary">
                    <User className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {selectedDoctorInfo.profile?.name || 'Doctor'}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedDoctorInfo.specialization}</p>
                    {selectedDoctorInfo.clinic_name && (
                      <p className="text-sm text-muted-foreground">{selectedDoctorInfo.clinic_name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Calendar */}
            {selectedDoctor && (
              <div className="medical-card">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Select Date
                </h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedSlot('');
                  }}
                  disabled={(date) => {
                    if (isPast(startOfDay(date)) && !isToday(date)) return true;
                    const dayOfWeek = date.getDay();
                    const hasAvailability = availability.some(
                      (a) => a.day_of_week === dayOfWeek && a.is_active
                    );
                    if (!hasAvailability) return true;
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return blockedDates.some((b) => b.blocked_date === dateStr);
                  }}
                  className="rounded-md border pointer-events-auto"
                />
              </div>
            )}
          </div>

          {/* Right Side - Time & Form */}
          <div className="space-y-6">
            {/* Time Slots */}
            {selectedDate && (
              <div className="medical-card">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                  <Clock className="h-5 w-5 text-accent" />
                  Select Time - {format(selectedDate, 'MMM d, yyyy')}
                </h3>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <p className="text-sm text-muted-foreground">
                      No available slots for this date. Please select another date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          'rounded-lg border p-3 text-sm font-medium transition-all',
                          selectedSlot === slot
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50 hover:bg-primary/5'
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Patient Details */}
            {selectedSlot && (
              <div className="medical-card">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                  <User className="h-5 w-5 text-primary" />
                  Your Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="medical-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        value={form.mobile}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        placeholder="Enter your mobile number"
                        className="medical-input pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any specific concerns or notes for the doctor"
                      rows={3}
                      className="medical-input resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {selectedSlot && (
              <button
                onClick={handleSubmit}
                disabled={isBooking}
                className="w-full medical-btn-primary py-4 text-lg"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Confirm Appointment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
