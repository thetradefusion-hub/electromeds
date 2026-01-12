import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { prescriptionApi } from '@/lib/api/prescription.api';
import { addDays, isAfter, isBefore, startOfDay, differenceInDays } from 'date-fns';

export interface Notification {
  id: string;
  type: 'followup_today' | 'followup_upcoming' | 'followup_overdue';
  title: string;
  message: string;
  date: string;
  patientId: string;
  patientName: string;
  prescriptionId: string;
  read: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    // Load read notification IDs from localStorage
    const stored = localStorage.getItem('readNotifications');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    const fetchFollowUps = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch prescriptions with follow-up dates
        const response = await prescriptionApi.getPrescriptions();
        if (!response.success || !response.data) {
          setLoading(false);
          return;
        }

        const prescriptions = response.data.filter((rx) => rx.followUpDate);
        const today = startOfDay(new Date());
        const upcomingLimit = addDays(today, 7); // Show follow-ups within next 7 days
        const newNotifications: Notification[] = [];

        prescriptions.forEach((rx) => {
          if (!rx.followUpDate) return;

          const followUpDate = startOfDay(new Date(rx.followUpDate));
          const patient = typeof rx.patientId === 'object' ? rx.patientId : null;
          if (!patient) return;

          const daysDiff = differenceInDays(followUpDate, today);

          // Overdue follow-ups (up to 30 days in the past)
          if (isBefore(followUpDate, today) && daysDiff >= -30) {
            newNotifications.push({
              id: `overdue-${rx._id}`,
              type: 'followup_overdue',
              title: 'Overdue Follow-up',
              message: `${patient.name} missed their follow-up ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? 's' : ''} ago`,
              date: rx.followUpDate,
              patientId: patient._id,
              patientName: patient.name,
              prescriptionId: rx._id,
              read: readIds.has(`overdue-${rx._id}`),
            });
          }
          // Today's follow-ups
          else if (daysDiff === 0) {
            newNotifications.push({
              id: `today-${rx._id}`,
              type: 'followup_today',
              title: 'Follow-up Today',
              message: `${patient.name} has a follow-up scheduled for today`,
              date: rx.followUpDate,
              patientId: patient._id,
              patientName: patient.name,
              prescriptionId: rx._id,
              read: readIds.has(`today-${rx._id}`),
            });
          }
          // Upcoming follow-ups (next 7 days)
          else if (isAfter(followUpDate, today) && isBefore(followUpDate, upcomingLimit)) {
            newNotifications.push({
              id: `upcoming-${rx._id}`,
              type: 'followup_upcoming',
              title: 'Upcoming Follow-up',
              message: `${patient.name} has a follow-up in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`,
              date: rx.followUpDate,
              patientId: patient._id,
              patientName: patient.name,
              prescriptionId: rx._id,
              read: readIds.has(`upcoming-${rx._id}`),
            });
          }
        });

      // Sort: overdue first, then today, then upcoming
      newNotifications.sort((a, b) => {
        const priority = { followup_overdue: 0, followup_today: 1, followup_upcoming: 2 };
        if (priority[a.type] !== priority[b.type]) {
          return priority[a.type] - priority[b.type];
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

        setNotifications(newNotifications);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    };

    fetchFollowUps();

    // Refresh every 5 minutes
    const interval = setInterval(fetchFollowUps, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, readIds]);

  const markAsRead = (notificationId: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      localStorage.setItem('readNotifications', JSON.stringify([...next]));
      return next;
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds((prev) => {
      const next = new Set([...prev, ...allIds]);
      localStorage.setItem('readNotifications', JSON.stringify([...next]));
      return next;
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};
