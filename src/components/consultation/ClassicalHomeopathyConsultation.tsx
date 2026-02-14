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
  Search,
  X,
  MoreVertical,
  BookOpen,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { ClassicalSymptomSelector } from './ClassicalSymptomSelector';
import { RemedySuggestionsCard } from './RemedySuggestionsCard';
import { AICaseInput } from './AICaseInput';
import { MetaAttributesDisplay } from './MetaAttributesDisplay';
import { ExtractedEntitiesList } from './ExtractedEntitiesList';
import { ExtractedModalitiesList } from './ExtractedModalitiesList';
import { ExtractedSymptomsList } from './ExtractedSymptomsList';
import { RubricSelector } from './RubricSelector';
import { CaseCompletenessPanel } from './CaseCompletenessPanel';
import { SmartQuestionsPanel } from './SmartQuestionsPanel';
import { CaseSummaryPanel } from './CaseSummaryPanel';
import { classicalHomeopathyApi, StructuredCaseInput, RemedySuggestion } from '@/lib/api/classicalHomeopathy.api';
import { Symptom } from '@/hooks/useSymptoms';
import { useApiError } from '@/hooks/useApiError';
import { ExtractedSymptom, RubricSuggestion, ExtractionResult, ExtractedEntity, ExtractedModality, MetaAttributes, extractSymptoms, analyzeCompleteness, generateQuestions, generateQuestionsBatch, CompletenessAnalysis, Question, suggestRubrics } from '@/lib/api/aiCaseTaking.api';
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
import { Slider } from '@/components/ui/slider';

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
  /** User-confirmed rubric IDs from book icon (used for remedy suggestion when present) */
  selectedRubricIds?: string[];
}

interface ClassicalHomeopathyConsultationProps {
  patientId: string;
  symptoms: ExtendedSymptom[];
  onCaseRecordCreated?: (caseRecordId: string) => void;
  onPrescriptionCreated?: (prescriptionId: string) => void;
  /** Initial case-taking mode when opened from mode selection screen */
  initialInputMode?: 'manual' | 'ai';
}

export function ClassicalHomeopathyConsultation({
  patientId,
  symptoms,
  onCaseRecordCreated,
  onPrescriptionCreated,
  initialInputMode = 'manual',
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
  const [inputMode, setInputMode] = useState<'manual' | 'ai'>(initialInputMode);
  const [manualSection, setManualSection] = useState<'mind' | 'generals' | 'particular' | 'modality'>('mind');
  const [symptomSearchManual, setSymptomSearchManual] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [aiNarrativeText, setAiNarrativeText] = useState('');
  /** Last extraction result for AI Interpretation panel (matched symptoms + rubrics) */
  const [lastExtractedSymptoms, setLastExtractedSymptoms] = useState<ExtractedSymptom[]>([]);
  /** Full extraction result for middle column (meta, entities, modalities, symptoms) */
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [useNLP, setUseNLP] = useState(true);
  const [showRubricSelector, setShowRubricSelector] = useState(false);
  const [selectedSymptomForRubrics, setSelectedSymptomForRubrics] = useState<ExtractedSymptom | null>(null);
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
      // Use user-confirmed rubrics (from book icon) where available
      let selectedRubricIds = Array.from(
        new Set(selectedSymptoms.flatMap((s) => s.selectedRubricIds ?? []))
      );
      // If any symptoms have no rubrics (e.g. added without opening book), fetch suggested rubrics by name so we don't get "No rubric found"
      const symptomsWithoutRubrics = selectedSymptoms.filter((s) => !(s.selectedRubricIds?.length));
      if (symptomsWithoutRubrics.length > 0) {
        const suggestedIds: string[] = [];
        for (const s of symptomsWithoutRubrics) {
          try {
            const { rubrics } = await suggestRubrics({
              symptom: { symptomName: s.symptom.name, category: s.category },
            });
            const top = (rubrics || []).slice(0, 3).map((r) => r.rubricId);
            suggestedIds.push(...top);
          } catch (_) {
            // ignore per-symptom failure
          }
        }
        selectedRubricIds = Array.from(new Set([...selectedRubricIds, ...suggestedIds]));
      }
      // Fetch patient remedy history (past case records) so repetition/contradiction engine can use it
      let patientHistory: Array<{ remedyId: string; date: string }> | undefined;
      try {
        const caseRes = await classicalHomeopathyApi.getPatientCaseRecords(patientId);
        if (caseRes.success && caseRes.data?.caseRecords?.length) {
          patientHistory = caseRes.data.caseRecords
            .filter((r: { finalRemedy?: { remedyId: string } | null }) => r.finalRemedy?.remedyId)
            .map((r: any) => ({
              remedyId: r.finalRemedy.remedyId,
              date: (r.updatedAt || r.createdAt || new Date().toISOString()).toString(),
            }));
        }
      } catch (_) {
        // proceed without history
      }

      const response = await classicalHomeopathyApi.suggestRemedies(
        patientId,
        structuredCase,
        patientHistory,
        selectedRubricIds.length > 0 ? selectedRubricIds : undefined
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

  /** Add extracted symptoms (from AI Interpretation / left panel) to Case Structure and clear interpretation panel */
  const addExtractedToCase = (extractedSymptoms: ExtractedSymptom[]) => {
    if (!extractedSymptoms?.length) return;
    const newSymptoms: SelectedSymptom[] = extractedSymptoms.map((extracted) => {
      const selectedRubricIds = extracted.selectedRubrics?.map((r) => r.rubricId) ?? [];
      const existingSymptom = classicalSymptoms.find((s) => s.code === extracted.symptomCode);
      if (existingSymptom) {
        return {
          symptomId: existingSymptom.id,
          symptom: existingSymptom,
          category: extracted.category,
          location: extracted.location,
          sensation: extracted.sensation,
          type: extracted.category === 'modality' ? 'worse' : undefined,
          weight: extracted.category === 'mental' ? 3 : extracted.category === 'general' ? 2 : 1,
          ...(selectedRubricIds.length > 0 && { selectedRubricIds }),
        };
      }
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
        ...(selectedRubricIds.length > 0 && { selectedRubricIds }),
      };
    });
    setSelectedSymptoms((prev) => {
      const existingIds = new Set(prev.map((s) => s.symptomId));
      const uniqueNew = newSymptoms.filter((s) => !existingIds.has(s.symptomId));
      toast.success(`Added ${uniqueNew.length} symptoms to Case Structure`);
      return [...prev, ...uniqueNew];
    });
    setLastExtractedSymptoms([]);
  };

  /** Run extraction from narrative (used when narrativeOnly AICaseInput calls onExtractRequest) */
  const handleExtractFromNarrative = async () => {
    const text = (aiNarrativeText || '').trim();
    if (!text) {
      toast.error('Please enter some text to extract symptoms from');
      return;
    }
    setExtracting(true);
    setExtractionResult(null);
    setLastExtractedSymptoms([]);
    try {
      const result = await extractSymptoms({ text, language: 'en', useNLP });
      setExtractionResult(result);
      setLastExtractedSymptoms(result.symptoms);
      const methodLabel = result.extractionMethod === 'nlp' ? 'AI (NLP)' : 'Keyword';
      toast.success(`Extracted ${result.symptoms.length} symptoms using ${methodLabel} (${result.overallConfidence}% confidence)`);
    } catch (error: any) {
      if ((error.message || '').includes('timeout') && useNLP) {
        toast.error('NLP timed out. Trying keyword extraction...', { duration: 5000 });
        try {
          const keywordResult = await extractSymptoms({ text, language: 'en', useNLP: false });
          setExtractionResult(keywordResult);
          setLastExtractedSymptoms(keywordResult.symptoms);
          toast.success(`Extracted ${keywordResult.symptoms.length} symptoms using Keyword extraction`);
        } catch (fallbackErr: any) {
          toast.error(fallbackErr.message || 'Extraction failed');
        }
      } else {
        toast.error(error.message || 'Failed to extract symptoms');
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirmSymptomExtracted = (symptom: ExtractedSymptom) => {
    const withRubrics = { ...symptom, selectedRubrics: symptom.selectedRubrics ?? [] };
    addExtractedToCase([withRubrics]);
    setExtractionResult((prev) => prev ? { ...prev, symptoms: prev.symptoms.filter((s) => s.symptomCode !== symptom.symptomCode) } : null);
    setLastExtractedSymptoms((prev) => prev.filter((s) => s.symptomCode !== symptom.symptomCode));
  };

  const handleRejectSymptomExtracted = (symptom: ExtractedSymptom) => {
    setExtractionResult((prev) => prev ? { ...prev, symptoms: prev.symptoms.filter((s) => s.symptomCode !== symptom.symptomCode) } : null);
    setLastExtractedSymptoms((prev) => prev.filter((s) => s.symptomCode !== symptom.symptomCode));
  };

  const handleUpdateSymptomExtracted = (symptom: ExtractedSymptom, updates: Partial<ExtractedSymptom>) => {
    setExtractionResult((prev) => prev ? {
      ...prev,
      symptoms: prev.symptoms.map((s) => s.symptomCode === symptom.symptomCode ? { ...s, ...updates } : s),
    } : null);
    setLastExtractedSymptoms((prev) => prev.map((s) => s.symptomCode === symptom.symptomCode ? { ...s, ...updates } : s));
  };

  const handleConfirmAllExtracted = () => {
    if (!extractionResult?.symptoms?.length) return;
    const withRubrics = extractionResult.symptoms.map((s) => ({ ...s, selectedRubrics: s.selectedRubrics ?? [] }));
    addExtractedToCase(withRubrics);
    setExtractionResult(null);
    setLastExtractedSymptoms([]);
    toast.success('All symptoms added to Case Structure');
  };

  const handleRejectAllExtracted = () => {
    setExtractionResult(null);
    setLastExtractedSymptoms([]);
    toast.info('Rejected all extracted symptoms');
  };

  const handleSuggestRubricsExtracted = (symptom: ExtractedSymptom) => {
    setSelectedSymptomForRubrics(symptom);
    setShowRubricSelector(true);
  };

  const handleRubricsSelectedExtracted = (selected: RubricSuggestion[]) => {
    if (!selectedSymptomForRubrics || selected.length === 0) {
      setShowRubricSelector(false);
      setSelectedSymptomForRubrics(null);
      return;
    }
    const code = selectedSymptomForRubrics.symptomCode;
    setExtractionResult((prev) => prev ? {
      ...prev,
      symptoms: prev.symptoms.map((s) => s.symptomCode === code ? { ...s, selectedRubrics: selected } : s),
    } : null);
    setLastExtractedSymptoms((prev) => prev.map((s) => s.symptomCode === code ? { ...s, selectedRubrics: selected } : s));
    toast.success(`Saved ${selected.length} rubric(s) for "${selectedSymptomForRubrics.symptomName}"`);
    setShowRubricSelector(false);
    setSelectedSymptomForRubrics(null);
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
      {/* Sticky header: workspace title + step indicator + mode toggle */}
      <div className="sticky top-0 z-20 -mx-2 px-2 py-2 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm space-y-3">
        {/* Workspace header - reference style */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {inputMode === 'manual' ? 'Classical mode' : 'AI-Enhanced'}
              </p>
              <h1 className="text-base font-semibold text-foreground">
                {inputMode === 'manual' ? 'Manual case taking' : 'Clinical workspace'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {selectedSymptoms.length} {selectedSymptoms.length === 1 ? 'symptom' : 'symptoms'} in case
            </Badge>
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

        {/* Mode toggle - always visible */}
        <div className="flex items-center justify-end gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-2">
        <span className="text-xs text-muted-foreground mr-2">Case entry:</span>
        <div className="flex rounded-lg border border-border/50 bg-background p-0.5">
          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              inputMode === 'manual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="h-4 w-4" />
            Manual
          </button>
          <button
            type="button"
            onClick={() => setInputMode('ai')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              inputMode === 'ai' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Sparkles className="h-4 w-4" />
            AI-Enhanced
          </button>
        </div>
      </div>
      </div>

      {/* AI-Enhanced: Four-panel workspace (Narrative | Extracted | AI Interpretation | Case Structure) */}
      {inputMode === 'ai' && (
        <div className="grid gap-2 lg:grid-cols-[1fr_1.2fr_1fr_200px] rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm min-h-[520px]">
          {/* Col 1: Patient Narrative */}
          <div className="flex flex-col border-r border-border/50 bg-muted/10 min-h-0">
            <div className="flex items-center gap-2 p-3 border-b border-border/50">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground uppercase tracking-wide text-xs">Patient Narrative</h3>
            </div>
            <div className="p-3 flex-1 min-h-0 overflow-auto">
              <AICaseInput
                narrativeValue={aiNarrativeText}
                onNarrativeChange={setAiNarrativeText}
                onExtractRequest={handleExtractFromNarrative}
                extracting={extracting}
                narrativeOnly
                useNLP={useNLP}
                onUseNLPChange={setUseNLP}
              />
            </div>
          </div>

          {/* Col 2: Extracted result (meta, entities, modalities, symptoms) */}
          <div className="flex flex-col border-r border-border/50 bg-muted/5 min-h-0">
            <div className="flex items-center gap-2 p-3 border-b border-border/50">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground uppercase tracking-wide text-xs">Extracted</h3>
            </div>
            <div className="p-3 flex-1 overflow-auto space-y-3">
              {!extractionResult && !extracting && (
                <p className="text-[11px] text-muted-foreground">Enter narrative on the left and click Extract. Results appear here.</p>
              )}
              {extractionResult?.metaAttributes && (
                <MetaAttributesDisplay metaAttributes={extractionResult.metaAttributes} />
              )}
              {extractionResult?.entities && extractionResult.entities.length > 0 && (
                <ExtractedEntitiesList entities={extractionResult.entities} />
              )}
              {extractionResult?.modalities && extractionResult.modalities.length > 0 && (
                <ExtractedModalitiesList modalities={extractionResult.modalities} />
              )}
              {extractionResult?.symptoms && extractionResult.symptoms.length > 0 && (
                <ExtractedSymptomsList
                  symptoms={extractionResult.symptoms}
                  onConfirm={handleConfirmSymptomExtracted}
                  onReject={handleRejectSymptomExtracted}
                  onUpdate={handleUpdateSymptomExtracted}
                  onConfirmAll={handleConfirmAllExtracted}
                  onRejectAll={handleRejectAllExtracted}
                  onSuggestRubrics={handleSuggestRubricsExtracted}
                />
              )}
            </div>
          </div>

          {/* Col 3: AI Interpretation (matched symptoms + rubrics, Add to Case) */}
          <div className="flex flex-col border-r border-border/50 bg-muted/5 min-h-0">
            <div className="flex items-center gap-2 p-3 border-b border-border/50">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground uppercase tracking-wide text-xs">AI Interpretation</h3>
            </div>
            <div className="p-3 flex-1 overflow-auto space-y-3">
              {lastExtractedSymptoms.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Matched symptoms and rubrics appear here after extraction. Use &quot;Add all to Case Structure&quot; to add them.</p>
              ) : (
                <>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <p className="text-[10px] font-medium text-primary mb-1">Matched symptoms ({lastExtractedSymptoms.length})</p>
                    <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                      {lastExtractedSymptoms.map((s) => (
                        <li key={s.symptomCode} className="text-[10px] flex justify-between gap-1">
                          <span className="truncate">{s.symptomName}</span>
                          <span className="text-muted-foreground shrink-0">{s.category}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
                    <p className="text-[10px] font-medium text-primary mb-1">Matched rubrics</p>
                    {(() => {
                      const allRubrics: RubricSuggestion[] = [];
                      lastExtractedSymptoms.forEach((s) => s.selectedRubrics?.forEach((r) => allRubrics.push(r)));
                      if (allRubrics.length === 0) {
                        return <p className="text-[10px] text-muted-foreground">Select rubrics (book icon) in Extracted column.</p>;
                      }
                      return (
                        <ul className="space-y-0.5 max-h-20 overflow-y-auto text-[10px]">
                          {allRubrics.map((r, i) => (
                            <li key={`${r.rubricId}-${i}`}>{r.rubricText}</li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                  <Button type="button" size="sm" onClick={() => addExtractedToCase(lastExtractedSymptoms)} className="w-full gap-1 h-8 text-xs">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Add all to Case Structure
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Col 4: Case Structure (compact) */}
          <div className="flex flex-col bg-muted/5 min-h-0">
            <div className="flex items-center gap-1.5 p-2 border-b border-border/50">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              <h3 className="font-semibold text-foreground uppercase tracking-wide text-[10px]">Case Structure</h3>
            </div>
            <div className="p-2 flex-1 space-y-2 overflow-auto">
              <p className="text-[10px] text-muted-foreground">…{patientId.slice(-6)}</p>
              {(['mental', 'general', 'particular', 'modality'] as const).map((cat) => {
                const list = selectedSymptoms.filter((s) => s.category === cat);
                if (list.length === 0) return null;
                const label = cat === 'mental' ? 'MIND' : cat === 'general' ? 'GEN' : cat === 'particular' ? 'PART' : 'MOD';
                return (
                  <div key={cat} className="rounded border border-border/40 bg-muted/20 p-1.5">
                    <p className="text-[9px] font-semibold uppercase text-muted-foreground mb-1">{label} ({list.length})</p>
                    <ul className="space-y-0.5">
                      {list.map((s) => (
                        <li key={s.symptomId} className="flex items-center justify-between text-[10px]">
                          <span className="truncate">{s.symptom.name}</span>
                          <span className="text-muted-foreground shrink-0">{s.weight ?? 0}/5</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {selectedSymptoms.length === 0 && (
                <p className="text-[10px] text-muted-foreground">No symptoms yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rubric selector modal (for Extracted column book icon) */}
      {showRubricSelector && selectedSymptomForRubrics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <RubricSelector
              symptom={selectedSymptomForRubrics}
              onRubricsSelected={handleRubricsSelectedExtracted}
              onClose={() => { setShowRubricSelector(false); setSelectedSymptomForRubrics(null); }}
            />
          </div>
        </div>
      )}

      {/* AI verification note */}
      {inputMode === 'ai' && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          AI-generated suggestions must be clinically verified and approved before finalizing treatment.
        </p>
      )}

      {/* Manual Case: Reference-style workspace (sidebar + active rubrics + case summary) */}
      {inputMode === 'manual' && (
        <div className="grid gap-0 lg:grid-cols-[200px_1fr_280px] rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm min-h-[520px]">
          {/* Left: Repertory sections */}
          <div className="border-r border-border/50 bg-muted/20 py-4">
            <p className="px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Repertory sections</p>
            <nav className="space-y-0.5">
              {[
                { key: 'mind' as const, label: 'Mind', icon: Brain },
                { key: 'generals' as const, label: 'Generals', icon: Activity },
                { key: 'particular' as const, label: 'Particulars', icon: Target },
                { key: 'modality' as const, label: 'Modalities', icon: TrendingUp },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setManualSection(key)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors',
                    manualSection === key ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Center: Search, Active rubrics, Add form */}
          <div className="flex flex-col min-h-0">
            <div className="p-4 border-b border-border/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rubrics (e.g. Anxiety, Fever, worse morning)..."
                  value={symptomSearchManual}
                  onChange={(e) => setSymptomSearchManual(e.target.value)}
                  className="pl-9 bg-muted/30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hidden sm:inline">Ctrl+K</span>
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Active rubrics
                </h4>
                <Badge variant="secondary" className="text-[11px]">{selectedSymptoms.length} selected</Badge>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {selectedSymptoms.length > 0 && (
                <div className="space-y-2">
                  {selectedSymptoms.map((s) => (
                    <div
                      key={s.symptomId}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.symptom.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{s.category}</p>
                      </div>
                      <div className="flex items-center gap-2 w-28">
                        <span className="text-[10px] text-muted-foreground w-5">{(s.weight ?? 1).toString()}</span>
                        <Slider
                          value={[s.weight ?? 1]}
                          onValueChange={([v]) => handleUpdateSymptom(s.symptomId, { weight: v })}
                          min={1}
                          max={5}
                          step={1}
                          className="flex-1"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(s.symptomId)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-semibold text-foreground mb-3">Add from repertory</p>
                {manualSection === 'mind' && (
                  <ClassicalSymptomSelector symptoms={classicalSymptoms} selectedSymptoms={selectedSymptoms} onAdd={handleAddSymptom} onRemove={handleRemoveSymptom} onUpdate={handleUpdateSymptom} category="mental" title="Mental" icon={<Brain className="h-5 w-5" />} description="Mental state, emotions, fears" searchQuery={symptomSearchManual} />
                )}
                {manualSection === 'generals' && (
                  <ClassicalSymptomSelector symptoms={classicalSymptoms} selectedSymptoms={selectedSymptoms} onAdd={handleAddSymptom} onRemove={handleRemoveSymptom} onUpdate={handleUpdateSymptom} category="general" title="Generals" icon={<Activity className="h-5 w-5" />} description="General body symptoms" searchQuery={symptomSearchManual} />
                )}
                {manualSection === 'particular' && (
                  <ClassicalSymptomSelector symptoms={classicalSymptoms} selectedSymptoms={selectedSymptoms} onAdd={handleAddSymptom} onRemove={handleRemoveSymptom} onUpdate={handleUpdateSymptom} category="particular" title="Particulars" icon={<Target className="h-5 w-5" />} description="Location & sensation" searchQuery={symptomSearchManual} />
                )}
                {manualSection === 'modality' && (
                  <ClassicalSymptomSelector symptoms={classicalSymptoms} selectedSymptoms={selectedSymptoms} onAdd={handleAddSymptom} onRemove={handleRemoveSymptom} onUpdate={handleUpdateSymptom} category="modality" title="Modalities" icon={<TrendingUp className="h-5 w-5" />} description="Better / worse" searchQuery={symptomSearchManual} />
                )}
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">Clinical observations</p>
                <Textarea
                  placeholder="Type clinical notes here... (e.g. improved sleep but persistent morning fatigue)"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={3}
                  className="text-xs resize-none bg-background"
                />
              </div>
            </div>
          </div>

          {/* Right: Case summary + pathology */}
          <div className="border-l border-border/50 bg-muted/10 flex flex-col">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Case summary</h4>
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="p-4 flex-1 overflow-auto space-y-4">
              <div className="space-y-2">
                {(['mental', 'general', 'particular', 'modality'] as const).map((cat) => {
                  const list = selectedSymptoms.filter((s) => s.category === cat);
                  if (list.length === 0) return null;
                  const label = cat === 'mental' ? 'MIND' : cat === 'general' ? 'GENERALS' : cat === 'particular' ? 'PARTICULARS' : 'MODALITIES';
                  return (
                    <div key={cat} className="rounded-lg border border-border/40 bg-background/50 p-2.5">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">{label} ({list.length})</p>
                      <ul className="space-y-1">
                        {list.map((s) => (
                          <li key={s.symptomId} className="flex items-center justify-between text-[11px]">
                            <span className="text-foreground truncate flex-1">{s.symptom.name}</span>
                            <span className="text-primary font-medium ml-1">{(s.weight ?? 0)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
              {selectedSymptoms.length === 0 && (
                <p className="text-xs text-muted-foreground">No symptoms yet. Use the repertory sections to add rubrics.</p>
              )}
              <div className="pt-3 border-t border-border/50">
                <h4 className="text-xs font-semibold text-foreground mb-2">Pathology & diagnosis tags</h4>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    value={pathologyInput}
                    onChange={(e) => setPathologyInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPathologyTag(); } }}
                    placeholder="e.g. Acute, Chronic"
                    className="h-8 text-xs flex-1 min-w-0"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddPathologyTag}>Add</Button>
                </div>
                {pathologyTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pathologyTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => handleRemovePathologyTag(tag)} className="hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rule Engine Analysis Progress - Full-screen overlay modal */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="medical-card border-primary/20 bg-card bg-gradient-to-br from-primary/5 via-background to-background shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Classical Homeopathy Rule Engine is analyzing this case
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process symptoms through all clinical steps
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm bg-primary/10 text-primary border-primary/20 shrink-0">
                Step {analysisStageIndex + 1} of {analysisStages.length}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500"
                style={{
                  width: `${((analysisStageIndex + 1) / analysisStages.length) * 100}%`,
                }}
              />
            </div>

            {/* Stages list */}
            <div className="grid gap-3 sm:grid-cols-2">
              {analysisStages.map((stage, index) => {
                const isActive = index === analysisStageIndex;
                const isCompleted = index < analysisStageIndex;

                return (
                  <div
                    key={stage.key}
                    className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
                      isActive
                        ? 'border-primary/50 bg-primary/5'
                        : isCompleted
                        ? 'border-blue-500/30 bg-blue-500/5'
                        : 'border-border/50 bg-muted/30'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          isActive
                            ? 'text-foreground'
                            : isCompleted
                            ? 'text-blue-700 dark:text-blue-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {stage.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Case Analysis Actions (Step 2 & 3) – sticky bar, sticks below main header */}
      <div className="sticky top-44 z-10 -mx-2 px-2 py-3 bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 shrink-0">
            <TrendingUp className="h-4 w-4 text-primary" />
            Step 2 & 3 • Completeness & questions
          </h3>
          <p className="hidden sm:block text-[11px] text-muted-foreground truncate">
            Pehle completeness check karein, phir questions se case ko deepen karein, phir suggestions lein.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleAnalyzeCompleteness}
            disabled={analyzingCompleteness || selectedSymptoms.length === 0}
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px] h-10 font-medium border-2 hover:bg-primary/10 hover:border-primary/30 transition-colors"
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
            size="sm"
            className="flex-1 min-w-[120px] h-10 font-medium border-2 hover:bg-primary/10 hover:border-primary/30 transition-colors"
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
            size="sm"
            title="Generate questions for all missing domains at once"
            className="flex-1 min-w-[120px] h-10 font-medium border-2 hover:bg-primary/10 hover:border-primary/30 transition-colors"
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
        <div className="pt-2 border-t border-border/50 flex flex-wrap gap-2">
          <Button
            onClick={() => setShowSummary(!showSummary)}
            disabled={selectedSymptoms.length === 0}
            variant="outline"
            size="default"
            className="flex-1 min-w-[140px] h-11 font-medium border-2 hover:bg-primary/10 hover:border-primary/30 transition-colors"
          >
            <FileText className="mr-2 h-4 w-4" />
            {showSummary ? 'Hide Summary' : 'Generate Summary'}
          </Button>
          <Button
            onClick={handleGetSuggestions}
            disabled={loading || selectedSymptoms.length === 0}
            size="default"
            className="flex-1 min-w-[180px] h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
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
                    <div className={cn('rounded-lg border-2 p-3 transition-colors', !finalRemedy.potency ? 'border-red-500 bg-red-500/5' : 'border-border/50 bg-muted/20')}>
                      <Label htmlFor="potency" className={cn('font-medium', !finalRemedy.potency && 'text-red-600 dark:text-red-400')}>
                        Potency *
                      </Label>
                      <Select
                        value={finalRemedy.potency}
                        onValueChange={(value) =>
                          setFinalRemedy({ ...finalRemedy, potency: value })
                        }
                      >
                        <SelectTrigger id="potency" className={cn('mt-1.5', !finalRemedy.potency && 'border-red-400 focus:ring-red-500')}>
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
                      {!finalRemedy.potency && (
                        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                          Required: choose potency before saving.
                        </p>
                      )}
                      {finalRemedy.potency && finalRemedy.rationale && (
                        <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400 font-medium">
                          Suggested based on case: {finalRemedy.rationale}
                        </p>
                      )}
                    </div>

                    <div className={cn('rounded-lg border-2 p-3 transition-colors', !finalRemedy.repetition ? 'border-red-500 bg-red-500/5' : 'border-border/50 bg-muted/20')}>
                      <Label htmlFor="repetition" className={cn('font-medium', !finalRemedy.repetition && 'text-red-600 dark:text-red-400')}>
                        Repetition *
                      </Label>
                      <select
                        id="repetition"
                        value={finalRemedy.repetition}
                        onChange={(e) =>
                          setFinalRemedy({ ...finalRemedy, repetition: e.target.value })
                        }
                        className={cn(
                          'mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                          !finalRemedy.repetition && 'border-red-400 focus:ring-red-500 text-muted-foreground'
                        )}
                      >
                        <option value="" disabled>
                          Select repetition
                        </option>
                        <option value="OD">OD (Once Daily)</option>
                        <option value="BD">BD (Twice Daily)</option>
                        <option value="TDS">TDS (Thrice Daily)</option>
                        <option value="QID">QID (Four Times Daily)</option>
                        <option value="SOS">SOS (As Needed)</option>
                      </select>
                      {!finalRemedy.repetition && (
                        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                          Required: choose repetition before saving.
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Select potency and repetition as per your clinical judgment.
                  </p>

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
