import mongoose, { Document, Schema } from 'mongoose';

export interface StructuredCase {
  mental: Array<{
    symptomCode: string;
    symptomName: string;
    weight?: number;
  }>;
  generals: Array<{
    symptomCode: string;
    symptomName: string;
    weight?: number;
  }>;
  particulars: Array<{
    symptomCode: string;
    symptomName: string;
    location?: string;
    sensation?: string;
    weight?: number;
  }>;
  modalities: Array<{
    symptomCode: string;
    symptomName: string;
    type: 'better' | 'worse';
    weight?: number;
  }>;
  pathologyTags: string[]; // ["Acute", "Chronic", "Fever", etc.]
}

export interface RemedyScore {
  remedyId: mongoose.Types.ObjectId;
  remedyName: string;
  finalScore: number;
  baseScore: number;
  constitutionBonus: number;
  modalityBonus: number;
  pathologySupport: number;
  contradictionPenalty: number;
  matchedRubrics: string[];
  matchedSymptoms: string[];
  confidence: 'low' | 'medium' | 'high' | 'very_high';
}

export interface ICaseRecord extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  // Structured case input
  structuredCase: StructuredCase;
  // Engine processing
  selectedRubrics: Array<{
    rubricId: mongoose.Types.ObjectId;
    rubricText: string;
    repertoryType: string;
    autoSelected: boolean;
  }>;
  engineOutput: {
    remedyScores: RemedyScore[];
    clinicalReasoning: string;
    warnings: Array<{
      type: 'contradiction' | 'incompatibility' | 'repetition';
      message: string;
      remedyId?: mongoose.Types.ObjectId;
    }>;
  };
  // Doctor decision
  finalRemedy: {
    remedyId: mongoose.Types.ObjectId;
    remedyName: string;
    potency: string;
    repetition: string;
    notes?: string;
  } | null;
  // Outcome tracking
  outcomeStatus: 'pending' | 'improved' | 'no_change' | 'worsened' | 'not_followed';
  followUpNotes?: string;
  // AI Case Taking metadata
  questionAnswers?: Array<{
    questionId: string;
    questionText: string;
    answer: string;
    domain: string;
    type: 'yes_no' | 'multiple_choice' | 'open_ended';
    answeredAt: Date;
    extractedSymptoms?: Array<{
      symptomText: string;
      category: string;
      confidence: string;
    }>;
  }>;
  questionHistory?: Array<{
    questionId: string;
    questionText: string;
    domain: string;
    generatedAt: Date;
    answered: boolean;
  }>;
  // Case Summary (AI-generated)
  caseSummary?: {
    clinicalSummary: string;
    homeopathicSummary: string;
    keynotes: string[];
    strangeSymptoms: string[];
    generatedAt: Date;
    updatedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const caseRecordSchema = new Schema<ICaseRecord>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required'],
    },
    structuredCase: {
      mental: [
        {
          symptomCode: { type: String, required: true },
          symptomName: { type: String, required: true },
          weight: { type: Number },
        },
      ],
      generals: [
        {
          symptomCode: { type: String, required: true },
          symptomName: { type: String, required: true },
          weight: { type: Number },
        },
      ],
      particulars: [
        {
          symptomCode: { type: String, required: true },
          symptomName: { type: String, required: true },
          location: { type: String },
          sensation: { type: String },
          weight: { type: Number },
        },
      ],
      modalities: [
        {
          symptomCode: { type: String, required: true },
          symptomName: { type: String, required: true },
          type: {
            type: String,
            required: true,
            enum: ['better', 'worse'],
          },
          weight: { type: Number },
        },
      ],
      pathologyTags: {
        type: [String],
        default: [],
      },
    },
    selectedRubrics: [
      {
        rubricId: {
          type: Schema.Types.ObjectId,
          ref: 'Rubric',
          required: true,
        },
        rubricText: { type: String, required: true },
        repertoryType: { type: String, required: true },
        autoSelected: { type: Boolean, default: false },
      },
    ],
    engineOutput: {
      remedyScores: [
        {
          remedyId: {
            type: Schema.Types.ObjectId,
            ref: 'Remedy',
            required: true,
          },
          remedyName: { type: String, required: true },
          finalScore: { type: Number, required: true },
          baseScore: { type: Number, required: true },
          constitutionBonus: { type: Number, default: 0 },
          modalityBonus: { type: Number, default: 0 },
          pathologySupport: { type: Number, default: 0 },
          contradictionPenalty: { type: Number, default: 0 },
          matchedRubrics: { type: [String], default: [] },
          matchedSymptoms: { type: [String], default: [] },
          confidence: {
            type: String,
            enum: ['low', 'medium', 'high', 'very_high'],
            required: true,
          },
        },
      ],
      clinicalReasoning: { type: String, default: '' },
      warnings: [
        {
          type: {
            type: String,
            enum: ['contradiction', 'incompatibility', 'repetition'],
            required: true,
          },
          message: { type: String, required: true },
          remedyId: {
            type: Schema.Types.ObjectId,
            ref: 'Remedy',
          },
        },
      ],
    },
    finalRemedy: {
      remedyId: {
        type: Schema.Types.ObjectId,
        ref: 'Remedy',
      },
      remedyName: { type: String },
      potency: { type: String },
      repetition: { type: String },
      notes: { type: String },
    },
    outcomeStatus: {
      type: String,
      enum: ['pending', 'improved', 'no_change', 'worsened', 'not_followed'],
      default: 'pending',
    },
    followUpNotes: {
      type: String,
      trim: true,
    },
    questionAnswers: [
      {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        answer: { type: String, required: true },
        domain: { type: String, required: true },
        type: {
          type: String,
          enum: ['yes_no', 'multiple_choice', 'open_ended'],
          required: true,
        },
        answeredAt: { type: Date, default: Date.now },
        extractedSymptoms: [
          {
            symptomText: { type: String },
            category: { type: String },
            confidence: { type: String },
          },
        ],
      },
    ],
    questionHistory: [
      {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        domain: { type: String, required: true },
        generatedAt: { type: Date, default: Date.now },
        answered: { type: Boolean, default: false },
      },
    ],
    caseSummary: {
      clinicalSummary: { type: String },
      homeopathicSummary: { type: String },
      keynotes: { type: [String], default: [] },
      strangeSymptoms: { type: [String], default: [] },
      generatedAt: { type: Date, default: Date.now },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// Indexes
caseRecordSchema.index({ doctorId: 1, createdAt: -1 });
caseRecordSchema.index({ patientId: 1 });
caseRecordSchema.index({ 'finalRemedy.remedyId': 1, outcomeStatus: 1 });
caseRecordSchema.index({ 'structuredCase.pathologyTags': 1 });

const CaseRecord = mongoose.model<ICaseRecord>('CaseRecord', caseRecordSchema);

export default CaseRecord;
