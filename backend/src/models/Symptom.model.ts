import mongoose, { Document, Schema } from 'mongoose';

export interface ISymptom extends Document {
  code: string; // NEW - Unique symptom code (e.g., "SYM_FEVER_001")
  name: string;
  category: 'mental' | 'general' | 'particular' | 'modality' | string; // Enhanced
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW - REQUIRED
  synonyms: string[]; // NEW - Alternative names for normalization
  // Classical Homeopathy specific
  location?: string; // NEW - Body location
  sensation?: string; // NEW - Pain type, etc.
  modalities?: string[]; // NEW - Better/worse conditions
  description?: string;
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const symptomSchema = new Schema<ISymptom>(
  {
    code: {
      type: String,
      required: [true, 'Symptom code is required'],
      unique: true, // Creates index automatically
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Symptom name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    modality: {
      type: String,
      required: [true, 'Modality is required'],
      enum: ['electro_homeopathy', 'classical_homeopathy'],
      default: 'electro_homeopathy',
    },
    synonyms: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
    },
    sensation: {
      type: String,
      trim: true,
    },
    modalities: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: 'code' index is automatically created by unique: true in schema
symptomSchema.index({ doctorId: 1, isGlobal: 1 });
symptomSchema.index({ category: 1 });
symptomSchema.index({ category: 1, modality: 1 });
symptomSchema.index({ name: 'text', synonyms: 'text' }); // Full-text search
symptomSchema.index({ modality: 1, isGlobal: 1 });
symptomSchema.index({ modality: 1, doctorId: 1 });

const Symptom = mongoose.model<ISymptom>('Symptom', symptomSchema);

export default Symptom;

