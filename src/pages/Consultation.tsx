import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePatients } from '@/hooks/usePatients';
import { useSymptoms, Symptom } from '@/hooks/useSymptoms';
import { useMedicines, Medicine } from '@/hooks/useMedicines';
import { usePrescriptions, PrescriptionSymptom, PrescriptionMedicine } from '@/hooks/usePrescriptions';
import { generatePrescriptionPDF } from '@/utils/generatePrescriptionPDF';
import { useWhatsAppShare } from '@/hooks/useWhatsAppShare';
import { MedicalReportAnalyzer } from '@/components/consultation/MedicalReportAnalyzer';
import { ClassicalHomeopathyConsultation } from '@/components/consultation/ClassicalHomeopathyConsultation';
import { CaseTakingModeSelect } from '@/components/consultation/CaseTakingModeSelect';
import { doctorApi } from '@/lib/api/doctor.api';
import {
  User,
  Search,
  Plus,
  X,
  Pill,
  Stethoscope,
  AlertCircle,
  FileText,
  Sparkles,
  Loader2,
  Download,
  History,
  Calendar,
  Activity,
  Thermometer,
  Weight,
  Heart,
  Clock,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Beaker,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import { prescriptionApi } from '@/lib/api/prescription.api';
import { medicineRuleApi } from '@/lib/api/medicineRule.api';
import { Badge } from '@/components/ui/badge';

interface SelectedSymptom {
  symptomId: string;
  symptom: Symptom;
  severity: 'low' | 'medium' | 'high';
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months';
}

interface SuggestedMedicine {
  medicineId: string;
  medicine: Medicine;
  dosage: string;
  duration: string;
  instructions: string;
}

interface Vitals {
  bloodPressure: string;
  temperature: string;
  weight: string;
  pulse: string;
}

interface PatientPrescription {
  id: string;
  prescription_no: string;
  created_at: string;
  symptoms: { name: string }[];
  medicines: { name: string }[];
}

// Common/frequently used symptoms for quick selection
const COMMON_SYMPTOMS = [
  'Fever',
  'Headache', 
  'Body Pain',
  'Cold & Cough',
  'Weakness',
  'Acidity',
  'Joint Pain',
  'Skin Problem',
  'Digestive Issue',
  'Anxiety',
];

export default function Consultation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patient');
  const { shareViaWhatsAppDirect } = useWhatsAppShare();

  const { patients, loading: patientsLoading } = usePatients();
  const { symptoms, loading: symptomsLoading } = useSymptoms();
  const { medicines } = useMedicines();
  const { createPrescription, doctorInfo } = usePrescriptions();

  // Modality state
  const [doctorModality, setDoctorModality] = useState<'electro_homeopathy' | 'classical_homeopathy' | 'both'>('electro_homeopathy');
  const [preferredModality, setPreferredModality] = useState<'electro_homeopathy' | 'classical_homeopathy'>('electro_homeopathy');
  const [currentModality, setCurrentModality] = useState<'electro_homeopathy' | 'classical_homeopathy'>('electro_homeopathy');
  const [loadingModality, setLoadingModality] = useState(true);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientIdFromUrl);
  const [patientSearch, setPatientSearch] = useState('');
  const [symptomSearch, setSymptomSearch] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [suggestedMedicines, setSuggestedMedicines] = useState<SuggestedMedicine[]>([]);
  const [selectedRemedyIds, setSelectedRemedyIds] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDays, setFollowUpDays] = useState(7);
  const [generating, setGenerating] = useState(false);
  
  // Vitals state
  const [vitals, setVitals] = useState<Vitals>({
    bloodPressure: '',
    temperature: '',
    weight: '',
    pulse: '',
  });
  const [showVitals, setShowVitals] = useState(false);
  
  // Patient history state
  const [patientHistory, setPatientHistory] = useState<PatientPrescription[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  /** Classical homeopathy: null = show mode selection; 'manual'|'ai' = show case taking screen */
  const [caseTakingModeChosen, setCaseTakingModeChosen] = useState<'manual' | 'ai' | null>(null);

  const patient = patients.find((p) => p.id === selectedPatientId);

  // When patient changes, show mode selection again for classical
  useEffect(() => {
    setCaseTakingModeChosen(null);
  }, [selectedPatientId]);

  // Fetch doctor modality
  useEffect(() => {
    const fetchDoctorModality = async () => {
      try {
        const response = await doctorApi.getMyProfile();
        if (response.success && response.data) {
          const doctor = response.data.doctor;
          const modality = doctor.modality || 'electro_homeopathy';
          const preferred = doctor.preferredModality || 'electro_homeopathy';
          
          setDoctorModality(modality);
          setPreferredModality(preferred);
          
          // Set current modality based on doctor's settings
          if (modality === 'both') {
            setCurrentModality(preferred);
          } else {
            setCurrentModality(modality);
          }
        }
      } catch (error) {
        console.error('Error fetching doctor modality:', error);
      } finally {
        setLoadingModality(false);
      }
    };

    fetchDoctorModality();
  }, []);

  // Fetch patient history when patient is selected
  useEffect(() => {
    const fetchPatientHistory = async () => {
      if (!selectedPatientId) {
        setPatientHistory([]);
        return;
      }
      
      setLoadingHistory(true);
      try {
        const response = await prescriptionApi.getPrescriptions();
        if (response.success && response.data) {
          // Filter prescriptions for this patient and map to expected format
          const patientPrescriptions = response.data
            .filter((rx) => {
              const patientId = typeof rx.patientId === 'string' 
                ? rx.patientId 
                : rx.patientId?._id;
              return patientId === selectedPatientId;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((rx) => ({
              id: rx._id,
              prescription_no: rx.prescriptionNo,
              created_at: rx.createdAt,
              symptoms: (rx.symptoms || []).map((s: any) => ({ name: s.name || s.symptomName || '' })),
              medicines: (rx.medicines || []).map((m: any) => ({ name: m.name || m.medicineName || '' })),
            }));
          
          setPatientHistory(patientPrescriptions);
        }
      } catch (error) {
        console.error('Error fetching patient history:', error);
      }
      setLoadingHistory(false);
    };
    
    fetchPatientHistory();
  }, [selectedPatientId]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filteredSymptoms = symptoms.filter(
    (s) =>
      s.name.toLowerCase().includes(symptomSearch.toLowerCase()) &&
      !selectedSymptoms.find((ss) => ss.symptomId === s.id)
  );

  // Get quick symptom chips that match common symptoms
  const quickSymptomChips = useMemo(() => {
    return COMMON_SYMPTOMS.map(name => {
      const symptom = symptoms.find(s => 
        s.name.toLowerCase().includes(name.toLowerCase())
      );
      return symptom;
    }).filter((s): s is Symptom => 
      s !== undefined && !selectedSymptoms.find(ss => ss.symptomId === s.id)
    );
  }, [symptoms, selectedSymptoms]);

  const groupedSymptoms = useMemo(() => {
    const groups: Record<string, Symptom[]> = {};
    filteredSymptoms.forEach((symptom) => {
      if (!groups[symptom.category]) {
        groups[symptom.category] = [];
      }
      groups[symptom.category].push(symptom);
    });
    return groups;
  }, [filteredSymptoms]);

  const addSymptom = (symptom: Symptom) => {
    setSelectedSymptoms((prev) => [
      ...prev,
      {
        symptomId: symptom.id,
        symptom,
        severity: 'medium',
        duration: 1,
        durationUnit: 'weeks',
      },
    ]);
    setSymptomSearch('');
  };

  const removeSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s.symptomId !== symptomId));
  };

  const updateSymptom = (
    symptomId: string,
    field: keyof SelectedSymptom,
    value: string | number
  ) => {
    setSelectedSymptoms((prev) =>
      prev.map((s) => (s.symptomId === symptomId ? { ...s, [field]: value } : s))
    );
  };

  const getSuggestions = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }

    const symptomIds = selectedSymptoms.map((s) => s.symptomId);

    try {
      console.log('[Consultation] Requesting medicine suggestions for symptom IDs:', symptomIds);
      const response = await medicineRuleApi.suggestMedicines(symptomIds);
      
      console.log('[Consultation] Medicine suggestion response:', {
        success: response.success,
        rulesCount: response.data?.rules?.length || 0,
        medicineIdsCount: response.data?.suggestedMedicineIds?.length || 0,
      });

      if (!response.success || !response.data) {
        toast.error('Failed to fetch suggestions');
        return;
      }

      const { rules: matchingRules, suggestedMedicineIds } = response.data;
      
      if (suggestedMedicineIds.length === 0) {
        toast.warning('No medicine suggestions found for selected symptoms');
        setShowSuggestions(true);
        setSuggestedMedicines([]);
        return;
      }

      const medicineMap = new Map<string, SuggestedMedicine>();

      // Get medicine details for suggested IDs
      const suggestedMedicinesList = medicines.filter((m) => 
        suggestedMedicineIds.includes(m.id)
      );

      console.log('[Consultation] Found medicines in local list:', suggestedMedicinesList.length, 'out of', suggestedMedicineIds.length, 'suggested');

      // Use rules to get dosage and duration
      matchingRules.forEach((rule) => {
        if (rule.medicineIds && rule.medicineIds.length > 0) {
          rule.medicineIds.forEach((medId: string) => {
            const medicine = suggestedMedicinesList.find((m) => m.id === medId.toString());
            if (medicine && !medicineMap.has(medId.toString())) {
              medicineMap.set(medId.toString(), {
                medicineId: medId.toString(),
                medicine,
                dosage: rule.dosage || medicine.default_dosage || '10 drops twice daily',
                duration: rule.duration || '7 days',
                instructions: '',
              });
            }
          });
        }
      });

      // If no medicines found from rules, try to add from suggested IDs directly
      if (medicineMap.size === 0 && suggestedMedicineIds.length > 0) {
        console.log('[Consultation] No medicines found from rules, trying direct match...');
        suggestedMedicineIds.forEach((medId: string) => {
          const medicine = medicines.find((m) => m.id === medId.toString());
          if (medicine && !medicineMap.has(medId.toString())) {
            medicineMap.set(medId.toString(), {
              medicineId: medId.toString(),
              medicine,
              dosage: medicine.default_dosage || '10 drops twice daily',
              duration: '7 days',
              instructions: '',
            });
          }
        });
      }

      const medicinesList = Array.from(medicineMap.values());
      setSuggestedMedicines(medicinesList);
      // Auto-select all remedies by default
      setSelectedRemedyIds(new Set(medicinesList.map((m) => m.medicineId)));
      setShowSuggestions(true);
      
      if (medicineMap.size > 0) {
        toast.success(`Found ${medicineMap.size} medicine suggestions. Select remedies to create prescription.`);
      } else {
        toast.warning('No matching medicines found. Please check if medicines exist for selected symptoms.');
      }
    } catch (error: any) {
      console.error('[Consultation] Error fetching suggestions:', error);
      toast.error('Failed to fetch suggestions: ' + (error.response?.data?.message || error.message));
    }
  };

  const removeMedicine = (medicineId: string) => {
    setSuggestedMedicines((prev) => prev.filter((m) => m.medicineId !== medicineId));
    setSelectedRemedyIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(medicineId);
      return newSet;
    });
  };

  const toggleRemedySelection = (medicineId: string) => {
    setSelectedRemedyIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(medicineId)) {
        newSet.delete(medicineId);
      } else {
        newSet.add(medicineId);
      }
      return newSet;
    });
  };

  const selectAllRemedies = () => {
    const allIds = new Set(suggestedMedicines.map((m) => m.medicineId));
    setSelectedRemedyIds(allIds);
  };

  const deselectAllRemedies = () => {
    setSelectedRemedyIds(new Set());
  };

  const addManualMedicine = (medicine: Medicine) => {
    if (suggestedMedicines.find((m) => m.medicineId === medicine.id)) {
      toast.error('Medicine already added');
      return;
    }
    setSuggestedMedicines((prev) => [
      ...prev,
      {
        medicineId: medicine.id,
        medicine,
        dosage: medicine.default_dosage || '10 drops twice daily',
        duration: '7 days',
        instructions: '',
      },
    ]);
    setShowSuggestions(true);
  };

  const generatePrescription = async (redirectToPrescription = false) => {
    if (!patient) {
      toast.error('Please select a patient');
      return;
    }
    
    // Filter only selected remedies
    const selectedMedicines = suggestedMedicines.filter((sm) => selectedRemedyIds.has(sm.medicineId));
    
    if (selectedMedicines.length === 0) {
      toast.error('Please select at least one remedy to create prescription');
      return;
    }
    if (!doctorInfo) {
      toast.error('Doctor profile not found');
      return;
    }

    setGenerating(true);

    const symptomData: PrescriptionSymptom[] = selectedSymptoms.map((ss) => ({
      id: ss.symptomId,
      name: ss.symptom.name,
      severity: ss.severity,
      duration: ss.duration,
      durationUnit: ss.durationUnit,
    }));

    const medicineData: PrescriptionMedicine[] = selectedMedicines.map((sm) => ({
      id: sm.medicineId,
      name: sm.medicine.name,
      category: sm.medicine.category,
      modality: sm.medicine.modality || 'electro_homeopathy',
      dosage: sm.dosage,
      duration: sm.duration,
      instructions: sm.instructions,
    }));

    const followUpDate = addDays(new Date(), followUpDays).toISOString();
    
    // Include vitals in advice if recorded
    let fullAdvice = advice;
    if (vitals.bloodPressure || vitals.temperature || vitals.weight || vitals.pulse) {
      const vitalsText = [
        vitals.bloodPressure && `BP: ${vitals.bloodPressure}`,
        vitals.temperature && `Temp: ${vitals.temperature}°F`,
        vitals.weight && `Weight: ${vitals.weight} kg`,
        vitals.pulse && `Pulse: ${vitals.pulse} bpm`,
      ].filter(Boolean).join(', ');
      fullAdvice = `Vitals: ${vitalsText}${advice ? `\n\n${advice}` : ''}`;
    }

    const prescription = await createPrescription({
      patient_id: patient.id,
      symptoms: symptomData,
      medicines: medicineData,
      diagnosis: diagnosis || undefined,
      advice: fullAdvice || undefined,
      follow_up_date: followUpDate,
    });

    setGenerating(false);

    if (prescription) {
      // If redirecting, don't generate PDF, just redirect
      if (redirectToPrescription) {
        toast.success('Prescription created successfully!');
        navigate('/prescriptions');
        return;
      }

      // Otherwise, generate PDF and redirect
      generatePrescriptionPDF(
        {
          prescription_no: prescription.prescription_no,
          created_at: prescription.created_at,
          symptoms: symptomData,
          medicines: medicineData,
          diagnosis,
          advice: fullAdvice,
          follow_up_date: followUpDate,
        },
        {
          name: patient.name,
          patient_id: patient.patient_id,
          age: patient.age,
          gender: patient.gender,
          mobile: patient.mobile,
          address: patient.address,
        },
        doctorInfo
      );

      // Reset form
      setSelectedPatientId(null);
      setSelectedSymptoms([]);
      setSuggestedMedicines([]);
      setSelectedRemedyIds(new Set());
      setShowSuggestions(false);
      setDiagnosis('');
      setAdvice('');
      setVitals({ bloodPressure: '', temperature: '', weight: '', pulse: '' });

      navigate('/prescriptions');
    }
  };

  const handleWhatsAppShare = () => {
    if (!patient || !doctorInfo || selectedRemedyIds.size === 0) return;

    const selectedMedicines = suggestedMedicines.filter((sm) => selectedRemedyIds.has(sm.medicineId));
    const symptomData = selectedSymptoms.map((ss) => ({ name: ss.symptom.name }));
    const medicineData = selectedMedicines.map((sm) => ({
      name: sm.medicine.name,
      dosage: sm.dosage,
      duration: sm.duration,
    }));

    shareViaWhatsAppDirect({
      prescriptionId: '',
      patientMobile: patient.mobile,
      patientName: patient.name,
      prescriptionNo: 'Draft',
      doctorName: doctorInfo.name,
      clinicName: doctorInfo.clinic_name || 'Medical Clinic',
      symptoms: symptomData,
      medicines: medicineData,
      diagnosis: diagnosis || undefined,
      advice: advice || undefined,
      followUpDate: format(addDays(new Date(), followUpDays), 'dd MMM yyyy'),
    });
  };


  if (patientsLoading || symptomsLoading) {
    return (
      <MainLayout title="New Consultation" subtitle="Record symptoms and generate prescription">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Show loading while fetching modality
  if (loadingModality) {
    return (
      <MainLayout title="New Consultation" subtitle="Record symptoms and generate prescription">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="New Consultation" subtitle="Record symptoms and generate prescription">
      <div className="space-y-6">
        {/* Modality Selector */}
        {doctorModality === 'both' && (
          <div className="medical-card border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Practice Modality</h3>
                  <p className="text-xs text-muted-foreground">
                    Select the modality for this consultation
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentModality('electro_homeopathy')}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    currentModality === 'electro_homeopathy'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/50 bg-background text-foreground hover:bg-secondary'
                  )}
                >
                  <Beaker className="h-4 w-4" />
                  Electro Homeopathy
                </button>
                <button
                  onClick={() => setCurrentModality('classical_homeopathy')}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    currentModality === 'classical_homeopathy'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/50 bg-background text-foreground hover:bg-secondary'
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  Classical Homeopathy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Patient Selection - Shared for both modalities */}
        <div className="medical-card border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Select Patient</h3>
                  <p className="text-xs text-muted-foreground">Choose a patient to start consultation</p>
                </div>
              </div>
              {selectedPatientId && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Selected
                </Badge>
              )}
            </div>

            {!selectedPatientId ? (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search patient by name or ID..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="medical-input pl-10"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
                  {filteredPatients.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className="group flex w-full items-center justify-between rounded-xl border border-border/50 bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.patient_id} • {p.age}y, {p.gender}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          'transition-all',
                          p.case_type === 'new'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        )}
                      >
                        {p.case_type === 'new' ? 'New' : 'Follow-up'}
                      </Badge>
                    </button>
                  ))}
                  {filteredPatients.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">No patients found</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Patient Info */}
                <div className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 shadow-lg shadow-primary/10">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30">
                      <User className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-foreground">{patient?.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {patient?.patient_id} • {patient?.age}y, {patient?.gender} • {patient?.mobile}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/patient-history?patient=${patient?.id}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                      title="View Full History"
                    >
                      <History className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => setSelectedPatientId(null)}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Patient History Preview */}
                {patientHistory.length > 0 && (
                  <div className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 p-4 shadow-sm">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-background/50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        Previous Visits ({patientHistory.length})
                      </span>
                      {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    
                    {showHistory && (
                      <div className="mt-3 space-y-2">
                        {loadingHistory ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          patientHistory.map((rx) => (
                            <div
                              key={rx.id}
                              className="group rounded-xl border border-border/50 bg-background p-3 text-xs shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-foreground">{rx.prescription_no}</span>
                                <span className="text-muted-foreground">
                                  {format(new Date(rx.created_at), 'dd MMM yyyy')}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {rx.symptoms.slice(0, 3).map((s, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                                    {s.name}
                                  </Badge>
                                ))}
                                {rx.symptoms.length > 3 && (
                                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                    +{rx.symptoms.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Classical Homeopathy: first choose case taking mode, then open consultation */}
        {currentModality === 'classical_homeopathy' && selectedPatientId && (
          <>
            {caseTakingModeChosen === null ? (
              <div className="medical-card border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background py-8 px-4">
                <CaseTakingModeSelect
                  patientName={patient?.name}
                  patientId={patient?.patient_id}
                  onSelectMode={(mode) => setCaseTakingModeChosen(mode)}
                  onBack={() => setSelectedPatientId(null)}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCaseTakingModeChosen(null)}
                    className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    ← Change case taking mode
                  </button>
                </div>
                <ClassicalHomeopathyConsultation
                  patientId={selectedPatientId}
                  symptoms={symptoms}
                  initialInputMode={caseTakingModeChosen}
                  onCaseRecordCreated={(caseRecordId) => {
                    console.log('Case record created:', caseRecordId);
                  }}
                  onPrescriptionCreated={async (prescriptionId) => {
                    console.log('Prescription created:', prescriptionId);
                    toast.success('Prescription created. Opening preview – share or print as needed.');
                    navigate('/prescriptions', { state: { newPrescriptionId: prescriptionId } });
                    try {
                      const response = await prescriptionApi.getPrescriptions();
                      if (response.success && response.data) {
                        const patientPrescriptions = response.data
                          .filter((rx) => {
                            const rxPatientId = typeof rx.patientId === 'string' ? rx.patientId : rx.patientId?._id;
                            return rxPatientId === selectedPatientId;
                          })
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 5)
                          .map((rx) => ({
                            id: rx._id,
                            prescription_no: rx.prescriptionNo,
                            created_at: rx.createdAt,
                            symptoms: (rx.symptoms || []).map((s: any) => ({ name: s.name || s.symptomName || '' })),
                            medicines: (rx.medicines || []).map((m: any) => ({ name: m.name || m.medicineName || '' })),
                          }));
                        setPatientHistory(patientPrescriptions);
                      }
                    } catch (error) {
                      console.error('Error fetching patient history:', error);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Electro Homeopathy Consultation (Existing) */}
        {currentModality === 'electro_homeopathy' && selectedPatientId && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Panel - Patient & Symptoms */}
            <div className="lg:col-span-2 space-y-6">
          {/* Vitals Recording */}
          {selectedPatientId && (
            <div className="medical-card border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <button
                onClick={() => setShowVitals(!showVitals)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/10">
                    <Activity className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Record Vitals</h3>
                    {(vitals.bloodPressure || vitals.temperature || vitals.weight || vitals.pulse) && (
                      <Badge variant="secondary" className="mt-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Recorded
                      </Badge>
                    )}
                  </div>
                </div>
                {showVitals ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>

              {showVitals && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/50 bg-card p-3 hover:border-primary/30 transition-all">
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                      <Heart className="h-4 w-4 text-red-500" />
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={vitals.bloodPressure}
                      onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-3 hover:border-primary/30 transition-all">
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      Temperature (°F)
                    </label>
                    <input
                      type="text"
                      placeholder="98.6"
                      value={vitals.temperature}
                      onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-3 hover:border-primary/30 transition-all">
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                      <Weight className="h-4 w-4 text-blue-500" />
                      Weight (kg)
                    </label>
                    <input
                      type="text"
                      placeholder="70"
                      value={vitals.weight}
                      onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-3 hover:border-primary/30 transition-all">
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wide">
                      <Activity className="h-4 w-4 text-blue-500" />
                      Pulse (bpm)
                    </label>
                    <input
                      type="text"
                      placeholder="72"
                      value={vitals.pulse}
                      onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Medical Report Analysis */}
          <MedicalReportAnalyzer 
            patientId={selectedPatientId || undefined} 
            doctorId={doctorInfo?.id} 
          />

          {/* Symptoms Selection */}
          <div className="medical-card border-accent/10 bg-gradient-to-br from-accent/5 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent/10">
                  <Stethoscope className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Record Symptoms</h3>
                  <p className="text-xs text-muted-foreground">Add patient symptoms for diagnosis</p>
                </div>
              </div>
              {selectedSymptoms.length > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {selectedSymptoms.length} {selectedSymptoms.length === 1 ? 'Symptom' : 'Symptoms'}
                </Badge>
              )}
            </div>

            {/* Quick Symptom Chips */}
            {quickSymptomChips.length > 0 && (
              <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 p-3">
                <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Add Common Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {quickSymptomChips.slice(0, 8).map((symptom) => (
                    <button
                      key={symptom.id}
                      onClick={() => addSymptom(symptom)}
                      className="group flex items-center gap-1.5 rounded-full border border-primary/20 bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                    >
                      <Plus className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground transition-colors" />
                      {symptom.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSymptoms.length > 0 && (
              <div className="mb-4 space-y-3">
                {selectedSymptoms.map((ss) => (
                  <div
                    key={ss.symptomId}
                    className="group flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-card to-card/50 p-4 shadow-sm hover:shadow-md transition-all"
                  >
                    <span className="font-medium text-foreground">{ss.symptom.name}</span>
                    <select
                      value={ss.severity}
                      onChange={(e) => updateSymptom(ss.symptomId, 'severity', e.target.value)}
                      className={cn(
                        "rounded-lg border px-2 py-1 text-sm",
                        ss.severity === 'high' && "border-red-300 bg-red-50 text-red-700",
                        ss.severity === 'medium' && "border-yellow-300 bg-yellow-50 text-yellow-700",
                        ss.severity === 'low' && "border-green-300 bg-green-50 text-green-700"
                      )}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={ss.duration}
                        onChange={(e) => updateSymptom(ss.symptomId, 'duration', parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-16 rounded-lg border border-input bg-background px-2 py-1 text-sm"
                      />
                      <select
                        value={ss.durationUnit}
                        onChange={(e) => updateSymptom(ss.symptomId, 'durationUnit', e.target.value)}
                        className="rounded-lg border border-input bg-background px-2 py-1 text-sm"
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                    <button
                      onClick={() => removeSymptom(ss.symptomId)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search and add more symptoms..."
                value={symptomSearch}
                onChange={(e) => setSymptomSearch(e.target.value)}
                className="medical-input pl-10 rounded-xl border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {symptomSearch && (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-border/50 bg-card p-3 shadow-lg scrollbar-thin">
                {Object.entries(groupedSymptoms).map(([category, categorySymptoms]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <p className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{category}</p>
                    <div className="space-y-1">
                      {categorySymptoms.map((symptom) => (
                        <button
                          key={symptom.id}
                          onClick={() => addSymptom(symptom)}
                          className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-primary/10 hover:border-primary/30 border border-transparent"
                        >
                          <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-foreground font-medium">{symptom.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(groupedSymptoms).length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No symptoms found</p>
                )}
              </div>
            )}

            <button
              onClick={getSuggestions}
              disabled={selectedSymptoms.length === 0}
              className="mt-4 w-full medical-btn-accent disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Get Medicine Suggestions
            </button>
          </div>

          {/* Diagnosis & Advice */}
          <div className="medical-card">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Diagnosis & Advice
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Diagnosis</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis..."
                  rows={2}
                  className="medical-input resize-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Advice</label>
                <textarea
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="Enter advice for the patient..."
                  rows={2}
                  className="medical-input resize-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Follow-up After</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={followUpDays}
                    onChange={(e) => setFollowUpDays(parseInt(e.target.value) || 7)}
                    min="1"
                    className="w-20 medical-input"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                  <span className="ml-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(addDays(new Date(), followUpDays), 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Medicine Suggestions */}
        <div className="space-y-6">
          <div className="medical-card sticky top-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Pill className="h-5 w-5 text-primary" />
                Suggested Remedies
                {suggestedMedicines.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{suggestedMedicines.length}</Badge>
                )}
              </h3>
              {suggestedMedicines.length > 0 && (
                <div className="flex gap-2">
                  {selectedRemedyIds.size < suggestedMedicines.length ? (
                    <button
                      onClick={selectAllRemedies}
                      className="text-xs text-primary hover:underline"
                    >
                      Select All
                    </button>
                  ) : (
                    <button
                      onClick={deselectAllRemedies}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Deselect All
                    </button>
                  )}
                </div>
              )}
            </div>

            {!showSuggestions ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Pill className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Select symptoms and click "Get Medicine Suggestions" to see recommendations
                </p>
              </div>
            ) : suggestedMedicines.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
                  <AlertCircle className="h-8 w-8 text-warning" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No matching medicines found. Add medicines manually below.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestedMedicines.map((pm) => {
                  const isSelected = selectedRemedyIds.has(pm.medicineId);
                  return (
                    <div
                      key={pm.medicineId}
                      onClick={() => toggleRemedySelection(pm.medicineId)}
                      className={cn(
                        "relative cursor-pointer rounded-lg border-2 p-3 transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-card hover:border-primary/50 hover:bg-primary/2"
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRemedySelection(pm.medicineId);
                            }}
                            className="mt-0.5 flex-shrink-0 text-primary"
                          >
                            {isSelected ? (
                              <CheckCircle2 className="h-5 w-5 fill-primary text-primary" />
                            ) : (
                              <Circle className="h-5 w-5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{pm.medicine.name}</p>
                            <p className="text-xs text-muted-foreground">{pm.medicine.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMedicine(pm.medicineId);
                          }}
                          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="grid gap-2 sm:grid-cols-2"
                      >
                        <div>
                          <label className="text-xs text-muted-foreground">Dosage</label>
                          <input
                            type="text"
                            value={pm.dosage}
                            onChange={(e) => {
                              setSuggestedMedicines((prev) =>
                                prev.map((m) =>
                                  m.medicineId === pm.medicineId ? { ...m, dosage: e.target.value } : m
                                )
                              );
                            }}
                            className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Duration</label>
                          <input
                            type="text"
                            value={pm.duration}
                            onChange={(e) => {
                              setSuggestedMedicines((prev) =>
                                prev.map((m) =>
                                  m.medicineId === pm.medicineId ? { ...m, duration: e.target.value } : m
                                )
                              );
                            }}
                            className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2"
                      >
                        <label className="text-xs text-muted-foreground">Instructions (optional)</label>
                        <input
                          type="text"
                          value={pm.instructions}
                          onChange={(e) => {
                            setSuggestedMedicines((prev) =>
                              prev.map((m) =>
                                m.medicineId === pm.medicineId ? { ...m, instructions: e.target.value } : m
                              )
                            );
                          }}
                          placeholder="e.g., Take after meals"
                          className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                        />
                      </div>
                      {isSelected && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Selected for prescription</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {showSuggestions && (
              <div className="mt-4 border-t border-border pt-4">
                <label className="mb-2 block text-xs font-medium text-muted-foreground">Add Medicine Manually</label>
                <select
                  onChange={(e) => {
                    const med = medicines.find((m) => m.id === e.target.value);
                    if (med) addManualMedicine(med);
                    e.target.value = '';
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Select a medicine...</option>
                  {medicines.map((med) => (
                    <option key={med.id} value={med.id}>
                      {med.name} ({med.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
              <p className="text-xs text-muted-foreground">
                These are suggestions based on rules. The final prescription decision lies with the qualified doctor.
              </p>
            </div>
          </div>

          {selectedRemedyIds.size > 0 && (
            <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {selectedRemedyIds.size} remedy{selectedRemedyIds.size > 1 ? 'ies' : ''} selected
                </span>
                <Badge variant="default" className="bg-primary">
                  Ready
                </Badge>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => generatePrescription(true)}
              disabled={!patient || selectedRemedyIds.size === 0 || generating}
              className="w-full medical-btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Prescription...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Create Prescription & View
                </>
              )}
            </button>

            <button
              onClick={() => generatePrescription(false)}
              disabled={!patient || selectedRemedyIds.size === 0 || generating}
              className="w-full medical-btn-accent disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Generate & Download PDF
            </button>
            
            {patient && selectedRemedyIds.size > 0 && (
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" />
                Share Draft via WhatsApp
              </button>
            )}
          </div>
        </div>
      </div>
        )}
      </div>
    </MainLayout>
  );
}
