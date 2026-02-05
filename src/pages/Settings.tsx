import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { doctorApi } from '@/lib/api/doctor.api';
import { subscriptionApi } from '@/lib/api/subscription.api';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Award,
  Save,
  Shield,
  Bell,
  Palette,
  Loader2,
  Eye,
  EyeOff,
  Crown,
  Check,
  Sparkles,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  registrationNo: string;
  qualification: string;
  specialization: string;
  clinicName: string;
  clinicAddress: string;
  modality: 'electro_homeopathy' | 'classical_homeopathy' | 'both';
  preferredModality?: 'electro_homeopathy' | 'classical_homeopathy';
}

export default function Settings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    registrationNo: '',
    qualification: '',
    specialization: '',
    clinicName: '',
    clinicAddress: '',
    modality: 'electro_homeopathy',
    preferredModality: undefined,
  });

  // Subscription data
  const { subscription, usage, isLoading: subscriptionLoading, planName, refetch: refetchSubscription } = useSubscription();
  
  // Subscription upgrade dialog state
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState(false);

  // Fetch all plans
  const { data: plans, error: plansError } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      try {
        const response = await subscriptionApi.getSubscriptionPlans();
        if (!response.success) {
          console.error('Subscription plans API error:', response);
          return [];
        }
        
        // Map backend format to frontend format
        return (response.data || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          price_monthly: p.priceMonthly,
          price_yearly: p.priceYearly || null,
          features: p.features || [],
          patient_limit: p.patientLimit || null,
          doctor_limit: p.doctorLimit,
          ai_analysis_quota: p.aiAnalysisQuota,
          is_active: p.isActive,
        }));
      } catch (error: any) {
        console.error('Error fetching subscription plans:', error);
        toast.error('Failed to load subscription plans. Please check if backend server is running.');
        return [];
      }
    },
    retry: 1, // Only retry once
    refetchOnWindowFocus: false,
  });

  // Password change state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setLoading(true);

      try {
        // Fetch doctor profile (includes user info)
        const doctorRes = await doctorApi.getMyProfile();
        if (doctorRes.success && doctorRes.data) {
          const doctor = doctorRes.data.doctor;
          setProfile({
            name: doctor.name || '',
            email: user.email || '',
            phone: doctor.phone || '',
            registrationNo: doctor.registrationNo || '',
            qualification: doctor.qualification || '',
            specialization: doctor.specialization || '',
            clinicName: doctor.clinicName || '',
            clinicAddress: doctor.clinicAddress || '',
            modality: doctor.modality || 'electro_homeopathy',
            preferredModality: doctor.preferredModality,
          });
        } else {
          // Fallback to user data only
          setProfile({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            registrationNo: '',
            qualification: '',
            specialization: '',
            clinicName: '',
            clinicAddress: '',
            modality: 'electro_homeopathy',
            preferredModality: undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Fallback to user data
        setProfile({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          registrationNo: '',
          qualification: '',
          specialization: '',
          clinicName: '',
          clinicAddress: '',
          modality: 'electro_homeopathy',
          preferredModality: undefined,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      // Update doctor profile (includes name and phone)
      const updateRes = await doctorApi.updateMyProfile({
        name: profile.name,
        phone: profile.phone,
        qualification: profile.qualification,
        specialization: profile.specialization,
        clinicName: profile.clinicName,
        clinicAddress: profile.clinicAddress,
        modality: profile.modality,
        preferredModality: profile.preferredModality,
      });

      if (!updateRes.success) {
        throw new Error(updateRes.message || 'Failed to update profile');
      }

      // Update profile state with the response data
      if (updateRes.data?.doctor) {
        const updatedDoctor = updateRes.data.doctor;
        setProfile({
          name: updatedDoctor.name || profile.name,
          email: updatedDoctor.email || profile.email,
          phone: updatedDoctor.phone || '',
          registrationNo: updatedDoctor.registrationNo || '',
          qualification: updatedDoctor.qualification || '',
          specialization: updatedDoctor.specialization || '',
          clinicName: updatedDoctor.clinicName || '',
          clinicAddress: updatedDoctor.clinicAddress || '',
          modality: updatedDoctor.modality || 'electro_homeopathy',
          preferredModality: updatedDoctor.preferredModality,
        });
      }

      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Failed to save settings');
    }

    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);

    try {
      // TODO: Implement backend API for password change
      // For now, show a message that this feature is not yet available
      toast.error('Password change feature is not yet available. Please contact support.');
      // const response = await authApi.changePassword(passwords.current, passwords.new);
      // if (!response.success) throw new Error(response.message);
      // toast.success('Password changed successfully!');
      // setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    }

    setChangingPassword(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'clinic', label: 'Clinic', icon: Building },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  if (loading) {
    return (
      <MainLayout title="Settings" subtitle="Manage your account and preferences">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="space-y-4 sm:space-y-6">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-4 sm:p-6 shadow-sm">
          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <User className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage your account, preferences, and subscription
              </p>
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Enhanced Sidebar */}
        <div className="medical-card border-border/50 shadow-sm lg:col-span-1 h-fit">
          <nav className="space-y-1.5 p-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-white/10 blur-sm -z-10" />
                  )}
                  <tab.icon className={cn('h-4 w-4 transition-transform duration-200', isActive && 'scale-110')} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <div className="medical-card border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="mb-6 flex items-center gap-4 pb-4 border-b border-border/50">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                  <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Doctor Profile</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Update your personal information
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="medical-input border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="medical-input bg-muted/50 border-border/30 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Email cannot be changed
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="medical-input border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    Registration No.
                  </label>
                  <input
                    type="text"
                    value={profile.registrationNo}
                    onChange={(e) =>
                      setProfile({ ...profile, registrationNo: e.target.value })
                    }
                    className="medical-input border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter registration number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={profile.qualification}
                    onChange={(e) =>
                      setProfile({ ...profile, qualification: e.target.value })
                    }
                    className="medical-input border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., MBBS, MD, etc."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={profile.specialization}
                    onChange={(e) =>
                      setProfile({ ...profile, specialization: e.target.value })
                    }
                    className="medical-input border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., Cardiology, General Medicine, etc."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Practice Modality
                  </label>
                  <div className="space-y-3">
                    <RadioGroup
                      value={profile.modality}
                      onValueChange={(value: 'electro_homeopathy' | 'classical_homeopathy' | 'both') => {
                        setProfile({
                          ...profile,
                          modality: value,
                          preferredModality: value === 'both' ? profile.preferredModality : undefined,
                        });
                      }}
                    >
                      <div className="flex items-center space-x-2 rounded-lg border border-border/50 p-3 hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value="electro_homeopathy" id="electro" />
                        <Label htmlFor="electro" className="flex-1 cursor-pointer">
                          <span className="font-medium">Electro Homeopathy</span>
                          <span className="text-xs text-muted-foreground block">Traditional Electro Homeopathy practice</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border border-border/50 p-3 hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value="classical_homeopathy" id="classical" />
                        <Label htmlFor="classical" className="flex-1 cursor-pointer">
                          <span className="font-medium">Classical Homeopathy</span>
                          <span className="text-xs text-muted-foreground block">Traditional Classical Homeopathy with repertory</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 rounded-lg border border-border/50 p-3 hover:bg-secondary/50 transition-colors">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both" className="flex-1 cursor-pointer">
                          <span className="font-medium">Both Modalities</span>
                          <span className="text-xs text-muted-foreground block">Practice both Electro and Classical Homeopathy</span>
                        </Label>
                      </div>
                    </RadioGroup>
                    {profile.modality === 'both' && (
                      <div className="ml-6 space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Preferred Modality (Default for new consultations)
                        </label>
                        <RadioGroup
                          value={profile.preferredModality || 'electro_homeopathy'}
                          onValueChange={(value: 'electro_homeopathy' | 'classical_homeopathy') => {
                            setProfile({ ...profile, preferredModality: value });
                          }}
                        >
                          <div className="flex items-center space-x-2 rounded-lg border border-border/30 p-2 bg-muted/30">
                            <RadioGroupItem value="electro_homeopathy" id="pref-electro" />
                            <Label htmlFor="pref-electro" className="cursor-pointer text-sm">
                              Electro Homeopathy
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-lg border border-border/30 p-2 bg-muted/30">
                            <RadioGroupItem value="classical_homeopathy" id="pref-classical" />
                            <Label htmlFor="pref-classical" className="cursor-pointer text-sm">
                              Classical Homeopathy
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clinic' && (
            <div className="medical-card border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="mb-6 flex items-center gap-4 pb-4 border-b border-border/50">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-500 shadow-lg">
                  <Building className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Clinic Details</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Manage your clinic information
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={profile.clinicName}
                    onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })}
                    className="medical-input border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter clinic name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Clinic Address
                  </label>
                  <textarea
                    value={profile.clinicAddress}
                    onChange={(e) =>
                      setProfile({ ...profile, clinicAddress: e.target.value })
                    }
                    rows={4}
                    className="medical-input resize-none border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter complete clinic address"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6 animate-fade-in">
              {/* Enhanced Current Plan */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-primary/2 to-background shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className={cn(
                      'flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl shadow-lg',
                      planName === 'Enterprise' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      planName === 'Professional' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' :
                      'bg-gradient-to-br from-slate-500 to-slate-600'
                    )}>
                      <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
                        Current Plan: <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{planName}</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {subscription ? (
                          <>Renews on <span className="font-medium">{format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')}</span></>
                        ) : (
                          'No active subscription'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Usage Stats */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Usage This Period
                    </h3>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 p-4 hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                            {usage?.patientsCount || 0}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            of {subscription?.plan?.patient_limit || '∞'} Patients
                          </p>
                          {subscription?.plan?.patient_limit && (
                            <Progress 
                              value={Math.min(100, ((usage?.patientsCount || 0) / subscription.plan.patient_limit) * 100)} 
                              className="mt-3 h-2"
                            />
                          )}
                        </div>
                      </div>
                      
                      <div className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 p-4 hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                            {usage?.prescriptionsCount || 0}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Prescriptions</p>
                        </div>
                      </div>
                      
                      <div className="relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 p-4 hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                          <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
                            {usage?.aiAnalysisCount || 0}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            of {subscription?.plan?.ai_analysis_quota || '∞'} AI Analysis
                          </p>
                          {subscription?.plan?.ai_analysis_quota && (
                            <Progress 
                              value={Math.min(100, ((usage?.aiAnalysisCount || 0) / subscription.plan.ai_analysis_quota) * 100)} 
                              className="mt-3 h-2"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Available Plans */}
              <div className="medical-card border-border/50 shadow-sm">
                <h3 className="mb-6 text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2 pb-3 border-b border-border/50">
                  <Crown className="h-5 w-5 text-primary" />
                  Available Plans
                </h3>
                {plansError && (
                  <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">
                      Failed to load subscription plans. Please ensure the backend server is running.
                    </p>
                  </div>
                )}
                {!plans || plans.length === 0 ? (
                  <div className="py-12 text-center">
                    <Crown className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No subscription plans available</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => {
                      const isCurrentPlan = subscription?.plan_id === plan.id;
                      const features = Array.isArray(plan.features) ? plan.features : [];
                      const planGradient = plan.name === 'Enterprise' 
                        ? 'from-amber-500 to-orange-600'
                        : plan.name === 'Professional'
                        ? 'from-blue-500 to-cyan-500'
                        : 'from-slate-500 to-slate-600';
                      
                      return (
                        <div
                          key={plan.id}
                          className={cn(
                            'group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:shadow-lg',
                            isCurrentPlan 
                              ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 shadow-md' 
                              : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
                          )}
                        >
                          {/* Decorative blur effect */}
                          <div className={cn(
                            'absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity -translate-y-1/2 translate-x-1/2',
                            `bg-gradient-to-br ${planGradient}`
                          )} />
                          
                          {isCurrentPlan && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                              <span className="rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                Current Plan
                              </span>
                            </div>
                          )}
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg shadow-sm',
                                `bg-gradient-to-br ${planGradient}`
                              )}>
                                <Crown className="h-5 w-5 text-white" />
                              </div>
                              <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                            </div>
                            <div className="mt-3">
                              <span className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                ₹{plan.price_monthly}
                              </span>
                              <span className="text-muted-foreground">/month</span>
                            </div>
                            
                            <ul className="mt-5 space-y-2.5">
                              <li className="flex items-center gap-2 text-sm">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10">
                                  <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-foreground">{plan.patient_limit ? `${plan.patient_limit} Patients` : 'Unlimited Patients'}</span>
                              </li>
                              <li className="flex items-center gap-2 text-sm">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10">
                                  <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-foreground">{plan.ai_analysis_quota} AI Analysis/month</span>
                              </li>
                              {features.slice(0, 3).map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10">
                                    <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="text-foreground">{feature}</span>
                                </li>
                              ))}
                            </ul>
                            
                            {!isCurrentPlan && (
                              <button 
                                onClick={() => {
                                  setSelectedPlan(plan);
                                  setUpgradeDialogOpen(true);
                                }}
                                className={cn(
                                  'mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2',
                                  'bg-gradient-to-r from-primary to-primary/80 text-white shadow-md hover:shadow-lg hover:scale-[1.02]'
                                )}
                              >
                                <Sparkles className="h-4 w-4" />
                                Subscribe
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="medical-card border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="mb-6 flex items-center gap-4 pb-4 border-b border-border/50">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                  <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Security Settings</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Change your password and manage security
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                      <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="Enter current password"
                      className="medical-input pr-10 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="Enter new password (min 6 characters)"
                      className="medical-input pr-10 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="Confirm new password"
                      className="medical-input pr-10 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={changingPassword}
                  className="w-full rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Change Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="medical-card border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="mb-6 flex items-center gap-4 pb-4 border-b border-border/50">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                  <Bell className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                    Notification Preferences
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Choose what notifications you want to receive
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Follow-up reminders', description: 'Get notified about pending follow-ups', icon: '📅' },
                  { label: 'New patient registrations', description: 'When a new patient is registered', icon: '👤' },
                  { label: 'Daily summary', description: 'Receive daily activity summary', icon: '📊' },
                  { label: 'System updates', description: 'Important system announcements', icon: '🔔' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="group relative overflow-hidden flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" className="peer sr-only" defaultChecked />
                      <div className="h-6 w-11 rounded-full bg-secondary peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-primary/80 peer-focus:ring-2 peer-focus:ring-primary/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="medical-card border-border/50 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="mb-6 flex items-center gap-4 pb-4 border-b border-border/50">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Palette className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">Appearance</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Customize how the app looks
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-blue-50/50 to-blue-50/30 dark:from-blue-950/20 dark:to-blue-950/10 p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10 text-center">
                    <Palette className="h-12 w-12 mx-auto mb-3 text-blue-500 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Theme Customization</h3>
                    <p className="text-sm text-muted-foreground">
                      Theme customization options will be available soon. Stay tuned for updates!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Save Button */}
          {(activeTab === 'profile' || activeTab === 'clinic') && (
            <div className="flex justify-end pt-4 border-t border-border/50">
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/80 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-center gap-2">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Subscription Upgrade Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Subscribe to {selectedPlan?.name} Plan
            </DialogTitle>
            <DialogDescription>
              Choose your billing cycle and start your 7-day free trial
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-6">
              {/* Plan Details */}
              <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">{selectedPlan.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      ₹{billingCycle === 'monthly' ? selectedPlan.price_monthly : selectedPlan.price_yearly || selectedPlan.price_monthly * 12}
                    </span>
                    <span className="text-muted-foreground">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                </div>
                {selectedPlan.price_yearly && billingCycle === 'yearly' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Save ₹{(selectedPlan.price_monthly * 12) - selectedPlan.price_yearly} per year
                  </p>
                )}
              </div>

              {/* Billing Cycle Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Billing Cycle</Label>
                <RadioGroup value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label
                        htmlFor="monthly"
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all',
                          billingCycle === 'monthly'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <div>
                          <div className="font-semibold text-foreground">Monthly</div>
                          <div className="text-sm text-muted-foreground">
                            ₹{selectedPlan.price_monthly}/month
                          </div>
                        </div>
                        <RadioGroupItem value="monthly" id="monthly" />
                      </Label>
                    </div>
                    {selectedPlan.price_yearly && (
                      <div className="flex-1">
                        <Label
                          htmlFor="yearly"
                          className={cn(
                            'flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-all',
                            billingCycle === 'yearly'
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                        >
                          <div>
                            <div className="font-semibold text-foreground">Yearly</div>
                            <div className="text-sm text-muted-foreground">
                              ₹{selectedPlan.price_yearly}/year
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Save {Math.round(((selectedPlan.price_monthly * 12 - selectedPlan.price_yearly) / (selectedPlan.price_monthly * 12)) * 100)}%
                            </div>
                          </div>
                          <RadioGroupItem value="yearly" id="yearly" />
                        </Label>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Plan Features</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {selectedPlan.features?.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trial Info */}
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-foreground font-medium">7-day free trial included</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your subscription will start after the trial period ends
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
              disabled={subscribing}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedPlan) return;
                
                setSubscribing(true);
                try {
                  const response = await subscriptionApi.createSubscription({
                    planId: selectedPlan.id,
                    billingCycle,
                  });
                  
                  if (response.success) {
                    toast.success('Subscription created successfully! 7-day free trial started.');
                    setUpgradeDialogOpen(false);
                    setSelectedPlan(null);
                    refetchSubscription();
                  } else {
                    toast.error(response.message || 'Failed to create subscription');
                  }
                } catch (error: any) {
                  toast.error(error.message || 'Failed to create subscription');
                } finally {
                  setSubscribing(false);
                }
              }}
              disabled={subscribing}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {subscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Free Trial
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}