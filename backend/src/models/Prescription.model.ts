import mongoose, { Document, Schema } from 'mongoose';

export interface PrescriptionSymptom {
  symptomId: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months';
}

export interface PrescriptionMedicine {
  medicineId: string;
  name: string;
  category: string;
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW
  // Electro Homeopathy
  dosage?: string;
  duration?: string;
  // Classical Homeopathy
  potency?: string; // NEW (6C, 30C, 200C, etc.)
  repetition?: string; // NEW (TDS, BD, OD, etc.)
  instructions?: string;
}

export interface IPrescription extends Document {
  prescriptionNo: string; // Auto-generated like RX-2024-001
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW - REQUIRED
  symptoms: PrescriptionSymptom[];
  medicines: PrescriptionMedicine[];
  diagnosis?: string;
  advice?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    modality: {
      type: String,
      required: [true, 'Modality is required'],
      enum: ['electro_homeopathy', 'classical_homeopathy'],
      default: 'electro_homeopathy',
    },
    symptoms: [
      {
        symptomId: { type: String, required: true },
        name: { type: String, required: true },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          required: true,
        },
        duration: { type: Number, required: true },
        durationUnit: {
          type: String,
          enum: ['days', 'weeks', 'months'],
          required: true,
        },
      },
    ],
    medicines: [
      {
        medicineId: { type: String, required: true },
        name: { type: String, required: true },
        category: { type: String, required: true },
        modality: {
          type: String,
          required: true,
          enum: ['electro_homeopathy', 'classical_homeopathy'],
        },
        // Electro Homeopathy
        dosage: { type: String },
        duration: { type: String },
        // Classical Homeopathy
        potency: { type: String },
        repetition: { type: String },
        instructions: { type: String },
      },
    ],
    diagnosis: {
      type: String,
      trim: true,
    },
    advice: {
      type: String,
      trim: true,
    },
    followUpDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (prescriptionNo index already created by unique: true)
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ followUpDate: 1 });

const Prescription = mongoose.model<IPrescription>('Prescription', prescriptionSchema);

export default Prescription;

