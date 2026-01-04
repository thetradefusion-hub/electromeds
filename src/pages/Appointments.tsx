import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { usePatients } from '@/hooks/usePatients';
import { Calendar } from '@/components/ui/calendar';
import { format, isToday, isTomorrow, isPast, startOfDay } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Plus,
  Settings,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvailabilityManager } from '@/components/appointments/AvailabilityManager';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  confirmed: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-accent/10 text-accent border-accent/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
  no_show: 'bg-destructive/10 text-destructive border-destructive/30',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showBooking, setShowBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('appointments');

  const {
    appointments,
    loading,
    availability,
    blockedDates,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    getAvailableSlots,
  } = useAppointments(selectedDate);

  const { patients } = usePatients();
  const availableSlots = getAvailableSlots(selectedDate, appointments);

  const [bookingForm, setBookingForm] = useState<{
    patient_id: string;
    patient_name: string;
    patient_mobile: string;
    time_slot: string;
    notes: string;
    booking_type: 'online' | 'walk_in' | 'phone';
  }>({
    patient_id: '',
    patient_name: '',
    patient_mobile: '',
    time_slot: '',
    notes: '',
    booking_type: 'walk_in',
  });

  const handleBook = () => {
    if (!bookingForm.time_slot) {
      toast.error('Please select a time slot');
      return;
    }
    if (!bookingForm.patient_id && !bookingForm.patient_name) {
      toast.error('Please select a patient or enter details');
      return;
    }

    createAppointment({
      patient_id: bookingForm.patient_id || undefined,
      patient_name: bookingForm.patient_name || undefined,
      patient_mobile: bookingForm.patient_mobile || undefined,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      time_slot: bookingForm.time_slot,
      notes: bookingForm.notes || undefined,
      booking_type: bookingForm.booking_type,
    });

    setShowBooking(false);
    setBookingForm({
      patient_id: '',
      patient_name: '',
      patient_mobile: '',
      time_slot: '',
      notes: '',
      booking_type: 'walk_in',
    });
  };

  const handleStatusChange = (appointment: Appointment, newStatus: Appointment['status']) => {
    updateAppointment({ id: appointment.id, status: newStatus });
  };

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  const todayAppointments = appointments.filter((a) => a.status !== 'cancelled');
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;

  return (
    <MainLayout title="Appointments" subtitle="Manage appointments and availability">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="appointments" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <Settings className="h-4 w-4" />
            Availability
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar Panel */}
            <div className="medical-card">
              <h3 className="mb-4 font-semibold text-foreground">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => isPast(startOfDay(date)) && !isToday(date)}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  blocked: blockedDates.map((b) => new Date(b.blocked_date)),
                }}
                modifiersStyles={{
                  blocked: { backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' },
                }}
              />

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-warning/10 p-3 text-center">
                  <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{confirmedCount}</p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </div>

            {/* Appointments List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{formatDateLabel(selectedDate)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowBooking(true)}
                  className="medical-btn-primary"
                  disabled={availableSlots.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  Book Appointment
                </button>
              </div>

              {/* No Availability Warning */}
              {availability.length === 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <div>
                      <p className="font-medium text-foreground">No availability set</p>
                      <p className="text-sm text-muted-foreground">
                        Go to the Availability tab to set your working hours
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : todayAppointments.length === 0 ? (
                <div className="medical-card text-center py-12">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No appointments for this date</p>
                  {availableSlots.length > 0 && (
                    <button
                      onClick={() => setShowBooking(true)}
                      className="mt-4 text-primary hover:underline"
                    >
                      Book an appointment
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="medical-card flex items-center gap-4 p-4"
                    >
                      {/* Time */}
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{appointment.time_slot}</p>
                        <p className="text-xs text-muted-foreground">
                          {appointment.booking_type === 'online' ? 'Online' : 'Walk-in'}
                        </p>
                      </div>

                      <div className="h-12 w-px bg-border" />

                      {/* Patient Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {appointment.patient?.name || appointment.patient_name || 'Unknown'}
                          </span>
                          {appointment.patient?.patient_id && (
                            <span className="text-xs text-muted-foreground">
                              ({appointment.patient.patient_id})
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {appointment.patient?.mobile || appointment.patient_mobile || '-'}
                          </span>
                        </div>
                        {appointment.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">{appointment.notes}</p>
                        )}
                      </div>

                      {/* Status */}
                      <Select
                        value={appointment.status}
                        onValueChange={(val) => handleStatusChange(appointment, val as Appointment['status'])}
                      >
                        <SelectTrigger
                          className={cn('w-32 border', statusColors[appointment.status])}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Actions */}
                      {appointment.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(appointment, 'confirmed')}
                            className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20"
                            title="Confirm"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => cancelAppointment(appointment.id)}
                            className="rounded-lg bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityManager />
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book Appointment - {format(selectedDate, 'MMM d, yyyy')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Time Slot Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium">Select Time Slot</label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setBookingForm({ ...bookingForm, time_slot: slot })}
                    className={cn(
                      'rounded-lg border p-2 text-sm transition-all',
                      bookingForm.time_slot === slot
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {slot}
                  </button>
                ))}
                {availableSlots.length === 0 && (
                  <p className="col-span-4 py-4 text-center text-muted-foreground">
                    No slots available for this date
                  </p>
                )}
              </div>
            </div>

            {/* Patient Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium">Select Existing Patient</label>
              <Select
                value={bookingForm.patient_id}
                onValueChange={(val) => {
                  const patient = patients.find((p) => p.id === val);
                  setBookingForm({
                    ...bookingForm,
                    patient_id: val,
                    patient_name: patient?.name || '',
                    patient_mobile: patient?.mobile || '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.patient_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Manual Entry */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Patient Name</label>
                <input
                  type="text"
                  value={bookingForm.patient_name}
                  onChange={(e) => setBookingForm({ ...bookingForm, patient_name: e.target.value, patient_id: '' })}
                  placeholder="Enter name"
                  className="medical-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Mobile Number</label>
                <input
                  type="tel"
                  value={bookingForm.patient_mobile}
                  onChange={(e) => setBookingForm({ ...bookingForm, patient_mobile: e.target.value })}
                  placeholder="Enter mobile"
                  className="medical-input"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-sm font-medium">Notes (Optional)</label>
              <textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                placeholder="Any notes..."
                rows={2}
                className="medical-input resize-none"
              />
            </div>

            {/* Booking Type */}
            <div>
              <label className="mb-2 block text-sm font-medium">Booking Type</label>
              <div className="flex gap-2">
                {(['walk_in', 'phone'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setBookingForm({ ...bookingForm, booking_type: type })}
                    className={cn(
                      'flex-1 rounded-lg border p-2 text-sm capitalize transition-all',
                      bookingForm.booking_type === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {type.replace('_', '-')}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleBook} className="w-full medical-btn-primary">
              <Check className="h-4 w-4" />
              Confirm Booking
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
