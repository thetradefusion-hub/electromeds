import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
  name: string;
  category: string;
  indications?: string;
  defaultDosage?: string;
  contraIndications?: string;
  notes?: string;
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    indications: {
      type: String,
      trim: true,
    },
    defaultDosage: {
      type: String,
      trim: true,
    },
    contraIndications: {
      type: String,
      trim: true,
    },
    notes: {
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
medicineSchema.index({ doctorId: 1, isGlobal: 1 });
medicineSchema.index({ name: 1 });
medicineSchema.index({ category: 1 });

const Medicine = mongoose.model<IMedicine>('Medicine', medicineSchema);

export default Medicine;

