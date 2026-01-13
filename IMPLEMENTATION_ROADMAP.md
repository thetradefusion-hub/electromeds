# Implementation Roadmap
## Classical Homeopathy Smart Rule Engine

---

## 🎯 Overview

Yeh roadmap step-by-step implementation guide hai. Har step ko sequentially follow karein.

**Priority Order**:
1. **Phase 1**: Database Models (Foundation)
2. **Phase 2**: Service Modules (Core Logic)
3. **Phase 3**: API Endpoints (Integration)
4. **Phase 4**: Frontend Integration
5. **Phase 5**: Testing & Refinement

---

## 📋 Phase 1: Database Models (Foundation)

### **Step 1.1: Update Existing Models**

#### **A. Doctor Model - Add Modality Field**

**File**: `backend/src/models/Doctor.model.ts`

**Changes**:
```typescript
export interface IDoctor extends Document {
  // ... existing fields
  modality: 'electro_homeopathy' | 'classical_homeopathy' | 'both'; // NEW
  preferredModality?: 'electro_homeopathy' | 'classical_homeopathy'; // NEW (if both)
  // ... rest of fields
}
```

**Migration Script**: Existing doctors ko `modality: 'electro_homeopathy'` set karein.

---

#### **B. Medicine Model - Add Modality Field**

**File**: `backend/src/models/Medicine.model.ts`

**Changes**:
```typescript
export interface IMedicine extends Document {
  // ... existing fields
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW - REQUIRED
  series?: string; // NEW (for Electro: S1, C1, etc.)
  // ... rest of fields
}
```

**Migration Script**: Existing medicines ko `modality: 'electro_homeopathy'` set karein.

---

#### **C. Symptom Model - Enhance for Classical Homeopathy**

**File**: `backend/src/models/Symptom.model.ts`

**Changes**:
```typescript
export interface ISymptom extends Document {
  code: string; // NEW - Unique symptom code (e.g., "SYM_FEVER_001")
  name: string;
  category: 'mental' | 'general' | 'particular' | 'modality' | string; // Enhanced
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW - REQUIRED
  synonyms: string[]; // NEW - Alternative names
  // Classical Homeopathy specific
  location?: string; // NEW
  sensation?: string; // NEW
  modalities?: string[]; // NEW - Better/worse conditions
  // ... existing fields
}
```

**Migration Script**: 
- Existing symptoms ko `modality: 'electro_homeopathy'` set karein
- `code` field generate karein (e.g., `SYM_${name.toUpperCase().replace(/\s/g, '_')}_${timestamp}`)
- `category` ko enum me convert karein (agar string hai to)

---

#### **D. MedicineRule Model - Add Modality Field**

**File**: `backend/src/models/MedicineRule.model.ts`

**Changes**:
```typescript
export interface IMedicineRule extends Document {
  // ... existing fields
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW - REQUIRED
  // ... rest of fields
}
```

**Migration Script**: Existing rules ko `modality: 'electro_homeopathy'` set karein.

---

#### **E. Prescription Model - Add Modality Field**

**File**: `backend/src/models/Prescription.model.ts`

**Changes**:
```typescript
export interface IPrescription extends Document {
  // ... existing fields
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW - REQUIRED
  medicines: [{
    // ... existing fields
    modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW
    potency?: string; // NEW (for Classical: 6C, 30C, 200C)
    repetition?: string; // NEW (for Classical: TDS, BD, OD)
    // ... rest of fields
  }];
  // ... rest of fields
}
```

**Migration Script**: Existing prescriptions ko `modality: 'electro_homeopathy'` set karein.

---

### **Step 1.2: Create New Models for Classical Homeopathy**

#### **A. Remedy Model** (NEW)

**File**: `backend/src/models/Remedy.model.ts` (CREATE NEW)

**Complete Model**:
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IRemedy extends Document {
  name: string;
  category: string; // Plant Kingdom, Mineral Kingdom, etc.
  modality: 'classical_homeopathy';
  // Constitution traits
  constitutionTraits: string[];
  // Modalities
  modalities: {
    better: string[];
    worse: string[];
  };
  // Clinical indications
  clinicalIndications: string[];
  // Incompatibilities
  incompatibilities: string[]; // Remedy IDs
  // Materia Medica
  materiaMedica: {
    keynotes: string[];
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

const remedySchema = new Schema<IRemedy>(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    modality: { type: String, required: true, enum: ['classical_homeopathy'], default: 'classical_homeopathy' },
    constitutionTraits: [{ type: String }],
    modalities: {
      better: [{ type: String }],
      worse: [{ type: String }],
    },
    clinicalIndications: [{ type: String }],
    incompatibilities: [{ type: String }], // Remedy IDs
    materiaMedica: {
      keynotes: [{ type: String }],
      pathogenesis: { type: String, default: '' },
      clinicalNotes: { type: String, default: '' },
    },
    supportedPotencies: [{ type: String }],
    indications: { type: String },
    defaultDosage: { type: String },
    contraIndications: { type: String },
    notes: { type: String },
    isGlobal: { type: Boolean, default: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor' },
  },
  { timestamps: true }
);

// Indexes
remedySchema.index({ name: 1 }, { unique: true });
remedySchema.index({ category: 1, modality: 1 });
remedySchema.index({ constitutionTraits: 1 });
remedySchema.index({ 'modalities.better': 1, 'modalities.worse': 1 });
remedySchema.index({ isGlobal: 1, doctorId: 1 });

export default mongoose.model<IRemedy>('Remedy', remedySchema);
```

---

#### **B. Rubric Model** (NEW)

**File**: `backend/src/models/Rubric.model.ts` (CREATE NEW)

**Complete Model**:
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IRubric extends Document {
  repertoryType: 'kent' | 'bbcr' | 'boericke' | 'synthesis';
  chapter: string; // Mind, Generals, etc.
  rubricText: string; // "FEAR - death, of"
  linkedSymptoms: string[]; // Symptom codes
  modality: 'classical_homeopathy';
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rubricSchema = new Schema<IRubric>(
  {
    repertoryType: {
      type: String,
      required: true,
      enum: ['kent', 'bbcr', 'boericke', 'synthesis'],
    },
    chapter: { type: String, required: true },
    rubricText: { type: String, required: true },
    linkedSymptoms: [{ type: String }], // Symptom codes
    modality: {
      type: String,
      required: true,
      enum: ['classical_homeopathy'],
      default: 'classical_homeopathy',
    },
    isGlobal: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
rubricSchema.index({ rubricText: 'text' }); // Full-text search
rubricSchema.index({ repertoryType: 1, chapter: 1 });
rubricSchema.index({ linkedSymptoms: 1 });
rubricSchema.index({ modality: 1, isGlobal: 1 });

export default mongoose.model<IRubric>('Rubric', rubricSchema);
```

---

#### **C. RubricRemedy Model** (NEW)

**File**: `backend/src/models/RubricRemedy.model.ts` (CREATE NEW)

**Complete Model**:
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IRubricRemedy extends Document {
  rubricId: mongoose.Types.ObjectId;
  remedyId: mongoose.Types.ObjectId;
  grade: number; // 1, 2, 3, or 4
  repertoryType: 'kent' | 'bbcr' | 'boericke' | 'synthesis';
  createdAt: Date;
  updatedAt: Date;
}

const rubricRemedySchema = new Schema<IRubricRemedy>(
  {
    rubricId: {
      type: Schema.Types.ObjectId,
      ref: 'Rubric',
      required: true,
    },
    remedyId: {
      type: Schema.Types.ObjectId,
      ref: 'Remedy',
      required: true,
    },
    grade: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    repertoryType: {
      type: String,
      required: true,
      enum: ['kent', 'bbcr', 'boericke', 'synthesis'],
    },
  },
  { timestamps: true }
);

// Indexes
rubricRemedySchema.index({ rubricId: 1, remedyId: 1 }, { unique: true });
rubricRemedySchema.index({ remedyId: 1, grade: -1 });
rubricRemedySchema.index({ rubricId: 1, grade: -1 });

export default mongoose.model<IRubricRemedy>('RubricRemedy', rubricRemedySchema);
```

---

#### **D. CaseRecord Model** (NEW)

**File**: `backend/src/models/CaseRecord.model.ts` (CREATE NEW)

**Complete Model**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` for full schema.

---

### **Step 1.3: Create Migration Scripts**

**File**: `backend/src/scripts/migrateModalityFields.ts` (CREATE NEW)

**Purpose**: Existing data ko modality fields add karein.

---

## 📋 Phase 2: Service Modules (Core Logic)

### **Step 2.1: Create Services Directory**

**Directory**: `backend/src/services/` (CREATE NEW)

---

### **Step 2.2: Implement Service Modules (Priority Order)**

#### **Priority 1: Case Engine Service**

**File**: `backend/src/services/caseEngine.service.ts` (CREATE NEW)

**Why First**: Yeh base service hai jo structured case ko normalize karta hai.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 1.

---

#### **Priority 2: Symptom Normalization Engine**

**File**: `backend/src/services/symptomNormalization.service.ts` (CREATE NEW)

**Why Second**: Symptom normalization ke bina rubric mapping nahi ho sakta.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 2.

---

#### **Priority 3: Rubric Mapping Engine**

**File**: `backend/src/services/rubricMapping.service.ts` (CREATE NEW)

**Why Third**: Rubrics ke bina repertory engine kaam nahi karega.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 3.

---

#### **Priority 4: Repertory Engine**

**File**: `backend/src/services/repertoryEngine.service.ts` (CREATE NEW)

**Why Fourth**: Remedy pool build karna zaroori hai scoring se pehle.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 4.

---

#### **Priority 5: Smart Scoring Engine** (CORE)

**File**: `backend/src/services/scoringEngine.service.ts` (CREATE NEW)

**Why Fifth**: Yeh core engine hai jo final scores calculate karta hai.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 5.

**Important**: Scoring formula ko carefully implement karein.

---

#### **Priority 6: Clinical Intelligence Layer**

**File**: `backend/src/services/clinicalIntelligence.service.ts` (CREATE NEW)

**Why Sixth**: Scoring ke baad clinical filters apply karein.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 6.

---

#### **Priority 7: Contradiction & Safety Engine**

**File**: `backend/src/services/contradictionEngine.service.ts` (CREATE NEW)

**Why Seventh**: Safety checks zaroori hain before final suggestions.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 7.

---

#### **Priority 8: Suggestion Engine**

**File**: `backend/src/services/suggestionEngine.service.ts` (CREATE NEW)

**Why Eighth**: Final suggestions generate karein.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 8.

---

#### **Priority 9: Outcome & Learning Hook**

**File**: `backend/src/services/outcomeLearning.service.ts` (CREATE NEW)

**Why Ninth**: Data capture ke liye, baad me implement kar sakte hain.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` Step 9.

---

#### **Priority 10: Main Rule Engine Service** (Integration)

**File**: `backend/src/services/classicalHomeopathyRuleEngine.service.ts` (CREATE NEW)

**Why Last**: Sab services ready hone ke baad integrate karein.

**Implementation**: See `CLASSICAL_HOMEOPATHY_RULE_ENGINE_FLOW.md` - Complete Engine Integration section.

---

## 📋 Phase 3: API Endpoints (Integration)

### **Step 3.1: Create Controller**

**File**: `backend/src/controllers/classicalHomeopathy.controller.ts` (CREATE NEW)

**Endpoints**:
1. `POST /api/classical-homeopathy/suggest` - Main suggestion endpoint
2. `PUT /api/classical-homeopathy/case/:id/decision` - Update doctor decision
3. `PUT /api/classical-homeopathy/case/:id/outcome` - Update outcome
4. `GET /api/classical-homeopathy/statistics/remedy/:id` - Remedy statistics
5. `GET /api/classical-homeopathy/statistics/patterns` - Pattern analysis

---

### **Step 3.2: Create Routes**

**File**: `backend/src/routes/classicalHomeopathy.routes.ts` (CREATE NEW)

**Integration**: `backend/src/server.ts` me routes add karein.

---

## 📋 Phase 4: Frontend Integration

### **Step 4.1: Update Doctor Settings**

**File**: `src/pages/Settings.tsx`

**Changes**: Modality selector add karein.

---

### **Step 4.2: Update Consultation Page**

**File**: `src/pages/Consultation.tsx` (or similar)

**Changes**: 
- Structured case input form (mental, generals, particulars, modalities)
- Classical Homeopathy symptom selection UI
- Remedy suggestions display with reasoning

---

### **Step 4.3: Create API Functions**

**File**: `src/lib/api/classicalHomeopathy.api.ts` (CREATE NEW)

**Functions**: All API calls for Classical Homeopathy.

---

## 📋 Phase 5: Testing & Refinement

### **Step 5.1: Unit Tests**

- Test each service module independently
- Test scoring formula
- Test contradiction detection

---

### **Step 5.2: Integration Tests**

- Test complete flow end-to-end
- Test API endpoints
- Test frontend integration

---

### **Step 5.3: Seed Data**

**File**: `backend/src/scripts/seedClassicalHomeopathy.ts` (CREATE NEW)

**Data to Seed**:
- 100+ Remedies with Materia Medica
- 200+ Symptoms with codes and synonyms
- 1000+ Rubrics from Kent, BBCR, Boericke
- 5000+ Rubric-Remedy mappings with grades

---

## 🚀 Quick Start Guide

### **Day 1-2: Database Models**

1. Update existing models (Doctor, Medicine, Symptom, MedicineRule, Prescription)
2. Create new models (Remedy, Rubric, RubricRemedy, CaseRecord)
3. Run migration scripts
4. Test models in MongoDB

---

### **Day 3-5: Core Services**

1. Create `services/` directory
2. Implement Case Engine
3. Implement Symptom Normalization Engine
4. Implement Rubric Mapping Engine
5. Implement Repertory Engine
6. Implement Smart Scoring Engine (CORE)

---

### **Day 6-7: Additional Services**

1. Implement Clinical Intelligence Layer
2. Implement Contradiction Engine
3. Implement Suggestion Engine
4. Implement Outcome Learning Hook
5. Implement Main Rule Engine (Integration)

---

### **Day 8-9: API & Frontend**

1. Create controller and routes
2. Test API endpoints
3. Update frontend (Settings, Consultation)
4. Create API functions

---

### **Day 10: Testing & Seed Data**

1. Write unit tests
2. Write integration tests
3. Create seed scripts
4. Seed initial data

---

## 📝 Important Notes

1. **Start with Models**: Database foundation pehle banana zaroori hai
2. **Test Each Service**: Har service ko independently test karein
3. **Incremental Development**: Ek service complete karke next pe jao
4. **Documentation**: Code me comments add karein
5. **Error Handling**: Proper error handling har service me

---

## 🎯 Success Criteria

- ✅ All models created and migrated
- ✅ All 9 service modules implemented
- ✅ API endpoints working
- ✅ Frontend integration complete
- ✅ Seed data loaded
- ✅ Tests passing

---

**Last Updated**: January 2025  
**Status**: Ready for Implementation  
**Next Step**: Start with Phase 1 - Database Models
