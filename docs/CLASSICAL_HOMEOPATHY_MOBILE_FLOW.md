# Classical Homeopathy – Rule Engine Flow & Mobile Parity

## Backend Rule Engine (9 steps)

1. **Case intake** – `CaseEngine.normalizeCase(structuredCase)`  
   - Input: `mental`, `generals`, `particulars`, `modalities`, `pathologyTags` (symptomText + weight, type for modalities).  
   - Output: `NormalizedCaseProfile` with symptomCode, symptomName per category.

2. **Rubric mapping** – Two paths:
   - **If `selectedRubricIds` provided (from client):** Resolve rubric IDs to full rubric records → use these for repertory (no mapping).
   - **Else:** `RubricMappingEngine.mapSymptomsToRubrics(normalizedCase)` → find rubrics by linkedSymptoms or text match (publicum repertory).

3. **Repertory** – `RepertoryEngine.buildRemedyPool(rubricIds)` → set of remedies from rubric–remedy mappings.

4. **Scoring** – `ScoringEngine.calculateRemedyScores(remedyPool, normalizedCase, selectedRubrics)` → baseScore, constitutionBonus, modalityBonus, pathologySupport, keynoteBonus, coverageBonus, contradictionPenalty, total.

5. **Clinical intelligence** – Filters by score threshold and rubric count.

6. **Contradiction detection** – Uses `patientHistory` (past remedyId + date) for repetition/contradiction warnings.

7. **Suggestion engine** – Top remedies with confidence, suggestedPotency, repetition, clinicalReasoning, matchedSymptoms, matchedRubrics, scoreBreakdown, warnings.

8. **Save case record** – Stored with normalized case + selected rubrics + engine output.

9. **Doctor decision** – `PUT /case/:id/decision` with finalRemedy → creates prescription and links to case.

---

## Mobile Enhancements (aligned with website)

### Manual Case Taking
- **Pathology tags** – Add/remove tags (e.g. Acute, Chronic); sent in `structuredCase.pathologyTags`.
- **Repertory rubric search** – Search bar → `POST /ai-case-taking/suggest-rubrics` with `symptom: { symptomName, category }`; category from active tab (Mind → mental, Physical Generals/Sleep/Digestion → general/modality, Particulars → particular). Add results to “Selected repertory rubrics”; their IDs sent as `selectedRubricIds` to `/classical-homeopathy/suggest`.
- **Patient history** – Before suggest, `fetchPatientCaseRecords(patientId)`; build `patientHistory: [{ remedyId, date }]` from records with `finalRemedy`; pass to `suggestRemedies(..., patientHistory, selectedRubricIds)`.
- **Save & repertorize** – Builds `structuredCase` from selected symptom rubrics + pathologyTags; if only repertory rubrics selected (no symptom rubrics), sends minimal `mental: [{ symptomText: "Repertory-based case", weight: 1 }]` so backend validation passes.

### AI Case Taking
- **Pathology tags** – Same add/remove UI; included in `structuredCase.pathologyTags` when calling suggest.
- **Process AI** – `extractSymptoms({ text, language, useNLP })`; accepted symptoms → mental/generals/particulars/modalities with weights from confidence.
- **Review & Save** – Same `suggestRemedies` + navigate to Remedy Suggestions.

### Remedy Suggestions screen
- **Engine summary** – Total remedies, high confidence count, warnings count.
- **Per remedy (website parity):**
  - Match score, confidence, suggested potency & repetition.
  - Clinical reasoning.
  - **Score breakdown** – Expandable: base, constitution, modality, pathology, keynote, coverage, penalty, total.
  - **Matched symptoms** – Chips (first 6 + “+N more”).
  - **Matched rubrics** – Bullet list (first 4 + “+N more”).
  - **Warnings** – Full list.
- **Use in prescription** → Navigate to **Prescription Builder** (no direct API call from this screen).

### Prescription Builder screen (new)
- Inputs: **Potency**, **Repetition**, **Notes** (pre-filled from suggestion).
- **Confirm & create prescription** → `updateDoctorDecision(caseRecordId, finalRemedy)` → success → “View patient” to Patient Profile.

### API (mobile)
- `suggestRemedies(patientId, structuredCase, patientHistory?, selectedRubricIds?)` – optional history and rubric IDs.
- `suggestRubrics({ symptom: { symptomName, category }, repertoryType? })` – returns `{ rubrics, rareRubrics }`.
- `fetchPatientCaseRecords(patientId)` – used to build patientHistory.

---

## Flow summary

**Manual:**  
Patient → Start New Case → Manual Mode → Add pathology tags, add symptom rubrics and/or search repertory rubrics → SAVE CASE & REPERTORIZE → Remedy Suggestions → Use in prescription → Prescription Builder → Confirm → Patient Profile.

**AI:**  
Patient → Start New Case → AI-Enhanced Mode → Narrative + pathology tags → Process AI → Accept/reject symptoms → Review & Save → Remedy Suggestions → Use in prescription → Prescription Builder → Confirm → Patient Profile.

Result and details (suggestions, score breakdown, matched symptoms/rubrics, warnings, potency/repetition/notes) are now aligned with the website flow on mobile.
