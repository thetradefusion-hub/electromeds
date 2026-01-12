# Advanced AI Features - Complete Implementation Guide

## 📋 Overview

ElectroMed me Advanced AI Features implement karne ka detailed guide. Current system me basic AI report analysis hai, ab hum advanced features add karenge.

---

## 🎯 Current AI Implementation Status

### **Existing Features**
- ✅ Medical Report Analysis (Image-based)
- ✅ Multiple AI Provider Support (Lovable, OpenAI, Google Gemini, Custom)
- ✅ AI Settings Management (Admin Panel)
- ✅ Base64 image upload (no storage needed)

### **Current Architecture**
- **Frontend**: `MedicalReportAnalyzer.tsx` component
- **Backend**: `aiAnalysis.controller.ts` controller
- **API Route**: `/api/ai/analyze-report`
- **Model**: `AISettings.model.ts` for configuration

---

## 🚀 Advanced AI Features Implementation

---

## 1. AI-Powered Symptom Analysis

### **Concept**
Patient ke symptoms ko analyze karke AI se insights, severity assessment, aur potential conditions suggest karna.

### **Implementation Steps**

#### **Step 1: Backend API Endpoint**

**File**: `backend/src/controllers/aiAnalysis.controller.ts`

```typescript
/**
 * @route   POST /api/ai/analyze-symptoms
 * @desc    AI-powered symptom analysis
 */
export const analyzeSymptoms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { symptoms, patientAge, patientGender, medicalHistory } = req.body;
    const userId = req.user!.id;

    // Get AI settings
    const aiSettings = await AISettings.findOne({ isActive: true });
    if (!aiSettings) {
      throw new CustomError('AI settings not configured', 400);
    }

    // Build AI prompt
    const prompt = `You are an expert Electro Homeopathy practitioner. Analyze the following symptoms and provide insights:

Patient Information:
- Age: ${patientAge}
- Gender: ${patientGender}
- Medical History: ${medicalHistory || 'Not provided'}

Symptoms:
${symptoms.map((s: any) => `- ${s.name} (Severity: ${s.severity}, Duration: ${s.duration} ${s.durationUnit})`).join('\n')}

Please provide:
1. Symptom severity assessment (Mild/Moderate/Severe)
2. Potential underlying conditions
3. Urgency level (Low/Medium/High)
4. Recommended immediate actions
5. Symptoms correlation analysis
6. Risk factors identification

Format your response as JSON with the following structure:
{
  "severityAssessment": "string",
  "potentialConditions": ["string"],
  "urgencyLevel": "string",
  "recommendedActions": ["string"],
  "symptomCorrelation": "string",
  "riskFactors": ["string"],
  "analysis": "detailed analysis text"
}`;

    // Call AI provider
    let aiResponse;
    switch (aiSettings.provider) {
      case 'lovable':
        aiResponse = await callLovableAI(prompt, aiSettings.apiKey);
        break;
      case 'openai':
        aiResponse = await callOpenAIAI(prompt, aiSettings.apiKey);
        break;
      case 'google':
        aiResponse = await callGoogleGeminiAI(prompt, aiSettings.apiKey);
        break;
      default:
        throw new CustomError('Unsupported AI provider', 400);
    }

    // Parse AI response
    const analysis = JSON.parse(aiResponse);

    // Save analysis to database (optional)
    // await SymptomAnalysis.create({ userId, symptoms, analysis, ... });

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};
```

#### **Step 2: Frontend Component**

**File**: `src/components/consultation/SymptomAnalyzer.tsx` (New)

```typescript
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiAnalysisApi } from '@/lib/api/aiAnalysis.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Symptom {
  name: string;
  severity: string;
  duration: number;
  durationUnit: string;
}

interface SymptomAnalysis {
  severityAssessment: string;
  potentialConditions: string[];
  urgencyLevel: string;
  recommendedActions: string[];
  symptomCorrelation: string;
  riskFactors: string[];
  analysis: string;
}

const SymptomAnalyzer = ({ symptoms, patientAge, patientGender, medicalHistory }: {
  symptoms: Symptom[];
  patientAge: number;
  patientGender: string;
  medicalHistory?: string;
}) => {
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await aiAnalysisApi.analyzeSymptoms({
        symptoms,
        patientAge,
        patientGender,
        medicalHistory,
      });
      if (!response.success) {
        throw new Error(response.message || 'Analysis failed');
      }
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success('Symptom analysis completed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to analyze symptoms');
    },
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-600';
      case 'medium': return 'bg-orange-500/20 text-orange-600';
      case 'low': return 'bg-green-500/20 text-green-600';
      default: return 'bg-gray-500/20 text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Symptom Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get AI-powered insights about patient symptoms, potential conditions, and recommended actions.
            </p>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="w-full"
            >
              {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Symptoms with AI'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Urgency Level */}
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Urgency Level</p>
                <Badge className={getUrgencyColor(analysis.urgencyLevel)}>
                  {analysis.urgencyLevel}
                </Badge>
              </div>
            </div>

            {/* Severity Assessment */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Severity Assessment
              </h4>
              <p className="text-sm">{analysis.severityAssessment}</p>
            </div>

            {/* Potential Conditions */}
            {analysis.potentialConditions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Potential Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.potentialConditions.map((condition, idx) => (
                    <Badge key={idx} variant="outline">{condition}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {analysis.recommendedActions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Recommended Actions
                </h4>
                <ul className="space-y-1">
                  {analysis.recommendedActions.map((action, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Factors */}
            {analysis.riskFactors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Risk Factors</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.riskFactors.map((risk, idx) => (
                    <Badge key={idx} variant="destructive">{risk}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Analysis */}
            <div>
              <h4 className="font-semibold mb-2">Detailed Analysis</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {analysis.analysis}
              </p>
            </div>

            {/* Symptom Correlation */}
            {analysis.symptomCorrelation && (
              <div>
                <h4 className="font-semibold mb-2">Symptom Correlation</h4>
                <p className="text-sm text-muted-foreground">
                  {analysis.symptomCorrelation}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setAnalysis(null)}
              className="w-full"
            >
              Analyze Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomAnalyzer;
```

#### **Step 3: API Service**

**File**: `src/lib/api/aiAnalysis.api.ts` (Update)

```typescript
export interface SymptomAnalysisRequest {
  symptoms: Array<{
    name: string;
    severity: string;
    duration: number;
    durationUnit: string;
  }>;
  patientAge: number;
  patientGender: string;
  medicalHistory?: string;
}

export interface SymptomAnalysisResponse {
  severityAssessment: string;
  potentialConditions: string[];
  urgencyLevel: string;
  recommendedActions: string[];
  symptomCorrelation: string;
  riskFactors: string[];
  analysis: string;
}

export const aiAnalysisApi = {
  // ... existing functions ...
  
  analyzeSymptoms: async (data: SymptomAnalysisRequest): Promise<ApiResponse<SymptomAnalysisResponse>> => {
    const response = await api.post<ApiResponse<SymptomAnalysisResponse>>('/ai/analyze-symptoms', data);
    return response.data;
  },
};
```

#### **Step 4: Route Addition**

**File**: `backend/src/routes/aiAnalysis.routes.ts` (Update)

```typescript
import { analyzeSymptoms } from '../controllers/aiAnalysis.controller.js';

router.post('/analyze-symptoms', authenticate, analyzeSymptoms);
```

---

## 2. AI Treatment Suggestions

### **Concept**
Symptoms aur patient data ke basis par AI se treatment suggestions, medicine recommendations, aur dosage guidance.

### **Implementation**

#### **Backend Controller**

```typescript
/**
 * @route   POST /api/ai/treatment-suggestions
 * @desc    AI-powered treatment suggestions
 */
export const getTreatmentSuggestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { symptoms, patientAge, patientGender, existingMedicines, allergies } = req.body;

    const aiSettings = await AISettings.findOne({ isActive: true });
    if (!aiSettings) {
      throw new CustomError('AI settings not configured', 400);
    }

    // Get existing medicine rules from database
    const medicineRules = await MedicineRule.find({
      symptoms: { $in: symptoms.map((s: any) => s.name) }
    }).populate('medicines');

    const prompt = `You are an expert Electro Homeopathy practitioner. Based on the following information, suggest treatment:

Patient: ${patientAge} years, ${patientGender}
Symptoms: ${symptoms.map((s: any) => `${s.name} (${s.severity})`).join(', ')}
Existing Medicines: ${existingMedicines?.join(', ') || 'None'}
Allergies: ${allergies?.join(', ') || 'None'}

Available Medicine Rules:
${medicineRules.map((rule: any) => 
  `- ${rule.name}: ${rule.medicines.map((m: any) => m.name).join(', ')}`
).join('\n')}

Provide treatment suggestions in JSON format:
{
  "recommendedMedicines": [
    {
      "name": "medicine name",
      "reason": "why this medicine",
      "dosage": "recommended dosage",
      "duration": "treatment duration",
      "priority": "high/medium/low"
    }
  ],
  "treatmentPlan": "overall treatment plan",
  "precautions": ["precaution 1", "precaution 2"],
  "followUp": "follow-up recommendations",
  "contraindications": ["if any"]
}`;

    const aiResponse = await callAIProvider(aiSettings, prompt);
    const suggestions = JSON.parse(aiResponse);

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};
```

#### **Frontend Integration**

**File**: `src/components/consultation/AITreatmentSuggestions.tsx` (New)

```typescript
import { useQuery } from '@tanstack/react-query';
import { aiAnalysisApi } from '@/lib/api/aiAnalysis.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Pill, AlertCircle } from 'lucide-react';

const AITreatmentSuggestions = ({ symptoms, patientData }: Props) => {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['ai-treatment-suggestions', symptoms],
    queryFn: () => aiAnalysisApi.getTreatmentSuggestions({
      symptoms,
      patientAge: patientData.age,
      patientGender: patientData.gender,
      existingMedicines: patientData.currentMedicines,
      allergies: patientData.allergies,
    }),
    enabled: symptoms.length > 0,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Treatment Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading suggestions...</div>
        ) : suggestions?.data ? (
          <div className="space-y-4">
            {/* Recommended Medicines */}
            {suggestions.data.recommendedMedicines.map((med: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{med.name}</span>
                  </div>
                  <Badge variant={med.priority === 'high' ? 'destructive' : 'secondary'}>
                    {med.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{med.reason}</p>
                <div className="flex gap-4 text-sm">
                  <span><strong>Dosage:</strong> {med.dosage}</span>
                  <span><strong>Duration:</strong> {med.duration}</span>
                </div>
              </div>
            ))}

            {/* Treatment Plan */}
            <div>
              <h4 className="font-semibold mb-2">Treatment Plan</h4>
              <p className="text-sm">{suggestions.data.treatmentPlan}</p>
            </div>

            {/* Precautions */}
            {suggestions.data.precautions?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Precautions
                </h4>
                <ul className="space-y-1">
                  {suggestions.data.precautions.map((p: string, idx: number) => (
                    <li key={idx} className="text-sm">• {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
```

---

## 3. AI Patient Risk Assessment

### **Concept**
Patient ke medical history, symptoms, aur demographics ke basis par risk assessment karna.

### **Implementation**

#### **Backend Controller**

```typescript
/**
 * @route   POST /api/ai/risk-assessment
 * @desc    AI-powered patient risk assessment
 */
export const assessPatientRisk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId, symptoms, medicalHistory, vitalSigns } = req.body;

    // Get patient data
    const patient = await Patient.findById(patientId).populate('doctorId');
    if (!patient) {
      throw new CustomError('Patient not found', 404);
    }

    // Get patient's prescription history
    const prescriptions = await Prescription.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    const aiSettings = await AISettings.findOne({ isActive: true });
    if (!aiSettings) {
      throw new CustomError('AI settings not configured', 400);
    }

    const prompt = `Assess the health risk for this patient:

Patient: ${patient.name}, ${patient.age} years, ${patient.gender}
Medical History: ${medicalHistory || 'Not provided'}
Current Symptoms: ${symptoms.map((s: any) => s.name).join(', ')}
Vital Signs: ${JSON.stringify(vitalSigns || {})}
Recent Prescriptions: ${prescriptions.length} in last period

Provide risk assessment in JSON:
{
  "overallRisk": "low/medium/high",
  "riskScore": 0-100,
  "riskFactors": ["factor1", "factor2"],
  "protectiveFactors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "monitoringNeeded": true/false,
  "urgentCare": true/false,
  "detailedAssessment": "detailed text"
}`;

    const aiResponse = await callAIProvider(aiSettings, prompt);
    const assessment = JSON.parse(aiResponse);

    // Save assessment
    await PatientRiskAssessment.create({
      patientId,
      doctorId: patient.doctorId._id,
      assessment,
      assessedAt: new Date(),
    });

    res.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
};
```

#### **Database Model**

**File**: `backend/src/models/PatientRiskAssessment.model.ts` (New)

```typescript
import mongoose from 'mongoose';

const PatientRiskAssessmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  assessment: {
    overallRisk: String,
    riskScore: Number,
    riskFactors: [String],
    protectiveFactors: [String],
    recommendations: [String],
    monitoringNeeded: Boolean,
    urgentCare: Boolean,
    detailedAssessment: String,
  },
  assessedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('PatientRiskAssessment', PatientRiskAssessmentSchema);
```

---

## 4. AI Appointment Optimization

### **Concept**
Appointment scheduling ko optimize karna, wait times reduce karna, aur resource utilization improve karna.

### **Implementation**

#### **Backend Controller**

```typescript
/**
 * @route   POST /api/ai/optimize-appointments
 * @desc    AI-powered appointment optimization
 */
export const optimizeAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { doctorId, dateRange } = req.body;

    // Get existing appointments
    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: dateRange.start, $lte: dateRange.end },
    }).sort({ date: 1 });

    // Get doctor availability
    const availability = await DoctorAvailability.find({ doctorId });

    // Get historical data
    const historicalAppointments = await Appointment.find({
      doctorId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const aiSettings = await AISettings.findOne({ isActive: true });
    if (!aiSettings) {
      throw new CustomError('AI settings not configured', 400);
    }

    const prompt = `Optimize appointment scheduling for a doctor:

Current Appointments: ${appointments.length}
Availability: ${JSON.stringify(availability)}
Historical Data: Average appointment duration, no-shows, cancellations

Suggest optimizations in JSON:
{
  "suggestedSlots": [
    {
      "time": "HH:MM",
      "reason": "why this slot",
      "priority": "high/medium/low"
    }
  ],
  "optimizations": [
    "optimization suggestion 1",
    "optimization suggestion 2"
  ],
  "estimatedWaitTime": "average wait time",
  "resourceUtilization": "percentage",
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    const aiResponse = await callAIProvider(aiSettings, prompt);
    const optimization = JSON.parse(aiResponse);

    res.json({
      success: true,
      data: optimization,
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 5. AI Prescription Review

### **Concept**
Prescription ko AI se review karna, drug interactions check karna, aur dosage validation.

### **Implementation**

#### **Backend Controller**

```typescript
/**
 * @route   POST /api/ai/review-prescription
 * @desc    AI-powered prescription review
 */
export const reviewPrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { prescriptionId, medicines, patientData } = req.body;

    // Get medicine details from database
    const medicineDetails = await Medicine.find({
      name: { $in: medicines.map((m: any) => m.name) }
    });

    const aiSettings = await AISettings.findOne({ isActive: true });
    if (!aiSettings) {
      throw new CustomError('AI settings not configured', 400);
    }

    const prompt = `Review this Electro Homeopathy prescription:

Patient: ${patientData.age} years, ${patientData.gender}
Medicines:
${medicines.map((m: any) => 
  `- ${m.name}: ${m.dosage}, Duration: ${m.duration}`
).join('\n')}

Medicine Details:
${medicineDetails.map((m: any) => 
  `- ${m.name}: ${m.indications}, Contraindications: ${m.contraIndications || 'None'}`
).join('\n')}

Review and provide:
{
  "isSafe": true/false,
  "warnings": ["warning1", "warning2"],
  "drugInteractions": [
    {
      "medicine1": "name",
      "medicine2": "name",
      "interaction": "description",
      "severity": "mild/moderate/severe"
    }
  ],
  "dosageValidation": [
    {
      "medicine": "name",
      "status": "appropriate/high/low",
      "recommendation": "recommendation"
    }
  ],
  "contraindications": ["contraindication1"],
  "suggestions": ["suggestion1", "suggestion2"],
  "overallReview": "detailed review text"
}`;

    const aiResponse = await callAIProvider(aiSettings, prompt);
    const review = JSON.parse(aiResponse);

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
```

#### **Frontend Integration**

**File**: `src/components/consultation/PrescriptionReview.tsx` (New)

```typescript
const PrescriptionReview = ({ prescription, onReviewComplete }) => {
  const reviewMutation = useMutation({
    mutationFn: () => aiAnalysisApi.reviewPrescription({
      prescriptionId: prescription.id,
      medicines: prescription.medicines,
      patientData: prescription.patient,
    }),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Prescription Review</CardTitle>
      </CardHeader>
      <CardContent>
        {reviewMutation.data?.data && (
          <div className="space-y-4">
            {/* Safety Status */}
            <div className={cn(
              "p-4 rounded-lg",
              reviewMutation.data.data.isSafe 
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-red-500/10 border border-red-500/20"
            )}>
              <div className="flex items-center gap-2">
                {reviewMutation.data.data.isSafe ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-semibold">
                  {reviewMutation.data.data.isSafe ? 'Prescription is Safe' : 'Prescription Needs Review'}
                </span>
              </div>
            </div>

            {/* Warnings */}
            {reviewMutation.data.data.warnings?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-orange-600">Warnings</h4>
                <ul className="space-y-1">
                  {reviewMutation.data.data.warnings.map((w: string, idx: number) => (
                    <li key={idx} className="text-sm">⚠️ {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Drug Interactions */}
            {reviewMutation.data.data.drugInteractions?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 text-red-600">Drug Interactions</h4>
                {reviewMutation.data.data.drugInteractions.map((interaction: any, idx: number) => (
                  <div key={idx} className="border rounded p-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {interaction.medicine1} + {interaction.medicine2}
                      </span>
                      <Badge variant={interaction.severity === 'severe' ? 'destructive' : 'secondary'}>
                        {interaction.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{interaction.interaction}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Dosage Validation */}
            {reviewMutation.data.data.dosageValidation?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Dosage Validation</h4>
                {reviewMutation.data.data.dosageValidation.map((validation: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded mb-1">
                    <span>{validation.medicine}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        validation.status === 'appropriate' ? 'default' : 
                        validation.status === 'high' ? 'destructive' : 'secondary'
                      }>
                        {validation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

---

## 6. AI Patient Insights

### **Concept**
Patient ke historical data, patterns, aur trends ko analyze karke insights provide karna.

### **Implementation**

#### **Backend Controller**

```typescript
/**
 * @route   GET /api/ai/patient-insights/:patientId
 * @desc    AI-powered patient insights
 */
export const getPatientInsights = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;

    // Get comprehensive patient data
    const patient = await Patient.findById(patientId);
    const prescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 });
    const appointments = await Appointment.find({ patientId }).sort({ date: -1 });
    const followUps = await FollowUp.find({ patientId });

    // Analyze patterns
    const commonSymptoms = extractCommonSymptoms(prescriptions);
    const medicinePatterns = extractMedicinePatterns(prescriptions);
    const visitFrequency = calculateVisitFrequency(appointments);

    const aiSettings = await AISettings.findOne({ isActive: true });
    if (!aiSettings) {
      throw new CustomError('AI settings not configured', 400);
    }

    const prompt = `Analyze this patient's medical history and provide insights:

Patient: ${patient.name}, ${patient.age} years, ${patient.gender}
Total Visits: ${appointments.length}
Total Prescriptions: ${prescriptions.length}
Common Symptoms: ${commonSymptoms.join(', ')}
Medicine Patterns: ${JSON.stringify(medicinePatterns)}
Visit Frequency: ${visitFrequency}

Provide insights in JSON:
{
  "healthTrends": "overall health trend",
  "recurringIssues": ["issue1", "issue2"],
  "treatmentEffectiveness": "assessment",
  "recommendations": ["recommendation1", "recommendation2"],
  "preventiveMeasures": ["measure1", "measure2"],
  "lifestyleSuggestions": ["suggestion1", "suggestion2"],
  "followUpPriority": "high/medium/low",
  "detailedInsights": "comprehensive analysis"
}`;

    const aiResponse = await callAIProvider(aiSettings, prompt);
    const insights = JSON.parse(aiResponse);

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 7. Predictive Analytics

### **Concept**
Historical data ke basis par future predictions, trends, aur forecasting.

### **Implementation**

#### **Backend Controller**

```typescript
/**
 * @route   POST /api/ai/predictive-analytics
 * @desc    AI-powered predictive analytics
 */
export const getPredictiveAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { doctorId, timeframe } = req.body;

    // Get historical data
    const patients = await Patient.find({ doctorId });
    const prescriptions = await Prescription.find({ doctorId });
    const appointments = await Appointment.find({ doctorId });
    const revenue = await Payment.find({ doctorId });

    // Calculate trends
    const patientGrowth = calculatePatientGrowth(patients);
    const prescriptionTrends = calculatePrescriptionTrends(prescriptions);
    const appointmentTrends = calculateAppointmentTrends(appointments);
    const revenueTrends = calculateRevenueTrends(revenue);

    const aiSettings = await AISettings.findOne({ isActive: true });
    if (!aiSettings) {
      throw new CustomError('AI settings not configured', 400);
    }

    const prompt = `Based on historical data, provide predictions for the next ${timeframe}:

Current Statistics:
- Total Patients: ${patients.length}
- Total Prescriptions: ${prescriptions.length}
- Total Appointments: ${appointments.length}
- Revenue Trends: ${JSON.stringify(revenueTrends)}

Historical Trends:
- Patient Growth: ${patientGrowth}%
- Prescription Trends: ${JSON.stringify(prescriptionTrends)}
- Appointment Trends: ${JSON.stringify(appointmentTrends)}

Provide predictions in JSON:
{
  "predictedPatients": {
    "nextMonth": number,
    "nextQuarter": number,
    "nextYear": number,
    "growthRate": "percentage"
  },
  "predictedRevenue": {
    "nextMonth": number,
    "nextQuarter": number,
    "nextYear": number,
    "trend": "increasing/decreasing/stable"
  },
  "predictedAppointments": {
    "nextMonth": number,
    "peakDays": ["day1", "day2"],
    "busyPeriods": ["period1", "period2"]
  },
  "recommendations": ["recommendation1", "recommendation2"],
  "risks": ["risk1", "risk2"],
  "opportunities": ["opportunity1", "opportunity2"]
}`;

    const aiResponse = await callAIProvider(aiSettings, prompt);
    const predictions = JSON.parse(aiResponse);

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    next(error);
  }
};
```

---

## 🔧 Helper Functions

### **AI Provider Abstraction**

**File**: `backend/src/utils/aiProvider.ts` (New)

```typescript
import axios from 'axios';

export const callAIProvider = async (
  aiSettings: any,
  prompt: string
): Promise<string> => {
  switch (aiSettings.provider) {
    case 'lovable':
      return await callLovableAI(prompt, aiSettings.apiKey);
    case 'openai':
      return await callOpenAIAI(prompt, aiSettings.apiKey);
    case 'google':
      return await callGoogleGeminiAI(prompt, aiSettings.apiKey);
    case 'custom':
      return await callCustomAI(prompt, aiSettings.apiKey, aiSettings.customEndpoint);
    default:
      throw new Error('Unsupported AI provider');
  }
};

const callLovableAI = async (prompt: string, apiKey: string): Promise<string> => {
  const response = await axios.post(
    'https://api.lovable.dev/v1/chat/completions',
    {
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
};

const callOpenAIAI = async (prompt: string, apiKey: string): Promise<string> => {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
};

const callGoogleGeminiAI = async (prompt: string, apiKey: string): Promise<string> => {
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }
  );
  return response.data.candidates[0].content.parts[0].text;
};
```

---

## 📊 Database Models Needed

### **1. SymptomAnalysis Model**

```typescript
const SymptomAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  symptoms: [{
    name: String,
    severity: String,
    duration: Number,
    durationUnit: String,
  }],
  analysis: {
    severityAssessment: String,
    potentialConditions: [String],
    urgencyLevel: String,
    recommendedActions: [String],
    symptomCorrelation: String,
    riskFactors: [String],
    analysis: String,
  },
  analyzedAt: { type: Date, default: Date.now },
});
```

### **2. PatientRiskAssessment Model** (Already shown above)

### **3. TreatmentSuggestion Model**

```typescript
const TreatmentSuggestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  symptoms: [String],
  suggestions: {
    recommendedMedicines: [{
      name: String,
      reason: String,
      dosage: String,
      duration: String,
      priority: String,
    }],
    treatmentPlan: String,
    precautions: [String],
    followUp: String,
  },
  suggestedAt: { type: Date, default: Date.now },
});
```

---

## 🎨 Frontend Integration Points

### **1. Consultation Page**
- Symptom Analyzer component
- AI Treatment Suggestions component
- Prescription Review component

### **2. Patient History Page**
- Patient Insights component
- Risk Assessment component

### **3. Dashboard**
- Predictive Analytics widget
- AI Insights summary

### **4. Appointment Page**
- Appointment Optimization suggestions

---

## 🔐 Security & Privacy Considerations

1. **Data Privacy**
   - Patient data ko AI providers ko send karte waqt anonymize karein
   - PII (Personally Identifiable Information) remove karein
   - HIPAA compliance maintain karein

2. **API Key Security**
   - API keys ko environment variables me store karein
   - Never expose keys in frontend
   - Rotate keys regularly

3. **Rate Limiting**
   - AI API calls ko rate limit karein
   - Cost control ke liye usage tracking
   - Per-user quotas

4. **Error Handling**
   - AI failures ko gracefully handle karein
   - Fallback mechanisms
   - User-friendly error messages

---

## 💰 Cost Management

### **AI API Costs**
- **Lovable**: Pay-per-use
- **OpenAI**: Token-based pricing
- **Google Gemini**: Request-based pricing

### **Cost Optimization**
- Cache AI responses where possible
- Batch requests
- Use cheaper models for simple tasks
- Set usage limits per user/plan

---

## 📈 Implementation Priority

### **Phase 1 (Month 1)**
1. AI Symptom Analysis
2. AI Treatment Suggestions
3. AI Prescription Review

### **Phase 2 (Month 2)**
4. AI Patient Risk Assessment
5. AI Patient Insights

### **Phase 3 (Month 3)**
6. AI Appointment Optimization
7. Predictive Analytics

---

## 🧪 Testing Strategy

1. **Unit Tests**: AI helper functions
2. **Integration Tests**: API endpoints
3. **E2E Tests**: Complete AI workflows
4. **AI Response Validation**: JSON parsing, error handling
5. **Performance Tests**: Response times, concurrent requests

---

## 📝 Usage Examples

### **Example 1: Symptom Analysis**
```typescript
// In Consultation page
<SymptomAnalyzer
  symptoms={selectedSymptoms}
  patientAge={patient.age}
  patientGender={patient.gender}
  medicalHistory={patient.medicalHistory}
/>
```

### **Example 2: Prescription Review**
```typescript
// Before saving prescription
const review = await aiAnalysisApi.reviewPrescription({
  prescriptionId: prescription.id,
  medicines: prescription.medicines,
  patientData: patient,
});

if (!review.data.isSafe) {
  // Show warnings to doctor
  showWarnings(review.data.warnings);
}
```

---

## 🚀 Next Steps

1. **Week 1**: Implement AI Symptom Analysis
2. **Week 2**: Implement AI Treatment Suggestions
3. **Week 3**: Implement AI Prescription Review
4. **Week 4**: Testing & refinement

---

**Last Updated**: January 2025  
**Status**: Implementation Guide Ready

