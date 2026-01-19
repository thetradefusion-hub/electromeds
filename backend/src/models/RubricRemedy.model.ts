import mongoose, { Document, Schema } from 'mongoose';

export interface IRubricRemedy extends Document {
  rubricId: mongoose.Types.ObjectId;
  remedyId: mongoose.Types.ObjectId;
  grade: number; // 1, 2, 3, or 4
  repertoryType: 'kent' | 'bbcr' | 'boericke' | 'synthesis' | 'publicum';
  createdAt: Date;
  updatedAt: Date;
}

const rubricRemedySchema = new Schema<IRubricRemedy>(
  {
    rubricId: {
      type: Schema.Types.ObjectId,
      ref: 'Rubric',
      required: [true, 'Rubric ID is required'],
    },
    remedyId: {
      type: Schema.Types.ObjectId,
      ref: 'Remedy',
      required: [true, 'Remedy ID is required'],
    },
    grade: {
      type: Number,
      required: [true, 'Grade is required'],
      min: 1,
      max: 4,
    },
    repertoryType: {
      type: String,
      required: [true, 'Repertory type is required'],
      enum: ['kent', 'bbcr', 'boericke', 'synthesis', 'publicum'], // publicum = English repertory
    },
  },
  { timestamps: true }
);

// Indexes
rubricRemedySchema.index({ rubricId: 1, remedyId: 1 }, { unique: true });
rubricRemedySchema.index({ remedyId: 1, grade: -1 });
rubricRemedySchema.index({ rubricId: 1, grade: -1 });

const RubricRemedy = mongoose.model<IRubricRemedy>('RubricRemedy', rubricRemedySchema);

export default RubricRemedy;
