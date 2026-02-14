import { api } from "./client";
import type { StructuredCaseInput } from "./classicalHomeopathy";

// Minimal subset of AI case taking types for mobile

export type ExtractedSymptom = {
  symptomCode: string;
  symptomName: string;
  category: "mental" | "general" | "particular" | "modality";
  confidence: "exact" | "high" | "medium" | "low";
  location?: string;
  sensation?: string;
  type?: "better" | "worse";
  weight?: number;
};

export type ExtractionResult = {
  symptoms: ExtractedSymptom[];
  overallConfidence: number;
  extractedCount: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type ExtractSymptomsRequest = {
  text: string;
  language?: string;
  useNLP?: boolean;
};

export async function extractSymptoms(
  request: ExtractSymptomsRequest
): Promise<ExtractionResult> {
  const res = await api.post<ApiResponse<ExtractionResult>>(
    "/ai-case-taking/extract-symptoms",
    request,
    { timeout: 60000 }
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to extract symptoms");
  }

  return res.data.data;
}

// --- Rubric suggestions (match web: symptom → repertory rubrics) ---

export type RubricSuggestion = {
  rubricId: string;
  rubricText: string;
  repertoryType: string;
  chapter?: string;
  matchScore: number;
  confidence: "exact" | "high" | "medium" | "low";
  relevanceScore: number;
  isRare: boolean;
  matchedSymptoms: string[];
  remedyCount?: number;
  avgGrade?: number;
  matchedText?: string;
};

export type SuggestRubricsRequest = {
  symptom: {
    symptomCode?: string;
    symptomName: string;
    category?: "mental" | "general" | "particular" | "modality";
    location?: string;
    sensation?: string;
  };
  repertoryType?: "kent" | "bbcr" | "boericke" | "synthesis" | "publicum";
};

export async function suggestRubrics(
  request: SuggestRubricsRequest
): Promise<{ rubrics: RubricSuggestion[]; rareRubrics: RubricSuggestion[] }> {
  const res = await api.post<ApiResponse<{ rubrics: RubricSuggestion[]; rareRubrics: RubricSuggestion[]; totalCount?: number }>>(
    "/ai-case-taking/suggest-rubrics",
    request
  );
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to get rubric suggestions");
  }
  return {
    rubrics: res.data.data.rubrics || [],
    rareRubrics: res.data.data.rareRubrics || [],
  };
}

// --- Whisper Transcription (server-side) ---

/**
 * Transcribe audio using OpenAI Whisper (server-side).
 * @param audioBlob - Recorded audio Blob (for web) or File URI (for native)
 * @param language - Optional language hint, e.g. 'en-US', 'hi-IN'
 */
export async function transcribeAudio(
  audioBlob: Blob | string,
  language?: string
): Promise<{ text: string }> {
  try {
    const formData = new FormData();
    
    // Handle web (Blob) vs native (file URI)
    if (typeof audioBlob === "string") {
      // Native: audioBlob is a file URI, need to convert to Blob
      // For React Native, we'll need to use fetch to get the file
      const response = await fetch(audioBlob);
      const blob = await response.blob();
      formData.append("audio", blob, "recording.m4a");
    } else {
      // Web: audioBlob is already a Blob
      formData.append("audio", audioBlob, "recording.webm");
    }
    
    if (language) {
      formData.append("language", language);
    }

    // Note: Don't set Content-Type header manually - axios will set it with boundary
    const res = await api.post<ApiResponse<{ text: string }>>(
      "/ai-case-taking/transcribe-audio",
      formData,
      {
        timeout: 60000, // 60 seconds for transcription
      }
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || "Transcription failed");
    }

    return res.data.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to transcribe audio";
    throw new Error(message);
  }
}

// --- Case Completeness (server-side analyzer) ---

export type MissingDomain = {
  domain: string;
  description: string;
  priority: "high" | "medium" | "low";
  suggestedQuestions: string[];
};

export type CompletenessAnalysis = {
  completenessScore: number;
  missingDomains: MissingDomain[];
  // We keep suggestions for future use, but the mobile UI currently only uses score + missingDomains + strengths/warnings.
  suggestions: Array<{
    id: string;
    text: string;
    domain: string;
    priority: "high" | "medium" | "low";
  }>;
  strengths: string[];
  warnings: string[];
};

/**
 * Analyze case completeness for a structured case.
 * Mirrors the web app's /ai-case-taking/analyze-completeness API.
 */
export async function analyzeCompleteness(
  caseData: StructuredCaseInput
): Promise<CompletenessAnalysis> {
  const res = await api.post<ApiResponse<CompletenessAnalysis>>(
    "/ai-case-taking/analyze-completeness",
    { case: caseData },
    { timeout: 45000 }
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to analyze case completeness");
  }

  return res.data.data;
}

