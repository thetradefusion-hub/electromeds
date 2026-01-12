import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctorAvailability extends Document {
  doctorId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  slotDuration: number; // minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorAvailabilitySchema = new Schema<IDoctorAvailability>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)'],
    },
    slotDuration: {
      type: Number,
      default: 15,
      min: 5,
      max: 120,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique index: one schedule per day per doctor
doctorAvailabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

const DoctorAvailability = mongoose.model<IDoctorAvailability>('DoctorAvailability', doctorAvailabilitySchema);

export default DoctorAvailability;

