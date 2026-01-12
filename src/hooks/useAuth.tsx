import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi, User } from '@/lib/api/auth.api';
import { toast } from 'sonner';

type AppRole = 'super_admin' | 'doctor' | 'staff';

interface AuthContextType {
  user: User | null;
  session: { token: string } | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface SignUpMetadata {
  name: string;
  phone?: string;
  role: AppRole;
  registration_no?: string;
  qualification?: string;
  specialization?: string;
  clinic_name?: string;
  clinic_address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setSession({ token });
        setRole(userData.role as AppRole);
        
        // Verify token is still valid and get full user data (including assignedDoctorId)
        authApi.getMe()
          .then((response) => {
            if (response.success && response.data) {
              const fullUserData = response.data.user;
              localStorage.setItem('user', JSON.stringify(fullUserData));
              setUser(fullUserData);
            }
          })
          .catch(() => {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setSession(null);
            setRole(null);
          });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    try {
      const response = await authApi.signUp({
        email,
        password,
        name: metadata.name,
        phone: metadata.phone,
        role: metadata.role,
        registration_no: metadata.registration_no,
        qualification: metadata.qualification,
        specialization: metadata.specialization,
        clinic_name: metadata.clinic_name,
        clinic_address: metadata.clinic_address,
      });

      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setSession({ token });
        setRole(userData.role as AppRole);
        toast.success('Registration successful!');
        return { error: null };
      } else {
        const errorMessage = response.message || 'Registration failed';
        toast.error(errorMessage);
        return { error: new Error(errorMessage) };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });

      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        
        // Get full user data including assignedDoctorId
        try {
          const meResponse = await authApi.getMe();
          if (meResponse.success && meResponse.data) {
            const fullUserData = meResponse.data.user;
            localStorage.setItem('user', JSON.stringify(fullUserData));
            setUser(fullUserData);
          } else {
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
          }
        } catch (error) {
          // If getMe fails, use login response data
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
        
        setSession({ token });
        setRole(userData.role as AppRole);
        toast.success('Login successful!');
        return { error: null };
      } else {
        const errorMessage = response.message || 'Login failed';
        toast.error(errorMessage);
        return { error: new Error(errorMessage) };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSession(null);
    setRole(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
