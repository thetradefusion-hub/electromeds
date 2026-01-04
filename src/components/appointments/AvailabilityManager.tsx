import { useState, useEffect } from 'react';
import { useAppointments, DoctorAvailability } from '@/hooks/useAppointments';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Clock,
  Plus,
  Trash2,
  Save,
  CalendarX,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration: number;
}

export function AvailabilityManager() {
  const {
    availability,
    blockedDates,
    saveAvailability,
    addBlockedDate,
    removeBlockedDate,
  } = useAppointments();

  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(() => ({
      enabled: false,
      start_time: '09:00',
      end_time: '17:00',
      slot_duration: 15,
    }))
  );

  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (availability.length > 0) {
      const newSchedule = DAYS.map((_, index) => {
        const dayAvail = availability.find((a) => a.day_of_week === index);
        if (dayAvail) {
          return {
            enabled: dayAvail.is_active,
            start_time: dayAvail.start_time.slice(0, 5),
            end_time: dayAvail.end_time.slice(0, 5),
            slot_duration: dayAvail.slot_duration,
          };
        }
        return {
          enabled: false,
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: 15,
        };
      });
      setSchedule(newSchedule);
    }
  }, [availability]);

  const updateDay = (index: number, field: keyof DaySchedule, value: any) => {
    setSchedule((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const slots = schedule
      .map((day, index) => ({
        day_of_week: index,
        start_time: day.start_time + ':00',
        end_time: day.end_time + ':00',
        slot_duration: day.slot_duration,
        is_active: day.enabled,
      }))
      .filter((slot) => slot.is_active);

    saveAvailability(slots);
    setSaving(false);
  };

  const handleAddBlock = () => {
    if (!blockDate) {
      toast.error('Please select a date');
      return;
    }
    addBlockedDate({
      blocked_date: format(blockDate, 'yyyy-MM-dd'),
      reason: blockReason || undefined,
    });
    setShowBlockDialog(false);
    setBlockDate(undefined);
    setBlockReason('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Weekly Schedule */}
      <div className="medical-card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Weekly Schedule</h3>
            <p className="text-sm text-muted-foreground">Set your working hours for each day</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="medical-btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Schedule
          </button>
        </div>

        <div className="space-y-4">
          {DAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                'flex flex-wrap items-center gap-4 rounded-lg border p-4 transition-all',
                schedule[index].enabled
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-muted/50'
              )}
            >
              {/* Day Toggle */}
              <label className="flex w-28 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={schedule[index].enabled}
                  onChange={(e) => updateDay(index, 'enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className={cn('font-medium', !schedule[index].enabled && 'text-muted-foreground')}>
                  {day}
                </span>
              </label>

              {schedule[index].enabled && (
                <>
                  {/* Time Range */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={schedule[index].start_time}
                      onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                      className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground">to</span>
                    <select
                      value={schedule[index].end_time}
                      onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                      className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Slot Duration */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Slot:</span>
                    <select
                      value={schedule[index].slot_duration}
                      onChange={(e) => updateDay(index, 'slot_duration', parseInt(e.target.value))}
                      className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                    >
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="space-y-6">
        <div className="medical-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Blocked Dates</h3>
              <p className="text-sm text-muted-foreground">Days when you're unavailable</p>
            </div>
            <button onClick={() => setShowBlockDialog(true)} className="medical-btn-secondary">
              <Plus className="h-4 w-4" />
              Block Date
            </button>
          </div>

          {blockedDates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center">
              <CalendarX className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No blocked dates</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {format(new Date(block.blocked_date), 'EEEE, MMM d, yyyy')}
                    </p>
                    {block.reason && (
                      <p className="text-sm text-muted-foreground">{block.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeBlockedDate(block.id)}
                    className="rounded-lg p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="medical-card">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Schedule Preview</h3>
          <div className="space-y-2 text-sm">
            {schedule.map((day, index) =>
              day.enabled ? (
                <div key={index} className="flex justify-between">
                  <span className="font-medium">{DAYS[index]}</span>
                  <span className="text-muted-foreground">
                    {day.start_time} - {day.end_time} ({day.slot_duration} min slots)
                  </span>
                </div>
              ) : null
            )}
            {!schedule.some((d) => d.enabled) && (
              <p className="text-muted-foreground">No working days configured</p>
            )}
          </div>
        </div>
      </div>

      {/* Block Date Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block a Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Calendar
              mode="single"
              selected={blockDate}
              onSelect={setBlockDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border pointer-events-auto"
            />
            <div>
              <label className="mb-1 block text-sm font-medium">Reason (Optional)</label>
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Holiday, Leave, Conference"
                className="medical-input"
              />
            </div>
            <button onClick={handleAddBlock} className="w-full medical-btn-primary">
              Block Date
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
