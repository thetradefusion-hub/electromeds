import mongoose, { Document, Schema } from 'mongoose';

export interface ISymptom extends Document {
  name: string;
  category: string;
  description?: string;
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const symptomSchema = new Schema<ISymptom>(
  {
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
symptomSchema.index({ doctorId: 1, isGlobal: 1 });
symptomSchema.index({ name: 1 });
symptomSchema.index({ category: 1 });

const Symptom = mongoose.model<ISymptom>('Symptom', symptomSchema);

export default Symptom;

