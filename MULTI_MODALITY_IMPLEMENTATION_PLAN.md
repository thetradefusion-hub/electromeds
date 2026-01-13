# Multi-Modality Support Implementation Plan
## Electro Homeopathy + Classical Homeopathy

---

## 📋 Overview

Platform ko **Electro Homeopathy** aur **Classical Homeopathy** dono modalities ke liye extend karna hai. Har doctor apni preferred modality select kar sakta hai, aur system accordingly medicines, symptoms, aur rules suggest karega.

---

## 🏗️ Architecture Design

### **System Role & Objective**

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

### **Tech Stack**
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Architecture**: Service-oriented modules
- **Design**: Therapy-agnostic base, Homoeopathy as first plugin

### **1. Modality Concept**

**Modality** = Treatment system (Electro Homeopathy ya Classical Homeopathy)

- **Electro Homeopathy**: Current system (S1-S10, C1-C17, GE, YE, WE, RE, BE series)
- **Classical Homeopathy**: Traditional homeopathy (Materia Medica based, Repertory based)

### **2. Modular Service Architecture**

System ko independent services/modules me divide kiya gaya hai:

1. **Case Engine** - Case intake & normalization
2. **Symptom Normalization Engine** - Text to standard symptom mapping
3. **Rubric Mapping Engine** - Symptom to rubric mapping
4. **Repertory Engine** - Rubric to remedy fetching
5. **Smart Scoring Engine** - Core scoring with weights
6. **Clinical Intelligence Layer** - Clinical filters & adjustments
7. **Contradiction & Safety Engine** - Safety checks & warnings
8. **Suggestion Engine** - Ranked remedy output
9. **Outcome & Learning Hook** - Data capture for future learning

---

## 🗄️ Database Schema Changes

### **A. Doctor Model - Modality Field Add**

```typescript
// backend/src/models/Doctor.model.ts
export interface IDoctor extends Document {
  // ... existing fields
  modality: 'electro_homeopathy' | 'classical_homeopathy' | 'both'; // NEW FIELD
  preferredModality?: 'electro_homeopathy' | 'classical_homeopathy'; // For doctors using both
  // ... rest of fields
}
```

**Default**: `modality: 'electro_homeopathy'` (existing doctors ke liye)

---

### **B. Medicine Model - Modality Field Add** (Enhanced for Classical Homeopathy)

```typescript
// backend/src/models/Medicine.model.ts (Electro Homeopathy)
export interface IMedicine extends Document {
  name: string;
  category: string;
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW FIELD - REQUIRED
  // Electro Homeopathy specific fields
  series?: string; // S1, S2, C1, GE, YE, etc. (for Electro)
  // Common fields
  indications?: string;
  defaultDosage?: string;
  contraIndications?: string;
  notes?: string;
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// backend/src/models/Remedy.model.ts (Classical Homeopathy - NEW)
export interface IRemedy extends Document {
  name: string; // Remedy name (e.g., "Aconite")
  category: string; // Plant Kingdom, Mineral Kingdom, etc.
  modality: 'classical_homeopathy'; // Required
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
    keynotes: string[]; // ["Sudden onset", "Fear of death"]
    pathogenesis: string;
    clinicalNotes: string;
  };
  // Potency support
  supportedPotencies: string[]; // ["6C", "30C", "200C", "1M"]
  // Common fields
  indications?: string;
  defaultDosage?: string;
  contraIndications?: string;
  notes?: string;
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```typescript
medicineSchema.index({ modality: 1, isGlobal: 1 });
medicineSchema.index({ modality: 1, doctorId: 1 });
medicineSchema.index({ modality: 1, category: 1 });
```

---

### **C. Symptom Model - Modality Field Add** (Enhanced)

```typescript
// backend/src/models/Symptom.model.ts
export interface ISymptom extends Document {
  code: string; // Unique symptom code (e.g., "SYM_FEVER_001") - NEW
  name: string; // Standard symptom name
  category: 'mental' | 'general' | 'particular' | 'modality'; // Enhanced category
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW FIELD - REQUIRED
  synonyms: string[]; // Alternative names for normalization - NEW
  // Classical Homeopathy specific
  repertoryRubrics?: Array<{
    rubricId: mongoose.Types.ObjectId; // Reference to Rubric
    grade?: number; // Symptom's importance in this rubric
  }>;
  location?: string; // Body location
  sensation?: string; // Pain type, etc.
  modalities?: string[]; // Better/worse conditions
  // Common fields
  description?: string;
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

**Indexes**:
```typescript
symptomSchema.index({ modality: 1, isGlobal: 1 });
symptomSchema.index({ modality: 1, doctorId: 1 });
symptomSchema.index({ modality: 1, category: 1 });
```

---

### **D. MedicineRule Model - Modality Field Add**

```typescript
// backend/src/models/MedicineRule.model.ts (Electro Homeopathy)
export interface IMedicineRule extends Document {
  name: string;
  description?: string;
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW FIELD - REQUIRED
  symptomIds: string[];
  medicineIds: string[];
  // Electro Homeopathy specific
  dosage?: string; // Standard dosage format
  duration?: string; // Standard duration
  // Common fields
  priority: number;
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### **D1. Rubric Model** (NEW - Classical Homeopathy)

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

### **D2. RubricRemedy Model** (NEW - Classical Homeopathy)

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
medicineRuleSchema.index({ modality: 1, doctorId: 1, isGlobal: 1 });
medicineRuleSchema.index({ modality: 1, symptomIds: 1 });
```

---

### **E. Prescription Model - Modality Field Add**

```typescript
// backend/src/models/Prescription.model.ts
export interface IPrescription extends Document {
  prescriptionNo: string;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW FIELD - REQUIRED
  symptoms: [{
    symptomId: string;
    name: string;
    severity: 'low' | 'medium' | 'high';
    duration: number;
    durationUnit: 'days' | 'weeks' | 'months';
  }];
  medicines: [{
    medicineId: string;
    name: string;
    category: string;
    modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW
    // Electro Homeopathy
    dosage?: string;
    duration?: string;
    // Classical Homeopathy
    potency?: string; // 6C, 30C, 200C, etc.
    repetition?: string; // TDS, BD, OD, etc.
    instructions?: string;
  }];
  diagnosis?: string;
  advice?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### **E1. CaseRecord Model** (NEW - For Classical Homeopathy Learning)

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
      weight?: number;
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
    autoSelected: boolean;
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
    clinicalReasoning: string;
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

---

## 🔧 Rule Engine Architecture

### **Modular Service Architecture**

System ko **9 independent services** me divide kiya gaya hai:

1. **Case Engine** (`caseEngine.service.ts`)
   - Accepts structured case
   - Normalizes symptoms by category
   - Returns normalized case profile

2. **Symptom Normalization Engine** (`symptomNormalization.service.ts`)
   - Maps free text to standard symptom codes
   - Uses synonym dictionary
   - Returns standardized symptom vector

3. **Rubric Mapping Engine** (`rubricMapping.service.ts`)
   - Maps symptoms → relevant rubrics
   - Auto-selection + manual confirmation
   - Supports multiple repertory types

4. **Repertory Engine** (`repertoryEngine.service.ts`)
   - Fetches remedies + grades from rubrics
   - Builds Remedy Pool
   - Supports Kent, BBCR, Boericke, Synthesis

5. **Smart Scoring Engine** (`scoringEngine.service.ts`) - **CORE**
   - Implements scoring formula with weights
   - Calculates bonuses and penalties
   - Returns scored remedy list

6. **Clinical Intelligence Layer** (`clinicalIntelligence.service.ts`)
   - Applies clinical filters (ADJUST, not override)
   - Acute vs chronic bias
   - Mental dominance detection
   - Constitutional similarity

7. **Contradiction & Safety Engine** (`contradictionEngine.service.ts`)
   - Detects incompatible remedies
   - Finds opposite modality conflicts
   - Checks repetition warnings
   - Attaches warnings + penalties

8. **Suggestion Engine** (`suggestionEngine.service.ts`)
   - Returns ranked remedies
   - Generates transparent clinical reasoning
   - Suggests potency and repetition

9. **Outcome & Learning Hook** (`outcomeLearning.service.ts`)
   - Saves case records
   - Tracks doctor decisions
   - Records outcomes
   - Prepares data for future ML

### **How Rule Engine Will Work**

#### **1. Rule Matching Logic** (Electro Homeopathy)

```typescript
// Pseudo-code for rule matching

function suggestMedicines(
  selectedSymptoms: Symptom[],
  doctorModality: 'electro_homeopathy' | 'classical_homeopathy',
  doctorId: string
) {
  // Step 1: Filter rules by modality
  const rules = MedicineRule.find({
    modality: doctorModality,
    $or: [
      { isGlobal: true },
      { doctorId: doctorId }
    ]
  }).sort({ priority: -1 });

  // Step 2: Match symptoms
  const matchedRules = rules.filter(rule => {
    const ruleSymptoms = rule.symptomIds;
    const selectedSymptomIds = selectedSymptoms.map(s => s.id);
    
    // Match if ALL rule symptoms are present in selected symptoms
    return ruleSymptoms.every(rs => selectedSymptomIds.includes(rs));
  });

  // Step 3: Extract medicines from matched rules
  const suggestedMedicines = [];
  matchedRules.forEach(rule => {
    rule.medicineIds.forEach(medicineId => {
      const medicine = Medicine.findOne({
        _id: medicineId,
        modality: doctorModality
      });
      if (medicine) {
        suggestedMedicines.push({
          medicine,
          rule: rule,
          matchScore: calculateMatchScore(rule, selectedSymptoms)
        });
      }
    });
  });

  // Step 4: Sort by match score and priority
  return suggestedMedicines
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10); // Top 10 suggestions
}
```

---

#### **2. Classical Homeopathy Smart Rule Engine** (9-Step Flow)

**Classical Homeopathy** me complete modular engine use hota hai:

**Complete Flow**:
```
Step 1: Case Intake (Case Engine)
  ↓
Step 2: Symptom Normalization (Symptom Normalization Engine)
  ↓
Step 3: Rubric Mapping (Rubric Mapping Engine)
  ↓
Step 4: Repertory Engine (Repertory Engine)
  ↓
Step 5: Smart Scoring (Scoring Engine) - CORE
  ↓
Step 6: Clinical Intelligence (Clinical Intelligence Layer)
  ↓
Step 7: Contradiction Detection (Contradiction Engine)
  ↓
Step 8: Generate Suggestions (Suggestion Engine)
  ↓
Step 9: Save Case Record (Outcome Learning Hook)
```

**Detailed Flow**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` for complete implementation details.

**Key Features**:
- **Structured Case Input**: mental[], generals[], particulars[], modalities[], pathologyTags[]
- **Smart Scoring Formula**: 
  ```
  FinalScore = Σ(rubric_grade × symptom_weight)
               + constitution_bonus
               + modality_bonus
               + pathology_support
               - contradiction_penalty
  ```
- **Symptom Weights**: Mental=3, Generals=2, Particulars=1, Modalities=1.5
- **Transparent Reasoning**: Har suggestion me detailed reasoning
- **Safety Checks**: Contradiction detection, incompatibility warnings
- **Learning Ready**: Case records stored for future ML/statistics

---

## 📊 Medicine Management

### **A. Medicine Categories by Modality**

#### **Electro Homeopathy Categories** (Current):
- **S Series**: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10
- **C Series**: C1, C2, C3, ..., C17
- **GE Series**: GE1, GE2, GE3, etc.
- **YE Series**: YE1, YE2, etc.
- **WE Series**: WE1, WE2, etc.
- **RE Series**: RE1, RE2, etc.
- **BE Series**: BE1, BE2, etc.

#### **Classical Homeopathy Categories**:
- **Plant Kingdom**: Aconite, Belladonna, Pulsatilla, etc.
- **Mineral Kingdom**: Calcarea, Silica, Sulphur, etc.
- **Animal Kingdom**: Lachesis, Apis, etc.
- **Nosodes**: Tuberculinum, Medorrhinum, etc.
- **Sarcodes**: Thyroidinum, Adrenalinum, etc.

---

### **B. Medicine Data Structure**

#### **Electro Homeopathy Medicine Example**:
```json
{
  "name": "S1",
  "category": "S Series",
  "modality": "electro_homeopathy",
  "series": "S1",
  "indications": "Fever, Headache",
  "defaultDosage": "10 drops",
  "contraIndications": "None",
  "isGlobal": true
}
```

#### **Classical Homeopathy Medicine Example**:
```json
{
  "name": "Aconite",
  "category": "Plant Kingdom",
  "modality": "classical_homeopathy",
  "potency": "6C, 30C, 200C",
  "materiaMedica": "Sudden onset, Fear, Anxiety",
  "repertoryRubrics": [
    "FEAR - death, of",
    "FEVER - sudden",
    "ANXIETY - sudden"
  ],
  "indications": "Sudden onset of symptoms, Fear, Restlessness",
  "defaultDosage": "3-5 pills",
  "isGlobal": true
}
```

---

## 🔍 Symptom Management

### **A. Symptom Categories by Modality**

#### **Electro Homeopathy Symptoms** (Current):
- Body Systems (Respiratory, Digestive, etc.)
- General Symptoms
- Specific Conditions

#### **Classical Homeopathy Symptoms**:
- **Location**: Head, Chest, Abdomen, Limbs, etc.
- **Sensation**: Burning, Stitching, Throbbing, etc.
- **Modalities**: Better/Worse conditions
- **Concomitants**: Associated symptoms
- **Repertory Rubrics**: Standardized symptom descriptions

---

### **B. Symptom Data Structure**

#### **Electro Homeopathy Symptom Example**:
```json
{
  "name": "Fever",
  "category": "General",
  "modality": "electro_homeopathy",
  "description": "Elevated body temperature",
  "isGlobal": true
}
```

#### **Classical Homeopathy Symptom Example**:
```json
{
  "name": "Fever - Sudden",
  "category": "General",
  "modality": "classical_homeopathy",
  "location": "Whole Body",
  "sensation": "Burning",
  "modalities": ["Worse - Evening", "Better - Rest"],
  "repertoryRubrics": [
    "FEVER - sudden",
    "FEVER - burning",
    "FEVER - evening"
  ],
  "description": "Sudden onset of burning fever",
  "isGlobal": true
}
```

---

## 📝 Prescription Workflow

### **1. Doctor Selects Modality**

```typescript
// Doctor Settings
{
  modality: 'electro_homeopathy' | 'classical_homeopathy' | 'both',
  preferredModality: 'electro_homeopathy' // If both selected
}
```

---

### **2. Consultation Page**

#### **Electro Homeopathy Flow**:
1. Doctor selects symptoms from Electro Homeopathy symptom list
2. Rule engine suggests Electro Homeopathy medicines (S1, C1, etc.)
3. Doctor selects medicines
4. Standard dosage/duration format

#### **Classical Homeopathy Flow**:
1. Doctor selects symptoms with:
   - Location
   - Sensation
   - Modalities (Better/Worse)
   - Concomitants
2. Rule engine suggests Classical Homeopathy medicines (Aconite, Belladonna, etc.)
3. Doctor selects medicine + potency (6C, 30C, 200C)
4. Repetition schedule (TDS, BD, OD)

---

### **3. Prescription Generation**

#### **Electro Homeopathy Prescription**:
```
Medicine: S1
Dosage: 10 drops
Duration: 7 days
Frequency: TDS (3 times a day)
```

#### **Classical Homeopathy Prescription**:
```
Medicine: Aconite 30C
Dosage: 3-5 pills
Repetition: Every 2 hours (acute) / TDS (chronic)
Duration: Until relief
```

---

## 🎨 UI/UX Changes

### **1. Doctor Registration/Settings**

**New Field**: Modality Selection
```
┌─────────────────────────────────┐
│ Select Your Practice Modality   │
├─────────────────────────────────┤
│ ○ Electro Homeopathy            │
│ ○ Classical Homeopathy          │
│ ○ Both                          │
└─────────────────────────────────┘
```

---

### **2. Consultation Page**

#### **Modality Toggle** (if doctor uses both):
```
[Electro Homeopathy] [Classical Homeopathy]
```

#### **Symptom Selection**:
- **Electro**: Simple symptom list (current)
- **Classical**: Advanced symptom form with:
  - Location dropdown
  - Sensation dropdown
  - Modalities (Better/Worse)
  - Repertory rubrics search

#### **Medicine Suggestions**:
- **Electro**: Shows S1, C1, etc. with dosage
- **Classical**: Shows Aconite, Belladonna, etc. with potency selector

---

### **3. Medicine Management Page**

**Filter by Modality**:
```
[All] [Electro Homeopathy] [Classical Homeopathy]
```

**Add Medicine Form**:
- Modality selector (required)
- If Electro: Series field
- If Classical: Potency, Materia Medica, Repertory fields

---

### **4. Symptom Management Page**

**Filter by Modality**:
```
[All] [Electro Homeopathy] [Classical Homeopathy]
```

**Add Symptom Form**:
- Modality selector (required)
- If Classical: Location, Sensation, Modalities fields

---

### **5. Rules Management Page** (Admin Only)

**Filter by Modality**:
```
[All] [Electro Homeopathy] [Classical Homeopathy]
```

**Add Rule Form**:
- Modality selector (required)
- Symptom selection (filtered by modality)
- Medicine selection (filtered by modality)
- If Classical: Potency suggestion field

---

## 🔄 Migration Strategy

### **Phase 1: Database Migration**

1. **Add Modality Field to Existing Data**:
   ```javascript
   // Migration script
   // All existing medicines → modality: 'electro_homeopathy'
   db.medicines.updateMany(
     { modality: { $exists: false } },
     { $set: { modality: 'electro_homeopathy' } }
   );
   
   // All existing symptoms → modality: 'electro_homeopathy'
   db.symptoms.updateMany(
     { modality: { $exists: false } },
     { $set: { modality: 'electro_homeopathy' } }
   );
   
   // All existing rules → modality: 'electro_homeopathy'
   db.medicinerules.updateMany(
     { modality: { $exists: false } },
     { $set: { modality: 'electro_homeopathy' } }
   );
   
   // All existing prescriptions → modality: 'electro_homeopathy'
   db.prescriptions.updateMany(
     { modality: { $exists: false } },
     { $set: { modality: 'electro_homeopathy' } }
   );
   
   // All existing doctors → modality: 'electro_homeopathy'
   db.doctors.updateMany(
     { modality: { $exists: false } },
     { $set: { modality: 'electro_homeopathy' } }
   );
   ```

---

### **Phase 2: Seed Classical Homeopathy Data**

#### **A. Classical Homeopathy Medicines** (Seed Script)

**Common Classical Medicines** (100+ medicines):
- **Acute Remedies**: Aconite, Belladonna, Pulsatilla, etc.
- **Constitutional Remedies**: Calcarea, Silica, Sulphur, etc.
- **Nosodes**: Tuberculinum, Medorrhinum, etc.

**Data Structure**:
```javascript
{
  name: "Aconite",
  category: "Plant Kingdom",
  modality: "classical_homeopathy",
  potency: "6C, 30C, 200C",
  materiaMedica: "Sudden onset, Fear, Anxiety, Restlessness",
  repertoryRubrics: [
    "FEAR - death, of",
    "FEVER - sudden",
    "ANXIETY - sudden",
    "RESTLESSNESS"
  ],
  indications: "Sudden onset of symptoms, Fear, Restlessness",
  defaultDosage: "3-5 pills",
  isGlobal: true
}
```

---

#### **B. Classical Homeopathy Symptoms** (Seed Script)

**Common Symptoms** (200+ symptoms):
- Location-based symptoms
- Sensation-based symptoms
- Modalities

**Data Structure**:
```javascript
{
  name: "Fever - Sudden",
  category: "General",
  modality: "classical_homeopathy",
  location: "Whole Body",
  sensation: "Burning",
  modalities: ["Worse - Evening", "Better - Rest"],
  repertoryRubrics: [
    "FEVER - sudden",
    "FEVER - burning",
    "FEVER - evening"
  ],
  isGlobal: true
}
```

---

#### **C. Classical Homeopathy Rules** (Seed Script)

**Common Rules** (50+ rules):
- Symptom-to-medicine mappings
- Potency suggestions
- Repetition guidelines

**Data Structure**:
```javascript
{
  name: "Sudden Fever with Fear",
  modality: "classical_homeopathy",
  symptomIds: ["fever-sudden", "fear-death"],
  medicineIds: ["aconite"],
  potency: "30C",
  repetition: "Every 2 hours",
  priority: 10,
  isGlobal: true
}
```

---

### **Phase 3: API Changes**

#### **A. Medicine API**

```typescript
// GET /api/medicines?modality=electro_homeopathy
// GET /api/medicines?modality=classical_homeopathy
// GET /api/medicines (returns all, filtered by doctor's modality)

// POST /api/medicines
// Body must include: modality (required)
```

#### **B. Symptom API**

```typescript
// GET /api/symptoms?modality=electro_homeopathy
// GET /api/symptoms?modality=classical_homeopathy
// GET /api/symptoms (returns all, filtered by doctor's modality)

// POST /api/symptoms
// Body must include: modality (required)
```

#### **C. Rule API**

```typescript
// GET /api/rules?modality=electro_homeopathy
// GET /api/rules?modality=classical_homeopathy
// GET /api/rules/suggest?symptomIds=[]&modality=electro_homeopathy

// POST /api/rules
// Body must include: modality (required)
```

---

### **Phase 4: Frontend Changes**

1. **Doctor Settings Page**: Modality selector
2. **Consultation Page**: Modality-aware symptom/medicine selection
3. **Medicine Management**: Modality filter + form fields
4. **Symptom Management**: Modality filter + form fields
5. **Rules Management**: Modality filter (admin only)

---

## 📋 Implementation Checklist

### **Backend - Database Models**
- [ ] Add `modality` field to Doctor model
- [ ] Add `modality` field to Medicine model (Electro)
- [ ] Create Remedy model (Classical Homeopathy)
- [ ] Enhance Symptom model (add code, synonyms, category enum)
- [ ] Add `modality` field to Symptom model
- [ ] Create Rubric model (Classical Homeopathy)
- [ ] Create RubricRemedy model (Classical Homeopathy)
- [ ] Add `modality` field to MedicineRule model
- [ ] Add `modality` field to Prescription model
- [ ] Create CaseRecord model (for learning)
- [ ] Create migration script for existing data

### **Backend - Service Modules**
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

### **Backend - API Endpoints**
- [ ] Update Medicine API to filter by modality
- [ ] Update Symptom API to filter by modality
- [ ] Update Rule API to filter by modality
- [ ] POST /api/classical-homeopathy/suggest (new)
- [ ] PUT /api/classical-homeopathy/case/:id/decision (new)
- [ ] PUT /api/classical-homeopathy/case/:id/outcome (new)
- [ ] GET /api/classical-homeopathy/statistics/remedy/:id (new)
- [ ] GET /api/classical-homeopathy/statistics/patterns (new)

### **Backend - Seed Data**
- [ ] Create Classical Homeopathy seed scripts
- [ ] Seed Classical Homeopathy Remedies (100+) with full Materia Medica
- [ ] Seed Classical Homeopathy Symptoms (200+) with codes and synonyms
- [ ] Seed Repertory Rubrics (1000+) from Kent, BBCR, Boericke
- [ ] Seed Rubric-Remedy Mappings (5000+) with grades

### **Frontend**
- [ ] Add modality selector in Doctor Settings
- [ ] Update Consultation page for modality
- [ ] Update Medicine Management page
- [ ] Update Symptom Management page
- [ ] Update Rules Management page (admin)
- [ ] Add modality filters in all pages
- [ ] Update prescription form for Classical Homeopathy
- [ ] Update PDF generation for Classical Homeopathy

### **Testing**
- [ ] Test Electro Homeopathy flow (existing)
- [ ] Test Classical Homeopathy flow (new)
- [ ] Test modality switching
- [ ] Test rule engine for both modalities
- [ ] Test prescription generation for both

---

## 🎯 Key Differences Summary

| Feature | Electro Homeopathy | Classical Homeopathy |
|---------|-------------------|---------------------|
| **Medicine Format** | S1, C1, GE1, etc. | Aconite, Belladonna, etc. |
| **Potency** | Not applicable | 6C, 30C, 200C, 1M |
| **Dosage** | Drops (10 drops) | Pills (3-5 pills) |
| **Repetition** | Standard (TDS) | Variable (Every 2h, TDS, OD) |
| **Symptom Selection** | Simple list | Location + Sensation + Modalities |
| **Rule Matching** | Direct symptom match | Repertory-based matching |
| **Materia Medica** | Not used | Used extensively |
| **Repertory** | Not used | Used for symptom matching |

---

## 💡 Benefits

1. **Single Platform**: Dono modalities ek hi platform me
2. **Doctor Choice**: Doctor apni preferred modality select kar sakta hai
3. **Data Separation**: Har modality ka data separate rahega
4. **Flexible**: Doctor "Both" select kar sakta hai
5. **Scalable**: Future me aur modalities add kar sakte hain

---

## 🚀 Future Enhancements

1. **Repertory Integration**: Full repertory support for Classical Homeopathy
2. **Materia Medica Viewer**: Built-in Materia Medica reference
3. **Case Analysis**: AI-powered case analysis for Classical Homeopathy
4. **Remedy Comparison**: Compare multiple remedies side-by-side
5. **Modality Analytics**: Separate analytics for each modality

---

---

## 🎯 Implementation Principles

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

## 📚 Related Documentation

- **Classical Homeopathy Rule Engine Flow**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` for complete 9-step engine flow
- **Database Schema Details**: See enhanced models above
- **Service Architecture**: See modular services design above

---

**Last Updated**: January 2025  
**Status**: Enhanced with Complete Modular Architecture  
**Next Step**: Implementation of Service Modules
