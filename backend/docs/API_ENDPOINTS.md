# API Endpoints Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Auth APIs

### POST /api/auth/signup
Register a new user

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "password123",
  "name": "Dr. John Doe",
  "phone": "1234567890",
  "role": "doctor",
  "registration_no": "REG123",
  "qualification": "MBBS",
  "specialization": "Electro Homoeopathy",
  "clinic_name": "My Clinic",
  "clinic_address": "123 Main St"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "doctor@example.com",
      "name": "Dr. John Doe",
      "role": "doctor"
    }
  }
}
```

### POST /api/auth/login
Login user

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "doctor@example.com",
      "name": "Dr. John Doe",
      "role": "doctor"
    }
  }
}
```

### GET /api/auth/me
Get current user (Protected)

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "doctor@example.com",
      "name": "Dr. John Doe",
      "phone": "1234567890",
      "avatar": "url",
      "role": "doctor"
    }
  }
}
```

### POST /api/auth/logout
Logout user (Protected)

**Response:**
```json
{
  "success": true,
  "message": "Logout successful. Please remove token from client storage."
}
```

---

## 2. Patient APIs

### GET /api/patients
Get all patients (Protected: super_admin, doctor, staff)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

### GET /api/patients/:id
Get single patient

### POST /api/patients
Create patient

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 30,
  "gender": "male",
  "mobile": "1234567890",
  "address": "123 Main St",
  "caseType": "new"
}
```

### PUT /api/patients/:id
Update patient

### DELETE /api/patients/:id
Delete patient

### PATCH /api/patients/:id/visit
Record patient visit

---

## 3. Prescription APIs

### GET /api/prescriptions
Get all prescriptions (Protected: super_admin, doctor)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [...]
}
```

### GET /api/prescriptions/:id
Get single prescription

### POST /api/prescriptions
Create prescription

**Request Body:**
```json
{
  "patientId": "patient_id",
  "symptoms": [
    {
      "symptomId": "symptom_id",
      "name": "Fever",
      "severity": "high",
      "duration": 3,
      "durationUnit": "days"
    }
  ],
  "medicines": [
    {
      "medicineId": "medicine_id",
      "name": "Paracetamol",
      "category": "Antipyretic",
      "dosage": "500mg",
      "duration": "5 days",
      "instructions": "After meals"
    }
  ],
  "diagnosis": "Viral fever",
  "advice": "Rest and hydration",
  "followUpDate": "2024-01-15"
}
```

### PUT /api/prescriptions/:id
Update prescription

### DELETE /api/prescriptions/:id
Delete prescription

---

## 4. Medicine APIs

### GET /api/medicines
Get all medicines (global + doctor-specific)

### GET /api/medicines/:id
Get single medicine

### POST /api/medicines
Create medicine

**Request Body:**
```json
{
  "name": "Paracetamol",
  "category": "Antipyretic",
  "indications": "Fever, Pain",
  "defaultDosage": "500mg",
  "contraIndications": "Liver disease",
  "notes": "Take with food",
  "isGlobal": false
}
```

### PUT /api/medicines/:id
Update medicine

### DELETE /api/medicines/:id
Delete medicine

---

## 5. Symptom APIs

### GET /api/symptoms
Get all symptoms (global + doctor-specific)

### GET /api/symptoms/:id
Get single symptom

### POST /api/symptoms
Create symptom

**Request Body:**
```json
{
  "name": "Fever",
  "category": "General",
  "description": "Elevated body temperature",
  "isGlobal": false
}
```

### PUT /api/symptoms/:id
Update symptom

### DELETE /api/symptoms/:id
Delete symptom

---

## 6. Medicine Rules APIs

### GET /api/rules
Get all medicine rules

### GET /api/rules/:id
Get single rule

### POST /api/rules
Create medicine rule

**Request Body:**
```json
{
  "name": "Fever Rule",
  "description": "Rule for fever symptoms",
  "symptomIds": ["symptom_id_1", "symptom_id_2"],
  "medicineIds": ["medicine_id_1"],
  "dosage": "500mg",
  "duration": "5 days",
  "priority": 1,
  "isGlobal": false
}
```

### PUT /api/rules/:id
Update rule

### DELETE /api/rules/:id
Delete rule

### POST /api/rules/suggest
Get medicine suggestions based on symptoms

**Request Body:**
```json
{
  "symptomIds": ["symptom_id_1", "symptom_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [...],
    "suggestedMedicineIds": ["medicine_id_1", "medicine_id_2"]
  }
}
```

---

## 7. Appointment APIs

### GET /api/appointments
Get all appointments

**Query Parameters:**
- `date`: Filter by date (YYYY-MM-DD)
- `status`: Filter by status

### GET /api/appointments/:id
Get single appointment

### POST /api/appointments
Create appointment

**Request Body:**
```json
{
  "patientId": "patient_id", // Optional for walk-in
  "patientName": "John Doe", // Required if no patientId
  "patientMobile": "1234567890", // Required if no patientId
  "appointmentDate": "2024-01-15",
  "timeSlot": "10:00",
  "status": "pending",
  "bookingType": "walk_in",
  "notes": "Follow-up appointment"
}
```

### PUT /api/appointments/:id
Update appointment

### DELETE /api/appointments/:id
Delete appointment

### GET /api/appointments/availability
Get doctor availability schedule

### POST /api/appointments/availability
Set doctor availability

**Request Body:**
```json
{
  "dayOfWeek": 1, // 0=Sunday, 6=Saturday
  "startTime": "09:00",
  "endTime": "17:00",
  "slotDuration": 15,
  "isActive": true
}
```

### GET /api/appointments/blocked-dates
Get blocked dates

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date

### POST /api/appointments/blocked-dates
Block a date

**Request Body:**
```json
{
  "blockedDate": "2024-01-20",
  "reason": "Holiday"
}
```

### DELETE /api/appointments/blocked-dates/:id
Unblock a date

---

## 8. Analytics APIs

### GET /api/analytics/dashboard
Get dashboard statistics (Protected: super_admin, doctor)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPatients": 100,
    "todayPatients": 5,
    "pendingFollowUps": 10,
    "totalPrescriptions": 250
  }
}
```

### GET /api/analytics/patients
Get patient analytics

**Query Parameters:**
- `startDate`: Start date
- `endDate`: End date

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPatients": 100,
    "newPatients": 50,
    "oldPatients": 50,
    "genderDistribution": [...],
    "ageDistribution": [...]
  }
}
```

### GET /api/analytics/prescriptions
Get prescription analytics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPrescriptions": 250,
    "monthlyTrend": [...],
    "topMedicines": [...],
    "topSymptoms": [...]
  }
}
```

### GET /api/analytics/appointments
Get appointment analytics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAppointments": 200,
    "statusDistribution": [...],
    "bookingTypeDistribution": [...],
    "dailyTrend": [...]
  }
}
```

### GET /api/analytics/revenue
Get revenue analytics (Protected: super_admin only)

---

## 9. Doctor APIs

### GET /api/doctors/me
Get current doctor's profile (Protected: super_admin, doctor)

**Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "doctor_id",
      "name": "Dr. John Doe",
      "email": "doctor@example.com",
      "registrationNo": "REG123",
      "qualification": "MBBS",
      "specialization": "Electro Homoeopathy",
      "clinicName": "My Clinic",
      "clinicAddress": "123 Main St"
    }
  }
}
```

### PUT /api/doctors/me
Update doctor profile

**Request Body:**
```json
{
  "qualification": "MBBS, MD",
  "specialization": "Cardiology",
  "clinicName": "Updated Clinic",
  "clinicAddress": "456 New St",
  "name": "Dr. John Updated",
  "phone": "9876543210"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...] // For validation errors
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting
Currently no rate limiting implemented. Consider adding for production.

---

## Notes
- All dates should be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
- All ObjectIds are MongoDB ObjectId strings
- Pagination not implemented yet (add if needed)
- File uploads for medical reports not implemented yet

