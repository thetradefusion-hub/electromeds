# MongoDB Schema Summary

## Quick Reference

### Collections Created (18 Total)

1. **users** - User authentication & profiles
2. **doctors** - Doctor information
3. **patients** - Patient records
4. **prescriptions** - Prescription records
5. **medicines** - Medicine database
6. **symptoms** - Symptom database
7. **medicinerules** - Symptom-medicine mapping rules
8. **appointments** - Appointment bookings
9. **doctoravailabilities** - Doctor schedules
10. **blockeddates** - Unavailable dates
11. **prescriptiontemplates** - Reusable templates
12. **patientmedicalreports** - Medical reports with AI analysis
13. **followups** - Follow-up tracking
14. **subscriptionplans** - Subscription plans
15. **subscriptions** - Active subscriptions
16. **payments** - Payment records
17. **supporttickets** - Support tickets
18. **ticketmessages** - Ticket conversation messages

---

## Key Design Decisions

### Embedded Documents
- ✅ Symptoms & Medicines in Prescriptions
- ✅ Analysis in Medical Reports
- ✅ Features in Subscription Plans

### References (ObjectId)
- ✅ All foreign key relationships
- ✅ User → Doctor (one-to-one)
- ✅ Doctor → Patients, Prescriptions, etc. (one-to-many)

### Arrays
- ✅ Symptom IDs & Medicine IDs in Rules
- ✅ Features in Subscription Plans

---

## Index Strategy

### Unique Indexes
- `users.email`
- `doctors.userId`
- `doctors.registrationNo`
- `patients.patientId`
- `prescriptions.prescriptionNo`
- `doctoravailabilities.doctorId + dayOfWeek`
- `blockeddates.doctorId + blockedDate`

### Compound Indexes
- `{ doctorId: 1, createdAt: -1 }` - Recent records
- `{ doctorId: 1, appointmentDate: 1 }` - Appointments
- `{ doctorId: 1, isGlobal: 1 }` - Filtered items

---

## Field Naming Convention

- **camelCase** for MongoDB (vs snake_case in PostgreSQL)
- **ObjectId** for references (vs UUID in PostgreSQL)
- **Date** objects (vs TIMESTAMP in PostgreSQL)

---

## Migration Mapping

| Supabase Table | MongoDB Collection | Key Changes |
|---------------|-------------------|-------------|
| `profiles` + `user_roles` | `users` | Merged, role in user doc |
| `doctors` | `doctors` | userId reference |
| `patients` | `patients` | doctorId reference |
| `prescriptions` | `prescriptions` | Embedded symptoms/medicines |
| `medicines` | `medicines` | doctorId optional |
| `symptoms` | `symptoms` | doctorId optional |
| `medicine_rules` | `medicinerules` | Arrays for IDs |
| `appointments` | `appointments` | References only |
| `doctor_availability` | `doctoravailabilities` | Unique compound index |
| `blocked_dates` | `blockeddates` | Unique compound index |
| `prescription_templates` | `prescriptiontemplates` | Embedded arrays |
| `patient_medical_reports` | `patientmedicalreports` | Embedded analysis |
| `subscription_plans` | `subscriptionplans` | Embedded features |
| `subscriptions` | `subscriptions` | References |
| `payments` | `payments` | References |
| `support_tickets` | `supporttickets` | References |
| `ticket_messages` | `ticketmessages` | References |

---

## Query Examples

### Get Doctor's Patients
```javascript
const patients = await Patient.find({ doctorId: doctor._id })
  .sort({ createdAt: -1 });
```

### Get Prescription with Patient
```javascript
const prescription = await Prescription.findById(id)
  .populate('patientId', 'name age mobile');
// Symptoms and medicines already embedded
```

### Get Patient History
```javascript
const [prescriptions, reports] = await Promise.all([
  Prescription.find({ patientId }),
  PatientMedicalReport.find({ patientId })
]);
```

---

## Next Steps

1. ✅ All models created
2. ✅ Indexes defined
3. ✅ Relationships designed
4. ⏳ Migration script ready
5. ⏳ Test migration on staging
6. ⏳ Update API endpoints
7. ⏳ Test all queries

---

**Status**: Schema design complete! Ready for migration.

