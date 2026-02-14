# Homeolytics Mobile App – APK / Play Store Build Guide

Yeh guide **Expo (managed)** project se APK banane aur **Google Play Store** par upload karne ke steps batati hai.

---

## Part 1: Pehle Tayyari

### 1.1 Developer Account (Play Store ke liye)
- **Google Play Console** par jao: https://play.google.com/console  
- Google account se sign in karo  
- **One-time registration fee** (approx. $25) pay karke Developer account banao  
- Approval ke baad aap apps publish kar sakte ho  

### 1.2 Tools Install (APK/AAB build ke liye)
- **Node.js** (already hai agar app chal rahi hai)  
- **EAS CLI** (Expo Application Services) – build ke liye:

```bash
npm install -g eas-cli
```

- **Expo account** banao (free): https://expo.dev/signup  
- Login:

```bash
eas login
```

---

## Part 2: Project Setup (Ek Baar)

### 2.1 app.json / app.config.js
- **App name** – jo Play Store par dikhe (e.g. `"name": "Homeolytics"`)  
- **version** – e.g. `"1.0.0"` (har release par increment karna)  
- **android.package** – unique package name (e.g. `com.yourcompany.homeolytics`)  

Agar `android.package` abhi nahi hai to `app.json` mein add karo:

```json
"android": {
  "package": "com.homeolytics.app",
  "adaptiveIcon": { ... },
  ...
}
```

*(Package name unique hona chahiye; kabhi change mat karna baad mein.)*

### 2.2 EAS Project Link (ek baar)
Mobile folder mein:

```bash
cd mobile
eas build:configure
```

- “Set up EAS Build?” → **Yes**  
- Isse `eas.json` ban jayega aur project Expo account se link ho jayega  

---

## Part 3: APK / AAB Banana

### Option A: APK (Testing / Direct Install)
- **APK** share karke direct install hota hai (Play Store ke bina).

Build run karo:

```bash
cd mobile
eas build --platform android --profile preview
```

- Pehli baar **Android ke liye credentials** poochenge → “Generate new” ya “Use existing”  
- Build cloud par chalegi; link Expo dashboard par milegi  

**Preview profile (APK)** ke liye `eas.json` mein ensure karo:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

- `preview` → **APK** (testing)  
- `production` → **AAB** (Play Store upload)  

Build khatam hone par **Download** link mil jayegi; wahi APK file share kar sakte ho.

---

### Option B: AAB (Play Store Upload)
Play Store **Android App Bundle (.aab)** maangta hai (APK nahi).

```bash
cd mobile
eas build --platform android --profile production
```

- Build complete hone par **.aab** file download karo (Expo dashboard se)  
- Yeh hi file Play Console par upload karni hai  

---

## Part 4: Play Store Par Upload Steps

### Step 1: New App Banao
1. **Play Console** → **All apps** → **Create app**  
2. App name, default language, type (App/Game), Free/Paid  
3. Declarations (Privacy policy, Ads nahi hai to “No” etc.) accept karo  

### Step 2: App Content
- **Privacy policy** URL (required) – koi public page jahan data use ka policy ho  
- **App access** – agar login hai to “All functionality behind login” + test credentials de sakte ho  
- **Ads** – Agar app mein ads nahi → “No, my app does not contain ads”  
- **Content rating** – questionnaire bharke rating le aao  
- **Target audience** – age group select karo  
- **News app / COVID** – agar nahi to N/A  

### Step 3: Release
1. **Production** (ya **Testing** pehle try karne ke liye) → **Create new release**  
2. **Upload** wahi **.aab** file (EAS production build se)  
3. **Release name** – e.g. “1.0.0 (1)”  
4. **Release notes** – kya naya hai, short description  

### Step 4: Store Listing
- **Short description** (80 chars)  
- **Full description** (4000 chars tak)  
- **Screenshots** – phone + optional tablet (Play Console size guide dekho)  
- **App icon** – 512x512 (Expo assets se use kar sakte ho)  
- **Feature graphic** – 1024x500 (optional but recommended)  

### Step 5: Submit for Review
- Sab sections complete hone chahiye (green tick)  
- **Send for review** / **Submit for review**  
- Review mein usually 1–7 din lagte hain  

---

## Part 5: Short Checklist

| Step | Kya karna hai |
|------|----------------|
| 1 | Google Play Developer account ($25) |
| 2 | `eas-cli` install, `eas login` |
| 3 | `app.json` – `android.package`, version, name |
| 4 | `eas build:configure` → `eas.json` |
| 5 | Testing ke liye: `eas build --platform android --profile preview` → APK |
| 6 | Play Store ke liye: `eas build --platform android --profile production` → AAB |
| 7 | Play Console – app create, content form, store listing, screenshots |
| 8 | Production release par .aab upload → Submit for review |

---

## Useful Commands (Summary)

```bash
# EAS login
eas login

# Project configure (ek baar)
cd mobile
eas build:configure

# APK (testing / direct install)
eas build --platform android --profile preview

# AAB (Play Store)
eas build --platform android --profile production

# Build status dekhna
eas build:list
```

---

## Agar “preview” / “production” Profile Nahi Mile

`mobile/eas.json` mein yeh structure rakho:

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Notes
- **APK** = testing / direct install  
- **AAB** = Play Store (required)  
- Har release par `version` (aur Android `versionCode` agar set ho) bump karo  
- First time ke liye **Internal testing** track use karke tez test kar sakte ho  

Is guide ko follow karke aap APK bana sakte ho aur Play Store ke liye AAB build + upload steps complete kar sakte ho.
