# Relationships Redesign: PostgreSQL → MongoDB

## Overview
This document explains how relationships were redesigned when migrating from Supabase PostgreSQL (relational) to MongoDB (document-based).

---

## Key Differences

### PostgreSQL (Supabase)
- **Foreign Keys**: Explicit foreign key constraints
- **Joins**: SQL JOINs for related data
- **Normalization**: Highly normalized (separate tables)
- **Referential Integrity**: Enforced at database level

### MongoDB
- **References**: ObjectId references (no constraints)
- **Populate**: Mongoose `.populate()` for related data
- **Denormalization**: Can embed frequently accessed data
- **Referential Integrity**: Enforced at application level

---

## Relationship Mapping

### 1. One-to-One Relationships

#### User ↔ Doctor
**PostgreSQL:**
```sql
doctors.user_id → auth.users.id (UNIQUE)
```

**MongoDB:**
```javascript
// Doctor model
{
  userId: ObjectId (ref: 'User', unique: true)
}

// Query
const doctor = await Doctor.findOne({ userId: user._id });
```

**Strategy**: Reference (not embedded) - Doctor data is large and accessed independently

---

### 2. One-to-Many Relationships

#### Doctor → Patients
**PostgreSQL:**
```sql
patients.doctor_id → doctors.id
```

**MongoDB:**
```javascript
// Patient model
{
  doctorId: ObjectId (ref: 'Doctor')
}

// Query with populate
const patients = await Patient.find({ doctorId })
  .populate('doctorId', 'clinicName specialization');
```

**Strategy**: Reference - Patients are large documents, frequently queried independently

---

#### Doctor → Prescriptions
**PostgreSQL:**
```sql
prescriptions.doctor_id → doctors.id
prescriptions.patient_id → patients.id
```

**MongoDB:**
```javascript
// Prescription model
{
  doctorId: ObjectId (ref: 'Doctor'),
  patientId: ObjectId (ref: 'Patient'),
  symptoms: [...], // Embedded
  medicines: [...] // Embedded
}

// Query
const prescriptions = await Prescription.find({ doctorId })
  .populate('patientId', 'name age mobile');
```

**Strategy**: 
- References for Doctor and Patient
- Embedded arrays for Symptoms and Medicines (frequently accessed together)

---

#### Patient → Prescriptions
**PostgreSQL:**
```sql
prescriptions.patient_id → patients.id
```

**MongoDB:**
```javascript
// Query patient's prescriptions
const prescriptions = await Prescription.find({ patientId })
  .populate('doctorId', 'name clinicName');
```

**Strategy**: Reference - Prescriptions are large, accessed independently

---

### 3. Many-to-Many Relationships

#### Symptoms ↔ Medicines (via Medicine Rules)
**PostgreSQL:**
```sql
medicine_rules.symptom_ids → symptoms.id (array)
medicine_rules.medicine_ids → medicines.id (array)
```

**MongoDB:**
```javascript
// MedicineRule model
{
  symptomIds: [String], // Array of symptom IDs
  medicineIds: [String], // Array of medicine IDs
  dosage: String,
  duration: String
}

// Query rules matching symptoms
const rules = await MedicineRule.find({
  symptomIds: { $in: selectedSymptomIds }
}).sort({ priority: -1 });
```

**Strategy**: Array of IDs - Simple and efficient for rule matching

---

### 4. Embedded Documents

#### Prescription → Symptoms & Medicines
**PostgreSQL:**
```sql
prescriptions.symptoms → JSONB
prescriptions.medicines → JSONB
```

**MongoDB:**
```javascript
// Embedded in Prescription
{
  symptoms: [{
    symptomId: String,
    name: String,
    severity: String,
    duration: Number,
    durationUnit: String
  }],
  medicines: [{
    medicineId: String,
    name: String,
    dosage: String,
    duration: String
  }]
}
```

**Strategy**: Embedded - Always accessed together, no need for separate queries

---

#### Medical Report → Analysis
**PostgreSQL:**
```sql
patient_medical_reports.analysis → JSONB
```

**MongoDB:**
```javascript
// Embedded in PatientMedicalReport
{
  analysis: {
    reportType: String,
    findings: [...],
    summary: String,
    concernAreas: [String],
    recommendations: [String]
  }
}
```

**Strategy**: Embedded - Analysis is specific to the report, never accessed separately

---

## Query Patterns

### 1. Get Doctor with Patients
**PostgreSQL:**
```sql
SELECT d.*, p.*
FROM doctors d
LEFT JOIN patients p ON p.doctor_id = d.id
WHERE d.user_id = $1;
```

**MongoDB:**
```javascript
// Two queries (more efficient in MongoDB)
const doctor = await Doctor.findOne({ userId });
const patients = await Patient.find({ doctorId: doctor._id });
```

---

### 2. Get Prescription with Patient Details
**PostgreSQL:**
```sql
SELECT p.*, pt.name, pt.age
FROM prescriptions p
JOIN patients pt ON pt.id = p.patient_id
WHERE p.id = $1;
```

**MongoDB:**
```javascript
const prescription = await Prescription.findById(id)
  .populate('patientId', 'name age gender mobile');
// Symptoms and medicines are already embedded
```

---

### 3. Get Patient History
**PostgreSQL:**
```sql
SELECT p.*, pr.*, r.*
FROM patients p
LEFT JOIN prescriptions pr ON pr.patient_id = p.id
LEFT JOIN patient_medical_reports r ON r.patient_id = p.id
WHERE p.id = $1;
```

**MongoDB:**
```javascript
// Separate queries (can be parallelized)
const [prescriptions, reports] = await Promise.all([
  Prescription.find({ patientId }),
  PatientMedicalReport.find({ patientId })
]);
```

---

## Performance Optimizations

### 1. Compound Indexes
```javascript
// For common query patterns
patientSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
```

### 2. Denormalization
```javascript
// Store patient name in appointment for walk-ins
{
  patientId: ObjectId, // If existing patient
  patientName: String, // For walk-ins (denormalized)
  patientMobile: String
}
```

### 3. Embedded vs Referenced Decision Matrix

| Factor | Embedded | Referenced |
|--------|----------|------------|
| Access Pattern | Always together | Independent access |
| Size | Small (< 16KB) | Large |
| Update Frequency | Rare | Frequent |
| Example | Symptoms in Prescription | Patient in Prescription |

---

## Migration Considerations

### 1. UUID to ObjectId
- Create consistent mapping during migration
- Store mapping for reference
- Use ObjectId for all new records

### 2. Data Integrity
- No foreign key constraints in MongoDB
- Validate references in application code
- Use Mongoose validation

### 3. Query Performance
- Use indexes strategically
- Prefer embedded for frequently accessed together
- Use aggregation pipeline for complex queries

---

## Best Practices

1. **Embed when**: Data is always accessed together, small size, rarely updated
2. **Reference when**: Data is large, accessed independently, frequently updated
3. **Index**: All foreign key fields and frequently queried fields
4. **Populate**: Use `.populate()` for referenced documents
5. **Aggregation**: Use aggregation pipeline for complex queries

---

## Example: Complete Patient Record Query

**PostgreSQL:**
```sql
SELECT 
  p.*,
  json_agg(DISTINCT pr.*) as prescriptions,
  json_agg(DISTINCT r.*) as reports
FROM patients p
LEFT JOIN prescriptions pr ON pr.patient_id = p.id
LEFT JOIN patient_medical_reports r ON r.patient_id = p.id
WHERE p.id = $1
GROUP BY p.id;
```

**MongoDB:**
```javascript
// Using aggregation pipeline
const patientRecord = await Patient.aggregate([
  { $match: { _id: patientId } },
  {
    $lookup: {
      from: 'prescriptions',
      localField: '_id',
      foreignField: 'patientId',
      as: 'prescriptions'
    }
  },
  {
    $lookup: {
      from: 'patientmedicalreports',
      localField: '_id',
      foreignField: 'patientId',
      as: 'reports'
    }
  }
]);
```

---

## Summary

✅ **Embedded**: Symptoms, Medicines in Prescriptions; Analysis in Reports
✅ **Referenced**: All foreign key relationships (Doctor, Patient, etc.)
✅ **Arrays**: Many-to-many relationships (symptomIds, medicineIds)
✅ **Indexes**: All foreign keys and frequently queried fields
✅ **Populate**: Use for referenced documents when needed

This design balances query performance with data consistency and maintainability.

