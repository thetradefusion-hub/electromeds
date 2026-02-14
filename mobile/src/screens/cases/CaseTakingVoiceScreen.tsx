import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { layout } from "../../theme/layout";
import { Card } from "../../components/ui/Card";
import {
  StructuredCaseInput,
  SuggestionResponse,
  fetchPatientCaseRecords,
} from "../../api/classicalHomeopathy";
import {
  extractSymptoms,
  ExtractedSymptom,
  ExtractionResult,
  suggestRubrics,
  type RubricSuggestion,
  transcribeAudio,
} from "../../api/aiCaseTaking";
import { useRuleEngineModal } from "../../context/RuleEngineModalContext";

type CaseTakingVoiceParams = {
  patientId?: string;
  patientName?: string;
};

type AISymptom = ExtractedSymptom & {
  accepted: boolean;
  importance: number; // 1-5
  srp: boolean; // Strange, Rare, Peculiar
};

type CaseStructureItem = {
  id: string;
  type: "mental" | "general" | "particular" | "modality";
  symptomText: string;
  weight: number;
  rubricId?: string;
  isRare?: boolean;
  location?: string;
  sensation?: string;
  modalityType?: "better" | "worse";
};

const CATEGORY_LABELS: Record<string, string> = {
  mental: "Mental",
  general: "General",
  particular: "Particular",
  modality: "Modalities",
};

const mockSymptomsFromNarrative: AISymptom[] = [
  { symptomCode: "m1", symptomName: "Fear of dark", category: "mental", confidence: "high", accepted: true, importance: 3, srp: false },
  { symptomCode: "m2", symptomName: "Worse at night", category: "modality", confidence: "high", type: "worse", accepted: true, importance: 3, srp: false },
  { symptomCode: "m3", symptomName: "Restlessness", category: "mental", confidence: "medium", accepted: true, importance: 2, srp: false },
  { symptomCode: "m4", symptomName: "Better with light", category: "modality", confidence: "medium", type: "better", accepted: true, importance: 2, srp: false },
];

function showAlert(title: string, message: string, onConfirm?: () => void) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm?.();
    return;
  }
  Alert.alert(title, message, onConfirm ? [{ text: "OK", onPress: onConfirm }] : undefined);
}

const isWeb = Platform.OS === "web";

export default function CaseTakingVoiceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, CaseTakingVoiceParams>, string>>();
  const params = route.params ?? {};
  const patientId = params.patientId;
  const patientName = params.patientName ?? "Patient";

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [narrativeText, setNarrativeText] = useState("");
  const [aiSymptoms, setAiSymptoms] = useState<AISymptom[]>([]);
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pathologyTags] = useState<string[]>([]); // Kept for API compatibility, always empty
  const [useNLP, setUseNLP] = useState(true);
  const [caseStructureItems, setCaseStructureItems] = useState<CaseStructureItem[]>([]);
  const [matchedRubrics, setMatchedRubrics] = useState<RubricSuggestion[]>([]);
  const [matchedRubricsSource, setMatchedRubricsSource] = useState<string | null>(null);
  const [loadingRubricsFor, setLoadingRubricsFor] = useState<string | null>(null);
  const [selectedRubricIds, setSelectedRubricIds] = useState<Set<string>>(new Set());
  const caseStructureIdRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { openRuleEngineModal } = useRuleEngineModal();

  // Recording time counter
  useEffect(() => {
    if (isRecording && !isTranscribing) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording, isTranscribing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);


  const setSymptomImportance = (code: string, value: number) => {
    setAiSymptoms((prev) => prev.map((s) => (s.symptomCode === code ? { ...s, importance: Math.max(1, Math.min(5, value)) } : s)));
  };
  const setSymptomSrp = (code: string, value: boolean) => {
    setAiSymptoms((prev) => prev.map((s) => (s.symptomCode === code ? { ...s, srp: value } : s)));
  };

  const fetchRubricsForSymptom = async (symptom: AISymptom) => {
    setLoadingRubricsFor(symptom.symptomCode);
    setMatchedRubricsSource(symptom.symptomName);
    try {
      const { rubrics, rareRubrics } = await suggestRubrics({
        symptom: {
          symptomCode: symptom.symptomCode,
          symptomName: symptom.symptomName,
          category: symptom.category,
          location: symptom.location,
          sensation: symptom.sensation,
        },
      });
      setMatchedRubrics([...rubrics, ...rareRubrics]);
      setSelectedRubricIds(new Set());
    } catch (e) {
      console.warn("Suggest rubrics failed", e);
      setMatchedRubrics([]);
      showAlert("Error", "Could not fetch rubrics. Check backend.");
    } finally {
      setLoadingRubricsFor(null);
    }
  };

  const toggleRubricSelection = (rubricId: string) => {
    setSelectedRubricIds((prev) => {
      const next = new Set(prev);
      if (next.has(rubricId)) next.delete(rubricId);
      else next.add(rubricId);
      return next;
    });
  };

  const addMatchedRubricsToCaseStructure = () => {
    const toAdd = matchedRubrics.filter((r) => selectedRubricIds.has(r.rubricId));
    const category = "general" as const;
    const newItems: CaseStructureItem[] = toAdd.map((r) => {
      caseStructureIdRef.current += 1;
      const weight = r.confidence === "exact" || r.confidence === "high" ? 3 : r.confidence === "medium" ? 2 : 1;
      return {
        id: `cs_${caseStructureIdRef.current}`,
        type: category,
        symptomText: r.rubricText,
        weight,
        rubricId: r.rubricId,
        isRare: r.isRare,
      };
    });
    setCaseStructureItems((prev) => [...prev, ...newItems]);
    setMatchedRubrics([]);
    setMatchedRubricsSource(null);
    setSelectedRubricIds(new Set());
  };

  const removeCaseStructureItem = (id: string) => {
    setCaseStructureItems((prev) => prev.filter((i) => i.id !== id));
  };

  const selectAllSymptoms = () => {
    setAiSymptoms((prev) => prev.map((s) => ({ ...s, accepted: true })));
  };
  const deselectAllSymptoms = () => {
    setAiSymptoms((prev) => prev.map((s) => ({ ...s, accepted: false })));
  };

  const clearNarrative = () => {
    setNarrativeText("");
    setRecordingTime(0);
  };

  // Start recording with MediaRecorder (web) or native audio recorder
  const startRecording = async () => {
    if (!isWeb) {
      showAlert("Not Supported", "Audio recording is currently only supported on web. Native support coming soon.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (audioChunksRef.current.length === 0) {
          setIsRecording(false);
          setRecordingTime(0);
          showAlert("No Audio", "No audio was recorded. Please try again.");
          return;
        }

        // Transcribe with Whisper
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setIsTranscribing(true);
        setRecordingTime(0);

        try {
          const { text } = await transcribeAudio(audioBlob, "en-US");
          setNarrativeText((prev) => (prev ? `${prev} ${text}` : text));
          showAlert("Transcription Complete", "Audio has been transcribed successfully.");
        } catch (error: any) {
          console.error("Transcription error:", error);
          showAlert("Transcription Failed", error.message || "Could not transcribe audio. Please try again.");
        } finally {
          setIsTranscribing(false);
          setIsRecording(false);
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error: any) {
      console.error("Recording error:", error);
      showAlert("Recording Failed", error.message || "Could not start recording. Please check microphone permissions.");
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleSymptom = (code: string) => {
    setAiSymptoms((prev) =>
      prev.map((s) => (s.symptomCode === code ? { ...s, accepted: !s.accepted } : s))
    );
  };

  const removeSymptom = (code: string) => {
    setAiSymptoms((prev) => prev.filter((s) => s.symptomCode !== code));
  };

  const handleProcessAI = async () => {
    const text = narrativeText.trim();
    if (!text) {
      showAlert("Empty narrative", "Please enter or record patient narrative first.");
      return;
    }

    try {
      setProcessing(true);
      const result: ExtractionResult = await extractSymptoms({
        text,
        language: "en",
        useNLP: useNLP,
      });
      const list = (result.symptoms || []).slice(0, 20).map((s) => ({
        ...s,
        accepted: true,
        importance: s.confidence === "exact" || s.confidence === "high" ? 3 : s.confidence === "medium" ? 2 : 1,
        srp: false,
      }));
      setAiSymptoms(list.length > 0 ? list : mockSymptomsFromNarrative);
    } catch (e: any) {
      console.warn("AI extract failed, using mock symptoms", e);
      setAiSymptoms(mockSymptomsFromNarrative);
      showAlert(
        "Using sample symptoms",
        "AI extraction failed or returned no symptoms. You can still add rubrics manually and Review & Save, or try again with backend running."
      );
    } finally {
      setProcessing(false);
    }
  };

  const addConfirmedSymptomsToCaseStructure = () => {
    const accepted = aiSymptoms.filter((s) => s.accepted);
    const newItems: CaseStructureItem[] = accepted.map((s) => {
      caseStructureIdRef.current += 1;
      const item: CaseStructureItem = {
        id: `cs_${caseStructureIdRef.current}`,
        type: s.category,
        symptomText: s.symptomName,
        weight: s.importance,
        isRare: s.srp,
      };
      if (s.location) item.location = s.location;
      if (s.sensation) item.sensation = s.sensation;
      if (s.category === "modality" && s.type) item.modalityType = s.type;
      return item;
    });
    setCaseStructureItems((prev) => [...prev, ...newItems]);
  };

  const buildStructuredCase = (): StructuredCaseInput => {
    // Ensure weights are valid (1-5), default to 3 if invalid
    const clampWeight = (w: number) => Math.max(1, Math.min(5, w || 3));
    
    const mental = caseStructureItems.filter((i) => i.type === "mental").map((i) => ({ 
      symptomText: i.symptomText, 
      weight: clampWeight(i.weight) 
    }));
    const generals = caseStructureItems.filter((i) => i.type === "general").map((i) => ({ 
      symptomText: i.symptomText, 
      weight: clampWeight(i.weight) 
    }));
    const particulars = caseStructureItems.filter((i) => i.type === "particular").map((i) => ({
      symptomText: i.symptomText,
      ...(i.location && { location: i.location }),
      ...(i.sensation && { sensation: i.sensation }),
      weight: clampWeight(i.weight),
    }));
    const modalities = caseStructureItems.filter((i) => i.type === "modality").map((i) => ({
      symptomText: i.symptomText,
      type: (i.modalityType ?? (i.symptomText.toLowerCase().includes("better") ? "better" : "worse")) as "better" | "worse",
      weight: clampWeight(i.weight),
    }));
    return { mental, generals, particulars, modalities, pathologyTags: pathologyTags || [] };
  };

  const handleGetRemedySuggestions = async () => {
    if (!patientId) {
      showAlert(
        "Patient not linked",
        "Go to Patients → select a patient → Consult Now → AI-Enhanced Mode to link this case."
      );
      return;
    }
    if (caseStructureItems.length === 0) {
      showAlert("Case structure empty", "Add symptoms to Case Structure (from Extracted or from Matched rubrics), then tap Get Remedy Suggestions.");
      return;
    }

    try {
      setSubmitting(true);
      const structuredCase = buildStructuredCase();
      
      // Validate: at least one symptom category must have items
      const totalSymptoms = structuredCase.mental.length + structuredCase.generals.length + structuredCase.particulars.length + structuredCase.modalities.length;
      if (totalSymptoms === 0) {
        showAlert("No symptoms", "Case structure must contain at least one symptom. Add symptoms from Extracted or Matched rubrics.");
        return;
      }

      // Collect rubricIds from case structure items (for backend tracking)
      const rubricIds = caseStructureItems.filter((i) => i.rubricId).map((i) => i.rubricId!);
      
      // Fetch patient history for rule engine (optional)
      let patientHistory: Array<{ remedyId: string; date: string }> | undefined;
      try {
        const records = await fetchPatientCaseRecords(patientId);
        if (records && records.length > 0) {
          patientHistory = records
            .filter((r) => r.finalRemedy?.remedyId)
            .map((r) => ({
              remedyId: r.finalRemedy!.remedyId,
              date: r.updatedAt || r.createdAt || new Date().toISOString(),
            }));
        }
      } catch (_) {
        // Ignore history fetch errors
      }

      // Log what we're sending for debugging
      console.log("Opening Rule Engine Modal with structured case:", JSON.stringify(structuredCase, null, 2));
      console.log("Total symptoms:", totalSymptoms);
      console.log("Rubric IDs:", rubricIds);
      
      // Open Rule Engine Processing Modal (same as manual case taking)
      openRuleEngineModal({
        patientId,
        patientName,
        structuredCase,
        patientHistory,
        selectedRubricIds: rubricIds.length > 0 ? rubricIds : undefined,
        onSuccess: handleRuleEngineSuccess,
        onError: handleRuleEngineError,
      });
    } catch (error: any) {
      console.error("Prepare case failed", error);
      showAlert("Error", "Could not prepare case. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRuleEngineSuccess = (response: SuggestionResponse) => {
    if (patientId) {
      navigation.navigate("RemedySuggestions", {
        suggestionResponse: response,
        patientId,
        patientName,
      });
    }
  };

  const handleRuleEngineError = (error: any) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to get remedy suggestions. Please try again.";
    showAlert("Error", message);
  };

  const handleCheckCompleteness = () => {
    if (caseStructureItems.length === 0) {
      showAlert("Empty Case", "Add symptoms to Case Structure first, then check completeness.");
      return;
    }
    const structuredCase = buildStructuredCase();
    navigation.navigate("CaseCompleteness", {
      structuredCase,
      patientName,
    });
  };

  const handleDiscard = () => {
    const hasContent = narrativeText.trim().length > 0 || aiSymptoms.length > 0;
    if (hasContent) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        if (window.confirm("Discard case? Narrative, extracted data and case structure will be cleared. You can't undo this.")) {
          setAiSymptoms([]);
          setNarrativeText("");
          setCaseStructureItems([]);
          setMatchedRubrics([]);
          setMatchedRubricsSource(null);
          setSelectedRubricIds(new Set());
          navigation.goBack();
        }
        return;
      }
      Alert.alert(
        "Discard case?",
        "Narrative, extracted data and case structure will be cleared. You can't undo this.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setAiSymptoms([]);
              setNarrativeText("");
              setCaseStructureItems([]);
              setMatchedRubrics([]);
              setMatchedRubricsSource(null);
              setSelectedRubricIds(new Set());
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const groupedByCategory = aiSymptoms.reduce<Record<string, AISymptom[]>>((acc, s) => {
    const cat = s.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});
  const categoryOrder = ["mental", "general", "particular", "modality"];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>AI Case Taking</Text>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>
            {patientId ? `${patientName} • Linked` : "Select patient via Consult Now to save"}
          </Text>
        </View>
        {patientId ? (
          <View style={styles.liveDot} />
        ) : (
          <Ionicons name="person-outline" size={20} color={colors.textTertiary} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!patientId && (
          <Card style={styles.bannerCard}>
            <Text style={styles.bannerText}>
              To save this case, go to Patients → select patient → Consult Now → AI-Enhanced Mode.
            </Text>
          </Card>
        )}

        <Card style={styles.narrativeCard}>
          <View style={styles.narrativeHeader}>
            <View style={styles.narrativeHeaderLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={styles.narrativeHeaderText}>Describe patient symptoms</Text>
            </View>
            {narrativeText.length > 0 && (
              <TouchableOpacity onPress={clearNarrative} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.narrativeInput}
            placeholder="Type or paste patient case in natural language. The AI will extract symptoms automatically. You can also use voice input."
            placeholderTextColor={colors.textTertiary}
            multiline
            value={narrativeText}
            onChangeText={setNarrativeText}
          />
          <View style={styles.narrativeFooter}>
            <View style={styles.narrativeFooterLeft}>
              {isRecording && (
                <View style={styles.recordingPill}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>
                    Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")}
                  </Text>
                </View>
              )}
              {isTranscribing && (
                <View style={styles.recordingPill}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.recordingText}>Transcribing with Whisper...</Text>
                </View>
              )}
              {!isRecording && !isTranscribing && (
                <Text style={styles.charCount}>{narrativeText.length} / 10,000</Text>
              )}
            </View>
            <View style={styles.narrativeActions}>
              <TouchableOpacity
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonActive,
                  isTranscribing && styles.micButtonDisabled,
                  !isWeb && styles.micButtonDisabled,
                ]}
                onPress={toggleRecording}
                disabled={isTranscribing || !isWeb}
                activeOpacity={0.8}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Ionicons name={isRecording ? "stop" : "mic"} size={20} color="#FFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.processBtn, processing && styles.processBtnDisabled]}
                disabled={processing}
                onPress={handleProcessAI}
                activeOpacity={0.8}
              >
                {processing ? (
                  <View style={styles.processBtnContent}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.processBtnText} numberOfLines={1}>Extracting...</Text>
                  </View>
                ) : (
                  <View style={styles.processBtnContent}>
                    <Ionicons name="sparkles" size={18} color="#FFF" />
                    <Text style={styles.processBtnText} numberOfLines={1}>Extract Symptoms</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          {!isWeb && (
            <Text style={styles.voiceHint}>💡 Voice input is currently only available on web</Text>
          )}
          {isWeb && typeof navigator !== "undefined" && !navigator.mediaDevices && (
            <Text style={styles.voiceHint}>💡 Microphone access not available. Please use HTTPS or localhost.</Text>
          )}
        </Card>

        {/* EXTRACTED */}
        {aiSymptoms.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>EXTRACTED</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaTag}>
                <Text style={styles.metaTagLabel}>Intensity</Text>
                <Text style={styles.metaTagValue}>moderate</Text>
              </View>
              <View style={[styles.metaTag, styles.metaTagFreq]}>
                <Text style={styles.metaTagLabel}>Frequency</Text>
                <Text style={styles.metaTagValue}>constant</Text>
              </View>
              <View style={[styles.metaTag, styles.metaTagPec]}>
                <Text style={styles.metaTagLabel}>Peculiarity</Text>
                <Text style={styles.metaTagValue}>0/100</Text>
              </View>
            </View>
            <Text style={styles.entityLabel}>Complaint</Text>
            <View style={styles.complaintChipRow}>
              {aiSymptoms.slice(0, 5).map((s) => (
                <View key={s.symptomCode} style={styles.complaintChip}>
                  <Ionicons name="heart" size={12} color={colors.textSecondary} />
                  <Text style={styles.complaintChipText}>{s.symptomName}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.entityLabel}>Extracted symptoms</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>
                Mental: {aiSymptoms.filter((s) => s.category === "mental").length} | General: {aiSymptoms.filter((s) => s.category === "general").length} | Particular: {aiSymptoms.filter((s) => s.category === "particular").length} | Modality: {aiSymptoms.filter((s) => s.category === "modality").length}
              </Text>
            </View>
            <View style={styles.confirmRejectRow}>
              <TouchableOpacity style={styles.confirmAllBtn} onPress={selectAllSymptoms}>
                <Text style={styles.confirmAllText}>Confirm All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectAllBtn} onPress={deselectAllSymptoms}>
                <Text style={styles.rejectAllText}>Reject All</Text>
              </TouchableOpacity>
            </View>
            {categoryOrder.map((cat) => {
              const items = groupedByCategory[cat];
              if (!items?.length) return null;
              return (
                <View key={cat} style={styles.categoryBlock}>
                  <Text style={styles.categoryBlockTitle}>{CATEGORY_LABELS[cat] || cat}</Text>
                  {items.map((s) => (
                    <View key={s.symptomCode} style={styles.rubricCardWrapper}>
                      <Card style={[styles.extractedCard, !s.accepted && styles.rubricCardDimmed]}>
                        <View style={styles.extractedCardTop}>
                          <View style={[styles.confidencePill, (s.confidence === "high" || s.confidence === "exact") ? styles.confidenceHigh : s.confidence === "medium" ? styles.confidenceMedium : styles.confidenceLow]}>
                            <Text style={styles.confidencePillText}>{s.confidence === "exact" ? "Exact Match" : s.confidence === "high" ? "High" : s.confidence}</Text>
                          </View>
                          <View style={styles.confidencePillGeneral}>
                            <Text style={styles.confidencePillText}>{CATEGORY_LABELS[s.category] || s.category}</Text>
                          </View>
                        </View>
                        <Text style={[styles.rubricTitle, !s.accepted && styles.rubricTitleDimmed]}>{s.symptomName}</Text>
                        <View style={styles.importanceRow}>
                          <Text style={styles.importanceLabel}>Importance</Text>
                          <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <TouchableOpacity key={n} onPress={() => setSymptomImportance(s.symptomCode, n)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                <Ionicons name={s.importance >= n ? "star" : "star-outline"} size={18} color={s.importance >= n ? colors.accentAlert : colors.border} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                        <TouchableOpacity style={styles.srpRow} onPress={() => setSymptomSrp(s.symptomCode, !s.srp)} activeOpacity={0.8}>
                          <Ionicons name={s.srp ? "checkbox" : "square-outline"} size={20} color={colors.primary} />
                          <Text style={styles.srpLabel}>Strange, Rare, Peculiar</Text>
                        </TouchableOpacity>
                        <View style={styles.extractedCardActions}>
                          <TouchableOpacity
                            style={[styles.getRubricBtn, loadingRubricsFor !== null && styles.getRubricBtnDisabled]}
                            onPress={() => fetchRubricsForSymptom(s)}
                            disabled={loadingRubricsFor !== null}
                          >
                            {loadingRubricsFor === s.symptomCode ? (
                              <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                              <Text style={styles.getRubricBtnText}>Get Rubric Suggestion</Text>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => removeSymptom(s.symptomCode)}>
                            <Ionicons name="close-circle" size={22} color="#c62828" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => toggleSymptom(s.symptomCode)}>
                            <Ionicons name={s.accepted ? "checkmark-circle" : "ellipse-outline"} size={26} color={s.accepted ? colors.primary : colors.border} />
                          </TouchableOpacity>
                        </View>
                      </Card>
                    </View>
                  ))}
                </View>
              );
            })}
          </Card>
        )}

        {/* AI INTERPRETATION */}
        {(matchedRubrics.length > 0 || matchedRubricsSource) && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>AI INTERPRETATION</Text>
            {matchedRubricsSource && (
              <Text style={styles.matchedSource}>Matched symptoms: {matchedRubricsSource}</Text>
            )}
            <Text style={styles.matchedRubricsLabel}>Matched rubrics — select then add to Case Structure:</Text>
            {matchedRubrics.length === 0 ? (
              <Text style={styles.noRubricsText}>No rubrics. Tap "Get Rubric Suggestion" on a symptom in Extracted.</Text>
            ) : (
              <>
                <ScrollView style={styles.matchedRubricsList} nestedScrollEnabled>
                  {matchedRubrics.slice(0, 15).map((r) => (
                    <TouchableOpacity
                      key={r.rubricId}
                      style={[styles.matchedRubricRow, selectedRubricIds.has(r.rubricId) && styles.matchedRubricRowSelected]}
                      onPress={() => toggleRubricSelection(r.rubricId)}
                    >
                      <Ionicons name={selectedRubricIds.has(r.rubricId) ? "checkbox" : "ellipse-outline"} size={20} color={colors.primary} />
                      <Text style={styles.matchedRubricText} numberOfLines={2}>{r.rubricText}</Text>
                      {r.isRare && <View style={styles.rareBadge}><Text style={styles.rareBadgeText}>Rare</Text></View>}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.addToCaseBtn} onPress={addMatchedRubricsToCaseStructure}>
                  <Ionicons name="checkmark-done" size={20} color="#FFF" />
                  <Text style={styles.addToCaseBtnText}>Add all to Case Structure</Text>
                </TouchableOpacity>
              </>
            )}
          </Card>
        )}

        {/* CASE STRUCTURE */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CASE STRUCTURE</Text>
          {caseStructureItems.length === 0 ? (
            <Text style={styles.noCaseText}>No symptoms yet.</Text>
          ) : (
            <>
              {caseStructureItems.map((item) => (
                <View key={item.id} style={styles.caseStructRow}>
                  <View style={styles.caseStructContent}>
                    <Text style={styles.caseStructText}>{item.symptomText}</Text>
                    <Text style={styles.caseStructMeta}>{CATEGORY_LABELS[item.type]} • weight {item.weight}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeCaseStructureItem(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addConfirmedBtn} onPress={addConfirmedSymptomsToCaseStructure}>
                <Text style={styles.addConfirmedBtnText}>Add confirmed symptoms to case</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completenessBtn} onPress={handleCheckCompleteness} activeOpacity={0.8}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.completenessBtnText}>Check Case Completeness</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
      </ScrollView>

      <View style={styles.footerBar}>
        <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (submitting || caseStructureItems.length === 0) && styles.saveBtnDisabled]}
          disabled={submitting || caseStructureItems.length === 0}
          onPress={handleGetRemedySuggestions}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="medical-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveText}>Get Remedy Suggestions</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: layout.spacing,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#E1F5FE",
  },
  aiBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primary },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentSuccess },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  scroll: { paddingHorizontal: layout.spacing, paddingBottom: 80 },
  bannerCard: { marginBottom: 12, backgroundColor: "#FFF3E0" },
  bannerText: { fontSize: 13, color: colors.textPrimary },
  sectionCard: { marginTop: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginBottom: 10, letterSpacing: 0.5 },
  narrativeCard: { marginTop: 8, marginBottom: 16, padding: 16 },
  narrativeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  narrativeHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  narrativeHeaderText: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  narrativeInput: {
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 120,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  narrativeFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  narrativeFooterLeft: { flex: 1 },
  charCount: { fontSize: 12, color: colors.textTertiary },
  recordingPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#FFEBEE", alignSelf: "flex-start" },
  recordingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentAlert },
  recordingText: { fontSize: 12, fontWeight: "600", color: colors.accentAlert },
  narrativeActions: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 4px rgba(0,0,0,0.1)" as any } : { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }),
  },
  micButtonActive: { backgroundColor: colors.accentAlert },
  micButtonDisabled: { opacity: 0.5 },
  processBtn: {
    flex: 1,
    minWidth: 0, // Allow flex shrink
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 4px rgba(0,0,0,0.1)" as any } : { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }),
  },
  processBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexShrink: 1,
  },
  processBtnDisabled: { opacity: 0.7 },
  processBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600", flexShrink: 1 },
  voiceHint: { fontSize: 11, color: colors.textTertiary, marginTop: 8, textAlign: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginTop: 8, marginBottom: 6 },
  aiHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 4, flexWrap: "wrap", gap: 6 },
  aiHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  newCount: { fontSize: 11, color: colors.primary, fontWeight: "600" },
  selectAllBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  selectAllText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  metaTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#FFF8E1" },
  metaTagFreq: { backgroundColor: "#FFEBEE" },
  metaTagPec: { backgroundColor: "#F5F5F5" },
  metaTagLabel: { fontSize: 10, color: colors.textSecondary },
  metaTagValue: { fontSize: 12, fontWeight: "600", color: colors.textPrimary },
  entityLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  complaintChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  complaintChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "#FCE4EC" },
  complaintChipText: { fontSize: 12, color: colors.textPrimary },
  summaryRow: { marginBottom: 10 },
  summaryText: { fontSize: 12, color: colors.textSecondary },
  confirmRejectRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  confirmAllBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#E8F5E9" },
  rejectAllBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "#FFEBEE" },
  confirmAllText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  rejectAllText: { fontSize: 13, fontWeight: "600", color: "#c62828" },
  categoryBlock: { marginBottom: 16 },
  categoryBlockTitle: { fontSize: 12, fontWeight: "700", color: colors.primary, marginBottom: 8, letterSpacing: 0.5 },
  rubricCardWrapper: { marginBottom: 8 },
  extractedCard: { padding: 12, marginBottom: 8 },
  extractedCardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  confidencePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" },
  confidenceHigh: { backgroundColor: "#E8F5E9" },
  confidenceMedium: { backgroundColor: "#FFF8E1" },
  confidenceLow: { backgroundColor: "#F5F5F5" },
  confidencePillGeneral: { backgroundColor: "#E3F2FD" },
  confidencePillText: { fontSize: 10, fontWeight: "600", color: colors.textPrimary },
  rubricTitle: { fontSize: 14, fontWeight: "600", color: colors.textPrimary, marginBottom: 6 },
  rubricTitleDimmed: { color: colors.textSecondary },
  importanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  importanceLabel: { fontSize: 12, color: colors.textSecondary },
  starsRow: { flexDirection: "row", gap: 2 },
  srpRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  srpLabel: { fontSize: 12, color: colors.textPrimary },
  extractedCardActions: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  getRubricBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  getRubricBtnDisabled: { opacity: 0.6 },
  getRubricBtnText: { fontSize: 12, fontWeight: "600", color: "#FFF" },
  iconBtn: { padding: 4 },
  rubricCardDimmed: { opacity: 0.65 },
  matchedSource: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  matchedRubricsLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  noRubricsText: { fontSize: 13, color: colors.textTertiary, marginBottom: 8 },
  matchedRubricsList: { maxHeight: 200, marginBottom: 10 },
  matchedRubricRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, paddingHorizontal: 4 },
  matchedRubricRowSelected: { backgroundColor: "#E8F5E9", borderRadius: 8 },
  matchedRubricText: { flex: 1, fontSize: 13, color: colors.textPrimary },
  rareBadge: { backgroundColor: "#F5F5F5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rareBadgeText: { fontSize: 10, color: colors.textSecondary },
  addToCaseBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
  addToCaseBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  noCaseText: { fontSize: 13, color: colors.textTertiary },
  caseStructRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  caseStructContent: { flex: 1 },
  caseStructText: { fontSize: 14, color: colors.textPrimary, fontWeight: "500" },
  caseStructMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  addConfirmedBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: "#E3F2FD", alignItems: "center" },
  addConfirmedBtnText: { fontSize: 13, fontWeight: "600", color: colors.primary },
  completenessBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 4px rgba(11,84,219,0.1)" as any } : { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
  },
  completenessBtnText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  rubricCardTouch: { flex: 1 },
  rubricCard: {},
  rubricRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rubricContent: { flex: 1 },
  rubricMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rubricActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  removeRubricBtn: { padding: 4 },
  rubricCheckWrap: {},
  rubricCheckWrapActive: {},
  emptyStateCard: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24, marginTop: 8 },
  emptyStateIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyStateTitle: { fontSize: 16, fontWeight: "600", color: colors.textPrimary, marginBottom: 8 },
  emptyStateText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    paddingHorizontal: layout.spacing,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  discardBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingVertical: 10 },
  discardText: { fontSize: 14, color: colors.textSecondary },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 20, backgroundColor: colors.primary, paddingVertical: 10 },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
});
