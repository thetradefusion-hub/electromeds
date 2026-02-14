import { api } from "./client";

// --- Shared types used across classical homeopathy flows ---

export type CaseRecord = {
  _id: string;
  patientId: string;
  doctorId: string;
  structuredCase?: {
    pathologyTags?: string[];
  };
  finalRemedy?: {
    remedyId: string;
    remedyName: string;
    potency: string;
    repetition: string;
    notes?: string;
  } | null;
  outcomeStatus?: "pending" | "improved" | "no_change" | "worsened" | "not_followed";
  followUpNotes?: string;
  // Some case records also include generated summaries – keep this loose here
  caseSummary?: {
    clinicalSummary?: string;
    homeopathicSummary?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type StructuredCaseInput = {
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
    type: "better" | "worse";
    weight?: number;
  }>;
  pathologyTags: string[];
};

export type ScoreBreakdown = {
  baseScore: number;
  constitutionBonus: number;
  modalityBonus: number;
  pathologySupport: number;
  keynoteBonus: number;
  coverageBonus: number;
  contradictionPenalty: number;
  total: number;
};

export type RemedySuggestion = {
  remedy: {
    id: string;
    name: string;
    abbreviation?: string;
  };
  matchScore: number;
  confidence: "low" | "medium" | "high" | "very_high";
  suggestedPotency: string;
  repetition: string;
  clinicalReasoning: string;
  matchedSymptoms?: string[];
  matchedRubrics?: string[];
  repertoryType?: string;
  scoreBreakdown?: ScoreBreakdown;
  warnings?: Array<{
    type: "contradiction" | "incompatibility" | "repetition" | "contraindication";
    message: string;
    severity?: "low" | "medium" | "high";
  }>;
};

export type SuggestionResponse = {
  suggestions: {
    topRemedies: RemedySuggestion[];
    summary: {
      totalRemedies: number;
      highConfidence: number;
      warnings: number;
    };
  };
  caseRecordId: string;
};

export type DoctorDecision = {
  remedyId: string;
  remedyName: string;
  potency: string;
  repetition: string;
  notes?: string;
};

export type DecisionResponse = {
  prescription: any;
  caseRecordId: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
};

// --- Timeline helpers ---

export async function fetchPatientCaseRecords(patientId: string): Promise<CaseRecord[]> {
  const res = await api.get<ApiResponse<{ caseRecords: CaseRecord[] }>>(
    `/classical-homeopathy/case/patient/${patientId}`
  );
  return res.data.data.caseRecords;
}

// --- Classical manual flow helpers (mobile) ---

export async function suggestRemedies(
  patientId: string,
  structuredCase: StructuredCaseInput,
  patientHistory?: Array<{ remedyId: string; date: string }>,
  selectedRubricIds?: string[]
): Promise<SuggestionResponse> {
  const body: Record<string, unknown> = { patientId, structuredCase };
  if (patientHistory && patientHistory.length > 0) body.patientHistory = patientHistory;
  if (selectedRubricIds && selectedRubricIds.length > 0) body.selectedRubricIds = selectedRubricIds;

  const res = await api.post<ApiResponse<SuggestionResponse>>(
    "/classical-homeopathy/suggest",
    body,
    { timeout: 45000 }
  );
  if (!res.data.success || !res.data.data) {
    throw new Error((res.data as any).message || "Failed to get suggestions");
  }
  return res.data.data;
}

export async function updateDoctorDecision(
  caseRecordId: string,
  finalRemedy: DoctorDecision
): Promise<DecisionResponse> {
  const res = await api.put<ApiResponse<DecisionResponse>>(
    `/classical-homeopathy/case/${caseRecordId}/decision`,
    {
      finalRemedy: {
        ...finalRemedy,
        remedyId: String(finalRemedy.remedyId),
      },
    },
    { timeout: 20000 }
  );
  if (!res.data?.success || res.data?.data == null) {
    throw new Error((res.data as any)?.message || "Prescription could not be created.");
  }
  return res.data.data;
}

// --- Materia Medica / Remedy Library ---

export type Remedy = {
  _id: string;
  name: string;
  category: string;
  modality: "classical_homeopathy";
  constitutionTraits: string[];
  modalities: { better: string[]; worse: string[] };
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
};

export type GetRemediesParams = {
  search?: string;
  category?: string;
  sortBy?: "name" | "category";
  page?: number;
  limit?: number;
};

export type GetRemediesResponse = {
  success: boolean;
  count: number;
  data: Remedy[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

export async function getRemedies(params?: GetRemediesParams): Promise<GetRemediesResponse> {
  const res = await api.get<GetRemediesResponse>("/classical-homeopathy/remedies", {
    params,
  });
  if (!res.data.success) {
    throw new Error((res.data as any).message || "Failed to fetch remedies");
  }
  return res.data;
}

// --- Remedy Profile (AI-generated) ---

export type RemedyProfile = {
  remedyId: string;
  remedyName: string;
  abbreviation: string;
  commonName: string;
  family: string;
  quickHighlights: string[];
  mind: { description: string; keyTraits: string[] };
  physical: { sections: Array<{ title: string; content: string }> };
  modalities: { aggravation: string[]; amelioration: string[] };
  differentials: string[];
  referenceSource: string;
};

export async function getRemedyProfile(remedyId: string): Promise<RemedyProfile> {
  const res = await api.get<{ success: boolean; data: RemedyProfile }>(
    `/classical-homeopathy/remedies/${remedyId}/profile`
  );
  if (!res.data.success || !res.data.data) {
    throw new Error((res.data as any).message || "Failed to load remedy profile");
  }
  return res.data.data;
}

