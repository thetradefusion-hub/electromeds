import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketMessage extends Document {
  ticketId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: 'doctor' | 'admin';
  message: string;
  createdAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'SupportTicket',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderType: {
      type: String,
      enum: ['doctor', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
ticketMessageSchema.index({ ticketId: 1 });
ticketMessageSchema.index({ senderId: 1 });
ticketMessageSchema.index({ createdAt: 1 });

const TicketMessage = mongoose.model<ITicketMessage>('TicketMessage', ticketMessageSchema);

export default TicketMessage;

