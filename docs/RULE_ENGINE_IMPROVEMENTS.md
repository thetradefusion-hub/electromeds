# Rule Engine – Improvements & Enhancements (Accuracy + Doctor Trust)

Yeh document un improvements aur enhancements ko list karta hai jo **better accuracy** aur **doctor trust** ke liye kiye ja sakte hain. Har section mein **kya karna hai**, **kyun**, aur **priority** diya gaya hai.

---

## 1. Accuracy Improvements

### 1.1 Rubric Mapping (Symptoms → Rubrics)

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Symptom synonyms / normalisation** | DB mein symptom ke zyada **synonyms** aur **common spellings** (fever, pyrexia; cough, khasi) add karo. Case normalise karte waqt in synonyms se match karo taaki TEMP_ kam banen. | TEMP_ codes repertory se match nahi hote; synonym match se sahi rubrics milenge. | High |
| **Symptom–Rubric linking (linkedSymptoms)** | Jitne important symptoms hain unke liye **Rubric.linkedSymptoms** populate karo (symptom code → rubric). Script chala kar publicum rubrics ko relevant symptom codes se link karo. | Abhi text match par depend hai; code match zyada reliable hai. | High |
| **Rubric confidence threshold** | Config mein `autoSelectThreshold` use karo (abhi 70 hai, engine 20% use kar raha hai). Auto-select ke liye **confidence ≥ 50%** try karo, taaki kam but zyada relevant rubrics select hon. | Zyada low-confidence rubrics noise aur galat remedies la sakte hain. | Medium |
| **Rubric limit per symptom** | Har symptom se max 5–10 best rubrics hi use karo (confidence sort karke), total cap e.g. 25–30. | Zyada rubrics = zyada remedies pool = ranking dilute. | Medium |
| **Fuzzy / NLP for rubric text** | Simple “contains” ke sath **fuzzy match** (e.g. Levenshtein) ya **word embeddings** (agar data ready ho) se rubric text match improve karo. | Spelling variation, Hindi–English mix se better match. | Low (later) |

### 1.2 Case Normalisation (Step 1)

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Doctor-editable weights** | Frontend par har symptom ke liye **weight override** (1–5) allow karo; yeh structuredCase mein bhejo. | Doctor ko important symptom zyada weight dene do. | Medium |
| **Location + sensation for particulars** | Particulars ke liye **location** aur **sensation** already structure mein hain – inhe rubric suggestion / mapping mein use karo (e.g. “headache, forehead, burning”). | Better rubric match (e.g. “Head – Pain – Forehead – Burning”). | High |
| **Modality type (better/worse)** | Modalities ko **better** vs **worse** clearly bhejo aur scoring/modality bonus mein consistently use karo. | Classical homeopathy mein modality direction important hai. | High (verify current flow) |

### 1.3 Scoring (Step 5)

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Rubric–symptom weight alignment** | Base score mein **rubric level** pe bhi weight consider karo: e.g. mental rubric → mental weight, general rubric → general weight (repertory chapter se ya rubric metadata se). | Abhi sirf symptom weight use ho raha hai; rubric type se alignment accuracy badhegi. | Medium |
| **Grade 3/4 ka zyada impact** | Grade 4 (bold) ko multiplier 1.5 se 1.8–2.0 try karo (config); grade 3 ko 1.2–1.3. | Repertory mein bold/italic = stronger indication. | Low |
| **Coverage bonus refine** | Coverage bonus ko **per-remedy** rakho: jo remedy zyada rubrics se cover karti hai (different symptoms) use zyada bonus. | Abhi coverage global hai; per-remedy se better differentiation. | Medium |
| **Minimum rubric count** | Jo remedy **kam se kam 2–3 rubrics** se match ho wahi suggest karo (config: minRubricsForSuggestion). | Single-rubric match kabhi coincidence ho sakta hai. | High |

### 1.4 Data Quality

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Repertory data audit** | RubricRemedy grades (1–4) aur Rubric texts consistent hon; missing grades fix karo. | Galat grade = galat base score. | High |
| **Remedy keynotes + indications** | Remedy master mein **keynotes** aur **clinicalIndications** complete hon; synonyms add karo. | Keynote/pathology bonus sahi kaam karenge. | High |
| **Incompatibilities** | Remedy **incompatibilities** list verify karo (evidence-based); jahan pata ho add karo. | Safety aur trust dono ke liye. | High |

---

## 2. Doctor Trust (Transparency & Consistency)

### 2.1 Transparent Reasoning

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Matched rubrics list** | Har remedy ke saath **matched rubrics** (text) already aa rahe hain – UI mein clearly list karo (e.g. “Ye remedy in rubrics se match hui: …”). | Doctor dekh sake ki suggestion kis repertory basis par hai. | High |
| **Score breakdown** | UI par **score breakdown** dikhao: Base = X, Constitution = Y, Modality = Z, Pathology = W, Penalty = -P, **Total = T**. | Doctor ko formula samajh aayega, trust badhega. | High |
| **Repertory source** | Har rubric ke saath **repertory name** (e.g. Publicum) aur optional **chapter** show karo. | “Kis repertory se hai” clarity. | Medium |
| **Symptom → rubric link** | Dikhao kaunse **case symptom** se kaunse **rubric** match hue (e.g. “Fever → FEVER – high”). | Traceability: symptom se rubric se remedy. | High |

### 2.2 Confidence & Warnings

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Confidence label** | Har suggestion par **confidence** (Low / Medium / High / Very High) clearly show karo; color/icon se highlight. | Doctor ko pehle hi pata chal jaye kaunsi suggestion zyada reliable hai. | High |
| **Low-confidence warning** | Agar top remedy bhi “medium” ya “low” confidence ho to short message: “Case se match kam hai; clinical judgment use karein.” | Over-reliance kam hogi. | High |
| **Warnings prominent** | Incompatibility / repetition warnings ko **expandable** ya **alert** style mein dikhao; message clear ho. | Safety warnings ignore na hon. | High |
| **Alternatives** | “Agar ye remedy use nahi karni to consider: Remedy 2, Remedy 3” – second/third suggestion ko “alternative” label do. | Doctor ko options dikhen. | Medium |

### 2.3 Audit & Consistency

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Case record detail** | Case record mein **selected rubrics (full)** + **per-remedy scores** save ho rahe hain – ensure yeh **audit API** se doctor ko dikh sake (e.g. “Is case par kya suggest hua tha”). | Repeat case ya dispute par proof. | Medium |
| **Same case = same result** | Ensure **deterministic** flow: same structuredCase + same selectedRubricIds → same order/list (no random, no date-based TEMP_). | Consistency = trust. | High |
| **Version / config tag** | Suggestion save karte waqt **rule engine version** ya **config version** tag save karo. | Baad mein “pehle ka logic tha” vs “ab ka” compare kar sako. | Low |

---

## 3. Safety & Clinical Validity

### 3.1 Contraindications & Demographics

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Contraindications** | Remedy model mein **contraindications** (e.g. pregnancy, specific diseases) add karo; suggestion time check karo. Agar case mein “pregnancy” ya relevant tag ho to contra remedy par **strong warning** ya **exclude**. | Legal + ethical safety. | High |
| **Age / pregnancy in case** | Structured case ya pathologyTags mein **age group** / **pregnancy** capture karo (frontend se). Engine mein iske hisaab se filter/penalty. | Bachche / pregnant women ke liye alag caution. | Medium |
| **Dose / potency cap** | Potency suggestion ko **max potency** (e.g. 1M only when score very high + chronic) se cap karo; repetition “max 3–4 times daily” jaisa safe default. | Over-prescription risk kam. | Medium |

### 3.2 Repetition & Incompatibility

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **History always pass** | Jab bhi suggest chalao **patient remedy history** pass karo (last 90 days / 6 months). | Repetition penalty sahi lagega. | High |
| **Incompatibility severity** | Incompatibility ko **severity** se handle karo: “never together” vs “caution”; first wale ko exclude ya heavy penalty. | Sab incompatibilities same level par na hon. | Medium |
| **Antidote / follow-up** | Remedy model mein **antidote** / **follow-up** notes add karo; suggestion ke saath “Antidote: …” show karo. | Doctor ko follow-up plan clear ho. | Low |

---

## 4. Clinical Intelligence (Step 6) & Potency

### 4.1 Acute vs Chronic

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Pathology tags improve** | Frontend par **Acute / Chronic** aur common pathology (Fever, Cold, Injury, etc.) easy select karo; backend isAcute/isChronic isi se derive karta hai – ensure tags sahi bhejo. | Clinical filters sahi kaam karenge. | High |
| **Chronic remedy definition** | “Constitutional” / “Chronic” remedy ko Remedy model mein flag ya category se identify karo; chronic case mein inhe boost do. | Better match for long-term cases. | Medium |

### 4.2 Potency & Repetition

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Potency reasoning** | Potency ke saath **short reason** dikhao: “Acute case + high score → 200C, 1–2 hr.” | Doctor samjhe kyon ye potency suggest hui. | High |
| **Supported potencies** | Remedy.supportedPotencies use karo: suggest karti waqt sirf supported potencies hi suggest karo. | Galat potency suggest na ho. | High |
| **Repetition in words** | “Every 2–4 hours” ke sath “Max 4–5 times in 24 hours” jaisa safe cap dikhao. | Overuse risk kam. | Medium |

---

## 5. Outcome Learning & Feedback (Step 9)

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Doctor selection record** | Doctor jo **final remedy + potency** select karta hai woh CaseRecord.finalRemedy mein save ho – already ho raha hai; ensure outcome bhi update ho. | Analytics: engine top-1 vs doctor choice. | High |
| **Outcome feedback** | **Outcome** (improved / no change / worsened) capture karo. Is data se baad mein “kitni baar engine ki top suggestion sahi thi” analyse kar sako. | Long-term accuracy improve karne ke liye. | High |
| **A/B or version compare** | Agar config change karo (e.g. weights) to kuch time ke liye **old vs new** result compare karke log karo (offline). | Risk-free tuning. | Low |

---

## 6. UX & Flow (Doctor Experience)

| Improvement | Kya karna hai | Kyun | Priority |
|-------------|----------------|------|----------|
| **Rubric confirmation reminder** | Agar case mein TEMP_ symptoms zyada hon to short message: “Kuch symptoms ke liye repertory rubrics confirm nahi hue – book icon se confirm karein for better results.” | Reminder = better data = better accuracy. | Medium |
| **Empty / low results** | Jab “No rubric found” ya 0 suggestions aaye to **clear message** + “Kya karein: synonyms try karein, ya rubrics manually select karein.” | Frustration kam, action clear. | High |
| **Export / print** | Suggestion list + reasoning + rubrics **PDF/print** option do. | Documentation aur second opinion. | Low |
| **Comparison view** | “Remedy A vs B” – side-by-side score breakdown dikhao. | Doctor ko choose karte waqt compare karna easy ho. | Low |

---

## 7. Quick Wins (Pehle ye kar sakte ho)

1. **UI par score breakdown** – Base, bonuses, penalty, total (per remedy).  
2. **Matched rubrics list** – Har remedy ke niche “Matched rubrics: …” with repertory name.  
3. **Confidence badge** – Har suggestion par High/Medium/Low clearly.  
4. **Minimum 2 rubrics** – Jo remedy kam se kam 2 rubrics se match ho wahi suggest karo.  
5. **Patient history** – Suggest API ko hamesha patient remedy history pass karo.  
6. **Remedy.supportedPotencies** – Potency suggest karte waqt sirf yahi use karo.  
7. **Symptom synonyms** – Top 50–100 symptoms ke synonyms DB mein add karo.  
8. **Contraindication warning** – Remedy contraindications vs case tags check karo; warning dikhao.

---

## 8. Summary Table (Priority)

| Category        | High priority items |
|----------------|---------------------|
| **Accuracy**   | Synonym/linkedSymptoms, location+sensation in mapping, min 2 rubrics, data audit. |
| **Trust**      | Score breakdown in UI, matched rubrics list, confidence label, symptom→rubric link, deterministic result. |
| **Safety**     | Contraindications check, history always pass, supported potencies. |
| **Clinical**   | Pathology tags, potency reasoning, outcome feedback. |

In improvements ko phase mein lao: pehle **Quick Wins** aur **High** priority, phir **Medium**, phir **Low**. Isse accuracy aur doctor trust dono improve honge.
