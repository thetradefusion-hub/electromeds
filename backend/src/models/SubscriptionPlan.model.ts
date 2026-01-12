import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  priceMonthly: number;
  priceYearly?: number;
  features: string[];
  patientLimit?: number;
  doctorLimit: number;
  aiAnalysisQuota: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    priceMonthly: {
      type: Number,
      required: [true, 'Monthly price is required'],
      min: 0,
    },
    priceYearly: {
      type: Number,
      min: 0,
    },
    features: {
      type: [String],
      default: [],
    },
    patientLimit: {
      type: Number,
      min: 0,
    },
    doctorLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    aiAnalysisQuota: {
      type: Number,
      default: 10,
      min: 0,
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

// Indexes
subscriptionPlanSchema.index({ isActive: 1 });

const SubscriptionPlan = mongoose.model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;

