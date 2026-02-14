# ElectroMed Mobile App – Screens & Flows Audit

Senior UI/UX & app flow review. Ye document batata hai ki abhi tak kaun kaun si screens bani hain, unka aapas mein flow theek hai ya nahi, kya improvements kiye gaye, aur aage kya screens banana zaroori hai.

---

## 1. Existing screens (abhi tak bani hui)

### Auth & onboarding
| Screen | File | Purpose |
|--------|------|--------|
| **Login** | `auth/LoginScreen.tsx` | Email/password login, link to Signup |
| **Signup** | `auth/SignupScreen.tsx` | Register, link back to Login |
| **Onboarding** | `auth/OnboardingScreen.tsx` | Disclaimer/terms (post-login, once) |

### Home tab (stack)
| Screen | File | Purpose |
|--------|------|--------|
| **Dashboard** | `dashboard/DashboardScreen.tsx` | Stats, today’s appointments, recent prescriptions, quick actions (New Case, Patients, Repertory), FAB |
| **AppointmentsList** | `dashboard/AppointmentsListScreen.tsx` | Date-wise appointments, tap → patient profile (Patients tab) |
| **PrescriptionsList** | `dashboard/PrescriptionsListScreen.tsx` | Recent prescriptions, tap → patient profile |

### Patients tab (stack)
| Screen | File | Purpose |
|--------|------|--------|
| **PatientsList** | `patients/PatientsScreen.tsx` | Patient list, search, + Add Patient, tap card → profile |
| **AddPatient** | `patients/AddPatientScreen.tsx` | Form: name, age, gender, mobile, address, case type → create patient |
| **PatientProfile** | `patients/PatientProfileScreen.tsx` | Profile card, Consult Now, Compare progress, treatment timeline |
| **FollowUpComparison** | `cases/FollowUpComparisonScreen.tsx` | Initial vs current (placeholder data) |

### New Case tab (stack)
| Screen | File | Purpose |
|--------|------|--------|
| **SelectPatientForCase** | `cases/SelectPatientForCaseScreen.tsx` | Add New Patient button, patient list, search, select → Consult Now |
| **CaseMode** | `cases/CaseModeScreen.tsx` | Classical / Assistive tabs, Manual vs AI-Enhanced mode choice |
| **CaseTaking** | `cases/CaseTakingScreen.tsx` | Manual case taking (rubrics, repertory), rule engine → RemedySuggestions |
| **CaseTakingVoice** | `cases/CaseTakingVoiceScreen.tsx` | AI-enhanced case taking (voice/narrative) → RemedySuggestions |
| **RemedySuggestions** | `cases/RemedySuggestionsScreen.tsx` | Top remedies, “Use in prescription” → PrescriptionBuilder |
| **PrescriptionBuilder** | `cases/PrescriptionBuilderScreen.tsx` | Potency, repetition, notes → confirm → PrescriptionPreview |
| **PrescriptionPreview** | `cases/PrescriptionPreviewScreen.tsx` | Prescription view, Share WhatsApp, Print/PDF, Done |

### Other tabs (single screen)
| Screen | File | Purpose |
|--------|------|--------|
| **Repertory** | `repertory/RepertoryScreen.tsx` | Placeholder – “Smart Repertory Search & Analysis” coming |
| **Settings** | `profile/ProfileScreen.tsx` | Profile, clinic branding, privacy/compliance (static content) |

### Not in navigator (dead code)
| File | Note |
|------|------|
| `cases/CasesScreen.tsx` | Old “New Case” placeholder – replaced by SelectPatientForCase |
| `knowledge/KnowledgeScreen.tsx` | Not used in navigation |

---

## 2. Flows – kaun screen kahan se kahan jaati hai

### Auth
- **Login** ↔ **Signup** (links)
- Login success → **Onboarding** (if first time) → **Main Tabs**
- Onboarding accept → **Main Tabs**

### Home
- **Dashboard** → AppointmentsList, PrescriptionsList (in stack)
- **Dashboard** → NewCase tab, Patients tab, Repertory tab (tab switch)
- **AppointmentsList** → back → Dashboard
- **PrescriptionsList** → back → Dashboard; tap prescription → **Patients** tab → PatientProfile

### Patients
- **PatientsList** → AddPatient (in stack); tap card → PatientProfile (in stack)
- **AddPatient** → back → PatientsList; success → “View profile” → PatientProfile ya “Add another” (form clear)
- **PatientProfile** → back → PatientsList; Consult Now → **NewCase** tab → CaseMode; Compare progress → FollowUpComparison
- **FollowUpComparison** → back → PatientProfile

### New Case (case-taking pipeline)
- **SelectPatientForCase** → Add New Patient → **Patients** tab → AddPatient; select patient + Consult Now → **CaseMode**
- **CaseMode** → back → SelectPatientForCase; Manual → **CaseTaking**; AI-Enhanced → **CaseTakingVoice**
- **CaseTaking** / **CaseTakingVoice** → back → CaseMode; submit → **RemedySuggestions**
- **RemedySuggestions** → back → CaseTaking/CaseTakingVoice; Use in prescription → **PrescriptionBuilder**
- **PrescriptionBuilder** → back → RemedySuggestions; confirm → **PrescriptionPreview**
- **PrescriptionPreview** → back / Done → previous screen

Flow theek hai: patient select → mode → case taking → remedies → prescription build → preview. Cross-tab (e.g. Dashboard → New Case, Prescriptions → Patients) bhi sahi kaam karta hai.

---

## 3. Improvements jo kiye gaye (chhote enhancements)

### Back / navigation
- **PatientProfileScreen**: Pehle koi header/back nahi tha. Ab **header + back button** add kiya – Patient name title, back → list.
- **CaseTakingScreen**: Header mein **back button** add kiya – back → CaseMode.
- Baaki jahan pehle se back tha (AddPatient, AppointmentsList, PrescriptionsList, CaseMode, CaseTakingVoice, RemedySuggestions, PrescriptionBuilder, PrescriptionPreview, FollowUpComparison) woh same rakha.

### Copy consistency
- **CaseTakingScreen** banner: “Start New Classical Case” → **“Consult Now”** (flow ke hisaab se).
- **CaseTakingVoiceScreen** mein bhi saari jagah “Start New Classical Case” → **“Consult Now”** kar diya.

### Jo intentionally back nahi hai
- **Tab roots** (Dashboard, PatientsList, SelectPatientForCase, Repertory, Settings): yahan back ka option nahi diya, kyunki tab switch se hi navigate hota hai.
- **PatientsList** pe left side jo chevron hai wo abhi bhi **decorative** hai (tab root), back action nahi – agar chaho to isko bhi back behaviour de sakte ho jab stack depth > 1 ho.

---

## 4. Aage banani zaroori / useful screens (recommendation)

### High priority (app ke liye jruri)
1. **Repertory search / browser**  
   Repertory tab ab placeholder hai. Zaroori: repertory search, chapter/rubric browse, results list. Isi se CaseTaking wale “repertory rubrics” flow ko strengthen kar sakte ho.

2. **Appointment detail / create**  
   AppointmentsList sirf list dikhata hai. Zaroori:  
   - **Appointment detail** (date, time, patient, notes, status)  
   - **Create/Edit appointment** (patient select, date/time, reason)

3. **Prescription detail (standalone)**  
   Abhi prescription sirf list item tap → patient profile. Zaroori: **Prescription detail** screen (full prescription view, share/print) list se bhi aur kahi se bhi open ho sake.

4. **Patient edit**  
   AddPatient hai, edit nahi. **Edit Patient** screen (same form, pre-filled, update API) – profile se “Edit” se open.

5. **Settings sub-screens**  
   Profile/Settings ab ek hi scroll. Better:  
   - **Profile edit** (name, email, qualifications, registration, clinic name)  
   - **Clinic branding** (logo, letterhead)  
   - **Privacy / compliance** (read-only policy/certificate)  
   - **Logout** (clear session, Login par bhejo)

### Medium priority (UX / completeness)
6. **Case record detail**  
   Patient profile pe timeline items dikhte hain. **Case record detail** (single case: rubrics, remedy, summary, date) – timeline item tap se.

7. **Follow-up comparison – real data**  
   FollowUpComparison ab dummy data. Real initial vs current (API se) is screen par lana.

8. **Search / filters on PrescriptionsList**  
   Date range, patient name search, prescription number.

9. **Onboarding skip / later**  
   Agar disclaimer skip/later option chahiye (policy ke hisaab se) to Onboarding mein option.

### Lower priority (nice to have)
10. **Knowledge / Materia Medica**  
    KnowledgeScreen file hai, nav mein nahi. Agar app mein knowledge base chahiye to is screen ko wire karke search/notes/remedy info dikhana.

11. **Notifications / reminders**  
    Screen for “Today’s reminders”, follow-ups, appointment reminders (backend + notif channel ke saath).

12. **Offline / sync indicator**  
    Koi dedicated “Sync status” ya “Offline” banner screen nahi – agar offline support aage aayega to useful.

---

## 5. Summary

- **Screens**: Auth 3, Home 3, Patients 4, New Case 7, Repertory 1, Settings 1 = **19 screens** (2 files unused).
- **Flows**: Auth → Tabs; Home ↔ Appointments/Prescriptions; Patients ↔ Add/Profile/FollowUp; New Case pipeline (select patient → mode → case → remedy → prescription) sab connected aur consistent.
- **Enhancements**: PatientProfile aur CaseTaking pe back button; copy “Consult Now” consistent.
- **Next**: Repertory screen, Appointment detail/create, Prescription detail, Patient edit, Settings sub-screens (profile, branding, privacy, logout) sabse jruri. Uske baad case record detail, real follow-up data, list filters.

Agar tum batayo ki pehle kis block par kaam karna hai (e.g. only Repertory, only Appointments, only Settings), to usi hisaab se step-by-step screens design kar sakte hain.
