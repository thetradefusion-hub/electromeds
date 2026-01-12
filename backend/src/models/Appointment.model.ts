import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  patientName?: string;
  patientMobile?: string;
  appointmentDate: Date;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  bookingType: 'online' | 'walk_in' | 'phone';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
    },
    patientName: {
      type: String,
      trim: true,
    },
    patientMobile: {
      type: String,
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    bookingType: {
      type: String,
      enum: ['online', 'walk_in', 'phone'],
      default: 'walk_in',
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
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ patientId: 1 });

const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);

export default Appointment;

