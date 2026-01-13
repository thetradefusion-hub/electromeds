/**
 * Classical Homeopathy API Functions
 * 
 * All API calls for Classical Homeopathy Smart Rule Engine
 */

import api, { ApiResponse } from '../api';

const API_URL = '/classical-homeopathy';

export interface StructuredCaseInput {
  mental: Array<{
    symptomText: string;
    weight?: number;
  }>;
  generals: Array<{
    symptomText: string;
    weight?: number;
  }>;
  particulars: Array<{
    symptomText: string;
    location?: string;
    sensation?: string;
    weight?: number;
  }>;
  modalities: Array<{
    symptomText: string;
    type: 'better' | 'worse';
    weight?: number;
  }>;
  pathologyTags: string[];
}

export interface RemedySuggestion {
  remedy: {
    id: string;
    name: string;
    abbreviation?: string;
  };
  matchScore: number;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
  suggestedPotency: string;
  repetition: string;
  clinicalReasoning: string;
  warnings?: Array<{
    type: 'contradiction' | 'incompatibility' | 'repetition';
    message: string;
  }>;
}

export interface SuggestionResponse {
  suggestions: {
    topRemedies: RemedySuggestion[];
    summary: {
      totalRemedies: number;
      highConfidence: number;
      warnings: number;
    };
  };
  caseRecordId: string;
}

export interface DoctorDecision {
  remedyId: string;
  remedyName: string;
  potency: string;
  repetition: string;
  notes?: string;
}

export interface DecisionResponse {
  prescription: any;
  caseRecordId: string;
}

export interface OutcomeUpdate {
  outcomeStatus: 'improved' | 'no_change' | 'worsened' | 'not_followed';
  followUpNotes?: string;
}

export interface RemedyStatistics {
  totalCases: number;
  improved: number;
  noChange: number;
  worsened: number;
  successRate: number;
}

export interface SymptomRemedyPattern {
  remedyId: string;
  remedyName: string;
  frequency: number;
  successRate: number;
}

export interface Remedy {
  _id: string;
  name: string;
  category: string;
  modality: 'classical_homeopathy';
  constitutionTraits: string[];
  modalities: {
    better: string[];
    worse: string[];
  };
  clinicalIndications: string[];
  incompatibilities: string[];
  materiaMedica: {
    keynotes: string[];
    pathogenesis: string;
    clinicalNotes: string;
  };
  supportedPotencies: string[];
  indications?: string;
  defaultDosage?: string;
  contraIndications?: string;
  notes?: string;
  isGlobal: boolean;
  doctorId?: string;
  createdAt: string;
  updatedAt: string;
}

class ClassicalHomeopathyAPI {
  /**
   * Get all remedies (global + doctor-specific)
   */
  async getRemedies(): Promise<ApiResponse<Remedy[]>> {
    const response = await api.get<ApiResponse<Remedy[]>>(`${API_URL}/remedies`);
    return response.data;
  }

  /**
   * Get remedy suggestions for a structured case
   */
  async suggestRemedies(
    patientId: string,
    structuredCase: StructuredCaseInput
  ): Promise<ApiResponse<SuggestionResponse>> {
    const response = await api.post<ApiResponse<SuggestionResponse>>(
      `${API_URL}/suggest`,
      {
        patientId,
        structuredCase,
      }
    );
    return response.data;
  }

  /**
   * Update doctor's final remedy decision
   */
  async updateDoctorDecision(
    caseRecordId: string,
    finalRemedy: DoctorDecision
  ): Promise<ApiResponse<DecisionResponse>> {
    const response = await api.put<ApiResponse<DecisionResponse>>(
      `${API_URL}/case/${caseRecordId}/decision`,
      { finalRemedy }
    );
    return response.data;
  }

  /**
   * Update case outcome status
   */
  async updateOutcome(
    caseRecordId: string,
    outcome: OutcomeUpdate
  ): Promise<ApiResponse<null>> {
    const response = await api.put<ApiResponse<null>>(
      `${API_URL}/case/${caseRecordId}/outcome`,
      outcome
    );
    return response.data;
  }

  /**
   * Get remedy statistics
   */
  async getRemedyStatistics(
    remedyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<RemedyStatistics>> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ApiResponse<RemedyStatistics>>(
      `${API_URL}/statistics/remedy/${remedyId}?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get symptom-remedy patterns
   */
  async getSymptomRemedyPatterns(
    symptomCode: string
  ): Promise<ApiResponse<SymptomRemedyPattern[]>> {
    const response = await api.get<ApiResponse<SymptomRemedyPattern[]>>(
      `${API_URL}/statistics/patterns?symptomCode=${symptomCode}`
    );
    return response.data;
  }
}

export const classicalHomeopathyApi = new ClassicalHomeopathyAPI();
