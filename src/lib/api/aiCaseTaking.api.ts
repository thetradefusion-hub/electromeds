/**
 * AI Case Taking API Client
 * 
 * Frontend API functions for AI-powered case taking
 */

import api, { ApiResponse } from '../api';
import axios from 'axios';

// Types
export interface ExtractedSymptom {
  symptomCode: string;
  symptomName: string;
  category: 'mental' | 'general' | 'particular' | 'modality';
  confidence: 'exact' | 'high' | 'medium' | 'low';
  location?: string;
  sensation?: string;
  context?: string;
  matchedText?: string;
  // Enhanced features
  importance?: number; // 1-5 scale
  isSRP?: boolean; // Strange, Rare, Peculiar
  whyDetected?: string; // AI explanation for why this symptom was detected
  extractionMethod?: 'nlp' | 'keyword' | 'hybrid'; // How it was extracted
}

export interface ExtractedEntity {
  type: 'body_part' | 'sensation' | 'complaint' | 'emotion' | 'food' | 'sleep' | 'thermal' | 'discharge' | 'other';
  text: string;
  confidence: number;
}

export interface ExtractedModality {
  type: 'better' | 'worse' | 'time' | 'weather' | 'motion' | 'position' | 'eating' | 'emotional';
  value: string;
  linkedSymptom?: string;
  confidence: number;
}

export interface MetaAttributes {
  intensity?: 'mild' | 'moderate' | 'severe';
  duration?: string;
  frequency?: 'constant' | 'intermittent' | 'occasional';
  peculiarity?: number;
}

export interface ExtractionResult {
  symptoms: ExtractedSymptom[];
  overallConfidence: number;
  extractedCount: number;
  totalTextLength: number;
  entities?: ExtractedEntity[];
  modalities?: ExtractedModality[];
  metaAttributes?: MetaAttributes;
  extractionMethod?: 'nlp' | 'keyword' | 'hybrid';
}

export interface ExtractSymptomsRequest {
  text: string;
  language?: string;
  useNLP?: boolean; // Option to use NLP extraction (default: true if available)
}

export interface ExtractSymptomsResponse {
  success: boolean;
  data: ExtractionResult;
  message?: string;
}

// Case Completeness Types
export interface MissingDomain {
  domain: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedQuestions: string[];
}

export interface CompletenessAnalysis {
  completenessScore: number;
  missingDomains: MissingDomain[];
  suggestions: Question[];
  strengths: string[];
  warnings: string[];
}

export interface Question {
  id: string;
  text: string;
  domain: string;
  type: 'yes_no' | 'multiple_choice' | 'open_ended';
  options?: string[];
  priority: 'high' | 'medium' | 'low';
  reasoning?: string;
}

export interface QuestionGenerationResult {
  questions: Question[];
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  answer: string;
  domain: string;
  type: 'yes_no' | 'multiple_choice' | 'open_ended';
}

export interface ExtractedSymptomFromAnswer {
  symptomText: string;
  category: 'mental' | 'general' | 'particular' | 'modality';
  confidence: 'exact' | 'high' | 'medium' | 'low';
  source: string;
  location?: string;
  sensation?: string;
  type?: 'better' | 'worse';
  weight?: number;
}

export interface StructuredCaseInput {
  mental: Array<{
    symptomCode?: string;
    symptomText: string;
    weight?: number;
  }>;
  generals: Array<{
    symptomCode?: string;
    symptomText: string;
    weight?: number;
  }>;
  particulars: Array<{
    symptomCode?: string;
    symptomText: string;
    location?: string;
    sensation?: string;
    weight?: number;
  }>;
  modalities: Array<{
    symptomCode?: string;
    symptomText: string;
    type: 'better' | 'worse';
    weight?: number;
  }>;
  pathologyTags: string[];
}

/**
 * Extract symptoms from free text
 */
export const extractSymptoms = async (
  request: ExtractSymptomsRequest
): Promise<ExtractionResult> => {
  try {
    // Create a custom axios instance with longer timeout for NLP operations
    const nlpApi = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      timeout: 90000, // 90 seconds for NLP operations
    });

    const response = await nlpApi.post<ExtractSymptomsResponse>(
      '/ai-case-taking/extract-symptoms',
      request
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to extract symptoms');
    }
  } catch (error: any) {
    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('Request timeout. The AI extraction is taking longer than expected. Please try again or use keyword extraction instead.');
    }
    
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to extract symptoms';
    throw new Error(message);
  }
};

/**
 * Analyze case completeness
 */
export const analyzeCompleteness = async (
  caseData: StructuredCaseInput
): Promise<CompletenessAnalysis> => {
  try {
    const response = await api.post<ApiResponse<CompletenessAnalysis>>(
      '/ai-case-taking/analyze-completeness',
      { case: caseData }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to analyze completeness');
    }
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to analyze case completeness';
    throw new Error(message);
  }
};

/**
 * Generate smart questions
 */
export const generateQuestions = async (
  caseData: StructuredCaseInput,
  missingDomain?: string,
  context?: string
): Promise<QuestionGenerationResult> => {
  try {
    const response = await api.post<ApiResponse<QuestionGenerationResult>>(
      '/ai-case-taking/generate-questions',
      { case: caseData, missingDomain, context }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to generate questions');
    }
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to generate questions';
    throw new Error(message);
  }
};

/**
 * Generate questions in batch for multiple domains
 */
export const generateQuestionsBatch = async (
  caseData: StructuredCaseInput,
  domains?: string[]
): Promise<{ questions: Question[]; domainQuestions: Record<string, Question[]>; totalCount: number }> => {
  try {
    const response = await api.post<ApiResponse<{ questions: Question[]; domainQuestions: Record<string, Question[]>; totalCount: number }>>(
      '/ai-case-taking/generate-questions-batch',
      { case: caseData, domains }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to generate questions batch');
    }
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to generate questions batch';
    throw new Error(message);
  }
};

/**
 * Extract symptoms from question answers
 */
export const extractSymptomsFromAnswers = async (
  answers: QuestionAnswer[],
  useNLP?: boolean
): Promise<{ extractedSymptoms: ExtractedSymptomFromAnswer[]; count: number }> => {
  try {
    const response = await api.post<ApiResponse<{ extractedSymptoms: ExtractedSymptomFromAnswer[]; count: number }>>(
      '/ai-case-taking/extract-symptoms-from-answers',
      { answers, useNLP }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to extract symptoms from answers');
    }
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to extract symptoms from answers';
    throw new Error(message);
  }
};

// Rubric Suggestion Types
export interface RubricSuggestion {
  rubricId: string;
  rubricText: string;
  repertoryType: string;
  chapter: string;
  matchScore: number;
  confidence: 'exact' | 'high' | 'medium' | 'low';
  relevanceScore: number;
  isRare: boolean;
  matchedSymptoms: string[];
  remedyCount?: number;
  avgGrade?: number;
  matchedText?: string;
}

export interface SuggestRubricsRequest {
  symptom: {
    symptomCode?: string;
    symptomName: string;
    category?: 'mental' | 'general' | 'particular' | 'modality';
    location?: string;
    sensation?: string;
  };
  repertoryType?: 'kent' | 'bbcr' | 'boericke' | 'synthesis' | 'publicum';
}

/**
 * Get rubric suggestions for a symptom
 */
export const suggestRubrics = async (
  request: SuggestRubricsRequest
): Promise<{ rubrics: RubricSuggestion[]; rareRubrics: RubricSuggestion[] }> => {
  try {
    const response = await api.post<ApiResponse<{ rubrics: RubricSuggestion[]; rareRubrics: RubricSuggestion[]; totalCount: number }>>(
      '/ai-case-taking/suggest-rubrics',
      request
    );

    if (response.data.success && response.data.data) {
      return {
        rubrics: response.data.data.rubrics,
        rareRubrics: response.data.data.rareRubrics,
      };
    } else {
      throw new Error('Failed to get rubric suggestions');
    }
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to get rubric suggestions';
    throw new Error(message);
  }
};

/**
 * Case Summary Types
 */
export interface CaseSummary {
  clinicalSummary: string;
  homeopathicSummary: string;
  keynotes: string[];
  strangeSymptoms: string[];
}

export interface GenerateSummaryRequest {
  structuredCase: {
    mental: Array<{
      symptomCode?: string;
      symptomText: string;
      weight?: number;
    }>;
    generals: Array<{
      symptomCode?: string;
      symptomText: string;
      weight?: number;
    }>;
    particulars: Array<{
      symptomCode?: string;
      symptomText: string;
      location?: string;
      sensation?: string;
      weight?: number;
    }>;
    modalities: Array<{
      symptomCode?: string;
      symptomText: string;
      type: 'better' | 'worse';
      weight?: number;
    }>;
    pathologyTags: string[];
  };
  normalizedCase: {
    mental: Array<{
      symptomCode: string;
      symptomName: string;
      category: 'mental';
      weight: number;
    }>;
    generals: Array<{
      symptomCode: string;
      symptomName: string;
      category: 'general';
      weight: number;
    }>;
    particulars: Array<{
      symptomCode: string;
      symptomName: string;
      category: 'particular';
      location?: string;
      sensation?: string;
      weight: number;
    }>;
    modalities: Array<{
      symptomCode: string;
      symptomName: string;
      category: 'modality';
      type: 'better' | 'worse';
      weight: number;
    }>;
    pathologyTags: string[];
    isAcute: boolean;
    isChronic: boolean;
  };
}

/**
 * Generate AI-powered case summary
 */
export const generateSummary = async (
  request: GenerateSummaryRequest
): Promise<CaseSummary> => {
  try {
    const response = await api.post<ApiResponse<CaseSummary>>(
      '/ai-case-taking/generate-summary',
      request
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error('Failed to generate case summary');
    }
  } catch (error: any) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Failed to generate case summary';
    throw new Error(message);
  }
};
