import { useQuery } from '@tanstack/react-query';
import { patientApi } from '@/lib/api/patient.api';
import { prescriptionApi } from '@/lib/api/prescription.api';
import { adminApi } from '@/lib/api/admin.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, FileText, Stethoscope, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'patient' | 'prescription' | 'doctor';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    doctorName?: string;
    patientName?: string;
  };
}

const ActivityFeed = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-activity-feed'],
    queryFn: async () => {
      try {
        // Fetch recent patients, prescriptions, and doctors
        const [patientsRes, prescriptionsRes, doctorsRes] = await Promise.all([
          patientApi.getPatients(),
          prescriptionApi.getPrescriptions(),
          adminApi.getAllDoctors(),
        ]);

        const items: ActivityItem[] = [];

        // Add patient activities
        if (patientsRes.success && patientsRes.data) {
          patientsRes.data
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10)
            .forEach(patient => {
              items.push({
                id: `patient-${patient._id}`,
                type: 'patient',
                title: 'New Patient Registered',
                description: `${patient.name} (${patient.patientId})`,
                timestamp: patient.createdAt,
                metadata: {
                  patientName: patient.name,
                },
              });
            });
        }

        // Add prescription activities
        if (prescriptionsRes.success && prescriptionsRes.data) {
          prescriptionsRes.data
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10)
            .forEach(rx => {
              const patientName = typeof rx.patientId === 'object' && rx.patientId?.name 
                ? rx.patientId.name 
                : 'Unknown';
              items.push({
                id: `prescription-${rx._id}`,
                type: 'prescription',
                title: 'Prescription Created',
                description: `${rx.prescriptionNo} for ${patientName}`,
                timestamp: rx.createdAt,
                metadata: {
                  patientName,
                },
              });
            });
        }

        // Add doctor activities
        if (doctorsRes.success && doctorsRes.data) {
          doctorsRes.data
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .forEach(doctor => {
              items.push({
                id: `doctor-${doctor.id}`,
                type: 'doctor',
                title: 'New Doctor Joined',
                description: `${doctor.name} - ${doctor.specialization}`,
                timestamp: doctor.createdAt,
                metadata: {
                  doctorName: doctor.name,
                },
              });
            });
        }

        // Sort by timestamp
        items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return items.slice(0, 20);
      } catch (error) {
        console.error('Error fetching activity feed:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'patient':
        return <UserPlus className="h-4 w-4 text-accent" />;
      case 'prescription':
        return <FileText className="h-4 w-4 text-primary" />;
      case 'doctor':
        return <Stethoscope className="h-4 w-4 text-warning" />;
    }
  };

  const getBadgeVariant = (type: ActivityItem['type']) => {
    switch (type) {
      case 'patient':
        return 'default';
      case 'prescription':
        return 'secondary';
      case 'doctor':
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Real-time updates from across the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {activities?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities?.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background">
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <Badge variant={getBadgeVariant(activity.type)} className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
