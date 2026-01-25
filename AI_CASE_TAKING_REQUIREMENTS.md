# AI Case Taking - Requirements & Setup Guide

## 📋 Overview

Yeh document batata hai ki AI Case Taking implementation ke liye kya-kya chahiye aur aapko kya provide karna hoga.

---

## ✅ Current Project Status

### **Already Available:**
1. ✅ **AI Infrastructure**: 
   - `AISettings.model.ts` - AI provider configuration
   - `aiAnalysis.controller.ts` - AI API integration
   - Support for: Lovable, OpenAI, Google, Custom providers

2. ✅ **Backend Setup**:
   - Express.js + TypeScript
   - MongoDB + Mongoose
   - Multer (file upload) - already installed
   - Environment config (`backend/src/config/env.ts`)

3. ✅ **Frontend Setup**:
   - React 18 + TypeScript
   - Shadcn UI components
   - TanStack Query

4. ✅ **Data**:
   - 74,866 symptoms (extracted from rubrics)
   - 74,666 rubrics (publicum repertory)
   - Symptom database ready

---

## 🔑 Required API Keys & Services

### **1. OpenAI API (Must Have for Phase 3+)**

**Purpose**: 
- NLP symptom extraction (GPT-4)
- Case summary generation
- Smart question generation

**How to Get:**
1. Go to: https://platform.openai.com/
2. Sign up / Login
3. Go to API Keys section
4. Create new API key
5. Copy the key

**Cost**: 
- GPT-4: ~$0.10 per case (input + output)
- Estimated: $0.10 - $0.15 per case

**What You Need to Provide:**
```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Where to Add:**
- Backend `.env` file
- Or via Admin Panel (AISettings model)

---

### **2. Speech-to-Text API (Required for Phase 2)**

**Option A: OpenAI Whisper API (Recommended)**
- **Purpose**: Voice to text conversion
- **How to Get**: Same OpenAI account (no separate signup)
- **Cost**: ~$0.006 per minute
- **API Key**: Same as OpenAI API key

**Option B: Google Cloud Speech-to-Text**
- **Purpose**: Voice to text conversion
- **How to Get**: 
  1. Go to: https://cloud.google.com/speech-to-text
  2. Create Google Cloud account
  3. Enable Speech-to-Text API
  4. Create service account
  5. Download JSON key file
- **Cost**: ~$0.006 per 15 seconds
- **What You Need**: Service account JSON file

**Option C: Web Speech API (Free, Phase 1 Only)**
- **Purpose**: Browser-based voice recognition
- **Cost**: Free
- **Limitation**: Works only in browser, limited languages
- **No API Key Needed**: Built into browser

**Recommendation**: Start with Web Speech API (free), upgrade to Whisper later

**What You Need to Provide:**
```
# Option A: OpenAI Whisper (uses same OpenAI key)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Option B: Google Cloud Speech
GOOGLE_CLOUD_SPEECH_KEY_PATH=./path/to/service-account.json
```

---

### **3. Current AI Settings (Already Configured)**

**Current Setup:**
- AI Settings stored in MongoDB (`AISettings` collection)
- Can be configured via Admin Panel
- Supports multiple providers

**What You Need:**
- If using existing AI settings, ensure API key is set in Admin Panel
- Or provide API key in `.env` file

---

## 📦 Required NPM Packages

### **Backend Packages:**

#### **Phase 1-2 (Foundation):**
```bash
# No new packages needed initially
# Multer already installed for file uploads
```

#### **Phase 3+ (Advanced NLP):**
```bash
cd backend
npm install openai
```

#### **Phase 2+ (Speech-to-Text - Optional):**
```bash
# Option A: OpenAI Whisper (uses openai package)
# Already installed above

# Option B: Google Cloud Speech
npm install @google-cloud/speech

# Option C: Web Speech API
# No package needed (browser native)
```

#### **Audio Processing (Optional):**
```bash
npm install fluent-ffmpeg
npm install --save-dev @types/fluent-ffmpeg
```

---

### **Frontend Packages:**

#### **Phase 1 (Free-text Input):**
```bash
# No new packages needed
```

#### **Phase 2 (Voice Input):**
```bash
# Option A: Web Speech API (recommended for MVP)
npm install react-speech-recognition

# Option B: Direct browser API
# No package needed
```

#### **Phase 4 (Drag & Drop):**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

#### **Phase 6 (Rich Text Editing - Optional):**
```bash
npm install react-quill
# or
npm install @tiptap/react @tiptap/starter-kit
```

---

## 🔧 Environment Variables Setup

### **Backend `.env` File:**

Add these to `backend/.env`:

```env
# Existing variables (already there)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:8080

# New variables for AI Case Taking

# OpenAI API (for NLP + Whisper)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Google Cloud Speech (if using instead of Whisper)
GOOGLE_CLOUD_SPEECH_KEY_PATH=./path/to/service-account.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Optional: Audio processing
FFMPEG_PATH=/usr/bin/ffmpeg  # Linux/Mac
# FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe  # Windows
```

---

## 📝 What You Need to Provide

### **1. API Keys (Required):**

#### **Must Have:**
- ✅ **OpenAI API Key** (for NLP extraction, Phase 3+)
  - Get from: https://platform.openai.com/api-keys
  - Cost: Pay-as-you-go (~$0.10 per case)

#### **Optional (Phase 2):**
- ⚠️ **Google Cloud Speech Key** (if not using Whisper)
  - Get from: https://cloud.google.com/speech-to-text
  - Cost: ~$0.006 per 15 seconds

### **2. Environment Variables:**

Create/update `backend/.env` file with:
```env
OPENAI_API_KEY=your_openai_key_here
```

### **3. NPM Packages Installation:**

I'll install these during implementation, but you can pre-install:

**Backend:**
```bash
cd backend
npm install openai
```

**Frontend:**
```bash
npm install react-speech-recognition @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 🎯 Implementation Phases & Requirements

### **Phase 1: Foundation (No API Keys Needed)**
- ✅ Free-text input
- ✅ Basic keyword extraction
- ✅ Symptom cards UI
- **Requirements**: None (uses existing symptom database)

### **Phase 2: Voice Input**
- ✅ Voice recording
- ✅ Speech-to-text
- **Requirements**: 
  - Option A: Web Speech API (free, no key needed)
  - Option B: OpenAI Whisper API key
  - Option C: Google Cloud Speech key

### **Phase 3: Advanced NLP**
- ✅ NLP symptom extraction
- ✅ Entity recognition
- ✅ Modality detection
- **Requirements**: 
  - ✅ **OpenAI API Key (Required)**

### **Phase 4: Smart UI**
- ✅ Case completeness analyzer
- ✅ Smart question generator
- **Requirements**: 
  - ✅ **OpenAI API Key (Required)**

### **Phase 5-6: Intelligence Features**
- ✅ Auto rubric mapping
- ✅ Case summary generation
- **Requirements**: 
  - ✅ **OpenAI API Key (Required)**

### **Phase 7: Learning**
- ✅ Feedback collection
- **Requirements**: None (uses existing database)

---

## 💰 Cost Estimates

### **Per Case Cost:**
- **Speech-to-Text**: 
  - Web Speech API: Free
  - OpenAI Whisper: ~$0.006 per minute
  - Google Cloud: ~$0.006 per 15 seconds

- **NLP Extraction (GPT-4)**:
  - Input: ~$0.03 per case
  - Output: ~$0.06 per case
  - **Total: ~$0.10 per case**

- **Case Summary (GPT-4)**:
  - Input: ~$0.02 per case
  - Output: ~$0.04 per case
  - **Total: ~$0.06 per case**

**Total per case**: ~$0.16 - $0.20 (with all features)

### **Monthly Estimate (100 cases/day):**
- 100 cases/day × 30 days = 3,000 cases/month
- 3,000 × $0.20 = **$600/month**

**Note**: Can reduce costs by:
- Using GPT-3.5 instead of GPT-4 (50% cheaper)
- Caching common extractions
- Batch processing

---

## 🚀 Quick Start Checklist

### **Before Implementation:**

1. ✅ **Get OpenAI API Key**
   - Sign up: https://platform.openai.com/
   - Create API key
   - Add to `backend/.env`

2. ✅ **Install NPM Packages** (I'll do this, but you can pre-install)
   ```bash
   # Backend
   cd backend
   npm install openai
   
   # Frontend
   npm install react-speech-recognition @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

3. ✅ **Update Environment Variables**
   - Add `OPENAI_API_KEY` to `backend/.env`

4. ✅ **Verify MongoDB Connection**
   - Ensure MongoDB is running
   - Symptoms database is populated (74,866 symptoms)

---

## 📋 Summary: What You Need to Provide

### **Must Have:**
1. ✅ **OpenAI API Key**
   - Get from: https://platform.openai.com/api-keys
   - Add to: `backend/.env` as `OPENAI_API_KEY`

### **Optional (Can add later):**
2. ⚠️ **Google Cloud Speech Key** (if not using Whisper)
3. ⚠️ **FFmpeg** (for advanced audio processing)

### **I'll Handle:**
- ✅ NPM package installation
- ✅ Code implementation
- ✅ Database schema updates
- ✅ API integration
- ✅ UI components

---

## 🎯 Next Steps

1. **Get OpenAI API Key** (if you don't have one)
2. **Add to `.env` file**
3. **Tell me when ready** - I'll start implementation!

---

**Note**: Phase 1 (Foundation) can start without any API keys. We can begin with basic keyword extraction and add AI features later.
