# OOREP Data Seeding Guide

## 🎯 Overview
Yeh guide aapko OOREP ke SQL file se data extract karke aapke Classical Homeopathy smart rule engine me seed karne me help karega.

---

## 📋 Prerequisites

### **1. OOREP Database Setup**

**Option A: PostgreSQL Import (Recommended)**
1. Download `oorep.sql.gz` from: https://github.com/nondeterministic/oorep
2. Extract: `gunzip oorep.sql.gz` (Linux/Mac) ya WinRAR/7-Zip (Windows)
3. Import to PostgreSQL:
   ```bash
   # Create database
   createdb oorep
   
   # Enable pgcrypto extension
   psql -d oorep -c "CREATE EXTENSION pgcrypto;"
   
   # Import SQL dump
   psql -d oorep < oorep.sql
   ```

**Option B: Direct SQL File (Alternative)**
- SQL file path ready rakhein (parsing support coming soon)

---

## 🔧 Setup

### **1. Install Dependencies**

```bash
cd backend
npm install
```

Yeh automatically `pg` (PostgreSQL client) install kar dega.

### **2. Configure Environment Variables**

`.env` file me add karein:

```env
# OOREP PostgreSQL Connection (if using PostgreSQL method)
OOREP_DB_HOST=localhost
OOREP_DB_PORT=5432
OOREP_DB_NAME=oorep
OOREP_DB_USER=postgres
OOREP_DB_PASS=your_password
```

**Note**: Agar aap default PostgreSQL settings use kar rahe ho, to yeh optional hai.

---

## 🚀 Usage

### **Step 1: Ensure MongoDB is Running**

```bash
# Check MongoDB connection
# Your MongoDB URI should be in .env as MONGODB_URI
```

### **Step 2: Run Seeding Script**

```bash
cd backend
npm run seed:oorep
```

### **Step 3: Wait for Completion**

Script automatically:
1. ✅ PostgreSQL se connect karega
2. ✅ Rubrics extract karega
3. ✅ Remedies extract karega
4. ✅ Rubric-Remedy mappings extract karega
5. ✅ Data transform karega (OOREP schema → Your schema)
6. ✅ MongoDB me seed karega

**Expected Time**: 
- Small dataset: 2-5 minutes
- Full OOREP database: 10-30 minutes (depending on size)

---

## 📊 What Gets Seeded

### **1. Rubrics**
- Repertory Type: `kent`, `bbcr`, `boericke`, `synthesis`
- Chapter: Mind, Generals, etc.
- Rubric Text: Full rubric text
- Modality: `classical_homeopathy`
- Is Global: `true`

**Example**:
```json
{
  "repertoryType": "kent",
  "chapter": "Mind",
  "rubricText": "FEAR - death, of",
  "linkedSymptoms": [],
  "modality": "classical_homeopathy",
  "isGlobal": true
}
```

### **2. Remedies**
- Name: Full remedy name
- Category: Plant Kingdom, Mineral Kingdom, etc.
- Modality: `classical_homeopathy`
- Constitution Traits: `[]` (empty initially)
- Modalities: `{ better: [], worse: [] }` (empty initially)
- Clinical Indications: `[]` (empty initially)
- Materia Medica: `{ keynotes: [], pathogenesis: '', clinicalNotes: '' }` (empty initially)
- Supported Potencies: `['6C', '30C', '200C', '1M']`
- Is Global: `true`

**Example**:
```json
{
  "name": "Aconitum napellus",
  "category": "Plant Kingdom",
  "modality": "classical_homeopathy",
  "constitutionTraits": [],
  "modalities": { "better": [], "worse": [] },
  "clinicalIndications": [],
  "materiaMedica": {
    "keynotes": [],
    "pathogenesis": "",
    "clinicalNotes": ""
  },
  "supportedPotencies": ["6C", "30C", "200C", "1M"],
  "isGlobal": true
}
```

### **3. Rubric-Remedy Mappings**
- Rubric ID: Reference to Rubric
- Remedy ID: Reference to Remedy
- Grade: 1, 2, 3, or 4
- Repertory Type: `kent`, `bbcr`, etc.

**Example**:
```json
{
  "rubricId": "ObjectId(...)",
  "remedyId": "ObjectId(...)",
  "grade": 4,
  "repertoryType": "kent"
}
```

---

## ⚙️ Data Transformation Details

### **Repertory Type Mapping**
- `kent` → `kent`
- `bbcr` → `bbcr`
- `boericke` → `boericke`
- `synthesis` → `synthesis`

### **Kingdom to Category Mapping**
- `plant` → `Plant Kingdom`
- `mineral` → `Mineral Kingdom`
- `animal` → `Animal Kingdom`
- `nosode` → `Nosode`
- `sarcode` → `Sarcode`
- `imponderabilia` → `Imponderabilia`

### **Grade Normalization**
- OOREP grades are preserved (1-4)
- Invalid grades are clamped to 1-4 range

---

## 🔍 Verification

### **Check Seeded Data**

```bash
# MongoDB shell me check karein
mongo
use electromed

# Count rubrics
db.rubrics.countDocuments({ modality: 'classical_homeopathy' })

# Count remedies
db.remedies.countDocuments({ modality: 'classical_homeopathy' })

# Count mappings
db.rubricremedies.countDocuments({ repertoryType: 'kent' })
```

### **Sample Queries**

```javascript
// Get all Kent repertory rubrics
db.rubrics.find({ 
  repertoryType: 'kent',
  modality: 'classical_homeopathy'
}).limit(10)

// Get remedies with mappings
db.remedies.find({ 
  modality: 'classical_homeopathy'
}).limit(10)

// Get rubric-remedy mappings for a specific rubric
db.rubricremedies.find({ 
  rubricId: ObjectId("..."),
  repertoryType: 'kent'
}).sort({ grade: -1 })
```

---

## ⚠️ Important Notes

### **1. Duplicate Handling**
- Script automatically skips duplicates
- Rubrics: Checked by `rubricText` + `repertoryType`
- Remedies: Checked by `name` + `modality`
- Mappings: Upserted (updated if exists, created if not)

### **2. ID Mapping**
- OOREP IDs are mapped to MongoDB ObjectIds
- Mappings are preserved for rubric-remedy relationships

### **3. Missing Data**
- **Materia Medica**: OOREP me limited materia medica data hai
- **Constitution Traits**: Empty initially (manually add karein)
- **Modalities**: Empty initially (manually add karein)
- **Keynotes**: Empty initially (manually add karein)

### **4. Performance**
- Batch processing for large datasets
- Progress indicators for long operations
- Error handling for individual records

---

## 🐛 Troubleshooting

### **Error: Cannot connect to PostgreSQL**
```
Solution: Check OOREP_DB_* environment variables
Or ensure PostgreSQL is running and accessible
```

### **Error: pgcrypto extension not found**
```
Solution: Run: psql -d oorep -c "CREATE EXTENSION pgcrypto;"
```

### **Error: Duplicate key error**
```
Solution: Normal - script automatically skips duplicates
Check logs for "Skipped (duplicates)" count
```

### **Error: MongoDB connection failed**
```
Solution: Check MONGODB_URI in .env file
Ensure MongoDB is running
```

---

## 📈 Expected Results

### **Typical OOREP Database Size**:
- **Rubrics**: 50,000 - 200,000+
- **Remedies**: 1,000 - 5,000+
- **Mappings**: 500,000 - 2,000,000+

### **After Seeding**:
- ✅ All rubrics available in your database
- ✅ All remedies available in your database
- ✅ All rubric-remedy mappings with grades
- ✅ Ready for Classical Homeopathy rule engine

---

## 🔄 Re-running the Script

### **Safe to Re-run**
- Script handles duplicates automatically
- Won't create duplicate data
- Can be run multiple times safely

### **To Clear and Re-seed**:
```bash
# MongoDB shell me
use electromed
db.rubrics.deleteMany({ modality: 'classical_homeopathy' })
db.remedies.deleteMany({ modality: 'classical_homeopathy' })
db.rubricremedies.deleteMany({})

# Then run seed script again
npm run seed:oorep
```

---

## 📚 Next Steps

### **1. Enhance Data** (Optional)
- Add Materia Medica data from other sources
- Add Constitution Traits
- Add Modalities (better/worse)
- Add Keynotes

### **2. Link Symptoms to Rubrics**
- Create symptoms from rubrics
- Link symptoms to rubrics via `linkedSymptoms` field

### **3. Test Rule Engine**
- Test Classical Homeopathy rule engine
- Verify remedy suggestions
- Check rubric matching

---

## ✅ Summary

**Yes, aap OOREP se data le sakte ho!**

**Steps**:
1. ✅ OOREP database PostgreSQL me import karein
2. ✅ Environment variables set karein
3. ✅ `npm run seed:oorep` run karein
4. ✅ Wait for completion
5. ✅ Verify data in MongoDB

**Result**:
- ✅ Complete repertory data
- ✅ All remedies
- ✅ All rubric-remedy mappings
- ✅ Ready for production use

---

## 📞 Support

Agar koi issue aaye to:
1. Check logs for error messages
2. Verify PostgreSQL connection
3. Verify MongoDB connection
4. Check environment variables

---

**Happy Seeding! 🎉**
