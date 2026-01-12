import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;
  registrationNo: string;
  qualification: string;
  specialization: string;
  clinicName?: string;
  clinicAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    registrationNo: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    specialization: {
      type: String,
      default: 'Electro Homoeopathy',
      trim: true,
    },
    clinicName: {
      type: String,
      trim: true,
    },
    clinicAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (userId and registrationNo indexes already created by unique: true)

const Doctor = mongoose.model<IDoctor>('Doctor', doctorSchema);

export default Doctor;

