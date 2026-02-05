import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope, Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { z } from 'zod';
import { Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  phone: z.string().optional(),
  role: z.enum(['doctor']), // Staff signup removed - only doctor can signup
  registration_no: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  clinic_name: z.string().min(2, 'Clinic name must be at least 2 characters'),
  clinic_address: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms & Conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading, role } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState<'doctor'>('doctor');
  const [registrationNo, setRegistrationNo] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('Electro Homoeopathy');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && role && !authLoading) {
      // Redirect based on role
      if (role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (role === 'doctor' || role === 'staff') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[`login_${error.path[0]}`] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. Please try again.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      // Navigation will be handled by useEffect when user/role state updates
    }
  };

  // Phone validation function
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    // Indian phone number: 10 digits starting with 6-9, or +91 followed by 10 digits
    const phoneRegex = /^(\+91[6-9]\d{9}|[6-9]\d{9})$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Phone validation
    if (signupPhone && !validatePhone(signupPhone)) {
      setErrors(prev => ({ ...prev, signup_phone: 'Please enter a valid Indian phone number (10 digits starting with 6-9)' }));
      return;
    }

    const signupData = {
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword,
      phone: signupPhone || undefined,
      role: signupRole,
      registration_no: registrationNo || undefined,
      qualification: qualification || undefined,
      specialization: specialization || undefined,
      clinic_name: clinicName,
      clinic_address: clinicAddress || undefined,
      termsAccepted,
    };

    try {
      signupSchema.parse(signupData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[`signup_${error.path[0]}`] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    // Validate doctor-specific fields
    if (signupRole === 'doctor') {
      if (!registrationNo) {
        setErrors(prev => ({ ...prev, signup_registration_no: 'Registration number is required for doctors' }));
        return;
      }
      if (!qualification) {
        setErrors(prev => ({ ...prev, signup_qualification: 'Qualification is required for doctors' }));
        return;
      }
      if (!clinicName) {
        setErrors(prev => ({ ...prev, signup_clinic_name: 'Clinic name is required for doctors' }));
        return;
      }
    }

    setIsLoading(true);
    // Normalize email before sending to backend
    const normalizedEmail = signupEmail.toLowerCase().trim();
    const { error } = await signUp(normalizedEmail, signupPassword, {
      name: signupName,
      phone: signupPhone || undefined,
      role: signupRole,
      registration_no: registrationNo || undefined,
      qualification: qualification || undefined,
      specialization: specialization || undefined,
      clinic_name: clinicName,
      clinic_address: clinicAddress || undefined,
    });
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Account Exists',
          description: 'An account with this email already exists. Please log in instead.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Account Created!',
        description: 'Your account has been created successfully.',
      });
      // Reset form
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setConfirmPassword('');
      setSignupPhone('');
      setRegistrationNo('');
      setQualification('');
      setSpecialization('Electro Homoeopathy');
      setClinicName('');
      setClinicAddress('');
      setTermsAccepted(false);
      setErrors({});
      // Navigation will be handled by useEffect when user/role state updates
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 safe-area-top safe-area-bottom">
      {/* Background decorations */}
      <div className="fixed top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="fixed bottom-20 -right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
      
      <Card className="w-full max-w-lg relative rounded-2xl border-border/50 shadow-xl">
        {/* Back to landing */}
        <Link to="/landing" className="absolute top-4 left-4 touch-target rounded-xl hover:bg-secondary flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        
        <CardHeader className="text-center pt-12 pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Homeolytics</CardTitle>
          <CardDescription className="text-sm">Clinical Management & Prescription Software</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl h-11">
              <TabsTrigger value="login" className="rounded-lg">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl"
                  />
                  {errors.login_email && (
                    <p className="text-xs text-destructive">{errors.login_email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl"
                  />
                  {errors.login_password && (
                    <p className="text-xs text-destructive">{errors.login_password}</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm">Full Name *</Label>
                  <Input
                    id="signup-name"
                    placeholder="Dr. John Doe"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                  {errors.signup_name && (
                    <p className="text-xs text-destructive">{errors.signup_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="doctor@clinic.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                  {errors.signup_email && (
                    <p className="text-xs text-destructive">{errors.signup_email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">Password *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl"
                    />
                    {errors.signup_password && (
                      <p className="text-xs text-destructive">{errors.signup_password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="h-11 rounded-xl pr-10"
                      />
                      {confirmPassword && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {signupPassword === confirmPassword ? (
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      )}
                    </div>
                    {errors.signup_confirmPassword && (
                      <p className="text-xs text-destructive">{errors.signup_confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-sm">Phone</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="9876543210 or +91 9876543210"
                    value={signupPhone}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Allow digits, +, and spaces
                      value = value.replace(/[^\d+\s]/g, '');
                      // Limit to 13 characters (for +91 9876543210)
                      if (value.length <= 13) {
                        setSignupPhone(value);
                      }
                    }}
                    className="h-11 rounded-xl"
                  />
                  {signupPhone && !validatePhone(signupPhone) && (
                    <p className="text-xs text-destructive">
                      Please enter a valid Indian phone number (10 digits starting with 6-9)
                    </p>
                  )}
                  {errors.signup_phone && (
                    <p className="text-xs text-destructive">{errors.signup_phone}</p>
                  )}
                  {signupPhone && validatePhone(signupPhone) && (
                    <p className="text-xs text-blue-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid phone number
                    </p>
                  )}
                </div>

                {/* Doctor-specific fields (staff signup removed) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="registration-no" className="text-sm">Reg. No. *</Label>
                    <Input
                      id="registration-no"
                      placeholder="MED/2024/001"
                      value={registrationNo}
                      onChange={(e) => setRegistrationNo(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                    {errors.signup_registration_no && (
                      <p className="text-xs text-destructive">{errors.signup_registration_no}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualification" className="text-sm">Qualification *</Label>
                    <Input
                      id="qualification"
                      placeholder="BHMS, MD"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                    {errors.signup_qualification && (
                      <p className="text-xs text-destructive">{errors.signup_qualification}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-sm">Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="Electro Homoeopathy"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Clinic Information */}
                <div className="space-y-2">
                  <Label htmlFor="clinic-name" className="text-sm">Clinic Name *</Label>
                  <Input
                    id="clinic-name"
                    placeholder="Dr. John's Clinic"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                  {errors.signup_clinic_name && (
                    <p className="text-xs text-destructive">{errors.signup_clinic_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinic-address" className="text-sm">Clinic Address</Label>
                  <Textarea
                    id="clinic-address"
                    placeholder="Enter complete clinic address"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <Checkbox
                    id="terms-accepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="terms-accepted" className="text-sm font-normal cursor-pointer">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary hover:underline font-medium">
                        Terms & Conditions
                      </Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-primary hover:underline font-medium">
                        Privacy Policy
                      </Link>
                      {' '}*
                    </Label>
                    {errors.signup_termsAccepted && (
                      <p className="text-xs text-destructive">{errors.signup_termsAccepted}</p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base" 
                  disabled={isLoading || !termsAccepted}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground px-4 sm:px-6 pb-6">
          <p className="w-full">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            <br />
            <span className="font-medium text-primary">Final prescription decision lies with the doctor.</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
