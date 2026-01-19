# OOREP Data Extraction Guide

## 🎯 Overview
Yeh guide aapko OOREP (Open Online Repertory) se data extract karne me help karega.

**OOREP Repository**: https://github.com/nondeterministic/oorep  
**Live Site**: https://www.oorep.com/  
**License**: GPL-3.0 (Open Source - Free to use)

---

## 📦 **Step 1: Database Download**

### **Option A: Direct SQL Dump (Easiest)**
1. Go to: https://github.com/nondeterministic/oorep
2. Download: `oorep.sql.gz` (repository root me hai)
3. Extract: `gunzip oorep.sql.gz` (Linux/Mac) ya WinRAR/7-Zip (Windows)

### **Option B: Clone Repository**
```bash
git clone https://github.com/nondeterministic/oorep.git
cd oorep
# oorep.sql.gz file root directory me milega
```

---

## 🗄️ **Step 2: Database Structure**

OOREP PostgreSQL database me yeh main tables hain:

### **Key Tables**:
1. **`rubric`** - Repertory rubrics
   - `id` - Rubric ID
   - `abbrev` - Repertory abbreviation (kent, bbcr, etc.)
   - `text` - Rubric text (e.g., "FEAR - death, of")
   - `chapter` - Chapter name (Mind, Generals, etc.)

2. **`remedy`** - Homeopathic remedies
   - `id` - Remedy ID
   - `nameabbrev` - Remedy abbreviation
   - `name` - Full remedy name
   - `kingdom` - Plant, Mineral, Animal, etc.

3. **`rubricremedy`** - Rubric-Remedy Mappings
   - `rubricid` - Rubric ID
   - `remedyid` - Remedy ID
   - `abbrev` - Repertory type
   - `grade` - Remedy grade in rubric (1, 2, 3, etc.)

---

## 🔧 **Step 3: Import Database**

### **Prerequisites**:
- PostgreSQL >= v11 installed
- `pgcrypto` extension enabled

### **Import Steps**:

```bash
# 1. Create database
createdb oorep

# 2. Enable pgcrypto extension
psql -d oorep -c "CREATE EXTENSION pgcrypto;"

# 3. Import SQL dump
psql -d oorep < oorep.sql

# Ya gunzip ke baad:
gunzip oorep.sql.gz
psql -d oorep < oorep.sql
```

---

## 📊 **Step 4: Extract Data for Your Schema**

### **A. Extract Rubrics**

```sql
-- Get all rubrics with their chapters
SELECT 
    id,
    abbrev as repertory_type,
    text as rubric_text,
    chapter
FROM rubric
WHERE abbrev = 'kent'  -- or 'bbcr', 'boericke', etc.
ORDER BY chapter, text;
```

### **B. Extract Remedies**

```sql
-- Get all remedies
SELECT 
    id,
    nameabbrev as abbreviation,
    name as full_name,
    kingdom
FROM remedy
ORDER BY name;
```

### **C. Extract Rubric-Remedy Mappings**

```sql
-- Get rubric-remedy mappings with grades
SELECT 
    rr.rubricid,
    r.text as rubric_text,
    rr.remedyid,
    rem.name as remedy_name,
    rr.abbrev as repertory_type,
    rr.grade
FROM rubricremedy rr
JOIN rubric r ON rr.rubricid = r.id
JOIN remedy rem ON rr.remedyid = rem.id
WHERE rr.abbrev = 'kent'
ORDER BY r.text, rr.grade DESC;
```

### **D. Get Complete Repertory Data**

```sql
-- Complete data for your MongoDB schema
SELECT 
    r.id as rubric_id,
    r.text as rubric_text,
    r.chapter,
    r.abbrev as repertory_type,
    rem.id as remedy_id,
    rem.name as remedy_name,
    rem.nameabbrev as remedy_abbrev,
    rem.kingdom,
    rr.grade
FROM rubric r
JOIN rubricremedy rr ON r.id = rr.rubricid
JOIN remedy rem ON rr.remedyid = rem.id
WHERE r.abbrev = 'kent'
ORDER BY r.chapter, r.text, rr.grade DESC;
```

---

## 🔄 **Step 5: Convert to Your MongoDB Schema**

### **A. Create Node.js Script**

```javascript
// extract-oorep-data.js
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'oorep',
  user: 'postgres',
  password: 'your_password'
});

async function extractData() {
  await client.connect();
  
  // Extract rubrics
  const rubricsResult = await client.query(`
    SELECT DISTINCT
      id,
      abbrev as repertoryType,
      text as rubricText,
      chapter
    FROM rubric
    WHERE abbrev = 'kent'
  `);
  
  // Extract remedies
  const remediesResult = await client.query(`
    SELECT 
      id,
      name as name,
      nameabbrev as abbreviation,
      kingdom as category
    FROM remedy
  `);
  
  // Extract rubric-remedy mappings
  const mappingsResult = await client.query(`
    SELECT 
      rr.rubricid as rubricId,
      rr.remedyid as remedyId,
      rr.abbrev as repertoryType,
      rr.grade
    FROM rubricremedy rr
    WHERE rr.abbrev = 'kent'
  `);
  
  // Convert to your schema format
  const rubrics = rubricsResult.rows.map(r => ({
    repertoryType: r.repertorytype,
    chapter: r.chapter,
    rubricText: r.rubrictext,
    linkedSymptoms: [], // You'll need to map this
    modality: 'classical_homeopathy',
    isGlobal: true
  }));
  
  const remedies = remediesResult.rows.map(r => ({
    name: r.name,
    category: r.category || 'Unknown',
    modality: 'classical_homeopathy',
    constitutionTraits: [],
    modalities: { better: [], worse: [] },
    clinicalIndications: [],
    incompatibilities: [],
    materiaMedica: {
      keynotes: [],
      pathogenesis: '',
      clinicalNotes: ''
    },
    supportedPotencies: ['6C', '30C', '200C', '1M'],
    isGlobal: true
  }));
  
  const rubricRemedies = mappingsResult.rows.map(m => ({
    rubricId: m.rubricid,
    remedyId: m.remedyid,
    repertoryType: m.repertorytype,
    grade: m.grade
  }));
  
  // Save to JSON files
  fs.writeFileSync('oorep-rubrics.json', JSON.stringify(rubrics, null, 2));
  fs.writeFileSync('oorep-remedies.json', JSON.stringify(remedies, null, 2));
  fs.writeFileSync('oorep-mappings.json', JSON.stringify(rubricRemedies, null, 2));
  
  console.log(`✅ Extracted:`);
  console.log(`   - Rubrics: ${rubrics.length}`);
  console.log(`   - Remedies: ${remedies.length}`);
  console.log(`   - Mappings: ${rubricRemedies.length}`);
  
  await client.end();
}

extractData().catch(console.error);
```

### **B. Run Extraction**

```bash
# Install PostgreSQL client
npm install pg

# Run extraction
node extract-oorep-data.js
```

---

## 📥 **Step 6: Import to MongoDB**

### **Using Your Existing Seed Scripts**

```javascript
// seedFromOorep.js
const mongoose = require('mongoose');
const Rubric = require('./models/Rubric.model');
const Remedy = require('./models/Remedy.model');
const RubricRemedy = require('./models/RubricRemedy.model');
const rubricsData = require('./oorep-rubrics.json');
const remediesData = require('./oorep-remedies.json');
const mappingsData = require('./oorep-mappings.json');

async function seedFromOorep() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Import rubrics
  console.log('Importing rubrics...');
  await Rubric.insertMany(rubricsData);
  
  // Import remedies
  console.log('Importing remedies...');
  await Remedy.insertMany(remediesData);
  
  // Import mappings
  console.log('Importing rubric-remedy mappings...');
  await RubricRemedy.insertMany(mappingsData);
  
  console.log('✅ OOREP data imported successfully!');
  await mongoose.disconnect();
}

seedFromOorep().catch(console.error);
```

---

## 🎯 **Step 7: Data Mapping**

### **OOREP → Your Schema Mapping**

| OOREP Field | Your Schema Field | Notes |
|------------|------------------|-------|
| `rubric.abbrev` | `repertoryType` | 'kent', 'bbcr', etc. |
| `rubric.text` | `rubricText` | Full rubric text |
| `rubric.chapter` | `chapter` | Mind, Generals, etc. |
| `remedy.name` | `name` | Full remedy name |
| `remedy.kingdom` | `category` | Plant, Mineral, etc. |
| `rubricremedy.grade` | `grade` | 1, 2, 3, etc. |

### **Fields You'll Need to Add**:
- `linkedSymptoms` - Map symptoms to rubrics
- `constitutionTraits` - Add from materia medica
- `modalities` - Extract from materia medica
- `keynotes` - Add from materia medica
- `materiaMedica` - Add from separate sources

---

## ⚠️ **Important Notes**

### **1. License Compliance**
- OOREP is **GPL-3.0** licensed
- Agar aap use karte ho, to aapka code bhi GPL-3.0 ke under aayega
- Ya phir aap sirf data use kar sakte ho (data itself is not copyrighted)

### **2. Data Completeness**
- OOREP me **repertory data** complete hai
- Lekin **materia medica** data limited hai
- Materia medica ke liye alag sources use karein (Allen's Keynotes, Boericke, etc.)

### **3. Data Quality**
- OOREP production-ready database hai
- Data quality good hai
- Lekin verify karein before production use

### **4. Performance**
- Database me indexes add karein (OOREP README me mentioned hai)
- Large datasets ke liye batch processing use karein

---

## 🚀 **Quick Start Commands**

```bash
# 1. Clone repository
git clone https://github.com/nondeterministic/oorep.git
cd oorep

# 2. Extract SQL dump
gunzip oorep.sql.gz  # or use 7-Zip on Windows

# 3. Import to PostgreSQL
createdb oorep
psql -d oorep -c "CREATE EXTENSION pgcrypto;"
psql -d oorep < oorep.sql

# 4. Extract data (using Node.js script above)
node extract-oorep-data.js

# 5. Import to MongoDB
node seedFromOorep.js
```

---

## 📚 **Additional Resources**

- **OOREP Repository**: https://github.com/nondeterministic/oorep
- **OOREP Live Site**: https://www.oorep.com/
- **GPL-3.0 License**: https://www.gnu.org/licenses/gpl-3.0.html

---

## ✅ **Summary**

**Yes, aap OOREP se data le sakte ho!**

**Advantages**:
- ✅ Complete repertory database
- ✅ Production-ready
- ✅ Free (GPL-3.0)
- ✅ Actively maintained
- ✅ PostgreSQL dump available

**Steps**:
1. Download `oorep.sql.gz` from GitHub
2. Import to PostgreSQL
3. Extract data using SQL queries
4. Convert to your MongoDB schema
5. Import to MongoDB

**Note**: Materia medica data ke liye alag sources use karein (Allen's Keynotes, Boericke, etc.)
