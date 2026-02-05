import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'warning';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    primary: 'bg-primary/5 border-primary/20',
    accent: 'bg-accent/5 border-accent/20',
    warning: 'bg-warning/5 border-warning/20',
  };

  const iconStyles = {
    default: 'bg-secondary text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    warning: 'bg-warning/10 text-warning',
  };

  const gradientStyles = {
    default: 'from-slate-500 to-slate-600',
    primary: 'from-blue-600 to-blue-700',
    accent: 'from-blue-500 to-blue-600',
    warning: 'from-orange-500 to-amber-500',
  };

  const cardGradients = {
    default: 'from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30',
    primary: 'from-blue-50 to-blue-50/50 dark:from-blue-950/40 dark:to-blue-900/30',
    accent: 'from-blue-50/80 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20',
    warning: 'from-orange-50 to-amber-50/50 dark:from-orange-950/30 dark:to-amber-950/20',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg',
        `bg-gradient-to-br ${cardGradients[variant]}`,
        variant === 'primary' ? 'border-blue-200 dark:border-blue-800' :
        variant === 'accent' ? 'border-blue-200 dark:border-blue-800' :
        variant === 'warning' ? 'border-orange-200 dark:border-orange-800' :
        'border-border'
      )}
    >
      {/* Decorative blur effect */}
      <div className={cn(
        'absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 -translate-y-1/2 translate-x-1/2',
        variant === 'primary' ? 'bg-blue-600' :
        variant === 'accent' ? 'bg-blue-500' :
        variant === 'warning' ? 'bg-orange-500' :
        'bg-slate-500'
      )} />
      
      <div className="relative z-10 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              'text-2xl sm:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
              variant === 'primary' ? 'from-blue-700 to-blue-800 dark:from-blue-400 dark:to-blue-300' :
              variant === 'accent' ? 'from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-300' :
              variant === 'warning' ? 'from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400' :
              'from-foreground to-foreground/70'
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  'text-xs font-medium flex items-center gap-1',
                  trend.isPositive ? 'text-primary' : 'text-red-600 dark:text-red-400'
                )}
              >
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}% from last week</span>
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 hover:scale-110',
              `bg-gradient-to-br ${gradientStyles[variant]}`
            )}
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
