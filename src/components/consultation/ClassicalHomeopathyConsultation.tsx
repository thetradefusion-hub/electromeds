/**
 * Classical Homeopathy Consultation Component
 * 
 * Complete UI for Classical Homeopathy case entry and remedy suggestions
 */

import { useState, useEffect } from 'react';
import {
  Brain,
  Activity,
  Target,
  TrendingUp,
  Loader2,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClassicalSymptomSelector } from './ClassicalSymptomSelector';
import { RemedySuggestionsCard } from './RemedySuggestionsCard';
import { AICaseInput } from './AICaseInput';
import { CaseCompletenessPanel } from './CaseCompletenessPanel';
import { SmartQuestionsPanel } from './SmartQuestionsPanel';
import { CaseSummaryPanel } from './CaseSummaryPanel';
import { classicalHomeopathyApi, StructuredCaseInput, RemedySuggestion } from '@/lib/api/classicalHomeopathy.api';
import { Symptom } from '@/hooks/useSymptoms';
import { useApiError } from '@/hooks/useApiError';
import { ExtractedSymptom, analyzeCompleteness, generateQuestions, generateQuestionsBatch, CompletenessAnalysis, Question } from '@/lib/api/aiCaseTaking.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Extended symptom type for Classical Homeopathy
interface ExtendedSymptom extends Symptom {
  code?: string;
  synonyms?: string[];
  location?: string;
  sensation?: string;
  modalities?: string[];
}

interface SelectedSymptom {
  symptomId: string;
  symptom: ExtendedSymptom;
  category: 'mental' | 'general' | 'particular' | 'modality';
  location?: string;
  sensation?: string;
  type?: 'better' | 'worse';
  weight?: number;
}

interface ClassicalHomeopathyConsultationProps {
  patientId: string;
  symptoms: ExtendedSymptom[];
  onCaseRecordCreated?: (caseRecordId: string) => void;
  onPrescriptionCreated?: (prescriptionId: string) => void;
}

export function ClassicalHomeopathyConsultation({
  patientId,
  symptoms,
  onCaseRecordCreated,
  onPrescriptionCreated,
}: ClassicalHomeopathyConsultationProps) {
  const { showError } = useApiError();
  const analysisStages = [
    {
      key: 'intake',
      label: 'Step 1 • Case intake & symptom structuring',
      description: 'Normalizing mental, general, particular, and modality symptoms',
    },
    {
      key: 'mapping',
      label: 'Step 2 • Mapping symptoms to repertory rubrics',
      description: 'Finding matching rubrics in the English (publicum) repertory',
    },
    {
      key: 'repertory',
      label: 'Step 3 • Building remedy pool from rubrics',
      description: 'Collecting all remedies related to the matched rubrics',
    },
    {
      key: 'scoring',
      label: 'Step 4 • Smart scoring & clinical filters',
      description: 'Applying weights, modalities, pathology and safety checks',
    },
    {
      key: 'suggestions',
      label: 'Step 5 • Generating final remedy suggestions',
      description: 'Preparing ranked remedies with transparent reasoning',
    },
  ] as const;

  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  const [pathologyTags, setPathologyTags] = useState<string[]>([]);
  const [pathologyInput, setPathologyInput] = useState('');
  const [suggestions, setSuggestions] = useState<RemedySuggestion[]>([]);
  const [caseRecordId, setCaseRecordId] = useState<string | null>(null);
  const [selectedRemedy, setSelectedRemedy] = useState<RemedySuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisStageIndex, setAnalysisStageIndex] = useState(0);
  const [finalRemedy, setFinalRemedy] = useState({
    potency: '',
    repetition: '',
    notes: '',
    rationale: '',
  });
  const [inputMode, setInputMode] = useState<'manual' | 'ai'>('manual');
  const [completenessAnalysis, setCompletenessAnalysis] = useState<CompletenessAnalysis | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [showCompleteness, setShowCompleteness] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [analyzingCompleteness, setAnalyzingCompleteness] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Filter symptoms for Classical Homeopathy
  // Allow symptoms with classical_homeopathy modality or symptoms without modality set (for backward compatibility)
  const classicalSymptoms = symptoms.filter(
    (s) => s.modality === 'classical_homeopathy' || !s.modality
  );

  // Debug: Log symptoms count
  useEffect(() => {
    console.log('🔍 Classical Homeopathy Consultation Debug:');
    console.log('Total symptoms received:', symptoms.length);
    console.log('Classical symptoms filtered:', classicalSymptoms.length);
    console.log('Sample symptoms:', symptoms.slice(0, 5).map(s => ({ 
      name: s.name,
      modality: s.modality,
      category: s.category,
    })));
  }, [symptoms, classicalSymptoms]);

  // Animate rule engine analysis stages while loading
  useEffect(() => {
    if (!loading) return;

    setAnalysisStageIndex(0);
    const interval = window.setInterval(() => {
      setAnalysisStageIndex((prev) => {
        const next = prev + 1;
        return next >= analysisStages.length ? analysisStages.length - 1 : next;
      });
    }, 900);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading, analysisStages.length]);

  const handleAddSymptom = (symptom: SelectedSymptom) => {
    setSelectedSymptoms((prev) => [...prev, symptom]);
  };

  const handleRemoveSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) => prev.filter((s) => s.symptomId !== symptomId));
  };

  const handleUpdateSymptom = (symptomId: string, updates: Partial<SelectedSymptom>) => {
    setSelectedSymptoms((prev) =>
      prev.map((s) => (s.symptomId === symptomId ? { ...s, ...updates } : s))
    );
  };

  const handleAddPathologyTag = () => {
    if (pathologyInput.trim() && !pathologyTags.includes(pathologyInput.trim())) {
      setPathologyTags((prev) => [...prev, pathologyInput.trim()]);
      setPathologyInput('');
    }
  };

  const handleRemovePathologyTag = (tag: string) => {
    setPathologyTags((prev) => prev.filter((t) => t !== tag));
  };

  const buildStructuredCase = (): StructuredCaseInput => {
    return {
      mental: selectedSymptoms
        .filter((s) => s.category === 'mental')
        .map((s) => ({
          symptomText: s.symptom.name,
          weight: s.weight || 3,
        })),
      generals: selectedSymptoms
        .filter((s) => s.category === 'general')
        .map((s) => ({
          symptomText: s.symptom.name,
          weight: s.weight || 2,
        })),
      particulars: selectedSymptoms
        .filter((s) => s.category === 'particular')
        .map((s) => ({
          symptomText: s.symptom.name,
          location: s.location,
          sensation: s.sensation,
          weight: s.weight || 1,
        })),
      modalities: selectedSymptoms
        .filter((s) => s.category === 'modality')
        .map((s) => ({
          symptomText: s.symptom.name,
          type: s.type || 'worse',
          weight: s.weight || 1.5,
        })),
      pathologyTags,
    };
  };

  // Build normalized case for summary generation (simplified version)
  const buildNormalizedCase = () => {
    const structuredCase = buildStructuredCase();
    const isAcute = pathologyTags.includes('Acute') || pathologyTags.some((tag) => ['Fever', 'Injury', 'Sudden'].includes(tag));
    const isChronic = pathologyTags.includes('Chronic');

    return {
      mental: structuredCase.mental.map((s) => ({
        symptomCode: `TEMP_${Date.now()}_${Math.random()}`,
        symptomName: s.symptomText,
        category: 'mental' as const,
        weight: s.weight || 3,
      })),
      generals: structuredCase.generals.map((s) => ({
        symptomCode: `TEMP_${Date.now()}_${Math.random()}`,
        symptomName: s.symptomText,
        category: 'general' as const,
        weight: s.weight || 2,
      })),
      particulars: structuredCase.particulars.map((s) => ({
        symptomCode: `TEMP_${Date.now()}_${Math.random()}`,
        symptomName: s.symptomText,
        category: 'particular' as const,
        location: s.location,
        sensation: s.sensation,
        weight: s.weight || 1,
      })),
      modalities: structuredCase.modalities.map((s) => ({
        symptomCode: `TEMP_${Date.now()}_${Math.random()}`,
        symptomName: s.symptomText,
        category: 'modality' as const,
        type: s.type || 'worse',
        weight: s.weight || 1.5,
      })),
      pathologyTags,
      isAcute,
      isChronic,
    };
  };

  const handleGetSuggestions = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please add at least one symptom');
      return;
    }

    setLoading(true);
    try {
      const structuredCase = buildStructuredCase();
      const response = await classicalHomeopathyApi.suggestRemedies(
        patientId,
        structuredCase
      );

      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to get suggestions');
        return;
      }

      setSuggestions(response.data.suggestions.topRemedies);
      setCaseRecordId(response.data.caseRecordId);
      
      if (onCaseRecordCreated) {
        onCaseRecordCreated(response.data.caseRecordId);
      }

      toast.success(
        `Found ${response.data.suggestions.topRemedies.length} remedy suggestions`
      );
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      // Use centralized API error handler so backend message is shown (not just status code)
      showError(error, 'Failed to get remedy suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRemedy = (remedy: RemedySuggestion) => {
    setSelectedRemedy(remedy);

    // Frontend heuristic to suggest potency based on case tags + match score
    const tagsLower = pathologyTags.map((t) => t.toLowerCase());
    let isAcute =
      tagsLower.includes('acute') ||
      tagsLower.some((t) => ['fever', 'injury', 'sudden', 'acute'].some((k) => t.includes(k)));
    let isChronic =
      tagsLower.includes('chronic') ||
      tagsLower.some((t) => ['chronic', 'long-standing', 'long standing'].some((k) => t.includes(k)));

    // If doctor has not tagged acute/chronic, infer a basic tendency from match score
    if (!isAcute && !isChronic) {
      if (remedy.matchScore >= 80) {
        // Strong, well-covered case – treat as deeper/chronic tendency
        isChronic = true;
      } else if (remedy.matchScore >= 60) {
        // Moderately strong match – treat as acute-style response
        isAcute = true;
      }
    }

    let suggestedPotency = remedy.suggestedPotency || '6C';
    let rationale = '';

    if (isAcute && !isChronic) {
      if (remedy.matchScore >= 80) {
        suggestedPotency = '200C';
        rationale =
          'Acute-style case with very strong remedy match; 200C suggested with closer follow‑up.';
      } else if (remedy.matchScore >= 60) {
        suggestedPotency = '30C';
        rationale =
          'Acute / short-term pattern detected; 30C suggested as starting potency for faster response.';
      } else {
        suggestedPotency = '6C';
        rationale =
          'Milder acute picture or lower confidence; 6C suggested as a conservative starting potency.';
      }
    } else if (isChronic) {
      if (symptomCounts.mental >= 1 && remedy.matchScore >= 60) {
        suggestedPotency = '200C';
        rationale =
          'Chronic case with at least one mental/general symptom and good match score; 200C suggested for deeper constitutional action.';
      } else if (remedy.matchScore >= 60) {
        suggestedPotency = '30C';
        rationale =
          'Chronic case with reasonable match; 30C suggested as balanced constitutional potency.';
      } else {
        suggestedPotency = '6C';
        rationale =
          'Chronic pathology tags present but lower confidence; 6C suggested with cautious dosing.';
      }
    } else if (!remedy.suggestedPotency || remedy.suggestedPotency === '6C') {
      rationale =
        'Engine defaulted to 6C; adjust potency as per your clinical judgment and case depth.';
    } else {
      rationale = 'Suggested potency from engine; adjust as per your clinical judgment.';
    }

    setFinalRemedy({
      potency: suggestedPotency,
      repetition: remedy.repetition,
      notes: '',
      rationale,
    });
  };

  const handleAnalyzeCompleteness = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please add at least one symptom before analyzing completeness');
      return;
    }

    setAnalyzingCompleteness(true);
    try {
      const structuredCase = buildStructuredCase();
      const analysis = await analyzeCompleteness(structuredCase);
      setCompletenessAnalysis(analysis);
      setShowCompleteness(true);
      toast.success(`Case completeness: ${analysis.completenessScore}%`);
    } catch (error: any) {
      console.error('Error analyzing completeness:', error);
      showError(error, 'Failed to analyze case completeness');
    } finally {
      setAnalyzingCompleteness(false);
    }
  };

  const handleGenerateQuestions = async (domain?: string) => {
    if (selectedSymptoms.length === 0 && !domain) {
      toast.error('Please add at least one symptom before generating questions');
      return;
    }

    setGeneratingQuestions(true);
    try {
      const structuredCase = buildStructuredCase();
      const result = await generateQuestions(structuredCase, domain);
      setGeneratedQuestions(result.questions);
      setShowQuestions(true);
      toast.success(`Generated ${result.questions.length} smart questions`);
    } catch (error: any) {
      console.error('Error generating questions:', error);
      showError(error, 'Failed to generate questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const [questionAnswers, setQuestionAnswers] = useState<Array<{ question: Question; answer: string }>>([]);
  const [questionHistory, setQuestionHistory] = useState<Question[]>([]);

  const handleQuestionAnswer = (questionId: string, answer: string, question: Question) => {
    // Store answer
    setQuestionAnswers((prev) => {
      const filtered = prev.filter((qa) => qa.question.id !== questionId);
      return [...filtered, { question, answer }];
    });
  };

  const handleQuestionsComplete = async (allAnswers: Array<{ question: Question; answer: string }>) => {
    setQuestionAnswers(allAnswers);
    toast.success(`Recorded ${allAnswers.length} question answers`);
  };

  const handleSymptomsExtracted = async (extractedSymptoms: any[]) => {
    console.log('[ClassicalHomeopathyConsultation] handleSymptomsExtracted called with:', extractedSymptoms);
    
    if (!extractedSymptoms || extractedSymptoms.length === 0) {
      console.warn('[ClassicalHomeopathyConsultation] No symptoms to add');
      return;
    }

    // Convert extracted symptoms to SelectedSymptom format
    const newSymptoms: SelectedSymptom[] = extractedSymptoms.map((extracted) => {
      console.log('[ClassicalHomeopathyConsultation] Processing extracted symptom:', extracted);
      
      const existingSymptom = classicalSymptoms.find(
        (s) => s.name.toLowerCase() === extracted.symptomText.toLowerCase()
      );
      
      if (existingSymptom) {
        console.log('[ClassicalHomeopathyConsultation] Found existing symptom:', existingSymptom.name);
        return {
          symptomId: existingSymptom.id,
          symptom: existingSymptom as ExtendedSymptom,
          category: extracted.category,
          location: extracted.location,
          sensation: extracted.sensation,
          type: extracted.type || (extracted.category === 'modality' ? 'worse' : undefined),
          weight: extracted.weight || (extracted.category === 'mental' ? 3 : extracted.category === 'general' ? 2 : 1),
        };
      } else {
        // Create temporary symptom
        console.log('[ClassicalHomeopathyConsultation] Creating new symptom:', extracted.symptomText);
        const tempSymptom: ExtendedSymptom = {
          id: `temp-${Date.now()}-${Math.random()}`,
          code: extracted.source || '',
          name: extracted.symptomText,
          category: extracted.category,
          modality: 'classical_homeopathy',
          synonyms: [],
          is_global: true,
          description: null,
          doctor_id: null,
          created_at: new Date().toISOString(),
        };
        return {
          symptomId: tempSymptom.id,
          symptom: tempSymptom,
          category: extracted.category,
          location: extracted.location,
          sensation: extracted.sensation,
          type: extracted.type || (extracted.category === 'modality' ? 'worse' : undefined),
          weight: extracted.weight || (extracted.category === 'mental' ? 3 : extracted.category === 'general' ? 2 : 1),
        };
      }
    });

    console.log('[ClassicalHomeopathyConsultation] Converted symptoms:', newSymptoms);

    // Add to selected symptoms
    setSelectedSymptoms((prev) => {
      const existingIds = new Set(prev.map((s) => s.symptomId));
      const uniqueNew = newSymptoms.filter((s) => !existingIds.has(s.symptomId));
      console.log('[ClassicalHomeopathyConsultation] Adding symptoms. Existing:', prev.length, 'New unique:', uniqueNew.length);
      return [...prev, ...uniqueNew];
    });

    toast.success(`Added ${newSymptoms.length} symptoms from question answers`);
  };

  const handleGenerateQuestionsBatch = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please add at least one symptom before generating questions');
      return;
    }

    setGeneratingQuestions(true);
    try {
      const structuredCase = buildStructuredCase();
      const analysis = await analyzeCompleteness(structuredCase);
      
      // Generate questions for all missing domains
      const missingDomains = analysis.missingDomains.map((d) => d.domain);
      const result = await generateQuestionsBatch(structuredCase, missingDomains);
      
      setGeneratedQuestions(result.questions);
      setQuestionHistory(result.questions);
      setShowQuestions(true);
      toast.success(`Generated ${result.questions.length} questions for ${missingDomains.length} domains`);
    } catch (error: any) {
      console.error('Error generating questions batch:', error);
      showError(error, 'Failed to generate questions batch');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!selectedRemedy || !caseRecordId) {
      toast.error('Please select a remedy first');
      return;
    }

    if (!finalRemedy.potency || !finalRemedy.repetition) {
      toast.error('Please fill in potency and repetition');
      return;
    }

    setLoading(true);
    try {
      const response = await classicalHomeopathyApi.updateDoctorDecision(
        caseRecordId,
        {
          remedyId: selectedRemedy.remedy.id,
          remedyName: selectedRemedy.remedy.name,
          potency: finalRemedy.potency,
          repetition: finalRemedy.repetition,
          notes: finalRemedy.notes,
        }
      );

      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to save decision');
        return;
      }

      toast.success('Remedy decision saved and prescription created successfully');

      // Notify parent component about prescription creation
      if (onPrescriptionCreated && response.data.prescription?._id) {
        onPrescriptionCreated(response.data.prescription._id);
      }
    } catch (error: any) {
      console.error('Error saving decision:', error);
      toast.error(error.message || 'Failed to save decision');
    } finally {
      setLoading(false);
    }
  };

  const symptomCounts = {
    mental: selectedSymptoms.filter((s) => s.category === 'mental').length,
    general: selectedSymptoms.filter((s) => s.category === 'general').length,
    particular: selectedSymptoms.filter((s) => s.category === 'particular').length,
    modality: selectedSymptoms.filter((s) => s.category === 'modality').length,
  };

  // High-level UI steps for classical flow (purely visual)
  const uiSteps = [
    { key: 'intake', label: '1. Case intake' },
    { key: 'completeness', label: '2. Completeness' },
    { key: 'questions', label: '3. Questions' },
    { key: 'analysis', label: '4. Suggestions' },
    { key: 'remedy', label: '5. Remedy' },
  ] as const;

  let currentUiStep: (typeof uiSteps)[number]['key'] = 'intake';
  if (suggestions.length > 0) {
    currentUiStep = selectedRemedy ? 'remedy' : 'analysis';
  } else if (showQuestions && generatedQuestions.length > 0) {
    currentUiStep = 'questions';
  } else if (showCompleteness && completenessAnalysis) {
    currentUiStep = 'completeness';
  }

  // Show warning if no symptoms available
  if (classicalSymptoms.length === 0 && symptoms.length > 0) {
    return (
      <div className="medical-card border-warning/30 bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">No Classical Homeopathy Symptoms Found</h3>
            <p className="text-sm text-muted-foreground mb-3">
              You have {symptoms.length} symptom(s) in your database, but none are marked for Classical Homeopathy.
            </p>
            <p className="text-sm text-muted-foreground">
              Please add Classical Homeopathy symptoms from the <strong>Symptoms</strong> page, or update existing symptoms to include <code className="text-xs bg-muted px-1.5 py-0.5 rounded">modality: classical_homeopathy</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (symptoms.length === 0) {
    return (
      <div className="medical-card border-warning/30 bg-warning/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-1">No Symptoms Available</h3>
            <p className="text-sm text-muted-foreground">
              Please add symptoms from the <strong>Symptoms</strong> page first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header strip for Classical flow */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary mb-1">
            Classical mode
          </p>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            Classical Homeopathy Consultation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Structured case-taking with mental, generals, particulars and modalities before repertory-style suggestions.
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <Badge variant="outline" className="text-[11px] sm:text-xs bg-primary/10 text-primary border-primary/20">
            {symptomCounts.mental + symptomCounts.general + symptomCounts.particular + symptomCounts.modality} symptom
            {selectedSymptoms.length === 1 ? '' : 's'} captured
          </Badge>
          <div className="flex flex-wrap gap-2 text-[11px] sm:text-xs text-muted-foreground">
            <span>Mode: Classical</span>
          </div>
        </div>
      </div>

      {/* High-level flow steps */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
        {uiSteps.map((step) => {
          const isActive = step.key === currentUiStep;
          const isCompleted =
            (step.key === 'completeness' && (currentUiStep === 'questions' || currentUiStep === 'analysis' || currentUiStep === 'remedy')) ||
            (step.key === 'questions' && (currentUiStep === 'analysis' || currentUiStep === 'remedy')) ||
            (step.key === 'analysis' && currentUiStep === 'remedy');

          return (
            <div
              key={step.key}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 border text-[11px] sm:text-xs',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : isCompleted
                  ? 'border-blue-500/30 bg-blue-500/5 text-blue-700 dark:text-blue-300'
                  : 'border-border bg-muted/40 text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <CheckCircle className="h-3 w-3" />
              ) : isActive ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Structured Case Input */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: intake and symptoms */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Case Entry
            </h2>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  {selectedSymptoms.length} {selectedSymptoms.length === 1 ? 'Symptom' : 'Symptoms'}
                  {classicalSymptoms.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({classicalSymptoms.length} available)
                    </span>
                  )}
                </Badge>
                <div className="flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/30 px-1 py-1 shadow-sm">
                  <Button
                    type="button"
                    variant={inputMode === 'manual' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setInputMode('manual')}
                    className="h-7 px-3 text-xs rounded-full"
                  >
                    Manual
                  </Button>
                  <Button
                    type="button"
                    variant={inputMode === 'ai' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode('ai')}
                    className={cn(
                      'h-7 px-3 text-xs rounded-full flex items-center gap-1',
                      inputMode !== 'ai' && 'border-blue-500/70 text-blue-700 dark:text-blue-300'
                    )}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Input
                  </Button>
                </div>
              </div>
              <p className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                AI Input converts your narrative into structured symptoms (recommended for rich cases).
              </p>
            </div>
          </div>

          {/* AI Case Input Mode */}
          {inputMode === 'ai' && (
            <div className="medical-card border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
              <AICaseInput
                onSymptomsConfirmed={(extractedSymptoms) => {
                  // Convert extracted symptoms to SelectedSymptom format
                  const newSymptoms: SelectedSymptom[] = extractedSymptoms.map((extracted) => {
                    // Find matching symptom from database or create a temporary one
                    const existingSymptom = classicalSymptoms.find(
                      (s) => s.code === extracted.symptomCode
                    );

                    if (existingSymptom) {
                      return {
                        symptomId: existingSymptom.id,
                        symptom: existingSymptom,
                        category: extracted.category,
                        location: extracted.location,
                        sensation: extracted.sensation,
                        type: extracted.category === 'modality' ? 'worse' : undefined,
                        weight: extracted.category === 'mental' ? 3 : extracted.category === 'general' ? 2 : 1,
                      };
                    } else {
                      // Create a temporary symptom object for symptoms not in database
                      const tempSymptom: ExtendedSymptom = {
                        id: extracted.symptomCode,
                        code: extracted.symptomCode,
                        name: extracted.symptomName,
                        category: extracted.category,
                        modality: 'classical_homeopathy',
                        synonyms: [],
                        is_global: true,
                        description: null,
                        doctor_id: null,
                        created_at: new Date().toISOString(),
                      };

                      return {
                        symptomId: extracted.symptomCode,
                        symptom: tempSymptom,
                        category: extracted.category,
                        location: extracted.location,
                        sensation: extracted.sensation,
                        type: extracted.category === 'modality' ? 'worse' : undefined,
                        weight: extracted.category === 'mental' ? 3 : extracted.category === 'general' ? 2 : 1,
                      };
                    }
                  });

                  // Add to selected symptoms (avoid duplicates)
                  setSelectedSymptoms((prev) => {
                    const existingIds = new Set(prev.map((s) => s.symptomId));
                    const uniqueNew = newSymptoms.filter((s) => !existingIds.has(s.symptomId));
                    const added = [...prev, ...uniqueNew];
                    return added;
                  });

                  const existingIds = new Set(selectedSymptoms.map((s) => s.symptomId));
                  const uniqueNew = newSymptoms.filter((s) => !existingIds.has(s.symptomId));
                  toast.success(`Added ${uniqueNew.length} symptoms from AI extraction`);
                }}
              />
            </div>
          )}

          {/* Manual Symptom Selection Mode */}
          {inputMode === 'manual' && (
            <>
              {/* Symptom Categories */}
              <div className="grid gap-4 lg:grid-cols-2">
                <ClassicalSymptomSelector
                  symptoms={classicalSymptoms}
                  selectedSymptoms={selectedSymptoms}
                  onAdd={handleAddSymptom}
                  onRemove={handleRemoveSymptom}
                  onUpdate={handleUpdateSymptom}
                  category="mental"
                  title="Mental Symptoms"
                  icon={<Brain className="h-5 w-5" />}
                  description="Mental state, emotions, fears, anxieties"
                />

                <ClassicalSymptomSelector
                  symptoms={classicalSymptoms}
                  selectedSymptoms={selectedSymptoms}
                  onAdd={handleAddSymptom}
                  onRemove={handleRemoveSymptom}
                  onUpdate={handleUpdateSymptom}
                  category="general"
                  title="General Symptoms"
                  icon={<Activity className="h-5 w-5" />}
                  description="General body symptoms, appetite, sleep, etc."
                />

                <ClassicalSymptomSelector
                  symptoms={classicalSymptoms}
                  selectedSymptoms={selectedSymptoms}
                  onAdd={handleAddSymptom}
                  onRemove={handleRemoveSymptom}
                  onUpdate={handleUpdateSymptom}
                  category="particular"
                  title="Particular Symptoms"
                  icon={<Target className="h-5 w-5" />}
                  description="Specific location with sensation"
                />

                <ClassicalSymptomSelector
                  symptoms={classicalSymptoms}
                  selectedSymptoms={selectedSymptoms}
                  onAdd={handleAddSymptom}
                  onRemove={handleRemoveSymptom}
                  onUpdate={handleUpdateSymptom}
                  category="modality"
                  title="Modalities"
                  icon={<TrendingUp className="h-5 w-5" />}
                  description="Better or worse conditions"
                />
              </div>
            </>
          )}
        </div>

        {/* Right: pathology tags and snapshot */}
        <div className="space-y-4">
          {/* Pathology Tags */}
          <div className="medical-card border-border/50">
            <h3 className="mb-3 font-semibold text-foreground">Pathology & diagnosis tags</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={pathologyInput}
                  onChange={(e) => setPathologyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPathologyTag();
                    }
                  }}
                  placeholder="e.g., Acute, Chronic, Respiratory, Endocrine..."
                  className="flex-1"
                />
                <Button onClick={handleAddPathologyTag} variant="outline">
                  Add
                </Button>
              </div>
              {pathologyTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pathologyTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemovePathologyTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {pathologyTags.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Tag the case as acute/chronic and add key diagnoses to guide scoring and safety filters.
                </p>
              )}
            </div>
          </div>

          {/* Case snapshot */}
          <div className="medical-card border-border/40 bg-muted/30">
            <h3 className="mb-2 text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Case snapshot
            </h3>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Mental:</span>{' '}
                {symptomCounts.mental || 0} symptom{symptomCounts.mental === 1 ? '' : 's'}
              </p>
              <p>
                <span className="font-semibold text-foreground">Generals:</span>{' '}
                {symptomCounts.general || 0} symptom{symptomCounts.general === 1 ? '' : 's'}
              </p>
              <p>
                <span className="font-semibold text-foreground">Particulars:</span>{' '}
                {symptomCounts.particular || 0} symptom{symptomCounts.particular === 1 ? '' : 's'}
              </p>
              <p>
                <span className="font-semibold text-foreground">Modalities:</span>{' '}
                {symptomCounts.modality || 0} symptom{symptomCounts.modality === 1 ? '' : 's'}
              </p>
            </div>
            {(symptomCounts.mental === 0 ||
              symptomCounts.general === 0 ||
              symptomCounts.modality === 0) && (
              <p className="mt-2 text-[11px] text-yellow-700 dark:text-yellow-400">
                Try to capture at least one strong symptom in each domain (mental, generals, modalities)
                before finalizing your remedy.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Rule Engine Analysis Progress */}
      {loading && (
          <div className="medical-card border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Classical Homeopathy Rule Engine is analyzing this case
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please wait while we process symptoms through all clinical steps
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                Step {analysisStageIndex + 1} of {analysisStages.length}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500"
                style={{
                  width: `${((analysisStageIndex + 1) / analysisStages.length) * 100}%`,
                }}
              />
            </div>

            {/* Stages list */}
            <div className="grid gap-2 md:grid-cols-2">
              {analysisStages.map((stage, index) => {
                const isActive = index === analysisStageIndex;
                const isCompleted = index < analysisStageIndex;

                return (
                  <div
                    key={stage.key}
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                      isActive
                        ? 'border-primary/50 bg-primary/5'
                        : isCompleted
                        ? 'border-blue-500/30 bg-blue-500/5'
                        : 'border-border/50 bg-muted/30'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                      ) : isActive ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          isActive
                            ? 'text-foreground'
                            : isCompleted
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {stage.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Case Analysis Actions (Step 2 & 3) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Step 2 & 3 • Completeness & questions
          </h3>
          <p className="hidden sm:block text-[11px] text-muted-foreground">
            Pehle completeness check karein, phir questions se case ko deepen karein, phir suggestions lein.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAnalyzeCompleteness}
            disabled={analyzingCompleteness || selectedSymptoms.length === 0}
            variant="outline"
            className="flex-1"
          >
            {analyzingCompleteness ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check Completeness
              </>
            )}
          </Button>
          <Button
            onClick={() => handleGenerateQuestions()}
            disabled={generatingQuestions || selectedSymptoms.length === 0}
            variant="outline"
            className="flex-1"
          >
            {generatingQuestions ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Questions
              </>
            )}
          </Button>
          <Button
            onClick={handleGenerateQuestionsBatch}
            disabled={generatingQuestions || selectedSymptoms.length === 0}
            variant="outline"
            className="flex-1"
            title="Generate questions for all missing domains at once"
          >
            {generatingQuestions ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Batch Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Case Completeness Panel */}
      {showCompleteness && completenessAnalysis && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Step 2 • Case completeness coach
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Dekhein kaun se domains strong hain aur kahaan aur depth chahiye.
            </p>
          </div>
          <CaseCompletenessPanel
            analysis={completenessAnalysis}
            onGenerateQuestions={(domain) => handleGenerateQuestions(domain)}
          />
        </div>
      )}

      {/* Smart Questions Panel */}
      {showQuestions && generatedQuestions.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Step 3 • Smart questions
            </h3>
            <span className="text-[11px] text-muted-foreground">
              {generatedQuestions.length} question
              {generatedQuestions.length === 1 ? '' : 's'} generated
            </span>
          </div>
          <SmartQuestionsPanel
            questions={generatedQuestions}
            onAnswer={handleQuestionAnswer}
            onComplete={handleQuestionsComplete}
            autoAddSymptoms={true}
            onSymptomsExtracted={(symptoms) => {
              console.log('[ClassicalHomeopathyConsultation] Symptoms extracted from answers:', symptoms);
              handleSymptomsExtracted(symptoms);
            }}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowSummary(!showSummary)}
          disabled={selectedSymptoms.length === 0}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          <FileText className="mr-2 h-4 w-4" />
          {showSummary ? 'Hide Summary' : 'Generate Summary'}
        </Button>
        <Button
          onClick={handleGetSuggestions}
          disabled={loading || selectedSymptoms.length === 0}
          className="flex-1"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get Remedy Suggestions
            </>
          )}
        </Button>
      </div>

      {/* Case Summary Panel */}
      {showSummary && selectedSymptoms.length > 0 && (
        <div className="space-y-4 border-t pt-4">
          <CaseSummaryPanel
            structuredCase={buildStructuredCase()}
            normalizedCase={buildNormalizedCase()}
            onSave={async (summary) => {
              if (!caseRecordId) {
                toast.error('Please generate remedy suggestions first to create a case record');
                return;
              }
              try {
                await classicalHomeopathyApi.saveCaseSummary(caseRecordId, summary);
                console.log('[ClassicalHomeopathyConsultation] Case summary saved:', summary);
                toast.success('Case summary saved to patient history');
              } catch (error: any) {
                console.error('Error saving case summary:', error);
                toast.error(error.message || 'Failed to save case summary');
              }
            }}
            onClose={() => setShowSummary(false)}
          />
        </div>
      )}

      {/* Remedy Suggestions & Final Remedy */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Step 4 • Remedy suggestions & analysis
            </h2>
            <p className="hidden sm:block text-xs text-muted-foreground">
              Review ranked remedies with their match scores and reasoning, then choose your final remedy.
            </p>
          </div>

          <RemedySuggestionsCard
            suggestions={suggestions}
            onSelectRemedy={handleSelectRemedy}
            selectedRemedyId={selectedRemedy?.remedy.id}
          />

          {/* Final Remedy Selection */}
          {selectedRemedy && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Step 5 • Finalize remedy & create prescription
                </h2>
                <p className="hidden sm:block text-xs text-muted-foreground">
                  Adjust potency and repetition as per your clinical judgment before saving.
                </p>
              </div>

              <div className="medical-card border-primary/20 bg-primary/5">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Remedy</Label>
                    <div className="rounded-lg border border-border/50 bg-background p-3">
                      <div className="font-medium text-foreground">
                        {selectedRemedy.remedy.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Match Score: {selectedRemedy.matchScore.toFixed(1)}% •{' '}
                        {selectedRemedy.confidence} confidence
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="potency">Potency *</Label>
                      <Select
                        value={finalRemedy.potency}
                        onValueChange={(value) =>
                          setFinalRemedy({ ...finalRemedy, potency: value })
                        }
                      >
                        <SelectTrigger id="potency">
                          <SelectValue placeholder="Select potency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6C">6C</SelectItem>
                          <SelectItem value="30C">30C</SelectItem>
                          <SelectItem value="200C">200C</SelectItem>
                          <SelectItem value="1M">1M</SelectItem>
                          <SelectItem value="10M">10M</SelectItem>
                        </SelectContent>
                      </Select>
                      {finalRemedy.rationale && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Suggested based on case: {finalRemedy.rationale}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="repetition">Repetition *</Label>
                      <Select
                        value={finalRemedy.repetition}
                        onValueChange={(value) =>
                          setFinalRemedy({ ...finalRemedy, repetition: value })
                        }
                      >
                        <SelectTrigger id="repetition">
                          <SelectValue placeholder="Select repetition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OD">OD (Once Daily)</SelectItem>
                          <SelectItem value="BD">BD (Twice Daily)</SelectItem>
                          <SelectItem value="TDS">TDS (Thrice Daily)</SelectItem>
                          <SelectItem value="QID">QID (Four Times Daily)</SelectItem>
                          <SelectItem value="SOS">SOS (As Needed)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={finalRemedy.notes}
                      onChange={(e) =>
                        setFinalRemedy({ ...finalRemedy, notes: e.target.value })
                      }
                      placeholder="Additional notes about this remedy selection..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleSaveDecision}
                    disabled={loading || !finalRemedy.potency || !finalRemedy.repetition}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Remedy Decision
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
