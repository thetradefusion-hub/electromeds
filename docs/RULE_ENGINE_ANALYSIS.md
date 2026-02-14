# Classical Homeopathy Rule Engine – Analysis

Yeh document batata hai ki **final remedy suggestions** kis-kis base par aa rahi hain aur rule engine step-by-step kaise kaam karta hai.

**Accuracy aur doctor trust ke liye improvements:** [RULE_ENGINE_IMPROVEMENTS.md](./RULE_ENGINE_IMPROVEMENTS.md)

---

## High-level flow (9 steps)

```
Structured Case (mental, generals, particulars, modalities)
    → Step 1: Case normalisation (symptom codes + weights)
    → Step 2/3: Rubric selection (symptoms → repertory rubrics)
    → Step 4: Remedy pool (rubrics → remedies + grades)
    → Step 5: Scoring (base + bonuses - penalties)
    → Step 6: Clinical filters (acute/chronic, mental dominance)
    → Step 7: Contradiction / safety (incompatibility, repetition)
    → Step 8: Final suggestions (threshold, confidence, potency)
    → Step 9: Case record save
```

---

## Step 1: Case Engine (Case Intake)

**File:** `caseEngine.service.ts`

- **Input:** `structuredCase` – mental, generals, particulars, modalities (symptom text/code + weight), pathologyTags.
- **Kya karta hai:**
  - Har symptom ko **normalise** karta hai: DB se match (code/name/synonym) → `symptomCode` + `symptomName`.
  - Match nahi mila to `TEMP_<timestamp>` code use hota hai (name as-is).
  - Category-wise **default weights** (config se): Mental=5, Generals=3, Particulars=1, Modalities=2.
- **Output:** `NormalizedCaseProfile` – sab symptoms code+name+weight ke saath, + `isAcute` / `isChronic` (pathologyTags se).

**Final remedies par effect:** Weights aage scoring mein use hote hain (mental zyada weight = zyada score).

---

## Step 2/3: Rubric Mapping

**File:** `rubricMapping.service.ts`

- **Input:** Normalised case (symptom codes + names).
- **Kya karta hai:**
  1. Pehle **linkedSymptoms** se: Rubric collection mein jahan symptom codes match hon, woh rubrics nikalta hai.
  2. Agar kuch na mile (jaise TEMP_ codes) to **symptom name** se **publicum** repertory mein **text match** (exact / word boundary / contains / partial).
  3. Har rubric ko **score** karta hai: match strength (exact=100%, word=90%, contains=70%, partial=50%) × symptom coverage → **confidence**.
  4. **autoSelected:** confidence ≥ 20% wale rubrics.
- **Rule engine usage:**  
  - Agar **user ne book icon se rubrics confirm kiye** (selectedRubricIds) → wahi IDs use hote hain, mapping skip.  
  - Warna: auto-selected rubrics use; agar koi auto-selected na ho to confidence ≥ 20% wale top 20 rubrics.

**Final remedies par effect:** Sirf inhi selected rubrics ke through remedies aayengi (Step 4). Better rubric match = better remedy pool.

---

## Step 4: Repertory Engine (Remedy Pool)

**File:** `repertoryEngine.service.ts`

- **Input:** Selected rubric IDs.
- **Kya karta hai:**
  - `RubricRemedy` collection se in rubrics ke saath saari **remedy + grade** entries nikalta hai.
  - Har remedy ke liye: saare rubric grades jod kar **totalBaseScore** (sum of grades) banata hai.
- **Output:** `Map<remedyId, RemedyScore>` – remedyId, name, rubric-wise grades, totalBaseScore.

**Final remedies par effect:** Jo remedies in rubrics mein hi nahi hain, woh list mein a hi nahi sakti. Score ki shuruat yahi base score se hoti hai.

---

## Step 5: Scoring Engine (Smart Scoring)

**File:** `scoringEngine.service.ts`  
**Config:** `ruleEngine.config.ts` (weights, bonuses, penalties)

Formula (concept):

```
FinalScore = BaseScore + ConstitutionBonus + ModalityBonus + PathologySupport
           + KeynoteBonus + CoverageBonus - ContradictionPenalty
```

- **Base score:**  
  Har rubric ke liye: `(rubric_grade × symptom_weight × grade_multiplier)` jodta hai.  
  - Symptom weight: Mental=5, Generals=3, Particulars=1, Modalities=2.  
  - Grade multiplier: grade 4→1.5, 3→1.2, 2→1.0, 1→0.8.

- **Constitution bonus:**  
  Remedy ke `constitutionTraits` aur case ke mental/general symptom names match → mental / physical / emotional bonus (config: 3 / 2 / 2.5 per trait).

- **Modality bonus:**  
  Case modalities (better/worse) remedy ke `modalities.better` / `modalities.worse` se match → +3 (worse) / +2 (better).

- **Pathology support:**  
  Case `pathologyTags` remedy ke `clinicalIndications` mein ho → fixed +15.

- **Keynote bonus:**  
  Remedy keynotes case symptoms (especially mental) se match → per keynote +3.

- **Coverage bonus:**  
  Kitne % symptoms rubrics se match hue → high (≥70%) +10, medium (≥50%) +5.

- **Confidence:**  
  Final score bands se: very_high (≥100), high (≥70), medium (≥40), low.

**Final remedies par effect:** Ranking aur “kitna match” sab isi score se decide hota hai; mental/constitution/pathology/modality sab isi step mein count hoti hain.

---

## Step 6: Clinical Intelligence (Filters)

**File:** `clinicalIntelligence.service.ts`

- **Input:** Scored remedies + normalised case.
- **Kya karta hai (score ko adjust, replace nahi):**
  - **Acute case:** Acute remedies × 1.25; chronic-only × 0.8.
  - **Chronic case:** Constitutional (constitutionBonus > 5) × 1.2; acute-only × 0.7.
  - **Mental dominance:** Agar mental symptoms > 50% → constitution bonus wale × 1.2; mental keynotes match → × 1.15.
  - **Pathology match:** Indications match → +pathology bonus (same as scoring).
  - **Category:** Mental-heavy case + remedy category Mental/Constitutional → × 1.1.

**Final remedies par effect:** Top remedies ki ordering change ho sakti hai (acute/chronic/mental bias ke hisaab se).

---

## Step 7: Contradiction Engine (Safety)

**File:** `contradictionEngine.service.ts`

- **Input:** Filtered scored remedies + patient remedy history (optional).
- **Kya karta hai:**
  - **Incompatibility:** Remedy ke `incompatibilities` mein jo remedies current list mein hain, un par penalty (+20) aur warning.
  - **Repetition (history):**  
    - Same remedy 7 days pehle → strong penalty (50).  
    - 30 days → 20, 90 days → 5.  
  - Final score se penalty subtract: `finalScore - penalty`.

**Final remedies par effect:** Incompatible ya recently use kiye hue remedies niche chale jaate hain; warnings UI par dikh sakti hain.

---

## Step 8: Suggestion Engine (Final List)

**File:** `suggestionEngine.service.ts`

- **Input:** Safety-checked remedies + normalised case.
- **Kya karta hai:**
  1. **Minimum score:** `finalScore >= minimumScore` (config: 30) wale hi “qualified”.
  2. **Confidence filter:** Confidence “low” wale hata sakte ho (implementation mein at least medium prefer hai).
  3. **Sort:** Final score descending.
  4. **Score gap:**
     - Top aur second ke beech gap > 50% → top 2 hi dikhao.
     - > 30% → top 3.
     - Warna → top 5 (maxSuggestions).
  5. Agar koi qualified na ho to bhi top 3 (by score) suggest ho sakte hain.
  6. Har suggestion ke liye: **clinical reasoning** (base, constitution, modality, pathology, keynote, coverage, penalty) + **potency/repetition** (acute vs chronic + score bands).

**Potency logic (short):**
- Acute: score ≥80 → 200C / 1–2 hr; ≥50 → 30C / 2–4 hr; else 6C / 4–6 hr.
- Chronic: score ≥80 → 200C / once daily; ≥60 → 30C / twice; else 6C / thrice.

**Final remedies par effect:** Jo list user ko dikhti hai (order, count, reasoning, potency) sab isi step se aata hai.

---

## Step 9: Outcome Learning (Save)

**File:** `outcomeLearning.service.ts`

- Case record save (structured case, selected rubrics, engine output) – learning/audit ke liye.  
- **Final suggestions par direct effect nahi** – sirf storage.

---

## Summary: Final remedies kis base par aa rahi hain?

| Base | Step | Kya use hota hai |
|------|------|-------------------|
| **Repertory rubrics** | 2–4 | Symptoms → rubrics (mapping ya user-selected) → sirf in rubrics ki remedies pool mein aati hain. |
| **Repertory grades** | 4–5 | Har rubric-remedy grade × symptom weight × grade multiplier → base score. |
| **Symptom weights** | 1, 5 | Mental (5) > Generals (3) > Modalities (2) > Particulars (1) → score par direct effect. |
| **Constitution / keynotes** | 5, 6 | Remedy traits & keynotes case se match → bonus; mental dominance par extra boost. |
| **Modalities** | 5 | Better/worse case modalities remedy modalities se match → bonus. |
| **Pathology** | 5, 6 | Pathology tags ↔ clinical indications → fixed bonus + filter boost. |
| **Acute/Chronic** | 6 | Case type ke hisaab se score multiply (acute/chronic remedies boost/penalty). |
| **Safety** | 7 | Incompatibility + recent use → penalty; final score subtract. |
| **Threshold & count** | 8 | Min score 30, confidence, score-gap → kitni remedies dikhani hain + potency/reasoning. |

**Ek line mein:**  
Final suggestions **repertory (rubrics + grades)** par, **symptom weights + constitution/modality/pathology/keynote bonuses** se score karke, **clinical + safety** adjust karke, **threshold aur score gap** se count fix karke aati hain; potency aur reasoning bhi isi score aur case type se derive hoti hain.
