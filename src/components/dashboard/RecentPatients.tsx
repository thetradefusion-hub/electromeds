import { User, Phone, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePatients } from '@/hooks/usePatients';

export function RecentPatients() {
  const { patients, loading } = usePatients();
  
  // Get the 5 most recent patients by visit date
  const recentPatients = [...patients]
    .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())
    .slice(0, 5);

  return (
    <div className="medical-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 sm:mb-5 flex items-center justify-between pb-3 border-b border-border/50">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            Recent Patients
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Latest patient registrations</p>
        </div>
        <Link
          to="/patients"
          className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && recentPatients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <User className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No patients registered yet</p>
          <Link to="/patients/new" className="text-sm text-primary hover:underline mt-1">
            Register your first patient
          </Link>
        </div>
      )}

      {!loading && recentPatients.length > 0 && (
        <div className="space-y-2.5 sm:space-y-3">
          {recentPatients.map((patient, index) => (
            <div
              key={patient.id}
              className={cn(
                'group relative overflow-hidden flex items-center justify-between rounded-xl border p-3 sm:p-4 transition-all duration-300 hover:shadow-md animate-fade-in',
                'border-border/50 hover:border-primary/30 bg-card hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Decorative blur effect on hover */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                  'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 shadow-sm',
                  patient.case_type === 'new'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                )}>
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground truncate">{patient.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="truncate">{patient.patient_id}</span>
                    <span>•</span>
                    <span>{patient.age}y, {patient.gender}</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[100px]">{patient.mobile}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted/50">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(patient.visit_date), 'dd MMM')}</span>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap',
                    patient.case_type === 'new'
                      ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  )}
                >
                  {patient.case_type === 'new' ? 'New' : 'Follow-up'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
