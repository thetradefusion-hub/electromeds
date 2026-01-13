import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  CalendarCheck,
  BookOpen,
  Shield,
  HeartPulse,
  TrendingUp,
  Clock,
  Sparkles,
  UserCog,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

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

const navItems: NavItem[] = [
  ...doctorNavItems,
  ...adminNavItems,
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, labelKey: 'nav.settings', path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut } = useAuth();
  const { t } = useTranslation();

  // Show different navigation based on role
  const visibleNavItems = role === 'super_admin' 
    ? adminNavItems.filter((item) => !item.roles || (role && item.roles.includes(role)))
    : doctorNavItems.filter((item) => !item.roles || (role && item.roles.includes(role)));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out hidden md:block',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border/30 px-4">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Stethoscope className="h-5 w-5 text-sidebar-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-sidebar-foreground">{t('sidebar.clinicName')}</h1>
                <p className="text-xs text-sidebar-foreground/70">{t('sidebar.clinicSubtitle')}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Stethoscope className="h-5 w-5 text-sidebar-foreground" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-all hover:bg-secondary"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
          {visibleNavItems.map((item) => {
            // Check if active - handle hash routes for admin tabs
            const isActive = item.path.includes('#') 
              ? location.pathname === item.path.split('#')[0] && location.hash === `#${item.path.split('#')[1]}`
              : location.pathname === item.path && !location.hash;
            
            // Handle click for /admin to ensure navigation works
            const handleClick = (e: React.MouseEvent) => {
              if (item.path === '/admin' && location.pathname === '/admin') {
                // If already on /admin, navigate to clear hash
                e.preventDefault();
                navigate('/admin', { replace: true });
              }
            };

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleClick}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0')} />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border/30 p-3 space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300 transition-all duration-200 hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{t('nav.logout')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
