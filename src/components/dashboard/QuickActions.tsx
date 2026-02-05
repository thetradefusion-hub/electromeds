import { UserPlus, Stethoscope, FileText, Pill, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const actions = [
  {
    icon: UserPlus,
    label: 'Add Patient',
    description: 'Register new patient',
    path: '/patients/new',
    variant: 'primary' as const,
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    icon: Stethoscope,
    label: 'New Consultation',
    description: 'Start consultation',
    path: '/consultation',
    variant: 'accent' as const,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    icon: FileText,
    label: 'View Prescriptions',
    description: 'Recent prescriptions',
    path: '/prescriptions',
    variant: 'default' as const,
    gradient: 'from-slate-500 to-slate-600',
  },
  {
    icon: Pill,
    label: 'Medicine Library',
    description: 'Browse medicines',
    path: '/medicines',
    variant: 'default' as const,
    gradient: 'from-blue-600 to-blue-700',
  },
];

export function QuickActions() {
  return (
    <div className="medical-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 sm:mb-5 pb-3 border-b border-border/50">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          Quick Actions
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Common tasks</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              "group relative overflow-hidden flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all duration-300 hover:shadow-lg animate-fade-in",
              action.variant === 'primary' 
                ? 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20'
                : action.variant === 'accent'
                ? 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/30 dark:to-blue-900/20'
                : 'border-border bg-card hover:border-primary/30'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Decorative blur effect */}
            <div className={cn(
              "absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity -translate-y-1/2 translate-x-1/2",
              `bg-gradient-to-br ${action.gradient}`
            )} />
            
            <div
              className={cn(
                "relative z-10 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 shadow-lg",
                `bg-gradient-to-br ${action.gradient}`
              )}
            >
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <div className="relative z-10">
              <p className="text-xs sm:text-sm font-semibold text-foreground">{action.label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
