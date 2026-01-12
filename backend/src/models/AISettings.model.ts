import mongoose, { Document, Schema } from 'mongoose';

export interface IAISettings extends Document {
  aiProvider: 'lovable' | 'openai' | 'google' | 'custom';
  apiKey: string;
  apiEndpoint?: string;
  modelName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const aiSettingsSchema = new Schema<IAISettings>(
  {
    aiProvider: {
      type: String,
      enum: ['lovable', 'openai', 'google', 'custom'],
      default: 'lovable',
      required: true,
    },
    apiKey: {
      type: String,
      required: [true, 'API key is required'],
      trim: true,
    },
    apiEndpoint: {
      type: String,
      trim: true,
    },
    modelName: {
      type: String,
      default: 'google/gemini-2.5-flash',
      trim: true,
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

// Only one active AI settings should exist
aiSettingsSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

const AISettings = mongoose.model<IAISettings>('AISettings', aiSettingsSchema);

export default AISettings;

