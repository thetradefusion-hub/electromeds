# ElectroMed – Android Native App: सुझाव और प्लान

## आपका मौजूदा सेटअप

- **Backend**: Node.js + Express + MongoDB (Railway) – सभी REST APIs तैयार
- **Web**: React + TypeScript + Vite (Vercel)
- **API layer**: `src/lib/api/` – auth, patient, prescription, classical homeopathy, appointments, आदि सब अलग-अलग modules में

मोबाइल ऐप को **बस इसी backend को call करना है**; नया backend बनाने की जरूरत नहीं।

---

## Option 1: React Native (Recommended)

### क्यों सुझाव?

1. आपको पहले से **React + TypeScript** आता है – learning curve कम।
2. **API layer reuse** – types, API URLs, request/response shapes वही रह सकते हैं; बस `axios`/`fetch` वाला code shared package या copy करके use कर सकते हैं।
3. **एक codebase** – Android अभी, बाद में **iOS** भी निकाल सकते हो।
4. **Ecosystem** – navigation, forms, async storage, push notifications सब mature है।
5. ElectroMed जैसे **form-heavy, list-heavy** app के लिए React Native अच्छा fit है (patients, consultations, prescriptions).

### Tech stack (suggested)

- **React Native** (Expo या bare – नीचे चुनाव)
- **TypeScript** – same types जो web पर use कर रहे हो
- **Shared logic** – API base URL, auth token, types एक shared package या folder में (monorepo)
- **Navigation**: React Navigation
- **State / API calls**: TanStack Query (वही जो web पर) या React Query
- **UI**: React Native Paper / NativeBase / custom – या Expo’s components

### Expo vs Bare React Native

| | Expo | Bare RN |
|---|------|--------|
| Setup | बहुत आसान, fast | थोड़ा manual (Android Studio, Xcode) |
| Native modules | ज्यादातर Expo SDK से | कोई भी native library use कर सकते हो |
| Build | EAS Build (cloud) या local | खुद build configure करना |
| Suggestion | पहले **Expo** से शुरू करो; अगर बाद में किसी special native SDK की जरूरत पड़े तो “prebuild” करके bare जैसा कर सकते हो |

**Recommendation:** शुरुआत **Expo (React Native)** से करो।

---

## Option 2: Native Android (Kotlin)

### कब चुनें?

- सिर्फ **Android** चाहिए, iOS नहीं।
- **100% native** look/feel और performance चाहिए।
- Team में कोई Kotlin/Android dev है या सीखने को तैयार है।

### Pros

- Best Android UX और performance।
- Play Store guidelines और Android-specific features (notifications, background) के लिए सबसे सीधा।

### Cons

- Web वाला code (React, types, API helpers) **reuse नहीं** होगा – सब दोबारा लिखना (API calls, models, screens)。
- बाद में iOS चाहिए तो अलग app (Swift/UIKit या SwiftUI) बनानी पड़ेगी।

### Tech (typical)

- **Kotlin** + **Jetpack Compose** (modern UI)
- **Retrofit** या **Ktor** – REST API calls
- **Hilt** या Koin – dependency injection
- **Room** – ऑफलाइन cache (optional)

---

## Option 3: Flutter (Dart)

### कब चुनें?

- **Android + iOS** दोनों एक codebase से चाहिए।
- React नहीं, बल्कि नया framework सीखने को ठीक है।

### Pros

- Single codebase → Android + iOS।
- Good performance, consistent UI।
- Hot reload, fast iteration।

### Cons

- **Dart** नया language – आपका existing React/TS code reuse नहीं होगा।
- API integration, types, business logic सब फिर से implement करनी होगी।

---

## Option 4: Capacitor (Web app को app में wrap)

### क्या है?

आपकी मौजूदा **Vite + React** web app को एक native shell में wrap करके Android (और iOS) app बनाना।

### Pros

- सबसे तेज़ – एक ही codebase (web + mobile)。
- Deployment बस web जैसा; app store के लिए build निकालो।

### Cons

- **Native feel कम** – बड़े हिस्से में बस webview।
- Heavy forms, long lists, animations पर performance native/RN से कम लग सकता है।
- Offline, push, device APIs के लिए plugins और extra care चाहिए।

**Suggestion:** ElectroMed जैसे professional medical app के लिए **long-term में React Native या Native Android बेहतर**; Capacitor को “quick pilot” के लिए use कर सकते हो।

---

## Recommended path: React Native (Expo) + shared API

### High-level architecture

```
electromed/
├── backend/              # जैसे अभी – कोई बदलाव नहीं
├── web/                  # (optional) current src को web/ में shift
│   └── src/
├── packages/
│   └── shared/           # Shared between web + mobile
│       ├── api/          # Base URL, endpoints, types (Zod/TS types)
│       ├── constants/
│       └── types/
└── mobile/               # React Native (Expo)
    ├── app/              # Expo Router या screens
    ├── components/
    ├── hooks/            # useAuth, usePatients – same logic, RN compatible
    └── package.json
```

- **Backend**: वही APIs (auth, patients, prescriptions, classical homeopathy, appointments, आदि)。
- **Shared**: Types + API base URL + env (e.g. `API_URL`); optional: small shared helpers।
- **Mobile**: सिर्फ UI और platform-specific code (navigation, storage, push)。

### Mobile app में क्या बनाना (priority)

1. **Auth** – Login (email/password), JWT store (secure storage), logout।
2. **Dashboard** – Basic stats (patients count, today’s appointments)।  
3. **Patients** – List, search, add patient, patient detail।
4. **Consultation** – Patient select → case entry (Electro/Classical) → save prescription। शुरू में simplified flow; बाद में web जैसा full flow।
5. **Prescriptions** – List, detail, PDF view/share (WebView या RN PDF lib)。
6. **Appointments** – List, create (optional शुरू में)।
7. **Profile / Settings** – Doctor profile, modality, logout।

Voice input जो आप doc में लिख रहे हो, बाद में React Native में भी mic + API call से add कर सकते हो।

---

## Step-by-step (React Native – Expo)

1. **Expo project बनाओ** (project root के अंदर या अलग repo):
   ```bash
   npx create-expo-app@latest mobile --template tabs
   cd mobile
   ```
2. **TypeScript** enable रखो; same strictness जितना web पर।
3. **Shared types/API**:
   - या तो `packages/shared` जैसा folder बनाकर types + API base URL share करो।
   - या पहले phase में mobile में ही `api/` folder में web वाले `auth.api.ts`, `patient.api.ts` आदि copy करो और बस base URL env से लो।
4. **Auth**: Login screen → `authApi.login` → store token (expo-secure-store) → use in axios interceptor।
5. **Navigation**: React Navigation या Expo Router – tabs: Dashboard, Patients, Consultations, Prescriptions, Profile।
6. **Screens**: एक-एक करके Patients list → Patient detail → Consultation flow।
7. **Classical Homeopathy**: Same API (`classicalHomeopathyApi.suggest` etc.) – mobile से same backend call; UI बस mobile-friendly forms।

बाद में:

- Push notifications (Expo Push / FCM)。
- Offline support (optional – critical data cache)。
- Deep links (prescription link, patient link)。

---

## Native Android (Kotlin) अगर चुनो तो

- **Architecture**: MVVM + Repository pattern।
- **Network**: Retrofit + same backend base URL (`https://your-api.railway.app/api`)।
- **Auth**: JWT in EncryptedSharedPreferences या DataStore।
- **UI**: Jetpack Compose; Material 3।
- **Screens**: Same flow – Login → Dashboard → Patients → Consultation → Prescriptions।

API contracts वही रहेंगे; सिर्फ implementation Kotlin में होगी।

---

## Short comparison

| Criteria              | React Native (Expo) | Native Kotlin | Flutter | Capacitor |
|----------------------|---------------------|---------------|---------|-----------|
| Code reuse (web)     | High (logic, types) | None          | None    | Full      |
| Android + iOS        | Yes                 | Android only  | Yes     | Yes       |
| Learning (your stack)| Easy (React/TS)     | New (Kotlin)  | New (Dart) | Easy   |
| Native feel          | Good                | Best          | Good    | Web-like  |
| Time to first app    | Medium              | Higher        | Higher  | Lowest    |

---

## Final suggestion

- **Goal**: ElectroMed का proper **native-feel Android app** (और भविष्य में iOS)।
- **Recommendation**: **React Native with Expo** से शुरू करो।
  - Existing backend और API design बिना बदलाव use होंगे।
  - Types और API layer share कर सकते हो।
  - एक codebase से Android + iOS।
  - Team को सिर्फ React Native / Expo का सीखना पड़ेगा, नया language नहीं।

अगर आप सिर्फ Android चाहते हो और long-term Android-only रखने का मन है, तो **Option 2: Native Kotlin** दूसरा सबसे साफ विकल्प है।

अगर चाहो तो अगला step “Expo project structure for ElectroMed” जैसा एक और doc बना सकता हूँ (folders, env, first 2–3 screens की list)।

