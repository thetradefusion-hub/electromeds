import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  patientId: string; // Auto-generated like EH-2024-001
  doctorId: mongoose.Types.ObjectId;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  address?: string;
  caseType: 'new' | 'old';
  visitDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age must be realistic'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
    },
    address: {
      type: String,
      trim: true,
    },
    caseType: {
      type: String,
      enum: ['new', 'old'],
      default: 'new',
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (patientId index already created by unique: true)
patientSchema.index({ doctorId: 1, createdAt: -1 });
patientSchema.index({ mobile: 1 });
patientSchema.index({ visitDate: 1 });

const Patient = mongoose.model<IPatient>('Patient', patientSchema);

export default Patient;

