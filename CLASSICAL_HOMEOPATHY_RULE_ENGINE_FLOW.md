# Classical Homeopathy - Smart Rule Engine Flow
## Detailed Implementation Guide

---

## 🎯 System Role & Objective

**You are a senior health-tech software architect and backend engineer.**  
**Building a Homoeopathy Smart Rule Engine for a multi-doctor SaaS platform.**

### **Core Objective**

Build a **modular, scalable Smart Rule Engine** that:
- ✅ Accepts structured patient cases
- ✅ Normalizes symptoms
- ✅ Maps them to repertory rubrics
- ✅ Scores remedies using classical homoeopathy logic
- ✅ Applies clinical intelligence filters
- ✅ Detects contradictions
- ✅ Outputs ranked remedies with transparent reasoning
- ✅ Supports future learning layer

**⚠️ Important**: System must act as a **clinical decision support system**, **NOT an auto-diagnosis tool**.

---

## 🏗️ Architecture Overview

### **Tech Stack**
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Architecture**: Service-oriented modules
- **Design**: Therapy-agnostic base, Homoeopathy as first plugin

### **Modular Architecture**

System ko independent services/modules me divide kiya gaya hai:

1. **Case Engine** - Case intake & normalization
2. **Symptom Normalization Engine** - Text to standard symptom mapping
3. **Repertory Engine** - Rubric mapping & remedy fetching
4. **Scoring Engine** - Smart scoring with weights
5. **Clinical Intelligence Layer** - Clinical filters & adjustments
6. **Contradiction & Safety Engine** - Safety checks & warnings
7. **Suggestion Engine** - Ranked remedy output
8. **Outcome & Learning Hook** - Data capture for future learning

---

## 🎯 Overview

Classical Homeopathy me rule engine **Electro Homeopathy** se bahut different hai. Yahan **Repertory-based matching**, **Materia Medica analysis**, aur **Symptom modalities** use hote hain. System **modular architecture** follow karta hai jisme har component independently kaam karta hai.

---

## 🔍 Key Differences: Electro vs Classical

| Aspect | Electro Homeopathy | Classical Homeopathy |
|--------|-------------------|---------------------|
| **Matching** | Direct symptom-to-medicine | Repertory rubrics matching |
| **Scoring** | Priority-based | Grade-based (1-4) |
| **Symptom Details** | Simple symptom list | Location + Sensation + Modalities |
| **Medicine Selection** | Series-based (S1, C1) | Remedy-based (Aconite, Belladonna) |
| **Potency** | Not applicable | Critical (6C, 30C, 200C) |
| **Repetition** | Standard (TDS) | Variable (Acute/Chronic) |

---

## 🗂️ Database Design

### **Complete MongoDB Schema Design**

#### **A. Symptoms Collection**

```typescript
// backend/src/models/Symptom.model.ts
export interface ISymptom extends Document {
  code: string; // Unique symptom code (e.g., "SYM_FEVER_001")
  name: string; // Standard symptom name
  category: 'mental' | 'general' | 'particular' | 'modality'; // Symptom category
  synonyms: string[]; // Alternative names for normalization
  description?: string;
  modality: 'classical_homeopathy'; // Required
  location?: string; // Body location
  sensation?: string; // Pain type, etc.
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```typescript
symptomSchema.index({ code: 1 }, { unique: true });
symptomSchema.index({ category: 1, modality: 1 });
symptomSchema.index({ name: 'text', synonyms: 'text' }); // Text search
```

---

#### **B. Rubrics Collection**

```typescript
// backend/src/models/Rubric.model.ts
export interface IRubric extends Document {
  repertoryType: 'kent' | 'bbcr' | 'boericke' | 'synthesis'; // Repertory source
  chapter: string; // Chapter name (e.g., "Mind", "Generals")
  rubricText: string; // Full rubric text (e.g., "FEAR - death, of")
  linkedSymptoms: string[]; // Array of symptom codes
  modality: 'classical_homeopathy';
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```typescript
rubricSchema.index({ rubricText: 'text' }); // Full-text search
rubricSchema.index({ repertoryType: 1, chapter: 1 });
rubricSchema.index({ linkedSymptoms: 1 });
```

---

#### **C. Rubric Remedies Collection**

```typescript
// backend/src/models/RubricRemedy.model.ts
export interface IRubricRemedy extends Document {
  rubricId: mongoose.Types.ObjectId; // Reference to Rubric
  remedyId: mongoose.Types.ObjectId; // Reference to Remedy
  grade: number; // 1, 2, 3, or 4 (importance)
  repertoryType: 'kent' | 'bbcr' | 'boericke' | 'synthesis';
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```typescript
rubricRemedySchema.index({ rubricId: 1, remedyId: 1 }, { unique: true });
rubricRemedySchema.index({ remedyId: 1, grade: -1 });
rubricRemedySchema.index({ rubricId: 1, grade: -1 });
```

---

#### **D. Remedies Collection** (Enhanced)

```typescript
// backend/src/models/Remedy.model.ts
export interface IRemedy extends Document {
  name: string; // Remedy name (e.g., "Aconite")
  category: string; // Plant Kingdom, Mineral Kingdom, etc.
  modality: 'classical_homeopathy';
  // Constitution traits
  constitutionTraits: string[]; // ["Nervous", "Anxious", "Fearful"]
  // Modalities
  modalities: {
    better: string[]; // ["Rest", "Open air"]
    worse: string[]; // ["Evening", "Night", "Cold"]
  };
  // Clinical indications
  clinicalIndications: string[]; // ["Acute fever", "Sudden onset"]
  // Incompatibilities
  incompatibilities: string[]; // Remedy IDs that are incompatible
  // Materia Medica
  materiaMedica: {
    keynotes: string[];
    pathogenesis: string;
    clinicalNotes: string;
  };
  // Potency support
  supportedPotencies: string[]; // ["6C", "30C", "200C", "1M"]
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```typescript
remedySchema.index({ name: 1 }, { unique: true });
remedySchema.index({ category: 1, modality: 1 });
remedySchema.index({ constitutionTraits: 1 });
remedySchema.index({ 'modalities.better': 1, 'modalities.worse': 1 });
```

---

#### **E. Case Records Collection** (New)

```typescript
// backend/src/models/CaseRecord.model.ts
export interface ICaseRecord extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  // Structured case input
  structuredCase: {
    mental: Array<{
      symptomCode: string;
      symptomName: string;
      weight?: number; // Custom weight if provided
    }>;
    generals: Array<{
      symptomCode: string;
      symptomName: string;
      weight?: number;
    }>;
    particulars: Array<{
      symptomCode: string;
      symptomName: string;
      location?: string;
      sensation?: string;
      weight?: number;
    }>;
    modalities: Array<{
      symptomCode: string;
      symptomName: string;
      type: 'better' | 'worse';
      weight?: number;
    }>;
    pathologyTags: string[]; // ["Acute", "Chronic", "Fever", etc.]
  };
  // Engine processing
  selectedRubrics: Array<{
    rubricId: mongoose.Types.ObjectId;
    rubricText: string;
    repertoryType: string;
    autoSelected: boolean; // Auto or manual
  }>;
  engineOutput: {
    remedyScores: Array<{
      remedyId: mongoose.Types.ObjectId;
      remedyName: string;
      finalScore: number;
      baseScore: number;
      constitutionBonus: number;
      modalityBonus: number;
      pathologySupport: number;
      contradictionPenalty: number;
      matchedRubrics: string[];
      matchedSymptoms: string[];
      confidence: 'low' | 'medium' | 'high' | 'very_high';
    }>;
    clinicalReasoning: string; // Transparent reasoning
    warnings: Array<{
      type: 'contradiction' | 'incompatibility' | 'repetition';
      message: string;
      remedyId?: mongoose.Types.ObjectId;
    }>;
  };
  // Doctor decision
  finalRemedy: {
    remedyId: mongoose.Types.ObjectId;
    remedyName: string;
    potency: string;
    repetition: string;
    notes?: string;
  } | null;
  // Outcome tracking
  outcomeStatus: 'pending' | 'improved' | 'no_change' | 'worsened' | 'not_followed';
  followUpNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```typescript
caseRecordSchema.index({ doctorId: 1, createdAt: -1 });
caseRecordSchema.index({ patientId: 1 });
caseRecordSchema.index({ 'finalRemedy.remedyId': 1, outcomeStatus: 1 });
caseRecordSchema.index({ 'structuredCase.pathologyTags': 1 });
```

---

## 📊 Classical Homeopathy Rule Engine Architecture

### **1. Data Structure**

#### **A. Repertory Rubric Model** (Enhanced)

```typescript
// backend/src/models/RepertoryRubric.model.ts
export interface IRepertoryRubric extends Document {
  rubric: string; // "FEAR - death, of"
  medicineId: string; // Reference to Medicine
  grade: number; // 1, 2, 3, or 4 (importance)
  modality?: string; // "Worse - evening"
  location?: string; // "Head", "Chest", etc.
  sensation?: string; // "Burning", "Stitching", etc.
  createdAt: Date;
  updatedAt: Date;
}
```

**Example Data**:
```json
{
  "rubric": "FEAR - death, of",
  "medicineId": "aconite_id",
  "grade": 4,
  "modality": null,
  "location": "Mind",
  "sensation": null
}
```

---

#### **B. Symptom with Repertory Data**

```typescript
// Enhanced Symptom Model for Classical Homeopathy
{
  name: "Fever - Sudden",
  modality: "classical_homeopathy",
  location: "Whole Body",
  sensation: "Burning",
  modalities: ["Worse - Evening", "Better - Rest"],
  repertoryRubrics: [
    {
      rubric: "FEVER - sudden",
      grade: 4
    },
    {
      rubric: "FEVER - burning",
      grade: 3
    },
    {
      rubric: "FEVER - evening",
      grade: 2
    }
  ]
}
```

---

#### **C. Medicine with Materia Medica**

```typescript
// Enhanced Medicine Model for Classical Homeopathy
{
  name: "Aconite",
  modality: "classical_homeopathy",
  category: "Plant Kingdom",
  materiaMedica: {
    keynotes: [
      "Sudden onset",
      "Fear of death",
      "Restlessness",
      "Anxiety"
    ],
    modalities: {
      better: ["Rest", "Open air"],
      worse: ["Evening", "Night", "Cold"]
    },
    potencies: ["6C", "30C", "200C", "1M"]
  },
  repertoryRubrics: [
    "FEAR - death, of",
    "FEVER - sudden",
    "ANXIETY - sudden",
    "RESTLESSNESS"
  ]
}
```

---

## ⚙️ ENGINE FLOW (MANDATORY) - 9 Steps

### **Step 1: Case Intake (Case Engine)**

**Purpose**: Accept structured case and return normalized case profile.

```typescript
// Case Engine Service
// backend/src/services/caseEngine.service.ts

interface StructuredCase {
  mental: Array<{
    symptomCode?: string;
    symptomText: string; // Free text or code
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
  pathologyTags: string[]; // ["Acute", "Chronic", "Fever", etc.]
}

interface NormalizedCaseProfile {
  mental: Array<{
    symptomCode: string;
    symptomName: string;
    category: 'mental';
    weight: number; // Default: 3
  }>;
  generals: Array<{
    symptomCode: string;
    symptomName: string;
    category: 'general';
    weight: number; // Default: 2
  }>;
  particulars: Array<{
    symptomCode: string;
    symptomName: string;
    category: 'particular';
    location?: string;
    sensation?: string;
    weight: number; // Default: 1
  }>;
  modalities: Array<{
    symptomCode: string;
    symptomName: string;
    category: 'modality';
    type: 'better' | 'worse';
    weight: number; // Default: 1.5
  }>;
  pathologyTags: string[];
  isAcute: boolean;
  isChronic: boolean;
}

export class CaseEngine {
  async normalizeCase(structuredCase: StructuredCase): Promise<NormalizedCaseProfile> {
    // Step 1.1: Normalize mental symptoms
    const normalizedMental = await Promise.all(
      structuredCase.mental.map(async (symptom) => {
        const normalized = await this.normalizeSymptom(symptom.symptomText, 'mental');
        return {
          symptomCode: normalized.code,
          symptomName: normalized.name,
          category: 'mental' as const,
          weight: symptom.weight || 3, // Default weight for mental
        };
      })
    );

    // Step 1.2: Normalize general symptoms
    const normalizedGenerals = await Promise.all(
      structuredCase.generals.map(async (symptom) => {
        const normalized = await this.normalizeSymptom(symptom.symptomText, 'general');
        return {
          symptomCode: normalized.code,
          symptomName: normalized.name,
          category: 'general' as const,
          weight: symptom.weight || 2, // Default weight for generals
        };
      })
    );

    // Step 1.3: Normalize particular symptoms
    const normalizedParticulars = await Promise.all(
      structuredCase.particulars.map(async (symptom) => {
        const normalized = await this.normalizeSymptom(symptom.symptomText, 'particular');
        return {
          symptomCode: normalized.code,
          symptomName: normalized.name,
          category: 'particular' as const,
          location: symptom.location,
          sensation: symptom.sensation,
          weight: symptom.weight || 1, // Default weight for particulars
        };
      })
    );

    // Step 1.4: Normalize modalities
    const normalizedModalities = await Promise.all(
      structuredCase.modalities.map(async (modality) => {
        const normalized = await this.normalizeSymptom(modality.symptomText, 'modality');
        return {
          symptomCode: normalized.code,
          symptomName: normalized.name,
          category: 'modality' as const,
          type: modality.type,
          weight: modality.weight || 1.5, // Default weight for modalities
        };
      })
    );

    // Step 1.5: Determine case type
    const isAcute = structuredCase.pathologyTags.includes('Acute') || 
                    structuredCase.pathologyTags.some(tag => 
                      ['Fever', 'Injury', 'Sudden'].includes(tag)
                    );
    const isChronic = structuredCase.pathologyTags.includes('Chronic');

    return {
      mental: normalizedMental,
      generals: normalizedGenerals,
      particulars: normalizedParticulars,
      modalities: normalizedModalities,
      pathologyTags: structuredCase.pathologyTags,
      isAcute,
      isChronic,
    };
  }

  private async normalizeSymptom(
    symptomText: string,
    category: 'mental' | 'general' | 'particular' | 'modality'
  ) {
    // If already a code, fetch from DB
    if (symptomText.startsWith('SYM_')) {
      const symptom = await Symptom.findOne({ code: symptomText });
      if (symptom) return { code: symptom.code, name: symptom.name };
    }

    // Search by name or synonym
    const symptom = await Symptom.findOne({
      $or: [
        { name: { $regex: symptomText, $options: 'i' } },
        { synonyms: { $in: [symptomText] } }
      ],
      category,
      modality: 'classical_homeopathy'
    });

    if (symptom) {
      return { code: symptom.code, name: symptom.name };
    }

    // If not found, return as-is (will be handled by Symptom Normalization Engine)
    return { code: `TEMP_${Date.now()}`, name: symptomText };
  }
}
```

---

### **Step 2: Symptom Normalization Engine**

**Purpose**: Map free text to standard symptom codes using synonym dictionary.

```typescript
// Symptom Normalization Engine Service
// backend/src/services/symptomNormalization.service.ts

export class SymptomNormalizationEngine {
  /**
   * Normalize symptom text to standard symptom code
   */
  async normalizeSymptomText(
    symptomText: string,
    category?: 'mental' | 'general' | 'particular' | 'modality'
  ): Promise<{
    symptomCode: string;
    symptomName: string;
    confidence: 'exact' | 'high' | 'medium' | 'low';
  }> {
    // Step 2.1: Exact match by code
    if (symptomText.startsWith('SYM_')) {
      const symptom = await Symptom.findOne({ code: symptomText });
      if (symptom) {
        return {
          symptomCode: symptom.code,
          symptomName: symptom.name,
          confidence: 'exact',
        };
      }
    }

    // Step 2.2: Exact match by name
    const exactMatch = await Symptom.findOne({
      name: { $regex: `^${symptomText}$`, $options: 'i' },
      ...(category && { category }),
      modality: 'classical_homeopathy',
    });

    if (exactMatch) {
      return {
        symptomCode: exactMatch.code,
        symptomName: exactMatch.name,
        confidence: 'exact',
      };
    }

    // Step 2.3: Synonym match
    const synonymMatch = await Symptom.findOne({
      synonyms: { $in: [new RegExp(symptomText, 'i')] },
      ...(category && { category }),
      modality: 'classical_homeopathy',
    });

    if (synonymMatch) {
      return {
        symptomCode: synonymMatch.code,
        symptomName: synonymMatch.name,
        confidence: 'high',
      };
    }

    // Step 2.4: Fuzzy text search
    const fuzzyMatches = await Symptom.find({
      $or: [
        { name: { $regex: symptomText, $options: 'i' } },
        { synonyms: { $regex: symptomText, $options: 'i' } },
      ],
      ...(category && { category }),
      modality: 'classical_homeopathy',
    })
      .limit(5)
      .lean();

    if (fuzzyMatches.length > 0) {
      // Return best match (exact substring match preferred)
      const bestMatch = fuzzyMatches.find(
        (s) => s.name.toLowerCase().includes(symptomText.toLowerCase())
      ) || fuzzyMatches[0];

      return {
        symptomCode: bestMatch.code,
        symptomName: bestMatch.name,
        confidence: 'medium',
      };
    }

    // Step 2.5: No match found - return original text
    // (Doctor will need to confirm or create new symptom)
    return {
      symptomCode: `UNKNOWN_${Date.now()}`,
      symptomName: symptomText,
      confidence: 'low',
    };
  }

  /**
   * Normalize array of symptoms
   */
  async normalizeSymptomVector(
    symptoms: Array<{ text: string; category?: string }>
  ): Promise<Array<{ code: string; name: string; confidence: string }>> {
    return Promise.all(
      symptoms.map((symptom) =>
        this.normalizeSymptomText(
          symptom.text,
          symptom.category as any
        )
      )
    );
  }
}
```

---

### **Step 3: Rubric Mapping Engine**

**Purpose**: Map symptoms → relevant rubrics with auto-selection + manual confirmation.

```typescript
// Rubric Mapping Engine Service
// backend/src/services/rubricMapping.service.ts

export class RubricMappingEngine {
  /**
   * Map symptoms to relevant rubrics
   */
  async mapSymptomsToRubrics(
    normalizedCase: NormalizedCaseProfile
  ): Promise<Array<{
    rubricId: mongoose.Types.ObjectId;
    rubricText: string;
    repertoryType: string;
    chapter: string;
    matchedSymptoms: string[];
    autoSelected: boolean;
    confidence: number;
  }>> {
    const allSymptomCodes = [
      ...normalizedCase.mental.map((s) => s.symptomCode),
      ...normalizedCase.generals.map((s) => s.symptomCode),
      ...normalizedCase.particulars.map((s) => s.symptomCode),
      ...normalizedCase.modalities.map((s) => s.symptomCode),
    ];

    // Step 3.1: Find rubrics that contain any of the symptoms
    const rubrics = await Rubric.find({
      linkedSymptoms: { $in: allSymptomCodes },
      modality: 'classical_homeopathy',
    }).lean();

    // Step 3.2: Score rubrics based on symptom matches
    const scoredRubrics = rubrics.map((rubric) => {
      const matchedSymptoms = rubric.linkedSymptoms.filter((code) =>
        allSymptomCodes.includes(code)
      );
      const matchRatio = matchedSymptoms.length / rubric.linkedSymptoms.length;
      const confidence = Math.min(matchRatio * 100, 100);

      return {
        rubricId: rubric._id,
        rubricText: rubric.rubricText,
        repertoryType: rubric.repertoryType,
        chapter: rubric.chapter,
        matchedSymptoms,
        autoSelected: confidence >= 70, // Auto-select if 70%+ match
        confidence,
      };
    });

    // Step 3.3: Sort by confidence
    return scoredRubrics.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get rubric suggestions for manual selection
   */
  async suggestRubrics(
    symptomCode: string,
    repertoryType?: string
  ): Promise<Array<{
    rubricId: mongoose.Types.ObjectId;
    rubricText: string;
    chapter: string;
    matchScore: number;
  }>> {
    const query: any = {
      linkedSymptoms: symptomCode,
      modality: 'classical_homeopathy',
    };

    if (repertoryType) {
      query.repertoryType = repertoryType;
    }

    const rubrics = await Rubric.find(query).lean();

    return rubrics.map((rubric) => ({
      rubricId: rubric._id,
      rubricText: rubric.rubricText,
      chapter: rubric.chapter,
      matchScore: rubric.linkedSymptoms.length, // More symptoms = better match
    }));
  }
}
```

---

### **Step 4: Repertory Engine**

**Purpose**: Fetch remedies + grades from selected rubrics and build Remedy Pool.

```typescript
// Repertory Engine Service
// backend/src/services/repertoryEngine.service.ts

export class RepertoryEngine {
  /**
   * Build remedy pool from selected rubrics
   */
  async buildRemedyPool(
    selectedRubricIds: mongoose.Types.ObjectId[]
  ): Promise<Map<string, RemedyScore>> {
    // Step 4.1: Fetch all rubric-remedy mappings
    const rubricRemedies = await RubricRemedy.find({
      rubricId: { $in: selectedRubricIds },
    }).populate('remedyId').lean();

    // Step 4.2: Build remedy pool with grades
    const remedyPool = new Map<string, RemedyScore>();

    rubricRemedies.forEach((rr) => {
      const remedyId = rr.remedyId._id.toString();
      const remedy = rr.remedyId as any;

      if (!remedyPool.has(remedyId)) {
        remedyPool.set(remedyId, {
          remedyId: remedy._id,
          remedyName: remedy.name,
          rubricGrades: [],
          totalBaseScore: 0,
        });
      }

      const remedyScore = remedyPool.get(remedyId)!;
      remedyScore.rubricGrades.push({
        rubricId: rr.rubricId,
        grade: rr.grade,
        repertoryType: rr.repertoryType,
      });
      remedyScore.totalBaseScore += rr.grade;
    });

    return remedyPool;
  }

  /**
   * Get remedy details
   */
  async getRemedyDetails(remedyId: mongoose.Types.ObjectId) {
    return Remedy.findById(remedyId).lean();
  }
}

interface RemedyScore {
  remedyId: mongoose.Types.ObjectId;
  remedyName: string;
  rubricGrades: Array<{
    rubricId: mongoose.Types.ObjectId;
    grade: number;
    repertoryType: string;
  }>;
  totalBaseScore: number;
}
```

---

### **Step 5: Smart Scoring Engine (CORE)**

**Purpose**: Implement scoring formula with weights and bonuses.

```typescript
// Scoring Engine Service
// backend/src/services/scoringEngine.service.ts

export class ScoringEngine {
  /**
   * Calculate final score for remedies
   * 
   * Formula:
   * FinalScore = 
   *   Σ(rubric_grade × symptom_weight)
   *   + constitution_bonus
   *   + modality_bonus
   *   + pathology_support
   *   - contradiction_penalty
   */
  async calculateRemedyScores(
    remedyPool: Map<string, RemedyScore>,
    normalizedCase: NormalizedCaseProfile,
    selectedRubrics: Array<{
      rubricId: mongoose.Types.ObjectId;
      matchedSymptoms: string[];
    }>
  ): Promise<Array<RemedyFinalScore>> {
    const scoredRemedies: RemedyFinalScore[] = [];

    for (const [remedyId, remedyScore] of remedyPool.entries()) {
      const remedy = await Remedy.findById(remedyId).lean();

      // Step 5.1: Calculate base score (Σ(rubric_grade × symptom_weight))
      let baseScore = 0;

      remedyScore.rubricGrades.forEach((rg) => {
        // Find which symptoms matched this rubric
        const rubric = selectedRubrics.find(
          (sr) => sr.rubricId.toString() === rg.rubricId.toString()
        );

        if (rubric) {
          // Calculate weight for each matched symptom
          rubric.matchedSymptoms.forEach((symptomCode) => {
            // Find symptom in normalized case to get weight
            const symptom = this.findSymptomInCase(normalizedCase, symptomCode);
            if (symptom) {
              baseScore += rg.grade * symptom.weight;
            }
          });
        }
      });

      // Step 5.2: Constitution bonus
      const constitutionBonus = this.calculateConstitutionBonus(
        remedy!,
        normalizedCase
      );

      // Step 5.3: Modality bonus
      const modalityBonus = this.calculateModalityBonus(
        remedy!,
        normalizedCase
      );

      // Step 5.4: Pathology support
      const pathologySupport = this.calculatePathologySupport(
        remedy!,
        normalizedCase.pathologyTags
      );

      // Step 5.5: Contradiction penalty (will be calculated in Step 7)
      const contradictionPenalty = 0; // Placeholder

      // Step 5.6: Calculate final score
      const finalScore =
        baseScore +
        constitutionBonus +
        modalityBonus +
        pathologySupport -
        contradictionPenalty;

      scoredRemedies.push({
        remedyId: remedy!._id,
        remedyName: remedy!.name,
        finalScore,
        baseScore,
        constitutionBonus,
        modalityBonus,
        pathologySupport,
        contradictionPenalty,
        matchedRubrics: remedyScore.rubricGrades.map((rg) => rg.rubricId.toString()),
        matchedSymptoms: this.getMatchedSymptoms(normalizedCase, selectedRubrics),
        confidence: this.calculateConfidence(finalScore, baseScore),
      });
    }

    // Step 5.7: Sort by final score
    return scoredRemedies.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Symptom weights:
   * - mental = 3
   * - generals = 2
   * - particulars = 1
   * - modalities = 1.5
   */
  private findSymptomInCase(
    normalizedCase: NormalizedCaseProfile,
    symptomCode: string
  ): { weight: number } | null {
    const allSymptoms = [
      ...normalizedCase.mental,
      ...normalizedCase.generals,
      ...normalizedCase.particulars,
      ...normalizedCase.modalities,
    ];

    const symptom = allSymptoms.find((s) => s.symptomCode === symptomCode);
    return symptom ? { weight: symptom.weight } : null;
  }

  /**
   * Calculate constitution bonus
   */
  private calculateConstitutionBonus(
    remedy: any,
    normalizedCase: NormalizedCaseProfile
  ): number {
    // Match constitution traits with mental symptoms
    const mentalSymptomNames = normalizedCase.mental.map((s) =>
      s.symptomName.toLowerCase()
    );

    const matchingTraits = remedy.constitutionTraits.filter((trait: string) =>
      mentalSymptomNames.some((name) => name.includes(trait.toLowerCase()))
    );

    // Bonus = number of matching traits × 2
    return matchingTraits.length * 2;
  }

  /**
   * Calculate modality bonus
   */
  private calculateModalityBonus(
    remedy: any,
    normalizedCase: NormalizedCaseProfile
  ): number {
    let bonus = 0;

    normalizedCase.modalities.forEach((modality) => {
      if (modality.type === 'worse') {
        // Check if remedy has this "worse" modality
        if (remedy.modalities.worse.includes(modality.symptomName)) {
          bonus += 3; // Strong match
        }
      } else if (modality.type === 'better') {
        // Check if remedy has this "better" modality
        if (remedy.modalities.better.includes(modality.symptomName)) {
          bonus += 2; // Moderate match
        }
      }
    });

    return bonus;
  }

  /**
   * Calculate pathology support
   */
  private calculatePathologySupport(
    remedy: any,
    pathologyTags: string[]
  ): number {
    // Check if remedy's clinical indications match pathology tags
    const matchingIndications = remedy.clinicalIndications.filter((ind: string) =>
      pathologyTags.some((tag) =>
        ind.toLowerCase().includes(tag.toLowerCase())
      )
    );

    // Bonus = number of matching indications × 1.5
    return matchingIndications.length * 1.5;
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    finalScore: number,
    baseScore: number
  ): 'low' | 'medium' | 'high' | 'very_high' {
    if (finalScore >= 100) return 'very_high';
    if (finalScore >= 70) return 'high';
    if (finalScore >= 40) return 'medium';
    return 'low';
  }

  private getMatchedSymptoms(
    normalizedCase: NormalizedCaseProfile,
    selectedRubrics: Array<{ matchedSymptoms: string[] }>
  ): string[] {
    const allMatched = selectedRubrics.flatMap((sr) => sr.matchedSymptoms);
    return [...new Set(allMatched)]; // Unique symptoms
  }
}

interface RemedyFinalScore {
  remedyId: mongoose.Types.ObjectId;
  remedyName: string;
  finalScore: number;
  baseScore: number;
  constitutionBonus: number;
  modalityBonus: number;
  pathologySupport: number;
  contradictionPenalty: number;
  matchedRubrics: string[];
  matchedSymptoms: string[];
  confidence: 'low' | 'medium' | 'high' | 'very_high';
}
```

---

### **Step 6: Clinical Intelligence Layer**

**Purpose**: Apply clinical filters (acute vs chronic bias, mental dominance, etc.)

```typescript
// Clinical Intelligence Layer Service
// backend/src/services/clinicalIntelligence.service.ts

export class ClinicalIntelligenceLayer {
  /**
   * Apply clinical intelligence filters
   * This layer ADJUSTS scores, does NOT override repertory results
   */
  async applyClinicalFilters(
    scoredRemedies: RemedyFinalScore[],
    normalizedCase: NormalizedCaseProfile
  ): Promise<RemedyFinalScore[]> {
    return scoredRemedies.map((remedy) => {
      let adjustedScore = remedy.finalScore;

      // Filter 1: Acute vs Chronic bias
      if (normalizedCase.isAcute) {
        // Boost acute remedies (typically high potencies work better)
        const remedyDetails = await Remedy.findById(remedy.remedyId).lean();
        if (remedyDetails?.clinicalIndications.includes('Acute')) {
          adjustedScore *= 1.15; // 15% boost for acute cases
        }
      } else if (normalizedCase.isChronic) {
        // Boost constitutional remedies for chronic cases
        if (remedy.constitutionBonus > 5) {
          adjustedScore *= 1.1; // 10% boost
        }
      }

      // Filter 2: Mental dominance
      if (normalizedCase.mental.length > normalizedCase.generals.length + normalizedCase.particulars.length) {
        // Mental symptoms dominate - boost remedies with strong mental symptoms
        if (remedy.constitutionBonus > 3) {
          adjustedScore *= 1.1; // 10% boost
        }
      }

      // Filter 3: Constitutional similarity
      // (Already handled in constitution bonus, but can add more logic here)

      // Filter 4: Disease support (non-ruling)
      // Pathology support already calculated, but can add disease-specific logic

      return {
        ...remedy,
        finalScore: adjustedScore,
      };
    });
  }
}
```

---

### **Step 7: Contradiction & Safety Engine**

**Purpose**: Detect incompatibilities, opposite modality conflicts, repetition warnings.

```typescript
// Contradiction & Safety Engine Service
// backend/src/services/contradictionEngine.service.ts

export class ContradictionEngine {
  /**
   * Detect contradictions and safety issues
   */
  async detectContradictions(
    scoredRemedies: RemedyFinalScore[],
    patientHistory?: Array<{ remedyId: string; date: Date }>
  ): Promise<Array<{
    remedy: RemedyFinalScore;
    warnings: Array<{
      type: 'contradiction' | 'incompatibility' | 'repetition';
      message: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    penalty: number;
  }>> {
    const results = [];

    for (const remedy of scoredRemedies) {
      const remedyDetails = await Remedy.findById(remedy.remedyId).lean();
      const warnings: Array<{
        type: 'contradiction' | 'incompatibility' | 'repetition';
        message: string;
        severity: 'low' | 'medium' | 'high';
      }> = [];
      let penalty = 0;

      // Check 1: Incompatible remedies
      if (remedyDetails?.incompatibilities) {
        const incompatibleRemedies = scoredRemedies.filter((r) =>
          remedyDetails.incompatibilities.includes(r.remedyId.toString())
        );

        if (incompatibleRemedies.length > 0) {
          warnings.push({
            type: 'incompatibility',
            message: `Incompatible with: ${incompatibleRemedies.map((r) => r.remedyName).join(', ')}`,
            severity: 'high',
          });
          penalty += 20; // High penalty
        }
      }

      // Check 2: Opposite modality conflicts
      // (Can add logic to detect remedies with opposite modalities)

      // Check 3: Repetition warnings
      if (patientHistory) {
        const recentUse = patientHistory.find(
          (h) =>
            h.remedyId === remedy.remedyId.toString() &&
            h.date > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        );

        if (recentUse) {
          warnings.push({
            type: 'repetition',
            message: 'This remedy was used recently. Consider waiting or using different potency.',
            severity: 'medium',
          });
          penalty += 10; // Medium penalty
        }
      }

      results.push({
        remedy: {
          ...remedy,
          contradictionPenalty: penalty,
          finalScore: remedy.finalScore - penalty,
        },
        warnings,
        penalty,
      });
    }

    return results;
  }
}
```

---

### **Step 8: Suggestion Engine**

**Purpose**: Return ranked remedies with transparent reasoning.

```typescript
// Suggestion Engine Service
// backend/src/services/suggestionEngine.service.ts

export class SuggestionEngine {
  /**
   * Generate final suggestions with transparent reasoning
   */
  async generateSuggestions(
    filteredRemedies: Array<{
      remedy: RemedyFinalScore;
      warnings: Array<any>;
    }>,
    normalizedCase: NormalizedCaseProfile,
    selectedRubrics: Array<any>
  ): Promise<{
    topRemedies: Array<{
      remedy: {
        id: string;
        name: string;
        category: string;
      };
      matchScore: number;
      confidence: string;
      matchedSymptoms: string[];
      matchedRubrics: string[];
      clinicalReasoning: string;
      suggestedPotency: string;
      repetition: string;
      warnings: Array<any>;
    }>;
    summary: {
      totalRemedies: number;
      highConfidence: number;
      warnings: number;
    };
  }> {
    // Step 8.1: Get top 10 remedies
    const topRemedies = filteredRemedies
      .sort((a, b) => b.remedy.finalScore - a.remedy.finalScore)
      .slice(0, 10);

    // Step 8.2: Generate suggestions with reasoning
    const suggestions = await Promise.all(
      topRemedies.map(async (item) => {
        const remedyDetails = await Remedy.findById(item.remedy.remedyId).lean();

        // Generate clinical reasoning
        const clinicalReasoning = this.generateClinicalReasoning(
          item.remedy,
          normalizedCase,
          remedyDetails
        );

        // Suggest potency
        const potencySuggestion = this.suggestPotency(
          item.remedy.finalScore,
          normalizedCase.isAcute,
          normalizedCase.pathologyTags
        );

        return {
          remedy: {
            id: item.remedy.remedyId.toString(),
            name: item.remedy.remedyName,
            category: remedyDetails?.category || 'Unknown',
          },
          matchScore: item.remedy.finalScore,
          confidence: item.remedy.confidence,
          matchedSymptoms: item.remedy.matchedSymptoms,
          matchedRubrics: item.remedy.matchedRubrics,
          clinicalReasoning,
          suggestedPotency: potencySuggestion.potency,
          repetition: potencySuggestion.repetition,
          warnings: item.warnings,
        };
      })
    );

    return {
      topRemedies: suggestions,
      summary: {
        totalRemedies: filteredRemedies.length,
        highConfidence: suggestions.filter((s) => s.confidence === 'high' || s.confidence === 'very_high').length,
        warnings: suggestions.reduce((sum, s) => sum + s.warnings.length, 0),
      },
    };
  }

  /**
   * Generate transparent clinical reasoning
   */
  private generateClinicalReasoning(
    remedy: RemedyFinalScore,
    normalizedCase: NormalizedCaseProfile,
    remedyDetails: any
  ): string {
    const reasons: string[] = [];

    // Base score reasoning
    reasons.push(
      `Base score: ${remedy.baseScore.toFixed(2)} (from ${remedy.matchedRubrics.length} matched rubrics)`
    );

    // Constitution bonus
    if (remedy.constitutionBonus > 0) {
      reasons.push(
        `Constitution match: +${remedy.constitutionBonus} (matches patient's constitutional traits)`
      );
    }

    // Modality bonus
    if (remedy.modalityBonus > 0) {
      reasons.push(
        `Modality match: +${remedy.modalityBonus} (matches patient's better/worse conditions)`
      );
    }

    // Pathology support
    if (remedy.pathologySupport > 0) {
      reasons.push(
        `Pathology support: +${remedy.pathologySupport} (indicated for ${normalizedCase.pathologyTags.join(', ')})`
      );
    }

    // Contradiction penalty
    if (remedy.contradictionPenalty > 0) {
      reasons.push(
        `Safety adjustment: -${remedy.contradictionPenalty} (contradictions detected)`
      );
    }

    // Keynotes match
    if (remedyDetails?.materiaMedica?.keynotes) {
      const matchingKeynotes = remedyDetails.materiaMedica.keynotes.filter((keynote: string) =>
        normalizedCase.mental.some((s) => s.symptomName.toLowerCase().includes(keynote.toLowerCase()))
      );

      if (matchingKeynotes.length > 0) {
        reasons.push(
          `Keynotes match: ${matchingKeynotes.join(', ')}`
        );
      }
    }

    return reasons.join('. ');
  }

  /**
   * Suggest potency based on score and case type
   */
  private suggestPotency(
    finalScore: number,
    isAcute: boolean,
    pathologyTags: string[]
  ): { potency: string; repetition: string } {
    if (isAcute) {
      if (finalScore >= 80) {
        return { potency: '200C', repetition: 'Every 1-2 hours' };
      } else if (finalScore >= 50) {
        return { potency: '30C', repetition: 'Every 2-4 hours' };
      } else {
        return { potency: '6C', repetition: 'Every 4-6 hours' };
      }
    } else {
      // Chronic case
      if (finalScore >= 80) {
        return { potency: '200C', repetition: 'Once daily' };
      } else if (finalScore >= 60) {
        return { potency: '30C', repetition: 'Twice daily' };
      } else {
        return { potency: '6C', repetition: 'Three times daily' };
      }
    }
  }
}
```

---

### **Step 9: Outcome & Learning Hook**

**Purpose**: Store doctor decisions and outcomes for future learning.

```typescript
// Outcome & Learning Hook Service
// backend/src/services/outcomeLearning.service.ts

export class OutcomeLearningHook {
  /**
   * Save case record with engine output
   */
  async saveCaseRecord(
    doctorId: mongoose.Types.ObjectId,
    patientId: mongoose.Types.ObjectId,
    structuredCase: StructuredCase,
    selectedRubrics: Array<any>,
    engineOutput: {
      remedyScores: RemedyFinalScore[];
      clinicalReasoning: string;
      warnings: Array<any>;
    }
  ): Promise<ICaseRecord> {
    return CaseRecord.create({
      doctorId,
      patientId,
      structuredCase,
      selectedRubrics,
      engineOutput,
      finalRemedy: null, // Will be set when doctor selects
      outcomeStatus: 'pending',
    });
  }

  /**
   * Update with doctor's final decision
   */
  async updateDoctorDecision(
    caseRecordId: mongoose.Types.ObjectId,
    finalRemedy: {
      remedyId: mongoose.Types.ObjectId;
      remedyName: string;
      potency: string;
      repetition: string;
      notes?: string;
    }
  ): Promise<void> {
    await CaseRecord.findByIdAndUpdate(caseRecordId, {
      finalRemedy,
    });
  }

  /**
   * Update outcome status
   */
  async updateOutcome(
    caseRecordId: mongoose.Types.ObjectId,
    outcomeStatus: 'improved' | 'no_change' | 'worsened' | 'not_followed',
    followUpNotes?: string
  ): Promise<void> {
    await CaseRecord.findByIdAndUpdate(caseRecordId, {
      outcomeStatus,
      followUpNotes,
    });
  }

  /**
   * Calculate success rate (for statistics)
   */
  async calculateSuccessRate(
    remedyId: mongoose.Types.ObjectId,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    totalCases: number;
    improved: number;
    noChange: number;
    worsened: number;
    successRate: number;
  }> {
    const query: any = {
      'finalRemedy.remedyId': remedyId,
      outcomeStatus: { $ne: 'pending' },
    };

    if (timeRange) {
      query.createdAt = { $gte: timeRange.start, $lte: timeRange.end };
    }

    const cases = await CaseRecord.find(query).lean();

    const improved = cases.filter((c) => c.outcomeStatus === 'improved').length;
    const noChange = cases.filter((c) => c.outcomeStatus === 'no_change').length;
    const worsened = cases.filter((c) => c.outcomeStatus === 'worsened').length;

    return {
      totalCases: cases.length,
      improved,
      noChange,
      worsened,
      successRate: cases.length > 0 ? (improved / cases.length) * 100 : 0,
    };
  }

  /**
   * Find symptom-remedy patterns (for future ML)
   */
  async findSymptomRemedyPatterns(
    symptomCode: string
  ): Promise<Array<{
    remedyId: string;
    remedyName: string;
    frequency: number;
    successRate: number;
  }>> {
    const cases = await CaseRecord.find({
      'structuredCase.mental.symptomCode': symptomCode,
      outcomeStatus: 'improved',
    }).lean();

    // Count remedy frequency
    const remedyCounts = new Map<string, { count: number; name: string }>();

    cases.forEach((c) => {
      if (c.finalRemedy) {
        const remedyId = c.finalRemedy.remedyId.toString();
        if (!remedyCounts.has(remedyId)) {
          remedyCounts.set(remedyId, {
            count: 0,
            name: c.finalRemedy.remedyName,
          });
        }
        remedyCounts.get(remedyId)!.count++;
      }
    });

    // Calculate success rates
    const patterns = Array.from(remedyCounts.entries()).map(([remedyId, data]) => {
      const successRate = await this.calculateSuccessRate(
        new mongoose.Types.ObjectId(remedyId)
      );

      return {
        remedyId,
        remedyName: data.name,
        frequency: data.count,
        successRate: successRate.successRate,
      };
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }
}
```

---

## 🔄 Complete Engine Flow Integration

```typescript
// Main Rule Engine Service
// backend/src/services/classicalHomeopathyRuleEngine.service.ts

export class ClassicalHomeopathyRuleEngine {
  private caseEngine: CaseEngine;
  private symptomNormalization: SymptomNormalizationEngine;
  private rubricMapping: RubricMappingEngine;
  private repertoryEngine: RepertoryEngine;
  private scoringEngine: ScoringEngine;
  private clinicalIntelligence: ClinicalIntelligenceLayer;
  private contradictionEngine: ContradictionEngine;
  private suggestionEngine: SuggestionEngine;
  private outcomeHook: OutcomeLearningHook;

  constructor() {
    this.caseEngine = new CaseEngine();
    this.symptomNormalization = new SymptomNormalizationEngine();
    this.rubricMapping = new RubricMappingEngine();
    this.repertoryEngine = new RepertoryEngine();
    this.scoringEngine = new ScoringEngine();
    this.clinicalIntelligence = new ClinicalIntelligenceLayer();
    this.contradictionEngine = new ContradictionEngine();
    this.suggestionEngine = new SuggestionEngine();
    this.outcomeHook = new OutcomeLearningHook();
  }

  /**
   * Main entry point - Process complete case
   */
  async processCase(
    doctorId: mongoose.Types.ObjectId,
    patientId: mongoose.Types.ObjectId,
    structuredCase: StructuredCase,
    patientHistory?: Array<{ remedyId: string; date: Date }>
  ): Promise<{
    suggestions: any;
    caseRecordId: mongoose.Types.ObjectId;
  }> {
    // Step 1: Case Intake
    const normalizedCase = await this.caseEngine.normalizeCase(structuredCase);

    // Step 2: Symptom Normalization (if needed)
    // (Already done in Step 1, but can re-normalize if needed)

    // Step 3: Rubric Mapping
    const rubricMappings = await this.rubricMapping.mapSymptomsToRubrics(normalizedCase);
    const selectedRubrics = rubricMappings.filter((r) => r.autoSelected);

    // Step 4: Repertory Engine
    const remedyPool = await this.repertoryEngine.buildRemedyPool(
      selectedRubrics.map((r) => r.rubricId)
    );

    // Step 5: Smart Scoring
    const scoredRemedies = await this.scoringEngine.calculateRemedyScores(
      remedyPool,
      normalizedCase,
      selectedRubrics
    );

    // Step 6: Clinical Intelligence
    const filteredRemedies = await this.clinicalIntelligence.applyClinicalFilters(
      scoredRemedies,
      normalizedCase
    );

    // Step 7: Contradiction Detection
    const safetyChecked = await this.contradictionEngine.detectContradictions(
      filteredRemedies,
      patientHistory
    );

    // Step 8: Generate Suggestions
    const suggestions = await this.suggestionEngine.generateSuggestions(
      safetyChecked,
      normalizedCase,
      selectedRubrics
    );

    // Step 9: Save Case Record
    const caseRecord = await this.outcomeHook.saveCaseRecord(
      doctorId,
      patientId,
      structuredCase,
      selectedRubrics,
      {
        remedyScores: safetyChecked.map((sc) => sc.remedy),
        clinicalReasoning: suggestions.summary.totalRemedies.toString(),
        warnings: safetyChecked.flatMap((sc) => sc.warnings),
      }
    );

    return {
      suggestions,
      caseRecordId: caseRecord._id,
    };
  }
}
```

---

## 🔄 Rule Engine Flow - Step by Step (Simplified View)

### **Step 1: Doctor Selects Symptoms** (Enhanced)

**Doctor Consultation Page se symptoms select karta hai:**

```typescript
// Selected Symptoms
const selectedSymptoms = [
  {
    id: "symptom_1",
    name: "Fever - Sudden",
    location: "Whole Body",
    sensation: "Burning",
    modalities: ["Worse - Evening", "Better - Rest"],
    repertoryRubrics: [
      "FEVER - sudden",
      "FEVER - burning",
      "FEVER - evening"
    ]
  },
  {
    id: "symptom_2",
    name: "Fear - Death",
    location: "Mind",
    sensation: null,
    modalities: ["Worse - Night"],
    repertoryRubrics: [
      "FEAR - death, of",
      "FEAR - night"
    ]
  },
  {
    id: "symptom_3",
    name: "Restlessness",
    location: "Mind",
    sensation: null,
    modalities: null,
    repertoryRubrics: [
      "RESTLESSNESS"
    ]
  }
];
```

---

### **Step 2: Extract Repertory Rubrics**

```typescript
function extractRubrics(selectedSymptoms: Symptom[]) {
  const rubrics = [];
  
  selectedSymptoms.forEach(symptom => {
    symptom.repertoryRubrics.forEach(rubric => {
      rubrics.push({
        rubric: rubric.rubric,
        grade: rubric.grade || 1,
        symptomId: symptom.id
      });
    });
  });
  
  return rubrics;
}

// Result:
const rubrics = [
  { rubric: "FEVER - sudden", grade: 4, symptomId: "symptom_1" },
  { rubric: "FEVER - burning", grade: 3, symptomId: "symptom_1" },
  { rubric: "FEVER - evening", grade: 2, symptomId: "symptom_1" },
  { rubric: "FEAR - death, of", grade: 4, symptomId: "symptom_2" },
  { rubric: "FEAR - night", grade: 3, symptomId: "symptom_2" },
  { rubric: "RESTLESSNESS", grade: 3, symptomId: "symptom_3" }
];
```

---

### **Step 3: Find Matching Medicines from Repertory**

```typescript
async function findMatchingMedicines(rubrics: Rubric[]) {
  const medicineScores = {};
  
  // Har rubric ke liye medicines find karo
  for (const rubric of rubrics) {
    const matchingMedicines = await RepertoryRubric.find({
      rubric: rubric.rubric
    });
    
    // Har medicine ko score do
    matchingMedicines.forEach(med => {
      const medicineId = med.medicineId.toString();
      
      if (!medicineScores[medicineId]) {
        medicineScores[medicineId] = {
          medicineId: medicineId,
          totalScore: 0,
          rubricCount: 0,
          rubrics: [],
          grades: []
        };
      }
      
      // Score calculation: rubric grade × medicine grade
      const score = rubric.grade * med.grade;
      medicineScores[medicineId].totalScore += score;
      medicineScores[medicineId].rubricCount += 1;
      medicineScores[medicineId].rubrics.push(rubric.rubric);
      medicineScores[medicineId].grades.push(med.grade);
    });
  }
  
  return medicineScores;
}

// Example Result:
{
  "aconite_id": {
    medicineId: "aconite_id",
    totalScore: 28, // (4×4) + (3×3) + (2×2) + (4×4) + (3×3) + (3×3)
    rubricCount: 6,
    rubrics: [
      "FEVER - sudden",
      "FEVER - burning",
      "FEVER - evening",
      "FEAR - death, of",
      "FEAR - night",
      "RESTLESSNESS"
    ],
    grades: [4, 3, 2, 4, 3, 3]
  },
  "belladonna_id": {
    medicineId: "belladonna_id",
    totalScore: 15,
    rubricCount: 3,
    rubrics: ["FEVER - sudden", "FEVER - burning", "RESTLESSNESS"],
    grades: [3, 2, 2]
  }
}
```

---

### **Step 4: Calculate Match Score**

```typescript
function calculateMatchScore(medicineData: MedicineScore, totalRubrics: number) {
  const baseScore = medicineData.totalScore;
  const coverage = (medicineData.rubricCount / totalRubrics) * 100;
  const averageGrade = medicineData.grades.reduce((a, b) => a + b, 0) / medicineData.grades.length;
  
  // Weighted score
  const matchScore = (
    baseScore * 0.5 +           // Base score (50%)
    coverage * 0.3 +             // Coverage (30%)
    averageGrade * 10 * 0.2      // Average grade (20%)
  );
  
  return {
    medicineId: medicineData.medicineId,
    matchScore: matchScore,
    coverage: coverage,
    rubricCount: medicineData.rubricCount,
    totalRubrics: totalRubrics
  };
}

// Example:
{
  medicineId: "aconite_id",
  matchScore: 85.6,
  coverage: 100, // 6/6 rubrics matched
  rubricCount: 6,
  totalRubrics: 6
}
```

---

### **Step 5: Apply Materia Medica Filtering**

```typescript
async function applyMateriaMedicaFilter(
  medicineScores: MedicineScore[],
  selectedSymptoms: Symptom[]
) {
  const filteredMedicines = [];
  
  for (const score of medicineScores) {
    const medicine = await Medicine.findById(score.medicineId);
    
    // Check if medicine's keynotes match selected symptoms
    const keynoteMatch = checkKeynoteMatch(medicine.materiaMedica.keynotes, selectedSymptoms);
    
    // Check if modalities match
    const modalityMatch = checkModalityMatch(medicine.materiaMedica.modalities, selectedSymptoms);
    
    // Boost score if matches
    if (keynoteMatch) {
      score.matchScore *= 1.2; // 20% boost
    }
    
    if (modalityMatch) {
      score.matchScore *= 1.1; // 10% boost
    }
    
    filteredMedicines.push({
      ...score,
      medicine: medicine,
      keynoteMatch: keynoteMatch,
      modalityMatch: modalityMatch
    });
  }
  
  return filteredMedicines;
}

function checkKeynoteMatch(keynotes: string[], symptoms: Symptom[]) {
  const symptomNames = symptoms.map(s => s.name.toLowerCase());
  return keynotes.some(keynote => 
    symptomNames.some(name => name.includes(keynote.toLowerCase()))
  );
}

function checkModalityMatch(medicineModalities: Modalities, symptoms: Symptom[]) {
  const symptomModalities = symptoms.flatMap(s => s.modalities || []);
  
  // Check if "worse" modalities match
  const worseMatch = medicineModalities.worse.some(w => 
    symptomModalities.some(sm => sm.includes(w))
  );
  
  // Check if "better" modalities match
  const betterMatch = medicineModalities.better.some(b => 
    symptomModalities.some(sm => sm.includes(b))
  );
  
  return worseMatch || betterMatch;
}
```

---

### **Step 6: Suggest Potency**

```typescript
function suggestPotency(
  matchScore: number,
  symptomSeverity: 'low' | 'medium' | 'high',
  isAcute: boolean
) {
  // Acute cases
  if (isAcute) {
    if (symptomSeverity === 'high') {
      return { potency: '200C', repetition: 'Every 1-2 hours' };
    } else if (symptomSeverity === 'medium') {
      return { potency: '30C', repetition: 'Every 2-4 hours' };
    } else {
      return { potency: '6C', repetition: 'Every 4-6 hours' };
    }
  }
  
  // Chronic cases
  if (matchScore > 80) {
    return { potency: '200C', repetition: 'Once daily' };
  } else if (matchScore > 60) {
    return { potency: '30C', repetition: 'Twice daily' };
  } else {
    return { potency: '6C', repetition: 'Three times daily' };
  }
}
```

---

### **Step 7: Final Medicine Suggestions**

```typescript
async function getClassicalHomeopathySuggestions(
  selectedSymptoms: Symptom[],
  doctorId: string
) {
  // Step 1: Extract rubrics
  const rubrics = extractRubrics(selectedSymptoms);
  
  // Step 2: Find matching medicines
  const medicineScores = await findMatchingMedicines(rubrics);
  
  // Step 3: Calculate match scores
  const scoredMedicines = Object.values(medicineScores).map(med => 
    calculateMatchScore(med, rubrics.length)
  );
  
  // Step 4: Apply Materia Medica filtering
  const filteredMedicines = await applyMateriaMedicaFilter(
    scoredMedicines,
    selectedSymptoms
  );
  
  // Step 5: Sort by match score
  const sortedMedicines = filteredMedicines.sort((a, b) => 
    b.matchScore - a.matchScore
  );
  
  // Step 6: Get top 10 suggestions
  const topMedicines = sortedMedicines.slice(0, 10);
  
  // Step 7: Add potency suggestions
  const suggestions = topMedicines.map(med => {
    const isAcute = selectedSymptoms.some(s => s.severity === 'high');
    const avgSeverity = calculateAverageSeverity(selectedSymptoms);
    
    return {
      medicine: med.medicine,
      matchScore: med.matchScore,
      coverage: med.coverage,
      rubricCount: med.rubricCount,
      suggestedPotency: suggestPotency(
        med.matchScore,
        avgSeverity,
        isAcute
      ),
      matchedRubrics: med.rubrics,
      keynoteMatch: med.keynoteMatch,
      modalityMatch: med.modalityMatch
    };
  });
  
  return suggestions;
}
```

---

## 📋 Complete Flow Example

### **Input: Selected Symptoms**

```json
[
  {
    "name": "Fever - Sudden",
    "location": "Whole Body",
    "sensation": "Burning",
    "modalities": ["Worse - Evening"],
    "severity": "high",
    "repertoryRubrics": [
      { "rubric": "FEVER - sudden", "grade": 4 },
      { "rubric": "FEVER - burning", "grade": 3 },
      { "rubric": "FEVER - evening", "grade": 2 }
    ]
  },
  {
    "name": "Fear - Death",
    "location": "Mind",
    "modalities": ["Worse - Night"],
    "severity": "high",
    "repertoryRubrics": [
      { "rubric": "FEAR - death, of", "grade": 4 },
      { "rubric": "FEAR - night", "grade": 3 }
    ]
  },
  {
    "name": "Restlessness",
    "location": "Mind",
    "severity": "medium",
    "repertoryRubrics": [
      { "rubric": "RESTLESSNESS", "grade": 3 }
    ]
  }
]
```

---

### **Step-by-Step Processing**

#### **Step 1: Extract Rubrics**
```
Total Rubrics: 6
- FEVER - sudden (grade 4)
- FEVER - burning (grade 3)
- FEVER - evening (grade 2)
- FEAR - death, of (grade 4)
- FEAR - night (grade 3)
- RESTLESSNESS (grade 3)
```

#### **Step 2: Repertory Matching**

**Aconite Matches**:
- FEVER - sudden → Grade 4 (Aconite grade 4) = Score 16
- FEVER - burning → Grade 3 (Aconite grade 3) = Score 9
- FEVER - evening → Grade 2 (Aconite grade 2) = Score 4
- FEAR - death, of → Grade 4 (Aconite grade 4) = Score 16
- FEAR - night → Grade 3 (Aconite grade 3) = Score 9
- RESTLESSNESS → Grade 3 (Aconite grade 3) = Score 9
- **Total Score: 63**
- **Coverage: 100% (6/6 rubrics)**

**Belladonna Matches**:
- FEVER - sudden → Grade 4 (Belladonna grade 3) = Score 12
- FEVER - burning → Grade 3 (Belladonna grade 2) = Score 6
- RESTLESSNESS → Grade 3 (Belladonna grade 2) = Score 6
- **Total Score: 24**
- **Coverage: 50% (3/6 rubrics)**

#### **Step 3: Materia Medica Check**

**Aconite Keynotes**:
- ✅ "Sudden onset" → Matches "Fever - Sudden"
- ✅ "Fear of death" → Matches "Fear - Death"
- ✅ "Restlessness" → Matches "Restlessness"
- **Keynote Match: Yes** → Score boost 20%

**Aconite Modalities**:
- ✅ Worse: "Evening", "Night" → Matches symptoms
- **Modality Match: Yes** → Score boost 10%

**Final Aconite Score**: 63 × 1.2 × 1.1 = **83.16**

#### **Step 4: Potency Suggestion**

- Match Score: 83.16 (High)
- Severity: High
- Is Acute: Yes (sudden onset)
- **Suggested Potency: 200C**
- **Repetition: Every 1-2 hours**

---

### **Output: Top Suggestions**

```json
[
  {
    "medicine": {
      "id": "aconite_id",
      "name": "Aconite",
      "category": "Plant Kingdom"
    },
    "matchScore": 83.16,
    "coverage": 100,
    "rubricCount": 6,
    "suggestedPotency": {
      "potency": "200C",
      "repetition": "Every 1-2 hours"
    },
    "matchedRubrics": [
      "FEVER - sudden",
      "FEVER - burning",
      "FEVER - evening",
      "FEAR - death, of",
      "FEAR - night",
      "RESTLESSNESS"
    ],
    "keynoteMatch": true,
    "modalityMatch": true,
    "confidence": "Very High"
  },
  {
    "medicine": {
      "id": "belladonna_id",
      "name": "Belladonna",
      "category": "Plant Kingdom"
    },
    "matchScore": 24.0,
    "coverage": 50,
    "rubricCount": 3,
    "suggestedPotency": {
      "potency": "30C",
      "repetition": "Every 2-4 hours"
    },
    "matchedRubrics": [
      "FEVER - sudden",
      "FEVER - burning",
      "RESTLESSNESS"
    ],
    "keynoteMatch": false,
    "modalityMatch": false,
    "confidence": "Medium"
  }
]
```

---

## 🎨 UI Flow

### **1. Symptom Selection (Enhanced)**

```
┌─────────────────────────────────────────┐
│ Symptom: Fever                          │
├─────────────────────────────────────────┤
│ Location: [Whole Body ▼]                │
│ Sensation: [Burning ▼]                  │
│ Modalities:                              │
│   ☑ Worse - Evening                     │
│   ☐ Worse - Night                       │
│   ☐ Better - Rest                       │
│ Repertory Rubrics:                      │
│   • FEVER - sudden (Auto-selected)      │
│   • FEVER - burning (Auto-selected)     │
│   • FEVER - evening (Auto-selected)    │
└─────────────────────────────────────────┘
```

---

### **2. Medicine Suggestions Display**

```
┌─────────────────────────────────────────┐
│ Suggested Medicines                     │
├─────────────────────────────────────────┤
│ 🥇 Aconite 200C                         │
│    Match: 83% | Coverage: 100%          │
│    ✓ Keynote Match | ✓ Modality Match   │
│    Repetition: Every 1-2 hours          │
│    [Select] [View Details]              │
├─────────────────────────────────────────┤
│ 🥈 Belladonna 30C                       │
│    Match: 24% | Coverage: 50%           │
│    Repetition: Every 2-4 hours           │
│    [Select] [View Details]              │
└─────────────────────────────────────────┘
```

---

### **3. Medicine Details Modal**

```
┌─────────────────────────────────────────┐
│ Aconite - Details                       │
├─────────────────────────────────────────┤
│ Match Score: 83.16 (Very High)          │
│ Coverage: 100% (6/6 rubrics matched)    │
│                                         │
│ Matched Rubrics:                        │
│ • FEVER - sudden (Grade 4)              │
│ • FEVER - burning (Grade 3)             │
│ • FEAR - death, of (Grade 4)             │
│ • RESTLESSNESS (Grade 3)                │
│                                         │
│ Keynotes:                               │
│ • Sudden onset                          │
│ • Fear of death                         │
│ • Restlessness                           │
│                                         │
│ Suggested Potency: 200C                 │
│ Repetition: Every 1-2 hours             │
│                                         │
│ [Add to Prescription] [Cancel]          │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementation Details

### **1. Repertory Database**

**Repertory Rubrics Collection**:
```typescript
// Example entries
[
  {
    rubric: "FEVER - sudden",
    medicineId: "aconite_id",
    grade: 4
  },
  {
    rubric: "FEVER - sudden",
    medicineId: "belladonna_id",
    grade: 3
  },
  {
    rubric: "FEAR - death, of",
    medicineId: "aconite_id",
    grade: 4
  }
]
```

**Grade System**:
- **Grade 4**: Very strongly indicated (Bold in repertory)
- **Grade 3**: Strongly indicated (Italic in repertory)
- **Grade 2**: Moderately indicated (Normal in repertory)
- **Grade 1**: Weakly indicated (Rarely used)

---

### **2. Scoring Algorithm**

```typescript
function calculateFinalScore(
  baseScore: number,
  coverage: number,
  averageGrade: number,
  keynoteMatch: boolean,
  modalityMatch: boolean
) {
  let score = baseScore;
  
  // Coverage bonus (more rubrics matched = better)
  score += coverage * 0.3;
  
  // Grade bonus (higher average grade = better)
  score += averageGrade * 10 * 0.2;
  
  // Materia Medica bonuses
  if (keynoteMatch) {
    score *= 1.2; // 20% boost
  }
  
  if (modalityMatch) {
    score *= 1.1; // 10% boost
  }
  
  return score;
}
```

---

### **3. Potency Selection Logic**

```typescript
function selectPotency(
  matchScore: number,
  symptomSeverity: string,
  isAcute: boolean,
  patientAge: number
) {
  // Acute cases
  if (isAcute) {
    if (symptomSeverity === 'high') {
      return { potency: '200C', repetition: 'Every 1-2 hours' };
    } else if (symptomSeverity === 'medium') {
      return { potency: '30C', repetition: 'Every 2-4 hours' };
    } else {
      return { potency: '6C', repetition: 'Every 4-6 hours' };
    }
  }
  
  // Chronic cases
  if (matchScore > 80) {
    return { potency: '200C', repetition: 'Once daily' };
  } else if (matchScore > 60) {
    return { potency: '30C', repetition: 'Twice daily' };
  } else {
    return { potency: '6C', repetition: 'Three times daily' };
  }
  
  // Pediatric cases (lower potency)
  if (patientAge < 12) {
    return { potency: '6C', repetition: 'Twice daily' };
  }
}
```

---

## 📊 Comparison: Electro vs Classical Rule Engine

### **Electro Homeopathy Rule Engine**:
```
Symptoms Selected → Direct Rule Match → Medicine Suggestions
- Simple matching
- Priority-based
- Fixed dosage
```

### **Classical Homeopathy Rule Engine**:
```
Symptoms Selected → Extract Rubrics → Repertory Matching → 
Score Calculation → Materia Medica Filter → Potency Selection → 
Final Suggestions
- Complex matching
- Grade-based scoring
- Variable potency
```

---

## 🎯 Key Features

1. **Repertory-Based Matching**: Standard homeopathic repertory rubrics use
2. **Grade System**: Medicine importance ka grade (1-4)
3. **Coverage Calculation**: Kitne rubrics match hue
4. **Materia Medica Integration**: Keynotes aur modalities check
5. **Smart Potency Selection**: Acute/Chronic ke basis pe
6. **Confidence Scoring**: Match score se confidence level

---

## 🚀 Benefits

1. **Accurate**: Repertory-based matching se accurate suggestions
2. **Comprehensive**: Materia Medica integration
3. **Flexible**: Potency selection based on case type
4. **Educational**: Doctor ko rubrics aur keynotes dikhate hain
5. **Professional**: Standard homeopathic practice follow karta hai

---

---

## 📦 Required Service Modules

### **1. Case Engine Service**
**Location**: `backend/src/services/caseEngine.service.ts`

**Responsibilities**:
- Accept structured case input
- Normalize symptoms by category
- Return normalized case profile
- Determine case type (acute/chronic)

**Key Methods**:
- `normalizeCase(structuredCase)`: Main entry point
- `normalizeSymptom(symptomText, category)`: Individual symptom normalization
- `determineCaseType(pathologyTags)`: Acute/Chronic detection

---

### **2. Symptom Normalization Engine Service**
**Location**: `backend/src/services/symptomNormalization.service.ts`

**Responsibilities**:
- Map free text to standard symptom codes
- Use synonym dictionary for matching
- Return standardized symptom vector
- Handle confidence levels (exact, high, medium, low)

**Key Methods**:
- `normalizeSymptomText(symptomText, category)`: Single symptom normalization
- `normalizeSymptomVector(symptoms)`: Batch normalization
- `findBySynonym(synonym)`: Synonym matching

---

### **3. Rubric Mapping Engine Service**
**Location**: `backend/src/services/rubricMapping.service.ts`

**Responsibilities**:
- Map symptoms → relevant rubrics
- Auto-select rubrics (70%+ confidence)
- Allow manual confirmation
- Support multiple repertory types

**Key Methods**:
- `mapSymptomsToRubrics(normalizedCase)`: Main mapping function
- `suggestRubrics(symptomCode, repertoryType)`: Manual suggestions
- `calculateRubricConfidence(rubric, symptoms)`: Confidence calculation

---

### **4. Repertory Engine Service**
**Location**: `backend/src/services/repertoryEngine.service.ts`

**Responsibilities**:
- Fetch remedies + grades from rubrics
- Build Remedy Pool
- Support multiple repertory sources (Kent, BBCR, Boericke, Synthesis)

**Key Methods**:
- `buildRemedyPool(selectedRubricIds)`: Build remedy pool
- `getRemedyDetails(remedyId)`: Fetch remedy information
- `getRubricRemedies(rubricId)`: Get remedies for a rubric

---

### **5. Smart Scoring Engine Service** (CORE)
**Location**: `backend/src/services/scoringEngine.service.ts`

**Responsibilities**:
- Implement scoring formula with weights
- Calculate base scores
- Apply bonuses (constitution, modality, pathology)
- Apply penalties (contradictions)

**Scoring Formula**:
```
FinalScore = 
  Σ(rubric_grade × symptom_weight)
  + constitution_bonus
  + modality_bonus
  + pathology_support
  - contradiction_penalty
```

**Symptom Weights**:
- Mental = 3
- Generals = 2
- Particulars = 1
- Modalities = 1.5

**Key Methods**:
- `calculateRemedyScores(remedyPool, normalizedCase, selectedRubrics)`: Main scoring
- `calculateConstitutionBonus(remedy, normalizedCase)`: Constitution matching
- `calculateModalityBonus(remedy, normalizedCase)`: Modality matching
- `calculatePathologySupport(remedy, pathologyTags)`: Pathology support
- `calculateConfidence(finalScore, baseScore)`: Confidence level

---

### **6. Clinical Intelligence Layer Service**
**Location**: `backend/src/services/clinicalIntelligence.service.ts`

**Responsibilities**:
- Apply clinical filters (ADJUST, not override)
- Acute vs chronic bias
- Mental dominance detection
- Constitutional similarity
- Disease support (non-ruling)

**Key Methods**:
- `applyClinicalFilters(scoredRemedies, normalizedCase)`: Main filter application
- `applyAcuteChronicBias(remedy, isAcute, isChronic)`: Case type bias
- `applyMentalDominanceBias(remedy, normalizedCase)`: Mental symptom bias
- `applyConstitutionalBias(remedy, normalizedCase)`: Constitution bias

**Important**: This layer **ADJUSTS** scores, does **NOT override** repertory results.

---

### **7. Contradiction & Safety Engine Service**
**Location**: `backend/src/services/contradictionEngine.service.ts`

**Responsibilities**:
- Detect incompatible remedies
- Find opposite modality conflicts
- Check repetition warnings
- Attach warnings + penalties

**Key Methods**:
- `detectContradictions(scoredRemedies, patientHistory)`: Main detection
- `checkIncompatibilities(remedy, otherRemedies)`: Incompatibility check
- `checkModalityConflicts(remedy, normalizedCase)`: Modality conflict check
- `checkRepetitionWarnings(remedy, patientHistory)`: Repetition warnings

**Warning Types**:
- `contradiction`: Incompatible remedies
- `incompatibility`: Remedy incompatibilities
- `repetition`: Recent use warnings

---

### **8. Suggestion Engine Service**
**Location**: `backend/src/services/suggestionEngine.service.ts`

**Responsibilities**:
- Generate final ranked remedies
- Calculate confidence scores
- Generate transparent clinical reasoning
- Suggest potency and repetition

**Key Methods**:
- `generateSuggestions(filteredRemedies, normalizedCase, selectedRubrics)`: Main generation
- `generateClinicalReasoning(remedy, normalizedCase, remedyDetails)`: Reasoning text
- `suggestPotency(finalScore, isAcute, pathologyTags)`: Potency suggestion
- `formatSuggestionOutput(remedy, score, reasoning)`: Format output

**Output Format**:
- Top ranked remedies (max 10)
- Confidence score (low, medium, high, very_high)
- Matched symptoms list
- Matched rubrics list
- Clinical reasoning (transparent)
- Suggested potency
- Repetition schedule
- Warnings (if any)

---

### **9. Outcome & Learning Hook Service**
**Location**: `backend/src/services/outcomeLearning.service.ts`

**Responsibilities**:
- Save case records with engine output
- Store doctor's final decision
- Track outcome status
- Prepare data for future ML/statistics

**Key Methods**:
- `saveCaseRecord(doctorId, patientId, structuredCase, selectedRubrics, engineOutput)`: Save case
- `updateDoctorDecision(caseRecordId, finalRemedy)`: Update decision
- `updateOutcome(caseRecordId, outcomeStatus, followUpNotes)`: Update outcome
- `calculateSuccessRate(remedyId, timeRange)`: Success statistics
- `findSymptomRemedyPatterns(symptomCode)`: Pattern analysis

**Outcome Status**:
- `pending`: Awaiting outcome
- `improved`: Patient improved
- `no_change`: No improvement
- `worsened`: Condition worsened
- `not_followed`: Prescription not followed

**Future Learning**:
- Success rate calculation
- Symptom-remedy pattern analysis
- Remedy effectiveness tracking
- (ML integration ready, but not implemented yet)

---

## 🔄 Complete Engine Integration

### **Main Rule Engine Service**
**Location**: `backend/src/services/classicalHomeopathyRuleEngine.service.ts`

```typescript
export class ClassicalHomeopathyRuleEngine {
  // Initialize all engines
  private caseEngine: CaseEngine;
  private symptomNormalization: SymptomNormalizationEngine;
  private rubricMapping: RubricMappingEngine;
  private repertoryEngine: RepertoryEngine;
  private scoringEngine: ScoringEngine;
  private clinicalIntelligence: ClinicalIntelligenceLayer;
  private contradictionEngine: ContradictionEngine;
  private suggestionEngine: SuggestionEngine;
  private outcomeHook: OutcomeLearningHook;

  /**
   * Main entry point - Process complete case
   * 
   * @param doctorId - Doctor ID
   * @param patientId - Patient ID
   * @param structuredCase - Structured case input
   * @param patientHistory - Previous remedy history (optional)
   * @returns Suggestions and case record ID
   */
  async processCase(
    doctorId: mongoose.Types.ObjectId,
    patientId: mongoose.Types.ObjectId,
    structuredCase: StructuredCase,
    patientHistory?: Array<{ remedyId: string; date: Date }>
  ): Promise<{
    suggestions: {
      topRemedies: Array<any>;
      summary: {
        totalRemedies: number;
        highConfidence: number;
        warnings: number;
      };
    };
    caseRecordId: mongoose.Types.ObjectId;
  }> {
    // Step 1: Case Intake
    const normalizedCase = await this.caseEngine.normalizeCase(structuredCase);

    // Step 2: Symptom Normalization (if needed - already done in Step 1)
    // Can re-normalize if doctor wants to add more symptoms

    // Step 3: Rubric Mapping
    const rubricMappings = await this.rubricMapping.mapSymptomsToRubrics(normalizedCase);
    const selectedRubrics = rubricMappings.filter((r) => r.autoSelected);

    // Step 4: Repertory Engine
    const remedyPool = await this.repertoryEngine.buildRemedyPool(
      selectedRubrics.map((r) => r.rubricId)
    );

    // Step 5: Smart Scoring
    const scoredRemedies = await this.scoringEngine.calculateRemedyScores(
      remedyPool,
      normalizedCase,
      selectedRubrics
    );

    // Step 6: Clinical Intelligence
    const filteredRemedies = await this.clinicalIntelligence.applyClinicalFilters(
      scoredRemedies,
      normalizedCase
    );

    // Step 7: Contradiction Detection
    const safetyChecked = await this.contradictionEngine.detectContradictions(
      filteredRemedies,
      patientHistory
    );

    // Step 8: Generate Suggestions
    const suggestions = await this.suggestionEngine.generateSuggestions(
      safetyChecked,
      normalizedCase,
      selectedRubrics
    );

    // Step 9: Save Case Record
    const caseRecord = await this.outcomeHook.saveCaseRecord(
      doctorId,
      patientId,
      structuredCase,
      selectedRubrics,
      {
        remedyScores: safetyChecked.map((sc) => sc.remedy),
        clinicalReasoning: suggestions.summary.totalRemedies.toString(),
        warnings: safetyChecked.flatMap((sc) => sc.warnings),
      }
    );

    return {
      suggestions,
      caseRecordId: caseRecord._id,
    };
  }
}
```

---

## 📊 API Endpoints

### **Main Rule Engine API**

```typescript
// POST /api/classical-homeopathy/suggest
// Request Body:
{
  patientId: string;
  structuredCase: {
    mental: Array<{ symptomText: string; weight?: number }>;
    generals: Array<{ symptomText: string; weight?: number }>;
    particulars: Array<{ 
      symptomText: string; 
      location?: string; 
      sensation?: string; 
      weight?: number 
    }>;
    modalities: Array<{ 
      symptomText: string; 
      type: 'better' | 'worse'; 
      weight?: number 
    }>;
    pathologyTags: string[];
  };
  patientHistory?: Array<{ remedyId: string; date: string }>;
}

// Response:
{
  success: true;
  data: {
    suggestions: {
      topRemedies: Array<{
        remedy: { id: string; name: string; category: string };
        matchScore: number;
        confidence: string;
        matchedSymptoms: string[];
        matchedRubrics: string[];
        clinicalReasoning: string;
        suggestedPotency: string;
        repetition: string;
        warnings: Array<any>;
      }>;
      summary: {
        totalRemedies: number;
        highConfidence: number;
        warnings: number;
      };
    };
    caseRecordId: string;
  };
}
```

---

### **Outcome Tracking API**

```typescript
// PUT /api/classical-homeopathy/case/:caseRecordId/decision
// Update doctor's final decision
{
  finalRemedy: {
    remedyId: string;
    remedyName: string;
    potency: string;
    repetition: string;
    notes?: string;
  };
}

// PUT /api/classical-homeopathy/case/:caseRecordId/outcome
// Update outcome status
{
  outcomeStatus: 'improved' | 'no_change' | 'worsened' | 'not_followed';
  followUpNotes?: string;
}

// GET /api/classical-homeopathy/statistics/remedy/:remedyId
// Get success rate for a remedy
// Response: {
//   totalCases: number;
//   improved: number;
//   noChange: number;
//   worsened: number;
//   successRate: number;
// }
```

---

## 🎯 Key Implementation Principles

### **1. Clinical Decision Support, NOT Auto-Diagnosis**
- System **suggests** remedies, doctor **decides**
- All suggestions have transparent reasoning
- Doctor can override any suggestion
- System tracks outcomes for learning

### **2. Modular Architecture**
- Each engine is independent service
- Can be tested separately
- Easy to extend or modify
- Therapy-agnostic base design

### **3. Transparent Reasoning**
- Every suggestion includes:
  - Match score breakdown
  - Matched rubrics
  - Matched symptoms
  - Clinical reasoning
  - Confidence level

### **4. Safety First**
- Contradiction detection
- Incompatibility warnings
- Repetition warnings
- All warnings visible to doctor

### **5. Learning Ready**
- Case records stored with full context
- Outcome tracking
- Pattern analysis ready
- ML integration hooks prepared

---

## 📋 Complete Implementation Checklist

### **Backend Services**
- [ ] Case Engine Service
- [ ] Symptom Normalization Engine Service
- [ ] Rubric Mapping Engine Service
- [ ] Repertory Engine Service
- [ ] Smart Scoring Engine Service (CORE)
- [ ] Clinical Intelligence Layer Service
- [ ] Contradiction & Safety Engine Service
- [ ] Suggestion Engine Service
- [ ] Outcome & Learning Hook Service
- [ ] Main Rule Engine Service (Integration)

### **Database Models**
- [ ] Enhanced Symptom Model (with code, synonyms, category)
- [ ] Rubric Model (with repertory type, chapter)
- [ ] RubricRemedy Model (with grade)
- [ ] Enhanced Remedy Model (with constitution, modalities, incompatibilities)
- [ ] CaseRecord Model (complete case tracking)

### **API Endpoints**
- [ ] POST /api/classical-homeopathy/suggest
- [ ] PUT /api/classical-homeopathy/case/:id/decision
- [ ] PUT /api/classical-homeopathy/case/:id/outcome
- [ ] GET /api/classical-homeopathy/statistics/remedy/:id
- [ ] GET /api/classical-homeopathy/statistics/patterns

### **Seed Data**
- [ ] Classical Homeopathy Symptoms (200+) with codes and synonyms
- [ ] Repertory Rubrics (1000+) from Kent, BBCR, Boericke
- [ ] Rubric-Remedy Mappings (5000+) with grades
- [ ] Classical Remedies (100+) with full Materia Medica

---

**Last Updated**: January 2025  
**Status**: Enhanced with Complete Architecture Design  
**Next Step**: Implementation of Service Modules
