# MongoDB Schema Design - ElectroMed

## Overview
This document describes the MongoDB schema design migrated from Supabase PostgreSQL to MongoDB Atlas.

## Schema Design Principles

1. **Embedded vs Referenced**: 
   - Use embedded documents for data that is frequently accessed together
   - Use references for data that is large or frequently updated independently

2. **Denormalization**: 
   - Store frequently accessed data together to reduce queries
   - Balance between data consistency and query performance

3. **Indexes**: 
   - Create indexes on frequently queried fields
   - Compound indexes for multi-field queries

---

## Collections & Schemas

### 1. Users Collection
**Purpose**: User authentication and basic profile

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  name: String,
  phone: String,
  avatar: String,
  role: String (enum: 'super_admin', 'doctor', 'staff', indexed),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- One-to-One with Doctor (via userId reference)

**Indexes**:
- `email`: unique
- `role`: for role-based queries

---

### 2. Doctors Collection
**Purpose**: Doctor-specific information

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', unique, indexed),
  registrationNo: String (unique, indexed),
  qualification: String,
  specialization: String (default: 'Electro Homoeopathy'),
  clinicName: String,
  clinicAddress: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: User (userId)
- One-to-Many: Patients, Prescriptions, Appointments

**Indexes**:
- `userId`: unique
- `registrationNo`: unique

---

### 3. Patients Collection
**Purpose**: Patient records

```javascript
{
  _id: ObjectId,
  patientId: String (unique, indexed), // EH-2024-001
  doctorId: ObjectId (ref: 'Doctor', indexed),
  name: String,
  age: Number,
  gender: String (enum: 'male', 'female', 'other'),
  mobile: String (indexed),
  address: String,
  caseType: String (enum: 'new', 'old', default: 'new'),
  visitDate: Date (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId)
- One-to-Many: Prescriptions, Appointments, Medical Reports

**Indexes**:
- `patientId`: unique
- `doctorId + createdAt`: compound (for doctor's patient list)
- `mobile`: for search
- `visitDate`: for follow-ups

---

### 4. Prescriptions Collection
**Purpose**: Prescription records

```javascript
{
  _id: ObjectId,
  prescriptionNo: String (unique, indexed), // RX-2024-001
  patientId: ObjectId (ref: 'Patient', indexed),
  doctorId: ObjectId (ref: 'Doctor', indexed),
  symptoms: [{
    symptomId: String,
    name: String,
    severity: String (enum: 'low', 'medium', 'high'),
    duration: Number,
    durationUnit: String (enum: 'days', 'weeks', 'months')
  }],
  medicines: [{
    medicineId: String,
    name: String,
    category: String,
    dosage: String,
    duration: String,
    instructions: String
  }],
  diagnosis: String,
  advice: String,
  followUpDate: Date (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Patient (patientId), Doctor (doctorId)
- Embedded: Symptoms, Medicines arrays

**Indexes**:
- `prescriptionNo`: unique
- `doctorId + createdAt`: compound
- `patientId`: for patient history
- `followUpDate`: for follow-up reminders

---

### 5. Medicines Collection
**Purpose**: Medicine database (global + doctor-specific)

```javascript
{
  _id: ObjectId,
  name: String (indexed),
  category: String (indexed),
  indications: String,
  defaultDosage: String,
  contraIndications: String,
  notes: String,
  isGlobal: Boolean (default: false, indexed),
  doctorId: ObjectId (ref: 'Doctor', indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId, optional for global medicines)

**Indexes**:
- `doctorId + isGlobal`: compound (for filtering)
- `name`: for search
- `category`: for filtering

---

### 6. Symptoms Collection
**Purpose**: Symptom database (global + doctor-specific)

```javascript
{
  _id: ObjectId,
  name: String (indexed),
  category: String (indexed),
  description: String,
  isGlobal: Boolean (default: false, indexed),
  doctorId: ObjectId (ref: 'Doctor', indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId, optional for global symptoms)

**Indexes**:
- `doctorId + isGlobal`: compound
- `name`: for search
- `category`: for filtering

---

### 7. Medicine Rules Collection
**Purpose**: Symptom-to-medicine mapping rules

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  symptomIds: [String] (indexed),
  medicineIds: [String] (indexed),
  dosage: String,
  duration: String,
  priority: Number (default: 0, indexed),
  isGlobal: Boolean (default: false, indexed),
  doctorId: ObjectId (ref: 'Doctor', indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId, optional)
- References: Symptoms (symptomIds array)
- References: Medicines (medicineIds array)

**Indexes**:
- `doctorId + isGlobal`: compound
- `priority`: for sorting
- `symptomIds`: for rule matching

---

### 8. Appointments Collection
**Purpose**: Appointment bookings

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId (ref: 'Doctor', indexed),
  patientId: ObjectId (ref: 'Patient', indexed, optional),
  patientName: String, // For walk-in appointments
  patientMobile: String, // For walk-in appointments
  appointmentDate: Date (indexed),
  timeSlot: String,
  status: String (enum: 'pending', 'confirmed', 'completed', 'cancelled', 'no_show', indexed),
  bookingType: String (enum: 'online', 'walk_in', 'phone', default: 'walk_in'),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId), Patient (patientId, optional)

**Indexes**:
- `doctorId + appointmentDate`: compound
- `appointmentDate`: for date queries
- `status`: for filtering

---

### 9. Doctor Availability Collection
**Purpose**: Doctor's weekly schedule

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId (ref: 'Doctor', indexed),
  dayOfWeek: Number (0-6, indexed), // 0=Sunday, 6=Saturday
  startTime: String, // HH:mm format
  endTime: String, // HH:mm format
  slotDuration: Number (default: 15), // minutes
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId)

**Indexes**:
- `doctorId + dayOfWeek`: unique compound (one schedule per day per doctor)

---

### 10. Blocked Dates Collection
**Purpose**: Doctor's holidays/unavailable dates

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId (ref: 'Doctor', indexed),
  blockedDate: Date (indexed),
  reason: String,
  createdAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId)

**Indexes**:
- `doctorId + blockedDate`: unique compound
- `blockedDate`: for date range queries

---

### 11. Prescription Templates Collection
**Purpose**: Reusable prescription templates

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId (ref: 'Doctor', indexed),
  name: String,
  description: String,
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
    category: String,
    dosage: String,
    duration: String,
    instructions: String
  }],
  diagnosis: String,
  advice: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId)
- Embedded: Symptoms, Medicines arrays

**Indexes**:
- `doctorId`: for doctor's templates

---

### 12. Patient Medical Reports Collection
**Purpose**: Medical reports with AI analysis

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: 'Patient', indexed),
  doctorId: ObjectId (ref: 'Doctor', indexed),
  reportType: String, // 'Blood Test', 'X-Ray', etc.
  fileName: String,
  fileUrl: String,
  analysis: {
    reportType: String,
    findings: [{
      parameter: String,
      value: String,
      normalRange: String,
      status: String, // 'normal', 'abnormal', 'critical'
      interpretation: String
    }],
    summary: String,
    concernAreas: [String],
    recommendations: [String]
  },
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Patient (patientId), Doctor (doctorId)
- Embedded: Analysis object

**Indexes**:
- `patientId`: for patient history
- `doctorId`: for doctor's reports
- `reportType`: for filtering

---

### 13. Follow-ups Collection
**Purpose**: Follow-up appointments tracking

```javascript
{
  _id: ObjectId,
  prescriptionId: ObjectId (ref: 'Prescription', indexed),
  patientId: ObjectId (ref: 'Patient', indexed),
  doctorId: ObjectId (ref: 'Doctor', indexed),
  scheduledDate: Date (indexed),
  status: String (enum: 'pending', 'completed', 'missed', indexed),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Prescription (prescriptionId), Patient (patientId), Doctor (doctorId)

**Indexes**:
- `doctorId + scheduledDate`: compound
- `status`: for filtering
- `scheduledDate`: for upcoming follow-ups

---

### 14. Subscription Plans Collection
**Purpose**: Available subscription plans

```javascript
{
  _id: ObjectId,
  name: String,
  priceMonthly: Number,
  priceYearly: Number,
  features: [String], // Array of feature names
  patientLimit: Number,
  doctorLimit: Number (default: 1),
  aiAnalysisQuota: Number (default: 10),
  isActive: Boolean (default: true, indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- One-to-Many: Subscriptions

**Indexes**:
- `isActive`: for active plans query

---

### 15. Subscriptions Collection
**Purpose**: Doctor subscriptions

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId (ref: 'Doctor', indexed),
  planId: ObjectId (ref: 'SubscriptionPlan', indexed),
  status: String (enum: 'active', 'cancelled', 'expired', 'trial', 'pending', indexed),
  billingCycle: String (enum: 'monthly', 'yearly', default: 'monthly'),
  currentPeriodStart: Date,
  currentPeriodEnd: Date (indexed),
  trialEndsAt: Date,
  cancelledAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId), SubscriptionPlan (planId)
- One-to-Many: Payments

**Indexes**:
- `doctorId`: for doctor's subscription
- `status`: for filtering
- `currentPeriodEnd`: for expiry checks

---

### 16. Payments Collection
**Purpose**: Payment records

```javascript
{
  _id: ObjectId,
  subscriptionId: ObjectId (ref: 'Subscription', indexed),
  doctorId: ObjectId (ref: 'Doctor', indexed),
  amount: Number,
  currency: String (default: 'INR'),
  status: String (enum: 'pending', 'completed', 'failed', 'refunded', indexed),
  paymentMethod: String,
  transactionId: String,
  invoiceUrl: String,
  createdAt: Date
}
```

**Relationships**:
- References: Subscription (subscriptionId), Doctor (doctorId)

**Indexes**:
- `subscriptionId`: for subscription payments
- `doctorId`: for doctor's payments
- `status`: for filtering
- `createdAt`: for revenue analytics

---

### 17. Support Tickets Collection
**Purpose**: Customer support tickets

```javascript
{
  _id: ObjectId,
  doctorId: ObjectId (ref: 'Doctor', indexed, optional),
  subject: String,
  description: String,
  status: String (enum: 'open', 'in_progress', 'resolved', 'closed', indexed),
  priority: String (enum: 'low', 'medium', 'high', 'urgent', indexed),
  category: String (enum: 'general', 'billing', 'technical', 'feature_request', 'bug'),
  assignedTo: ObjectId (ref: 'User', optional), // Admin user
  resolvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- References: Doctor (doctorId, optional), User (assignedTo, optional)
- One-to-Many: TicketMessages

**Indexes**:
- `doctorId`: for doctor's tickets
- `status`: for filtering
- `priority`: for sorting
- `assignedTo`: for admin assignment

---

### 18. Ticket Messages Collection
**Purpose**: Support ticket conversation messages

```javascript
{
  _id: ObjectId,
  ticketId: ObjectId (ref: 'SupportTicket', indexed),
  senderId: ObjectId (ref: 'User', indexed),
  senderType: String (enum: 'doctor', 'admin'),
  message: String,
  createdAt: Date
}
```

**Relationships**:
- References: SupportTicket (ticketId), User (senderId)

**Indexes**:
- `ticketId`: for ticket messages
- `senderId`: for user messages
- `createdAt`: for chronological order

---

## Relationship Summary

### One-to-One:
- User ↔ Doctor (via userId)

### One-to-Many:
- Doctor → Patients
- Doctor → Prescriptions
- Doctor → Appointments
- Doctor → Availability
- Doctor → Blocked Dates
- Doctor → Templates
- Doctor → Subscriptions
- Patient → Prescriptions
- Patient → Medical Reports
- Prescription → Follow-ups
- Subscription → Payments
- SupportTicket → TicketMessages

### Many-to-Many (via arrays):
- Prescriptions ↔ Symptoms (embedded)
- Prescriptions ↔ Medicines (embedded)
- Medicine Rules ↔ Symptoms (via symptomIds array)
- Medicine Rules ↔ Medicines (via medicineIds array)

---

## Index Strategy

### Compound Indexes for Common Queries:
1. `{ doctorId: 1, createdAt: -1 }` - Doctor's recent records
2. `{ doctorId: 1, appointmentDate: 1 }` - Doctor's appointments
3. `{ doctorId: 1, isGlobal: 1 }` - Doctor's + global items
4. `{ doctorId: 1, dayOfWeek: 1 }` - Doctor's availability
5. `{ doctorId: 1, blockedDate: 1 }` - Doctor's blocked dates
6. `{ status: 1, createdAt: -1 }` - Filtered by status

### Single Field Indexes:
- All `_id` fields (automatic)
- All unique fields
- Frequently queried fields (status, dates, etc.)

---

## Data Migration Considerations

1. **UUID to ObjectId**: Convert Supabase UUIDs to MongoDB ObjectIds
2. **Timestamps**: Convert PostgreSQL timestamps to JavaScript Dates
3. **Arrays**: PostgreSQL arrays → MongoDB arrays
4. **JSONB**: PostgreSQL JSONB → MongoDB embedded documents
5. **Foreign Keys**: Convert to ObjectId references
6. **Enums**: Convert to string values with validation

---

## Performance Optimizations

1. **Embedded Documents**: Symptoms and Medicines in Prescriptions (frequently accessed together)
2. **Denormalization**: Store patient name in appointments for walk-ins
3. **Indexes**: Strategic indexes for common query patterns
4. **Pagination**: Use skip/limit with indexed queries
5. **Aggregation**: Use MongoDB aggregation pipeline for complex queries

---

## Security Considerations

1. **Field-level Security**: Implement in application layer (no RLS in MongoDB)
2. **Role-based Access**: Check user roles before queries
3. **Data Validation**: Use Mongoose schemas for validation
4. **Password Hashing**: Use bcrypt (already implemented)

