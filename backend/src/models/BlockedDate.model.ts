import mongoose, { Document, Schema } from 'mongoose';

export interface IBlockedDate extends Document {
  doctorId: mongoose.Types.ObjectId;
  blockedDate: Date;
  reason?: string;
  createdAt: Date;
}

const blockedDateSchema = new Schema<IBlockedDate>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    blockedDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique index: one blocked date per doctor per day
blockedDateSchema.index({ doctorId: 1, blockedDate: 1 }, { unique: true });
blockedDateSchema.index({ blockedDate: 1 });

const BlockedDate = mongoose.model<IBlockedDate>('BlockedDate', blockedDateSchema);

export default BlockedDate;

