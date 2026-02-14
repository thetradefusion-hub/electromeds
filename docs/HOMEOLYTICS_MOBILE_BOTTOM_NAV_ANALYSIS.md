# Homeolytics (ElectroMed) Mobile App – Bottom Navigation Analysis

## ElectroMed Web App – Core Features (Reference)

| Area | Web Routes / Features |
|------|------------------------|
| **Dashboard** | `/dashboard` – stats, quick actions, overview |
| **Patients** | `/patients`, `/patients/new`, `/patients/history` – Patient Records Directory |
| **Appointments** | `/appointments`, `/book` – Schedule, bookings |
| **Consultation** | `/consultation` – New Case, Case Taking, Electro + Classical Homeopathy |
| **Prescriptions** | `/prescriptions` – history, PDF, share |
| **Medicines** | `/medicines` – remedy/medicine library |
| **Symptoms** | `/symptoms` – symptom library |
| **Rules** | `/rules` – rule engine (Electro) |
| **Analytics** | `/analytics` – practice analytics |
| **Settings** | `/settings` – profile, clinic, modality |
| **Admin** | `/admin`, `/saas-admin` – super admin only |

Doctor ka main workflow: **Dashboard → Patients → Consultation (New Case) → Prescription**; uske saath **Repertory / Materia Medica** (knowledge) aur **Settings**.

---

## Homeolytics 33-Screen Plan – Grouping

| Group | Screens (summary) |
|-------|--------------------|
| **Gateway** | Login, Onboarding, Profile, Clinic Branding, Privacy, Branding Guide |
| **Practice** | Main Dashboard, Medical News, Schedule Appointment, **Patient Records Directory** |
| **Clinical** | Patient Profile/Timeline, **New Case – Case Taking**, Voice to Text, Follow-up Comparison |
| **AI / Rule Engine** | Rule Engine Analysis, Totality, AI Logic, Transparency, Verification, Settings, No Match |
| **Knowledge** | **Smart Repertory Search**, Repertory Analysis, **Materia Medica** Search/Reference/Comparative, Remedy Relationship, Bibliographic Refs |
| **Output** | Case Analysis Summary, Acute Quick-Reference, Prescription Builder, PDF Preview, Share/Print |
| **Security & Support** | Analytics, Data Ownership, Privacy/Backup, Help & Support |

---

## Bottom Navigation – Recommendation (5 Items)

Mobile par **5 items** rakhna best hai: zyada se zyada 5, kam se kam 4. Aapke shared homescreen design me: **Home, Patients, center +, Repertory, Settings**.

### Recommended Tabs

| # | Tab Name | Icon (suggestion) | Kya open hoga | ElectroMed / Homeolytics map |
|---|----------|-------------------|----------------|------------------------------|
| 1 | **Home** | `home` | Dashboard – overview, appointments count, analysis count, Quick Actions (New Case, Patient Records, Repertory, Materia Medica), Upcoming Today, Recent Prescriptions, Legal disclaimer | Main Dashboard, Medical News entry |
| 2 | **Patients** | `people` | Patient Records Directory – searchable list; tap → Patient Profile & Timeline, Treatment Timeline | `/patients`, Patient Records Directory |
| 3 | **New Case** (center) | `add` (circle) | New Case – Case Taking entry (symptom/rubric entry, Voice to Text option). Yahan se Rule Engine flow start → Prescription Builder → PDF/Share | Consultation, New Case – Case Taking, Rule Engine, Prescription |
| 4 | **Repertory** | `book` / `search` | Smart Repertory Search, Repertory Analysis, Materia Medica Search/Reference/Comparative, Remedy Relationship | Repertory + Materia Medica + Knowledge |
| 5 | **Settings** | `settings` / `person-circle` | Profile & Settings, Clinic Branding, Privacy & Compliance, Backup Manager, Help & Support | Settings, Profile, Privacy, Help |

### Why this set?

- **Home** – Doctor ka first screen; sab kuch ka entry point (ElectroMed Dashboard + Homeolytics Main Dashboard).
- **Patients** – Daily use: patient dhoondhna, profile dekhna, history (ElectroMed Patients + Patient Records Directory).
- **New Case (center)** – Sabse zyada use: naya case, case taking, rule engine, prescription (ElectroMed Consultation + Homeolytics Case Taking + Rule Engine + Prescription).
- **Repertory** – Decision support: repertory, materia medica (Homeolytics Phase 5).
- **Settings** – Profile, clinic, privacy, help (ElectroMed Settings + Homeolytics Profile/Privacy/Help).

Appointments, Analytics, Prescriptions list, Medicines/Symptoms library ko:
- **Appointments** → Home (Upcoming Today) + agar dedicated chahiye to Settings ke andar ya Home pe “See all” se.
- **Prescriptions** → Home (Recent Prescriptions) + New Case flow ke end me; optional alag “Prescriptions” tab bhi de sakte ho (tab 6 avoid, to Home/list se hi theek hai).
- **Medicines/Symptoms** → Repertory/Knowledge ke andar ya Rule Engine flow ke andar.

---

## Summary Table – Bottom Nav Final

| Tab        | Label      | Purpose |
|-----------|------------|--------|
| Home      | Home       | Dashboard, quick actions, upcoming, recent prescriptions |
| Patients  | Patients   | Patient records directory, profile, timeline |
| New Case  | + (center) | New case taking, rule engine, prescription |
| Repertory | Repertory  | Repertory search, materia medica, knowledge |
| Settings  | Settings   | Profile, clinic, privacy, backup, help |

Ye structure ElectroMed backend (patients, consultation, prescriptions, repertory/classical APIs) aur Homeolytics 33-screen plan dono ke saath align hai.
