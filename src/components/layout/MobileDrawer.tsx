import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  FileText,
  Settings,
  LogOut,
  Activity,
  CalendarCheck,
  BookOpen,
  Shield,
  HeartPulse,
  X,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  UserCog,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
  roles?: ('super_admin' | 'doctor' | 'staff')[];
}

// Doctor/Staff navigation items
const doctorNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/dashboard' },
  { icon: Users, labelKey: 'nav.patients', path: '/patients' },
  { icon: CalendarCheck, labelKey: 'nav.appointments', path: '/appointments' },
  { icon: UserCog, labelKey: 'nav.staffManagement', path: '/staff-management', roles: ['doctor'] },
  { icon: Stethoscope, labelKey: 'nav.consultation', path: '/consultation', roles: ['doctor'] },
  { icon: FileText, labelKey: 'nav.prescriptions', path: '/prescriptions', roles: ['doctor'] },
  { icon: HeartPulse, labelKey: 'nav.symptoms', path: '/symptoms', roles: ['doctor'] },
  { icon: Pill, labelKey: 'nav.medicines', path: '/medicines', roles: ['doctor'] },
  { icon: BookOpen, labelKey: 'nav.rulesEngine', path: '/rules', roles: ['doctor'] },
  { icon: Activity, labelKey: 'nav.analytics', path: '/analytics', roles: ['doctor'] },
];

// Admin navigation items
const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: 'nav.adminDashboard', path: '/admin' },
  { icon: Clock, labelKey: 'nav.activity', path: '/admin#activity', roles: ['super_admin'] },
  { icon: TrendingUp, labelKey: 'nav.performance', path: '/admin#performance', roles: ['super_admin'] },
  { icon: Users, labelKey: 'nav.doctors', path: '/admin#doctors', roles: ['super_admin'] },
  { icon: Stethoscope, labelKey: 'nav.symptoms', path: '/admin#symptoms', roles: ['super_admin'] },
  { icon: Pill, labelKey: 'nav.medicines', path: '/admin#medicines', roles: ['super_admin'] },
  { icon: BookOpen, labelKey: 'nav.rules', path: '/admin#rules', roles: ['super_admin'] },
  { icon: Shield, labelKey: 'nav.userRoles', path: '/admin#roles', roles: ['super_admin'] },
  { icon: Sparkles, labelKey: 'nav.aiSettings', path: '/admin#ai-settings', roles: ['super_admin'] },
  { icon: CreditCard, labelKey: 'nav.subscriptions', path: '/admin#subscriptions', roles: ['super_admin'] },
  { icon: Activity, labelKey: 'nav.saasAdmin', path: '/saas-admin', roles: ['super_admin'] },
];

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut, user } = useAuth();
  const { t } = useTranslation();

  // Show different navigation based on role - only admin items for super_admin
  const visibleNavItems = role === 'super_admin' 
    ? adminNavItems.filter((item) => !item.roles || (role && item.roles.includes(role)))
    : doctorNavItems.filter((item) => !item.roles || (role && item.roles.includes(role)));

  const handleNavClick = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <DrawerTitle className="text-left text-lg">{t('sidebar.clinicName')}</DrawerTitle>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <DrawerClose asChild>
              <button className="touch-target rounded-xl hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 pb-safe-bottom">
          <div className="space-y-1">
            {visibleNavItems.map((item) => {
              // Check if active - handle hash routes for admin tabs
              const isActive = item.path.includes('#') 
                ? location.pathname === item.path.split('#')[0] && location.hash === `#${item.path.split('#')[1]}`
                : location.pathname === item.path && !location.hash;
              
              // Handle click for /admin to clear hash
              const handleItemClick = (e: React.MouseEvent) => {
                handleNavClick();
                if (item.path === '/admin' && location.pathname === '/admin') {
                  e.preventDefault();
                  navigate('/admin', { replace: true });
                }
              };

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleItemClick}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span>{t(item.labelKey)}</span>
                  </div>
                  <ChevronRight className={cn('h-4 w-4', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')} />
                </Link>
              );
            })}
          </div>

          <div className="mt-6 border-t border-border pt-4 space-y-1">
            <Link
              to="/settings"
              onClick={handleNavClick}
              className={cn(
                'flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-all',
                location.pathname === '/settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary'
              )}
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span>{t('nav.settings')}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>

            <button
              onClick={() => {
                signOut();
                handleNavClick();
              }}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-destructive transition-all hover:bg-destructive/10"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <span>{t('nav.logout')}</span>
              </div>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
