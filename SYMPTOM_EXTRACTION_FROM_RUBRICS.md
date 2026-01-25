# Symptom Extraction from Rubrics - Guide

## 🎯 Problem Statement

**Current Situation:**
- Database me only **200 symptoms** available hain
- Classical Homeopathy consultation me **rubric matching** English symptoms ko English rubrics se match karta hai
- Limited symptoms ki wajah se system properly work nahi kar raha

**Solution:**
- **Rubrics se symptoms extract karke database me add karna**
- Rubrics me **810,000+ entries** hain (publicum repertory)
- Har rubric me symptom description hota hai
- In rubrics se unique symptoms extract karke database me add kar sakte hain

---

## 💡 Approach

### **How It Works:**

1. **Rubric Text Parsing:**
   - Rubric text format: `"FEAR - death, of"` → Extract "Fear of death"
   - Rubric text format: `"FEVER - high"` → Extract "High fever"
   - Rubric text format: `"HEADACHE - throbbing"` → Extract "Throbbing headache"

2. **Symptom Extraction:**
   - Har rubric text se main symptom extract karo
   - Modifiers (descriptors) extract karo
   - Category determine karo (chapter se: Mind → mental, etc.)

3. **Database Creation:**
   - Unique symptoms create karo
   - Proper codes generate karo (`SYM_MEN_FEAR_OF_DEATH`)
   - Synonyms add karo (main symptom + modifiers)
   - Rubrics ko symptoms se link karo

---

## 🚀 Usage

### **Run the Script:**

```bash
cd backend
npm run extract:symptoms
```

### **What It Does:**

1. ✅ **Fetches all publicum rubrics** (810,000+ rubrics)
2. ✅ **Extracts unique symptoms** from rubric texts
3. ✅ **Creates new symptoms** in database (skips duplicates)
4. ✅ **Links rubrics to symptoms** (updates `linkedSymptoms` field)

---

## 📊 Expected Results

### **Before:**
- **Symptoms**: ~200
- **Rubrics**: 810,000+ (but not linked to symptoms)

### **After:**
- **Symptoms**: **5,000 - 10,000+** (estimated)
- **Rubrics**: 810,000+ (now linked to symptoms)
- **Better Matching**: Rubric matching ab properly work karega

---

## 🔍 How Rubric Text is Parsed

### **Example 1: Simple Format**
```
Rubric Text: "ANXIETY"
Extracted: "Anxiety"
Category: mental (if chapter is "Mind")
```

### **Example 2: With Modifiers**
```
Rubric Text: "FEAR - death, of"
Extracted: "Fear of death"
Category: mental
Synonyms: ["FEAR", "death", "of"]
```

### **Example 3: Location + Symptom**
```
Rubric Text: "HEAD - pain, throbbing"
Extracted: "Throbbing headache"
Category: particular
Synonyms: ["HEAD", "pain", "throbbing"]
```

### **Example 4: Complex Format**
```
Rubric Text: "FEVER - high, sudden"
Extracted: "High sudden fever"
Category: general
Synonyms: ["FEVER", "high", "sudden"]
```

---

## 📝 Script Features

### **1. Smart Parsing:**
- Handles different rubric text formats
- Extracts main symptom + modifiers
- Formats symptom names properly

### **2. Category Detection:**
- **Mental**: Chapter contains "mind" or "mental"
- **General**: Chapter contains "general" or "constitution"
- **Modality**: Chapter contains "modality", "aggravation", "amelioration"
- **Particular**: Default (body parts, specific locations)

### **3. Duplicate Prevention:**
- Checks existing symptoms before creating
- Uses symptom name (case-insensitive) for comparison
- Generates unique codes automatically

### **4. Linking:**
- Links rubrics back to extracted symptoms
- Updates `linkedSymptoms` field in rubrics
- Enables better rubric matching

---

## 🎯 Benefits

### **1. More Symptoms:**
- **200 → 5,000-10,000+ symptoms**
- Better coverage for patient symptoms
- More accurate rubric matching

### **2. Better Matching:**
- Rubrics ab symptoms se properly linked hain
- `linkedSymptoms` field populated
- Faster and more accurate matching

### **3. Improved Consultation:**
- Doctors ko more symptoms milenge
- Better remedy suggestions
- More accurate case analysis

---

## ⚠️ Important Notes

### **1. Duplicate Handling:**
- Script automatically skips duplicates
- Uses symptom name (lowercase) for comparison
- Existing symptoms ko update nahi karta

### **2. Code Generation:**
- Automatic code generation: `SYM_MEN_FEAR_OF_DEATH`
- Unique codes ensure no conflicts
- Format: `SYM_{CATEGORY}_{NAME}`

### **3. Synonyms:**
- Main symptom + all modifiers synonyms me add hote hain
- Example: "Fear of death" → synonyms: ["FEAR", "death", "of"]
- Better search and matching ke liye

### **4. Performance:**
- Batch processing (100 symptoms per batch)
- Efficient database operations
- Progress indicators during execution

---

## 🔧 Customization

### **If You Want to Modify:**

1. **Category Mapping:**
   - Edit `getCategoryFromChapter()` function
   - Add more chapter-to-category mappings

2. **Symptom Formatting:**
   - Edit `formatSymptomName()` function
   - Change how symptom names are formatted

3. **Code Generation:**
   - Edit `generateSymptomCode()` function
   - Change code format if needed

---

## 📈 Monitoring

### **Script Output:**
```
🔍 Connecting to MongoDB...
✅ Connected to MongoDB

📚 Fetching all publicum rubrics...
✅ Found 810233 rubrics

🔍 Extracting symptoms from rubrics...
   Processed 1000/810233 rubrics...
   Processed 2000/810233 rubrics...
   ...

✅ Extracted 8542 unique symptoms

🔍 Checking existing symptoms...
✅ Found 200 existing symptoms

📝 Creating new symptoms...
✅ Prepared 8342 new symptoms (200 duplicates skipped)

💾 Inserting new symptoms...
   Inserted batch 1/84
   Inserted batch 2/84
   ...

✅ Inserted 8342 new symptoms

🔗 Linking rubrics to symptoms...
✅ Linked 650000 rubrics to symptoms

📊 Summary:
──────────────────────────────────────────────────
Total rubrics processed: 810233
Unique symptoms extracted: 8542
New symptoms created: 8342
Duplicate symptoms skipped: 200
Rubrics linked to symptoms: 650000
Total symptoms in database: 8542
──────────────────────────────────────────────────
```

---

## ✅ Next Steps

1. **Run the script:**
   ```bash
   cd backend
   npm run extract:symptoms
   ```

2. **Verify results:**
   - Check symptom count in database
   - Test rubric matching in consultation
   - Verify linkedSymptoms field in rubrics

3. **Test consultation:**
   - Try different symptoms
   - Check if rubric matching improved
   - Verify remedy suggestions

---

## 🎉 Expected Outcome

**After running this script:**
- ✅ **5,000-10,000+ symptoms** in database (instead of 200)
- ✅ **Better rubric matching** (rubrics linked to symptoms)
- ✅ **Improved consultation** (more symptoms available)
- ✅ **Better remedy suggestions** (more accurate matching)

---

**Script Location:** `backend/src/scripts/extractSymptomsFromRubrics.ts`

**Command:** `npm run extract:symptoms`
