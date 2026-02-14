# Manual & AI Case Taking – Advance-Level Enhancement Suggestions

Yeh document **manual case taking** aur **AI case taking** dono ko next level pe le jaane ke liye concrete suggestions deta hai. Aap priority ke hisaab se implement kar sakte hain.

---

## 1. Manual Case Taking – Advance Enhancements

### 1.1 Repertory & Search
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Fuzzy / typo-tolerant search** | "anxity" → "Anxiety" match ho; doctor fast type kare | Medium |
| **Search by rubric code** | SYM_MIND_ANXIETY type karke direct rubric open | Low |
| **Recent / favourite rubrics** | Last 10 ya starred rubrics quick add ke liye | Low |
| **Chapter-wise drill-down** | Mind → Fear → Death se hierarchy dikhe | Medium |
| **Booenninghausen / Kent style filters** | Repertory type toggle (e.g. Publicum vs other) | Medium |

### 1.2 Symptom Entry
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Location + sensation + modality in one card** | Particulars: "Head" + "Burning" + "Worse evening" ek unit | Medium |
| **Weight (1–5) per rubric at add time** | Doctor turant importance set kare, baad mein slider na chalana pade | Low |
| **Rubric synonyms / alternate names** | Same rubric different language ya term se search | Medium |
| **Duplicate warning** | Same rubric dobara add hone par alert | Low |
| **Bulk add from template** | "Acute fever template" se 5–6 rubrics ek click | Medium |

### 1.3 Case Structure View
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Drag-and-drop reorder** | Mental/General order change for emphasis | Low |
| **Mini repertory view** | Selected rubric ke saath remedy grades dikhe (transparency) | High |
| **Case strength indicator** | "Strong mental", "Weak modalities" – visual cue | Medium |
| **Export case as text/PDF** | Sharing ya second opinion ke liye | Low |

### 1.4 Keyboard & Speed
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Ctrl+K already shown – wire it** | Global search rubrics shortcut | Low |
| **Number keys 1–5 for weight** | Select rubric then press 3 → weight 3 | Low |
| **Quick-add from search** | Type + Enter se pehla match add | Medium |

---

## 2. AI Case Taking – Advance Enhancements

### 2.1 Narrative & Extraction
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Multi-language narrative** | Hindi/regional input → same extraction pipeline | High |
| **Structured prompts / templates** | "Chief complaint → Modalities → Mental" guide in placeholder | Low |
| **Partial extract / stream results** | Long narrative: symptoms thoda-thoda dikhte rahe (like streaming) | High |
| **Confidence per symptom** | Har extracted symptom ke saath % ya badge (High/Medium/Low) | Low |
| **Edit before add** | Extracted symptom text edit, phir "Add to case" | Medium |
| **Re-extract selection** | Sirf selected paragraph se dubara extract | Medium |

### 2.2 Interpretation Panel (Middle Column)
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Suggested rubrics per symptom** | Har symptom ke neeche 2–3 repertory rubrics auto-suggest | Medium |
| **One-click "Add symptom + top rubric"** | Speed: ek click mein symptom + best rubric case mein | Medium |
| **Group by category** | Extracted list Mental / General / Particular / Modality sections mein | Low |
| **Conflict / duplication check** | "Similar already in case" warning with link | Medium |

### 2.3 Case Structure (Right Column)
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Inline weight + rubric** | Har symptom ke saath weight slider + linked rubric name | Low |
| **Remove from case with undo** | "Removed X" toast with Undo (5s) | Low |
| **Case summary one-liner** | Auto: "Anxiety, headache right side, worse cold" – always visible | Medium |

### 2.4 Voice & Accessibility
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Voice input with real-time transcript** | Bolte waqt text dikhe, phir Extract | Medium |
| **Keyboard-only flow** | Tab, Enter, Arrow keys se pura AI flow chal sake | Medium |

---

## 3. Common / Shared Enhancements (Dono Manual & AI)

### 3.1 Clinical Workflow
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Save draft case** | Session beech mein save; baad mein resume (no remedy yet) | Medium |
| **Compare two cases** | Side-by-side symptoms for follow-up vs first visit | High |
| **Case templates** | "Acute cold", "Chronic skin" – pre-filled symptom set | Medium |
| **Clinical notes timestamp** | Note add karte waqt time; timeline view | Low |

### 3.2 Remedy Suggestion Flow
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Show why rubric was chosen** | Remedy card par "Selected from rubric: Mind – Anxiety" | Medium |
| **Exclude remedy** | "Don’t suggest Nux vomica this time" – one-time exclude | Low |
| **Potency reasoning short text** | Engine ki line: "Acute, high match → 30C suggested" | Low (backend may already have) |
| **Second-best remedy compare** | "Why A vs B?" – 2 remedies side-by-side reasoning | Medium |

### 3.3 Data & Reporting
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Analytics: most used rubrics** | Doctor/clinic ke top rubrics → templates ya favourites | Medium |
| **Export case + remedy for audit** | PDF: case summary + selected remedy + potency + reasoning | Medium |
| **Integration with follow-up** | Same case ID → follow-up visit mein "Previous case" link | Low |

### 3.4 UX Polish
| Suggestion | Benefit | Effort |
|------------|---------|--------|
| **Onboarding tooltips** | First-time: "Add symptoms here → then Get suggestions" | Low |
| **Empty state actions** | "No symptoms – try AI extraction or add manually" with buttons | Low |
| **Responsive: 4-column → 2-column on tablet** | AI layout stack on small screens (already partial) | Low |
| **Dark mode consistency** | All new components theme-aware | Low |

---

## 4. Suggested Priority Order

**Quick wins (1–2 days each)**  
1. Wire **Ctrl+K** for search focus (manual).  
2. **Duplicate rubric warning** on add (manual).  
3. **Confidence badge** on extracted symptoms (AI).  
4. **Group extracted by category** in AI Interpretation.  
5. **Save draft case** (no prescription) for both.

**Medium (3–5 days each)**  
6. **Weight at add time** in manual (dropdown or 1–5 buttons).  
7. **Suggested rubrics per symptom** in AI (API + UI).  
8. **Edit extracted symptom** before adding to case.  
9. **Case summary one-liner** (auto from symptoms).  
10. **Exclude remedy** once before suggestions.

**Larger (1–2 weeks each)**  
11. **Fuzzy search** for rubrics (backend + frontend).  
12. **Draft save / resume** with full state.  
13. **Voice input** with live transcript.  
14. **Multi-language** narrative support.

---

## 5. Technical Notes

- **Manual:** State is in `ClassicalHomeopathyConsultation` (selectedSymptoms, manualSection, symptomSearchManual). Any "draft" would need a new API (e.g. `POST /case-drafts`) and load on Consultation open.
- **AI:** Extraction is in `extractSymptoms` (aiCaseTaking.api); rubric suggestions per symptom would need backend support (e.g. suggestRubrics already exists – can be called per extracted symptom and shown in Interpretation panel).
- **Rule engine:** Already uses weights, pathology, selected rubrics; front-end enhancements (exclude remedy, show rubric name on card) need small API/response changes.

Agar aap bata dein kaun se section pehle chahiye (e.g. "manual search", "AI interpretation", "draft save"), to us hisaab se step-by-step implementation plan bana sakte hain.
