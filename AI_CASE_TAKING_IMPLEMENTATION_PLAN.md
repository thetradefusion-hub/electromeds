# AI Case Taking Module - Complete Implementation Plan

## 📋 Executive Summary

**Goal**: Transform current manual symptom selection system into an AI-powered intelligent case taking platform that rivals RadarOpus.

**Current State**: Manual symptom selection from dropdown/search
**Target State**: Voice + NLP + AI-guided case taking with auto-structuring

---

## 🔍 Current Codebase Analysis

### ✅ **What Already Exists:**

#### **Frontend:**
1. **Consultation.tsx** - Main consultation page
   - Manual symptom selection (search + dropdown)
   - Symptom categorization (mental, general, particular, modality)
   - Basic structured form
   - Vitals recording
   - Prescription generation

2. **ClassicalHomeopathyConsultation.tsx** - Classical homeopathy specific
   - Structured symptom input by category
   - Pathology tags
   - Remedy suggestion flow
   - Progress indicator

3. **ClassicalSymptomSelector.tsx** - Symptom selection component
   - Search functionality
   - Category-based filtering
   - Manual symptom addition

#### **Backend:**
1. **caseEngine.service.ts** - Case normalization
   - `normalizeCase()` - Converts structured case to normalized profile
   - Symptom code mapping
   - Category assignment

2. **symptomNormalization.service.ts** - Symptom text normalization
   - Text matching
   - Synonym handling
   - Confidence scoring

3. **rubricMapping.service.ts** - Rubric matching
   - Symptom to rubric mapping
   - Text-based matching (for OOREP data)

4. **classicalHomeopathyRuleEngine.service.ts** - Main rule engine
   - 9-step process
   - Case processing
   - Remedy suggestions

### ❌ **What's Missing (From Plan):**

1. **Multimodal Input:**
   - ❌ Voice input (Speech-to-Text)
   - ❌ Free-text narrative input
   - ❌ Auto-formatting
   - ❌ Language detection (Hindi/English/Hinglish)

2. **AI Symptom Intelligence:**
   - ❌ NLP symptom extraction from free text
   - ❌ Entity recognition (body parts, sensations, emotions)
   - ❌ Modality detection (better/worse, time, weather)
   - ❌ Meta-attributes extraction (intensity, duration, frequency)

3. **Smart Structuring UI:**
   - ❌ Editable symptom cards with AI confidence
   - ❌ Drag-and-drop categorization
   - ❌ "Strange, rare, peculiar" marking
   - ❌ Importance slider
   - ❌ Doctor correction tracking

4. **AI-Guided Questioning:**
   - ❌ Case completeness analysis
   - ❌ Missing symptom detection
   - ❌ Smart question generation
   - ❌ Yes/No quick buttons

5. **Auto Rubric Mapping:**
   - ⚠️ Partially exists (text-based matching)
   - ❌ Multiple rubric suggestions
   - ❌ Rubric selection UI
   - ❌ Rare rubric highlighting

6. **Intelligent Case Summary:**
   - ❌ Auto-generated clinical summary
   - ❌ Homeopathic summary
   - ❌ Keynotes extraction
   - ❌ Strange/rare/peculiar list

7. **Learning & Improvement:**
   - ❌ Doctor correction logging
   - ❌ Model feedback loop
   - ❌ Dataset building

---

## 🎯 Implementation Roadmap

### **Phase 1: Foundation (Weeks 1-2)**
**Goal**: Basic multimodal input + simple NLP

#### **1.1 Free-Text Input Component**
**Files to Create:**
- `src/components/consultation/AICaseInput.tsx`
- `src/components/consultation/FreeTextInput.tsx`

**Features:**
- Large textarea for narrative input
- Auto-formatting (punctuation, paragraphs)
- Real-time character count
- Save as draft

**Backend API:**
- `POST /api/ai-case-taking/extract-symptoms`
  - Input: `{ text: string, language?: string }`
  - Output: `{ symptoms: ExtractedSymptom[], confidence: number }`

**Dependencies:**
- None (simple keyword extraction initially)

---

#### **1.2 Basic Symptom Extraction Service**
**Files to Create:**
- `backend/src/services/aiCaseTaking.service.ts`
- `backend/src/services/symptomExtraction.service.ts`

**Features:**
- Keyword-based symptom extraction
- Category detection (mental/general/particular/modality)
- Simple pattern matching

**Algorithm:**
```typescript
// Phase 1: Simple keyword matching
1. Split text into sentences
2. Match against symptom database (name + synonyms)
3. Extract context (location, sensation, time)
4. Assign category based on keywords
```

**Dependencies:**
- Existing symptom database (74,866 symptoms)
- Basic regex patterns

---

#### **1.3 Symptom Cards UI**
**Files to Create:**
- `src/components/consultation/ExtractedSymptomCard.tsx`

**Features:**
- Display extracted symptoms
- Edit symptom text
- Confirm/reject buttons
- Category assignment dropdown
- Confidence indicator

**Integration:**
- Replace manual symptom selector with extracted symptoms
- Allow manual addition as fallback

---

### **Phase 2: Voice Input (Weeks 3-4)**
**Goal**: Speech-to-text integration

#### **2.1 Voice Recording Component**
**Files to Create:**
- `src/components/consultation/VoiceInput.tsx`
- `src/hooks/useVoiceRecorder.ts`

**Features:**
- Record button with visual feedback
- Real-time transcription
- Pause/resume
- Language selection (Hindi/English)
- Low-confidence highlighting

**APIs to Integrate:**
- **Option 1**: Web Speech API (browser native, free)
  - Pros: No cost, works offline
  - Cons: Limited language support, accuracy varies

- **Option 2**: Google Cloud Speech-to-Text
  - Pros: High accuracy, multilingual
  - Cons: Cost per minute, requires API key

- **Option 3**: OpenAI Whisper API
  - Pros: Excellent accuracy, multilingual
  - Cons: Cost, API dependency

**Recommendation**: Start with Web Speech API, upgrade to Whisper/Google later

**Backend API:**
- `POST /api/ai-case-taking/transcribe-audio`
  - Input: `{ audioBlob: Blob, language: string }`
  - Output: `{ text: string, confidence: number }`

---

#### **2.2 Audio Processing Service**
**Files to Create:**
- `backend/src/services/speechToText.service.ts`
- `backend/src/controllers/aiCaseTaking.controller.ts`

**Features:**
- Audio file handling
- Format conversion
- API integration (Whisper/Google)
- Error handling

**Dependencies:**
- `multer` (already installed) for file upload
- Speech-to-text API key

---

### **Phase 3: Advanced NLP (Weeks 5-8)**
**Goal**: Real AI-powered symptom extraction

#### **3.1 NLP Symptom Extraction Engine**
**Files to Create:**
- `backend/src/services/nlpSymptomExtraction.service.ts`
- `backend/src/services/entityRecognition.service.ts`

**Features:**
- Named Entity Recognition (NER)
- Symptom entity detection:
  - Body parts
  - Sensations (pain, burning, itching)
  - Complaints (fever, cough, headache)
  - Emotions (anxiety, fear, anger)
  - Food/cravings
  - Sleep patterns
  - Thermal reactions
  - Discharges

**AI Models to Use:**
- **Option 1**: spaCy (Python) + API wrapper
  - Pros: Free, good NER, custom training
  - Cons: Need Python service

- **Option 2**: Transformers.js (JavaScript)
  - Pros: Pure JS, no Python needed
  - Cons: Limited models, browser-only

- **Option 3**: OpenAI GPT-4 with structured output
  - Pros: Excellent accuracy, understands context
  - Cons: Cost, API dependency

- **Option 4**: Custom fine-tuned model
  - Pros: Domain-specific, accurate
  - Cons: Training time, data needed

**Recommendation**: Start with GPT-4 API for MVP, build custom model later

**Backend API:**
- `POST /api/ai-case-taking/extract-entities`
  - Input: `{ text: string }`
  - Output: `{ entities: Entity[], symptoms: ExtractedSymptom[], modalities: Modality[] }`

---

#### **3.2 Modality Detection Service**
**Files to Create:**
- `backend/src/services/modalityDetection.service.ts`

**Features:**
- Better/worse factor detection
- Time modality extraction (morning, evening, night)
- Weather influence
- Motion/posture impact
- Mental triggers

**Algorithm:**
```typescript
// Pattern matching + NLP
1. Detect temporal words (morning, evening, etc.)
2. Detect comparative words (better, worse, aggravated)
3. Detect environmental factors (cold, heat, weather)
4. Detect activity triggers (motion, rest, eating)
```

---

#### **3.3 Meta-Attributes Extraction**
**Files to Create:**
- `backend/src/services/metaAttributeExtraction.service.ts`

**Features:**
- Intensity detection (mild, moderate, severe)
- Duration extraction (days, weeks, months)
- Frequency detection (constant, intermittent)
- Peculiarity scoring

---

### **Phase 4: Smart UI Components (Weeks 9-10)**
**Goal**: Interactive symptom structuring interface

#### **4.1 Enhanced Symptom Cards**
**Files to Modify:**
- `src/components/consultation/ExtractedSymptomCard.tsx` (enhance)

**New Features:**
- Drag-and-drop between categories
- Importance slider (1-5)
- "Strange, rare, peculiar" checkbox
- AI confidence indicator with tooltip
- "Why detected?" explanation
- Edit inline

---

#### **4.2 Case Completeness Analyzer**
**Files to Create:**
- `backend/src/services/caseCompleteness.service.ts`
- `src/components/consultation/CaseCompletenessPanel.tsx`

**Features:**
- Analyze current case
- Identify missing domains:
  - Mental generals
  - Physical generals
  - Sleep, thirst, appetite
  - Thermal reaction
  - Dreams/fears
- Generate missing symptom checklist

**Backend API:**
- `POST /api/ai-case-taking/analyze-completeness`
  - Input: `{ case: StructuredCase }`
  - Output: `{ missingDomains: string[], suggestions: Question[] }`

---

#### **4.3 Smart Question Generator**
**Files to Create:**
- `backend/src/services/questionGenerator.service.ts`
- `src/components/consultation/SmartQuestionsPanel.tsx`

**Features:**
- Generate contextual questions
- Yes/No quick buttons
- MCQ options
- Follow-up question chains

**Algorithm:**
```typescript
// Rule-based + AI
1. Check missing domains
2. Generate questions based on:
   - Classical homeopathy principles
   - Current symptoms context
   - Patient profile
3. Prioritize questions (most important first)
```

**Backend API:**
- `POST /api/ai-case-taking/generate-questions`
  - Input: `{ case: StructuredCase, missingDomain: string }`
  - Output: `{ questions: Question[] }`

---

### **Phase 5: Auto Rubric Mapping (Weeks 11-12)**
**Goal**: Intelligent rubric suggestions

#### **5.1 Enhanced Rubric Mapping**
**Files to Modify:**
- `backend/src/services/rubricMapping.service.ts` (enhance)

**New Features:**
- Multiple rubric suggestions per symptom
- Rubric ranking by relevance
- Rare rubric highlighting
- Rubric selection UI

**Backend API:**
- `POST /api/ai-case-taking/suggest-rubrics`
  - Input: `{ symptom: ExtractedSymptom }`
  - Output: `{ rubrics: RubricSuggestion[], rareRubrics: RubricSuggestion[] }`

---

#### **5.2 Rubric Selection Component**
**Files to Create:**
- `src/components/consultation/RubricSelector.tsx`

**Features:**
- Display multiple rubric options
- Show source repertory
- Show grade/weight
- Allow manual rubric addition
- Auto-build repertory sheet

---

### **Phase 6: Case Summary Generation (Weeks 13-14)**
**Goal**: AI-powered case documentation

#### **6.1 Case Summary Generator**
**Files to Create:**
- `backend/src/services/caseSummaryGenerator.service.ts`
- `src/components/consultation/CaseSummaryPanel.tsx`

**Features:**
- Auto-generate clinical summary
- Generate homeopathic summary
- Extract keynotes
- List strange/rare/peculiar symptoms
- Doctor editing capability

**AI Integration:**
- Use GPT-4 for summary generation
- Template-based approach
- Structured output

**Backend API:**
- `POST /api/ai-case-taking/generate-summary`
  - Input: `{ case: StructuredCase, normalizedCase: NormalizedCaseProfile }`
  - Output: `{ clinicalSummary: string, homeopathicSummary: string, keynotes: string[], strangeSymptoms: string[] }`

---

### **Phase 7: Learning & Improvement (Weeks 15-16)**
**Goal**: Continuous model improvement

#### **7.1 Feedback Collection**
**Files to Create:**
- `backend/src/models/AICaseTakingFeedback.model.ts`
- `backend/src/services/feedbackCollection.service.ts`

**Features:**
- Log doctor corrections
- Track rubric changes
- Record accepted/rejected suggestions
- Build training dataset

**Database Schema:**
```typescript
{
  caseId: ObjectId,
  originalExtraction: ExtractedSymptom[],
  doctorCorrections: Correction[],
  rubricChanges: RubricChange[],
  acceptedSuggestions: string[],
  rejectedSuggestions: string[],
  timestamp: Date
}
```

---

#### **7.2 Model Retraining Pipeline**
**Files to Create:**
- `backend/src/scripts/retrainSymptomModel.ts`

**Features:**
- Collect feedback data
- Prepare training dataset
- Fine-tune model (future)
- A/B testing

---

## 📊 Database Schema Changes

### **New Collections:**

#### **1. AICaseTakingFeedback**
```typescript
{
  caseId: ObjectId,
  doctorId: ObjectId,
  originalText: string,
  extractedSymptoms: ExtractedSymptom[],
  doctorCorrections: Correction[],
  rubricChanges: RubricChange[],
  acceptedSuggestions: string[],
  rejectedSuggestions: string[],
  createdAt: Date
}
```

#### **2. CaseDraft**
```typescript
{
  patientId: ObjectId,
  doctorId: ObjectId,
  rawText: string,
  extractedSymptoms: ExtractedSymptom[],
  audioUrl?: string,
  language: string,
  status: 'draft' | 'completed',
  createdAt: Date,
  updatedAt: Date
}
```

#### **3. SmartQuestions**
```typescript
{
  caseId: ObjectId,
  questions: Question[],
  answers: Answer[],
  missingDomains: string[],
  createdAt: Date
}
```

---

## 🔧 Technical Stack Additions

### **Frontend:**
- **Voice Recording**: `react-speech-recognition` or Web Speech API
- **Audio Processing**: `wavesurfer.js` (optional, for visualization)
- **Drag & Drop**: `@dnd-kit/core` (for symptom cards)
- **Rich Text**: `react-quill` or `tiptap` (for case summary editing)

### **Backend:**
- **Speech-to-Text**: 
  - Option 1: `@google-cloud/speech` (Google Cloud)
  - Option 2: `openai` (Whisper API)
  - Option 3: Web Speech API (browser-based)
- **NLP**: 
  - Option 1: `openai` (GPT-4 for extraction)
  - Option 2: Python service with `spaCy` (via API)
- **Audio Processing**: `multer` (already installed), `fluent-ffmpeg`

---

## 🎨 UI/UX Enhancements

### **New Components:**

1. **AICaseInput.tsx** - Main AI case input interface
   - Tabs: Voice | Text | Structured Form
   - Real-time extraction preview
   - Confidence indicators

2. **ExtractedSymptomCard.tsx** - Interactive symptom card
   - Drag handle
   - Edit button
   - Confidence badge
   - Category badge
   - Importance slider
   - SRP checkbox

3. **CaseCompletenessPanel.tsx** - Missing symptoms panel
   - Progress indicator
   - Missing domains list
   - Quick add buttons

4. **SmartQuestionsPanel.tsx** - AI-generated questions
   - Question cards
   - Yes/No buttons
   - MCQ options
   - Answer tracking

5. **RubricSelector.tsx** - Rubric selection interface
   - Multiple rubric options
   - Repertory source badges
   - Grade indicators
   - Selection checkboxes

6. **CaseSummaryPanel.tsx** - Auto-generated summary
   - Clinical summary (editable)
   - Homeopathic summary (editable)
   - Keynotes list
   - SRP symptoms highlight

---

## 📈 Success Metrics

### **Phase 1-2 (Foundation):**
- ✅ Free-text input working
- ✅ Basic symptom extraction (70%+ accuracy)
- ✅ Voice input functional

### **Phase 3-4 (NLP + UI):**
- ✅ NLP extraction (85%+ accuracy)
- ✅ Case completeness detection
- ✅ Question generation working

### **Phase 5-6 (Intelligence):**
- ✅ Auto rubric mapping (80%+ accuracy)
- ✅ Case summary generation
- ✅ Doctor acceptance rate >60%

### **Phase 7 (Learning):**
- ✅ Feedback collection active
- ✅ Model improvement pipeline ready

---

## 🚀 Implementation Priority

### **Must Have (MVP):**
1. Free-text input ✅
2. Basic keyword extraction ✅
3. Symptom cards UI ✅
4. Voice input (Web Speech API) ✅
5. Case completeness analyzer ✅

### **Should Have:**
1. Advanced NLP extraction (GPT-4)
2. Smart question generator
3. Auto rubric mapping
4. Case summary generation

### **Nice to Have:**
1. Custom trained model
2. Multilingual support (Hindi)
3. Emotion detection
4. Learning pipeline

---

## 💰 Cost Estimation

### **Development:**
- **Phase 1-2**: 2-3 weeks (1 developer)
- **Phase 3-4**: 4-5 weeks (1 developer)
- **Phase 5-6**: 3-4 weeks (1 developer)
- **Phase 7**: 2 weeks (1 developer)
- **Total**: 11-14 weeks

### **Infrastructure:**
- **Speech-to-Text**: 
  - Web Speech API: Free
  - Google Cloud: ~$0.006 per 15 seconds
  - OpenAI Whisper: ~$0.006 per minute
- **NLP (GPT-4)**:
  - ~$0.03 per case (input) + $0.06 per case (output)
  - Estimated: $0.10 per case
- **Storage**: Minimal (audio files, feedback data)

---

## 🔐 Security & Privacy

### **Requirements:**
1. **Audio Data**: Encrypt at rest, delete after processing
2. **Patient Data**: HIPAA compliance (if applicable)
3. **API Keys**: Store in environment variables
4. **Audit Logs**: Track all AI suggestions and doctor actions
5. **Data Ownership**: Doctor owns all data

---

## 📝 Next Steps

1. **Review this plan** with team
2. **Prioritize features** based on business needs
3. **Set up development environment** (API keys, etc.)
4. **Start with Phase 1** (Foundation)
5. **Iterate based on feedback**

---

## 🎯 Key Differentiators vs RadarOpus

1. **Voice Input**: RadarOpus doesn't have this
2. **AI-Guided Questioning**: Unique feature
3. **Real-time Extraction**: Instant feedback
4. **Cloud-based**: No desktop installation
5. **Modern UI**: Better UX than legacy software
6. **Learning System**: Gets better with use

---

**This plan transforms your current manual system into a next-generation AI-powered case taking platform! 🚀**
