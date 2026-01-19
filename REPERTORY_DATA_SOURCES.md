# Repertory, Remedy & Materia Medica Data Sources

## 🎯 Overview
Aapke Classical Homeopathy Smart Rule Engine ke liye comprehensive data sources ki list.

---

## 📚 **1. Open Source / Free Resources**

### **A. Repertory Data**

#### **1. OOREP (Open Online Repertory) - ⭐ HIGHLY RECOMMENDED**
- **URL**: https://github.com/nondeterministic/oorep
- **Live Site**: https://www.oorep.com/
- **Content**: 
  - Complete repertory database (PostgreSQL)
  - Rubrics and remedy mappings with grades
  - Multiple repertory types (Kent, BBCR, Boericke, etc.)
  - Complete database structure
- **Format**: 
  - SQL dump: `oorep.sql.gz` (in repository root)
  - PostgreSQL database
  - Can be accessed via SQL queries
- **License**: GPL-3.0 (Open Source)
- **Database**: PostgreSQL with complete schema
- **Best For**: Production-ready, comprehensive repertory data
- **How to Use**:
  1. Download `oorep.sql.gz` from repository
  2. Import into PostgreSQL
  3. Extract data using SQL queries
  4. Convert to your MongoDB schema
- **Advantages**:
  - ✅ Complete database structure
  - ✅ Production-ready
  - ✅ Actively maintained (Latest: v0.17.0, Dec 2024)
  - ✅ Includes rubric-remedy mappings with grades
  - ✅ Multiple repertory support
  - ✅ Free and open source
- **Note**: 
  - GPL-3.0 license means if you use it, your code should also be GPL-3.0
  - Or use only the data (data itself may not be copyrighted)
  - See `OOREP_DATA_EXTRACTION_GUIDE.md` for detailed steps

#### **2. OpenRep - Open Source Repertory**
- **URL**: https://github.com/open-repertory
- **Content**: 
  - Kent Repertory (partial)
  - Boenninghausen Repertory
  - Synthetic Repertory
- **Format**: JSON, CSV
- **License**: Open Source
- **Best For**: Starting point, basic rubrics

#### **2. Homeopathy Data Project**
- **URL**: https://github.com/homeopathy-data
- **Content**: 
  - Repertory rubrics
  - Remedy mappings
  - Symptom-remedy relationships
- **Format**: JSON, XML
- **License**: MIT/CC0
- **Best For**: Structured data

#### **3. Hahnemann Repertory (Public Domain)**
- **Source**: Old repertories (pre-1923) are public domain
- **Content**: 
  - Original Kent Repertory (1920s)
  - Boenninghausen Therapeutic Pocket Book
- **Format**: Text/PDF (needs parsing)
- **License**: Public Domain
- **Best For**: Historical accuracy

---

### **B. Remedy Data (Materia Medica)**

#### **1. Homeopathic Materia Medica (Public Domain Books)**
- **Sources**:
  - **Allen's Keynotes** (public domain)
  - **Boericke's Materia Medica** (public domain)
  - **Hering's Guiding Symptoms** (public domain)
  - **Kent's Lectures on Materia Medica** (public domain)
- **Where to Find**:
  - Project Gutenberg: https://www.gutenberg.org
  - Internet Archive: https://archive.org
  - Homeopathy Books: https://www.homeopathybooks.in
- **Format**: Text/PDF (needs extraction)
- **Best For**: Comprehensive remedy information

#### **2. OpenMateriaMedica**
- **URL**: https://github.com/open-materia-medica
- **Content**: 
  - Remedy symptoms
  - Keynotes
  - Modalities
  - Constitution types
- **Format**: JSON, Markdown
- **License**: Open Source
- **Best For**: Structured remedy data

#### **3. Homeopathy Remedy Database**
- **URL**: Various GitHub repositories
- **Content**: 
  - Remedy names
  - Common symptoms
  - Potencies
- **Format**: JSON, CSV
- **Best For**: Quick reference

---

## 💰 **2. Commercial / Licensed Resources**

### **A. Professional Repertories**

#### **1. Complete Dynamics (CARA)**
- **URL**: https://www.complete-dynamics.com
- **Content**: 
  - Complete Kent Repertory
  - Multiple repertories
  - Materia Medica
- **Cost**: Expensive (Professional license)
- **API**: Available (paid)
- **Best For**: Production systems (if budget allows)

#### **2. RADAR Opus**
- **URL**: https://www.radar-opus.com
- **Content**: 
  - Multiple repertories
  - Materia Medica
  - Clinical cases
- **Cost**: High (Professional license)
- **API**: Limited
- **Best For**: Clinical accuracy

#### **3. HomeoQuest**
- **URL**: https://www.homeoquest.com
- **Content**: 
  - Repertory data
  - Remedy information
- **Cost**: Moderate
- **API**: Available
- **Best For**: Mid-range solutions

---

### **B. Materia Medica Databases**

#### **1. Homeopathic Materia Medica (Commercial)**
- **Publishers**:
  - B. Jain Publishers
  - Homeopathic Publishers
- **Content**: 
  - Complete remedy information
  - Clinical cases
  - Keynotes
- **Cost**: Per book/database
- **Best For**: Comprehensive data

---

## 🔧 **3. Data Extraction & Parsing**

### **A. From PDF/Text Books**

#### **Tools for Extraction**:
1. **OCR Tools**:
   - Tesseract OCR (free)
   - Adobe Acrobat Pro
   - ABBYY FineReader

2. **Text Parsing**:
   - Python: `pdfplumber`, `PyPDF2`
   - Node.js: `pdf-parse`
   - Regex patterns for structured data

3. **AI-Assisted Extraction**:
   - GPT-4 for structured extraction
   - Claude for parsing
   - Custom NLP models

### **B. Manual Data Entry**
- **Crowdsourcing**: Community contributions
- **Gradual Building**: Start with common remedies
- **Quality Control**: Expert review

---

## 📊 **4. Recommended Approach (Hybrid)**

### **Phase 1: Start with Free Resources**
1. **Repertory**:
   - Use OpenRep or Homeopathy Data Project
   - Start with 50-100 common rubrics
   - Focus on mental, generals, modalities

2. **Remedies**:
   - Start with 30-50 polychrests (common remedies)
   - Extract from public domain books
   - Use Allen's Keynotes as base

3. **Materia Medica**:
   - Extract from Boericke's Materia Medica (public domain)
   - Focus on keynotes, modalities, constitution

### **Phase 2: Expand Gradually**
1. **Add More Remedies**: 50 → 100 → 200
2. **Add More Rubrics**: 100 → 500 → 1000+
3. **Enhance Data**: Add more symptoms, modalities

### **Phase 3: Commercial (If Needed)**
- If budget allows, license commercial database
- Use for validation and expansion
- Integrate with existing free data

---

## 🗂️ **5. Data Structure Recommendations**

### **A. Repertory Data Structure**
```json
{
  "rubricId": "RUB_001",
  "rubricText": "FEAR - death, of",
  "repertoryType": "kent",
  "grade": 3,
  "remedies": [
    {
      "remedyId": "REM_001",
      "remedyName": "Aconitum Napellus",
      "grade": 3,
      "type": "bold"
    }
  ]
}
```

### **B. Remedy Data Structure**
```json
{
  "remedyId": "REM_001",
  "name": "Aconitum Napellus",
  "commonName": "Aconite",
  "kingdom": "Plant",
  "keynotes": [
    "Sudden onset",
    "Great fear and anxiety",
    "Restlessness"
  ],
  "constitution": ["Robust", "Plethoric"],
  "modalities": {
    "worse": ["Cold", "Night", "Lying on affected side"],
    "better": ["Open air", "Warmth"]
  },
  "mental": ["Fear", "Anxiety", "Restlessness"],
  "generals": ["Fever", "Thirst", "Dryness"],
  "particulars": ["Headache", "Cough", "Palpitation"]
}
```

### **C. Materia Medica Structure**
```json
{
  "remedyId": "REM_001",
  "materiaMedica": {
    "description": "Full remedy description...",
    "symptoms": [
      {
        "category": "mental",
        "symptom": "Fear of death",
        "intensity": "high"
      }
    ],
    "clinicalIndications": ["Fever", "Anxiety", "Acute conditions"],
    "contraindications": ["Chronic cases", "Weak patients"],
    "incompatibilities": ["Remedy_002", "Remedy_003"]
  }
}
```

---

## 🚀 **6. Quick Start Recommendations**

### **For Immediate Use**:
1. **Start Small**: 
   - 30-50 common remedies (Polychrests)
   - 100-200 common rubrics
   - Focus on mental, generals, modalities

2. **Use Public Domain Books**:
   - Allen's Keynotes (for keynotes)
   - Boericke's Materia Medica (for remedy info)
   - Kent Repertory (old version, public domain)

3. **Extract Gradually**:
   - Start with most common symptoms
   - Add remedies as needed
   - Build database incrementally

### **For Production**:
1. **Validate Data**: Expert review
2. **License Commercial**: If budget allows
3. **Hybrid Approach**: Free + Commercial

---

## 📝 **7. Data Quality Checklist**

- ✅ **Accuracy**: Verified by experts
- ✅ **Completeness**: All required fields
- ✅ **Consistency**: Standardized format
- ✅ **Source Attribution**: Track data sources
- ✅ **Version Control**: Track changes
- ✅ **Legal Compliance**: Respect copyrights

---

## ⚖️ **8. Legal Considerations**

### **Public Domain**:
- ✅ Books published before 1923 (US)
- ✅ Books published before 1943 (India, varies)
- ✅ Government publications

### **Copyright**:
- ❌ Modern repertories (post-1923)
- ❌ Commercial databases (need license)
- ❌ Recent materia medica books

### **Best Practice**:
- Use public domain sources
- License commercial if needed
- Attribute sources properly
- Respect copyrights

---

## 🎯 **9. Recommended Priority**

### **High Priority (Start Here)**:
1. **Allen's Keynotes** (Public Domain) - For keynotes
2. **Boericke's Materia Medica** (Public Domain) - For remedy info
3. **OpenRep** (Open Source) - For basic repertory

### **Medium Priority (Expand)**:
1. **Kent Repertory** (Old version, Public Domain)
2. **Boenninghausen Repertory** (Public Domain)
3. **Hering's Guiding Symptoms** (Public Domain)

### **Low Priority (If Budget Allows)**:
1. **CARA/Complete Dynamics** (Commercial)
2. **RADAR Opus** (Commercial)
3. **HomeoQuest** (Commercial)

---

## 📚 **10. Useful Links**

- **Project Gutenberg**: https://www.gutenberg.org (Public domain books)
- **Internet Archive**: https://archive.org (Old books, PDFs)
- **Homeopathy Books**: https://www.homeopathybooks.in (Free books)
- **OpenRep GitHub**: https://github.com/open-repertory
- **Homeopathy Data**: https://github.com/homeopathy-data

---

## 💡 **11. Pro Tips**

1. **Start Small**: Don't try to get everything at once
2. **Focus on Quality**: Better to have 50 accurate remedies than 500 inaccurate
3. **Community Help**: Engage homeopathy community for data validation
4. **Gradual Expansion**: Add data as you need it
5. **Version Control**: Track data sources and versions
6. **Expert Review**: Have experts validate critical data

---

**Note**: Ye suggestions hain. Final decision aapke budget, timeline, aur requirements par depend karega.
