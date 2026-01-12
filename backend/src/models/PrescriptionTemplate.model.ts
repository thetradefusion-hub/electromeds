import mongoose, { Document, Schema } from 'mongoose';

export interface PrescriptionTemplateSymptom {
  symptomId: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months';
}

export interface PrescriptionTemplateMedicine {
  medicineId: string;
  name: string;
  category: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

export interface IPrescriptionTemplate extends Document {
  doctorId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  symptoms: PrescriptionTemplateSymptom[];
  medicines: PrescriptionTemplateMedicine[];
  diagnosis?: string;
  advice?: string;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionTemplateSchema = new Schema<IPrescriptionTemplate>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
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
  },
  {
    timestamps: true,
  }
);

// Indexes
prescriptionTemplateSchema.index({ doctorId: 1 });

const PrescriptionTemplate = mongoose.model<IPrescriptionTemplate>('PrescriptionTemplate', prescriptionTemplateSchema);

export default PrescriptionTemplate;

