import mongoose, { Document, Schema } from 'mongoose';

export interface IFollowUp extends Document {
  prescriptionId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  scheduledDate: Date;
  status: 'pending' | 'completed' | 'missed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUp>(
  {
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
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
    scheduledDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'missed'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
followUpSchema.index({ doctorId: 1, scheduledDate: 1 });
followUpSchema.index({ status: 1 });
followUpSchema.index({ scheduledDate: 1 });
followUpSchema.index({ prescriptionId: 1 });

const FollowUp = mongoose.model<IFollowUp>('FollowUp', followUpSchema);

export default FollowUp;

