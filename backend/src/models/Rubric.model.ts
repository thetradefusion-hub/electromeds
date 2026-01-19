import mongoose, { Document, Schema } from 'mongoose';

export interface IRubric extends Document {
  repertoryType: 'kent' | 'bbcr' | 'boericke' | 'synthesis' | 'publicum';
  chapter: string; // Mind, Generals, etc.
  rubricText: string; // "FEAR - death, of"
  linkedSymptoms: string[]; // Symptom codes
  modality: 'classical_homeopathy';
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rubricSchema = new Schema<IRubric>(
  {
    repertoryType: {
      type: String,
      required: [true, 'Repertory type is required'],
      enum: ['kent', 'bbcr', 'boericke', 'synthesis', 'publicum'], // publicum = English repertory
    },
    chapter: {
      type: String,
      required: [true, 'Chapter is required'],
      trim: true,
    },
    rubricText: {
      type: String,
      required: [true, 'Rubric text is required'],
      trim: true,
    },
    linkedSymptoms: {
      type: [String], // Symptom codes
      default: [],
    },
    modality: {
      type: String,
      required: true,
      enum: ['classical_homeopathy'],
      default: 'classical_homeopathy',
    },
    isGlobal: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
rubricSchema.index({ rubricText: 'text' }); // Full-text search
rubricSchema.index({ repertoryType: 1, chapter: 1 });
rubricSchema.index({ linkedSymptoms: 1 });
rubricSchema.index({ modality: 1, isGlobal: 1 });

const Rubric = mongoose.model<IRubric>('Rubric', rubricSchema);

export default Rubric;
