# AI Case Input – Voice Case Input: Current Status

Yeh document batata hai ki **Voice Case Input** abhi app mein **kya hal (state)** mein hai – kya kaam kar raha hai, kya limitations hain, aur kahan use hota hai.

---

## 1. Kahan dikhta hai

- **AI Case Input** ke andar **tabs** hain: **Free Text** | **Voice** | Structured Form.
- **Voice** tab pe click karne par **Voice Case Input** UI dikhta hai.
- Ye **dono layouts** mein available hai:
  - **Full AICaseInput** (jahan extracted results bhi isi panel mein dikhte hain), aur
  - **4-column layout** (Patient Narrative column) – wahan bhi tabs hain, isliye Voice tab wahi se use ho sakta hai.

---

## 2. Abhi kya implement hai (working)

### 2.1 Browser-based speech-to-text
- **Web Speech API** (browser ka built-in **SpeechRecognition**) use hota hai.
- **Real-time transcription**: bolte waqt text live dikhta hai (final + interim).
- **Supported browsers**: Chrome, Edge, Safari (Firefox mein support limited/inconsistent hai).
- **Hook**: `useVoiceRecorder` (`src/hooks/useVoiceRecorder.ts`) – start/stop/pause/resume, transcript, errors handle karta hai.

### 2.2 Voice UI (VoiceInput.tsx)
- **Language select**: English (US), English (India), Hindi (India), Spanish, French.
- **Record**: Mic button → recording start.
- **Pause / Stop**: Pause, phir Resume ya Stop.
- **Timer**: Recording time “00:00” format mein.
- **Transcript box**: Live transcript dikhta hai; final text solid, interim italic.
- **Clear**: Transcript clear karne ka button.
- **Extract Symptoms**: Transcript ke upar “Extract Symptoms” button – same extraction as Free Text (NLP/Keyword).

### 2.3 Flow (kaise chal raha hai)
1. User **Voice** tab kholta hai → mic permission (browser prompt).
2. **Start** → bolna shuru → transcript real-time update hota hai.
3. **Stop** → transcript final ho jata hai; ye text **narrative** mein bhi save ho jata hai (parent state `aiNarrativeText` / controlled `narrativeValue`).
4. **Extract Symptoms** dabane par:
   - **narrativeOnly mode (4-column)**: Parent ka `handleExtractFromNarrative()` chalta hai, jo `aiNarrativeText` (voice se aaya hua text) use karke extraction karta hai.
   - **Normal mode**: AICaseInput khud `extractSymptoms` API call karta hai, same narrative text ke saath.
5. Extraction ke baad **symptoms / entities / modalities** list mein dikhte hain (normal mode) ya **Extracted** column mein (4-column mode).

---

## 3. Limitations / caveats (abhi kya nahi hai)

| Point | Detail |
|-------|--------|
| **Browser dependency** | Sirf Chrome, Edge, Safari reliable; Firefox / purane browsers par “not supported” ya inconsistent. |
| **Server-side STT** | Ab **Whisper** use ho raha hai – record → upload → server transcribe → transcript. (Pehle browser-only tha.) |
| **Offline** | Chrome/Edge ka on-device recognition kaam kar sakta hai; baaki often online engine use karte hain. |
| **Pause = stop** | `pauseRecording()` actually recognition **stop** karta hai; resume par **naya session** start hota hai (purana transcript rehta hai, lekin true “pause and resume same session” nahi). |
| **Noise / accent** | Accuracy fully browser/engine par; app side se koi extra noise reduction ya model nahi. |
| **Structured form** | “Structured Form” tab abhi disabled / “coming soon” – iska voice se koi link nahi. |

---

## 4. Technical summary

- **Component**: `VoiceInput` (`src/components/consultation/VoiceInput.tsx`).
- **Hook**: `useVoiceRecorder` (`src/hooks/useVoiceRecorder.ts`) – Web Speech API wrap karta hai.
- **Parent**: `AICaseInput` – Voice tab ke andar `VoiceInput` ko `onTranscriptReady` aur `onExtract` (ya narrativeOnly + Extract) pass karta hai; transcript narrative state mein sync rehta hai.
- **Extraction**: Voice se mila hua text **same pipeline** se jata hai jo Free Text use karta hai (`extractSymptoms` API, NLP/Keyword).

---

## 5. Short answer: “Abhi kya hal hai?”

- **Voice Case Input**: Record (mic → MediaRecorder) → Stop pe audio backend ko bhejna → **Whisper** se transcribe → transcript narrative mein + **Extract Symptoms** same pipeline.
- **Condition**: OpenAI API key (backend), modern browser (MediaRecorder + mic permission).
- **Benefit**: Better accuracy, Hindi/English mix, sab browsers (Chrome, Edge, Firefox, Safari); pause/resume recording supported.

Agar aap chahein to next step mein **improvements** (e.g. live transcript in 4-column, better pause/resume, or backend STT option) list kar sakte hain.

---

## 6. Agar Whisper use karein to kya kya hoga

**Whisper** = OpenAI ka speech-to-text API. Abhi app **browser Web Speech API** use karti hai; Whisper **server-side** transcription hai.

### 6.1 Kya better hoga (benefits)

| Pehle (Web Speech) | Whisper ke baad |
|--------------------|-----------------|
| Sirf Chrome/Edge/Safari reliable | **Koi bhi browser** jahan audio record + upload ho sake (Firefox bhi) |
| Accuracy browser par depend | **Consistent, zyada accurate** – medical/technical terms ke liye better |
| Real-time transcript (live) | **Post-recording transcript** – record khatam, phir server pe bhejo, result aaye (real-time optional/chunked possible but extra work) |
| Free (browser) | **Paid** – ~$0.006 per minute (OpenAI Whisper API) |
| Pause = stop, resume = naya session | **Pause/Resume** same recording; stop pe **ek hi audio file** server ko bhej sakte ho → **single transcript** |
| Hindi/regional quality variable | **Hindi + English mix** Whisper se generally better handle hota hai |

**Short:**  
- **Browser independence** + **better accuracy** + **better Hindi/mixed language** + **proper pause/resume** (one recording → one transcript).  
- Trade-off: **cost** (per minute) + **real-time nahi by default** (record → upload → transcript aata hai).

### 6.2 Kya change hoga (flow / UX)

1. **Recording**  
   - Same: mic se record (start / pause / resume / stop).  
   - Change: audio **browser mein buffer** hoga (e.g. MediaRecorder), **real-time transcript nahi** (optional baad mein add kar sakte ho).

2. **Stop ke baad**  
   - Audio backend ko bhejna (e.g. `POST /api/ai-case-taking/transcribe-audio` with multipart file).  
   - Backend **Whisper API** call karega → text wapas aayega.  
   - UI mein wahi text narrative + Extract Symptoms flow mein use hoga (same as ab).

3. **Transcript source**  
   - Ab: browser (Web Speech) → live text.  
   - Whisper: server (Whisper) → text after upload.  
   - **Extract Symptoms** logic same rahega – sirf text ka source change hoga (Whisper response).

4. **Optional: hybrid**  
   - Option 1: **Sirf Whisper** (record → upload → transcript).  
   - Option 2: **Web Speech + Whisper** – Web Speech “preview” ke liye, “Confirm with Whisper” pe upload karke final transcript (better accuracy).

### 6.3 Kya banana padega (implementation)

| Layer | Kya karna hoga |
|-------|-----------------|
| **Backend** | Naya endpoint: `POST /api/ai-case-taking/transcribe-audio` (audio file accept). OpenAI SDK se `openai.audio.transcriptions.create()` (Whisper). Same `OPENAI_API_KEY` use ho sakta hai. |
| **Frontend** | Recording: **MediaRecorder** se audio capture (e.g. WebM/Blob). Stop pe file upload to above API. Loading state + transcript display. Optional: Web Speech hata ke only Whisper, ya “Use Whisper” toggle. |
| **Config** | Optional: Settings mein “Use Whisper for voice” on/off (agar Web Speech bhi rakhna ho). |
| **Cost** | Billing/usage track karna agar chaho (minutes transcribed). |

### 6.4 Summary: Whisper use karein to

- **Hoga:** Better accuracy, sab browsers, better Hindi/mix, proper pause/resume (one recording → one transcript), same narrative + Extract flow.  
- **Lagega:** Backend transcribe endpoint, frontend audio record + upload, OpenAI cost per minute.  
- **Optional:** Real-time preview (Web Speech) + “Confirm with Whisper”; ya settings mein Web Speech vs Whisper choice.
