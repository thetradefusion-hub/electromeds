import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicineRule extends Document {
  name: string;
  description?: string;
  modality: 'electro_homeopathy' | 'classical_homeopathy'; // NEW - REQUIRED
  symptomIds: string[];
  medicineIds: string[];
  dosage: string;
  duration: string;
  // Classical Homeopathy specific
  potency?: string; // NEW (for Classical: 6C, 30C, 200C)
  repetition?: string; // NEW (for Classical: TDS, BD, OD)
  priority: number;
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const medicineRuleSchema = new Schema<IMedicineRule>(
  {
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    modality: {
      type: String,
      required: [true, 'Modality is required'],
      enum: ['electro_homeopathy', 'classical_homeopathy'],
      default: 'electro_homeopathy',
    },
    symptomIds: {
      type: [String],
      required: true,
      default: [],
    },
    medicineIds: {
      type: [String],
      required: true,
      default: [],
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
    potency: {
      type: String,
      trim: true,
    },
    repetition: {
      type: String,
      trim: true,
    },
    priority: {
      type: Number,
      default: 0,
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
medicineRuleSchema.index({ doctorId: 1, isGlobal: 1 });
medicineRuleSchema.index({ priority: -1 });
medicineRuleSchema.index({ symptomIds: 1 });
medicineRuleSchema.index({ modality: 1, doctorId: 1, isGlobal: 1 });
medicineRuleSchema.index({ modality: 1, symptomIds: 1 });

const MedicineRule = mongoose.model<IMedicineRule>('MedicineRule', medicineRuleSchema);

export default MedicineRule;

