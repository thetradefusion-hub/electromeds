import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Save, Loader2, Stethoscope } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useAuth } from '@/hooks/useAuth';
import { useDoctor } from '@/hooks/useDoctor';
import { adminApi } from '@/lib/api/admin.api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function NewPatient() {
  const navigate = useNavigate();
  const { createPatient } = usePatients();
  const { role, user } = useAuth();
  const { doctorId } = useDoctor();
  const [submitting, setSubmitting] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'male',
    mobile: '',
    address: '',
    case_type: 'new',
  });

  // Fetch doctors list for admin
  useEffect(() => {
    if (role === 'super_admin') {
      setLoadingDoctors(true);
      adminApi.getAllDoctors()
        .then((response) => {
          if (response.success && response.data) {
            setDoctors(response.data);
            if (response.data.length > 0) {
              setSelectedDoctorId(response.data[0].id);
            }
          }
        })
        .catch((error) => {
          console.error('Error fetching doctors:', error);
        })
        .finally(() => {
          setLoadingDoctors(false);
        });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted:', { role, doctorId, selectedDoctorId, formData });
    
    // For admin, require doctor selection
    if (role === 'super_admin' && !selectedDoctorId) {
      toast.error('Please select a doctor');
      return;
    }
    
    // Validate required fields
    if (!formData.name || !formData.age || !formData.mobile) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const patientData = {
        name: formData.name,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        mobile: formData.mobile,
        address: formData.address || undefined,
        caseType: formData.case_type,
        doctorId: role === 'super_admin' ? selectedDoctorId : undefined,
      };
      
      console.log('Creating patient with data:', patientData);
      
      const success = await createPatient(patientData);

      if (success) {
        navigate('/patients');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to register patient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <MainLayout title="Register New Patient" subtitle="Add a new patient to your records">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate('/patients')}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </button>

        <div className="medical-card">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <UserPlus className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Patient Information</h2>
              <p className="text-sm text-muted-foreground">Fill in the patient details below</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Assigned Doctor Display for Staff */}
            {role === 'staff' && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Stethoscope className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Assigned Doctor</p>
                    {user?.assignedDoctorId ? (
                      <p className="text-sm text-muted-foreground">
                        Patient will be assigned to your assigned doctor
                      </p>
                    ) : (
                      <p className="text-sm text-destructive">
                        You are not assigned to any doctor. Please contact admin.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Doctor Selector for Admin */}
            {role === 'super_admin' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Select Doctor *
                </label>
                {loadingDoctors ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading doctors...
                  </div>
                ) : (
                  <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId} required>
                    <SelectTrigger className="medical-input">
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization} ({doctor.registrationNo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {doctors.length === 0 && !loadingDoctors && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No doctors available. Please create a doctor account first.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter patient name"
                  className="medical-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="0"
                  max="120"
                  placeholder="Enter age"
                  className="medical-input"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="medical-input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  placeholder="+91 98765 43210"
                  className="medical-input"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                placeholder="Enter complete address"
                className="medical-input resize-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Case Type *
              </label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="case_type"
                    value="new"
                    checked={formData.case_type === 'new'}
                    onChange={handleChange}
                    className="h-4 w-4 border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">New Case</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="case_type"
                    value="old"
                    checked={formData.case_type === 'old'}
                    onChange={handleChange}
                    className="h-4 w-4 border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">Follow-up Case</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="medical-btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="medical-btn-primary"
                disabled={
                  submitting || 
                  (role === 'super_admin' ? (!selectedDoctorId || doctors.length === 0) : false)
                }
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Register Patient
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
