# OOREP SQL File Seeding - Quick Guide

## 🎯 Overview
Aapke paas OOREP SQL file (`oorep.sql`) project root me hai. Yeh guide aapko directly SQL file se data seed karne me help karega.

**File Location**: `C:\Users\i\OneDrive\Desktop\electromed\oorep.sql`

---

## 🚀 Quick Start

### **Step 1: Install Dependencies**

```bash
cd backend
npm install
```

### **Step 2: Run Seeding Script**

```bash
# Option 1: Using npm script (recommended)
npm run seed:oorep:file

# Option 2: Direct command with file path
tsx src/scripts/seedFromOorep.ts --file=../oorep.sql

# Option 3: Using environment variable
# .env me add karein:
# OOREP_SQL_FILE=../oorep.sql
npm run seed:oorep
```

---

## 📋 What Happens

Script automatically:
1. ✅ SQL file ko read karega
2. ✅ Chapters extract karega
3. ✅ Remedies extract karega
4. ✅ Rubrics extract karega
5. ✅ Rubric-Remedy mappings extract karega
6. ✅ Data transform karega (OOREP schema → Your MongoDB schema)
7. ✅ MongoDB me seed karega

**Expected Time**: 
- Full OOREP database: 15-45 minutes (depending on file size and system)

---

## ⚙️ File Path Options

### **Option 1: Relative Path (Recommended)**
```bash
npm run seed:oorep:file
```
Yeh automatically `../oorep.sql` (project root) se file dhundega.

### **Option 2: Absolute Path**
```bash
tsx src/scripts/seedFromOorep.ts --file=C:\Users\i\OneDrive\Desktop\electromed\oorep.sql
```

### **Option 3: Environment Variable**
`.env` file me:
```env
OOREP_SQL_FILE=../oorep.sql
```

Phir run karein:
```bash
npm run seed:oorep
```

---

## 📊 Expected Data

### **Typical OOREP Database Size**:
- **Chapters**: ~50-100
- **Remedies**: 1,000 - 5,000+
- **Rubrics**: 50,000 - 200,000+
- **Mappings**: 500,000 - 2,000,000+

### **After Seeding**:
- ✅ All rubrics available in MongoDB
- ✅ All remedies available in MongoDB
- ✅ All rubric-remedy mappings with grades
- ✅ Ready for Classical Homeopathy rule engine

---

## 🔍 Progress Monitoring

Script progress indicators show karega:
- `📚 Extracting chapters...` - Chapters being extracted
- `💊 Extracting remedies...` - Remedies being extracted
- `📖 Extracting rubrics...` - Rubrics being extracted
- `🔗 Extracting rubric-remedy mappings...` - Mappings being extracted
- `📝 Seeding rubrics to MongoDB...` - Rubrics being inserted
- `💊 Seeding remedies to MongoDB...` - Remedies being inserted
- `🔗 Seeding rubric-remedy mappings...` - Mappings being inserted

---

## ⚠️ Important Notes

### **1. File Size**
- OOREP SQL file bahut bada ho sakta hai (1.5M+ lines)
- Parsing me time lag sakta hai
- System memory sufficient honi chahiye

### **2. Duplicate Handling**
- Script automatically skips duplicates
- Safe to re-run multiple times

### **3. Memory Usage**
- Large files ke liye streaming parser use hota hai
- Agar memory issue aaye, to PostgreSQL method use karein

---

## 🐛 Troubleshooting

### **Error: SQL file not found**
```
Solution: Check file path
- Ensure file is at: C:\Users\i\OneDrive\Desktop\electromed\oorep.sql
- Or provide correct path using --file= option
```

### **Error: Out of memory**
```
Solution: Use PostgreSQL method instead
1. Import SQL to PostgreSQL
2. Use npm run seed:oorep (without --file)
```

### **Error: Parsing failed**
```
Solution: 
- Check if SQL file is complete
- Ensure file is not corrupted
- Try PostgreSQL method as alternative
```

---

## ✅ Verification

### **Check Seeded Data**

```bash
# MongoDB shell me
mongo
use electromed

# Count rubrics
db.rubrics.countDocuments({ modality: 'classical_homeopathy' })

# Count remedies
db.remedies.countDocuments({ modality: 'classical_homeopathy' })

# Count mappings
db.rubricremedies.countDocuments({ repertoryType: 'kent' })
```

---

## 📚 Next Steps

1. ✅ Data seed ho gaya
2. ✅ Test Classical Homeopathy rule engine
3. ✅ Verify remedy suggestions
4. ✅ Add Materia Medica data (optional)

---

**Happy Seeding! 🎉**
