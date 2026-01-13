import mongoose, { Document, Schema } from 'mongoose';

export interface IRemedy extends Document {
  name: string;
  category: string; // Plant Kingdom, Mineral Kingdom, etc.
  modality: 'classical_homeopathy';
  // Constitution traits
  constitutionTraits: string[];
  // Modalities
  modalities: {
    better: string[];
    worse: string[];
  };
  // Clinical indications
  clinicalIndications: string[];
  // Incompatibilities
  incompatibilities: string[]; // Remedy IDs
  // Materia Medica
  materiaMedica: {
    keynotes: string[];
    pathogenesis: string;
    clinicalNotes: string;
  };
  // Potency support
  supportedPotencies: string[]; // ["6C", "30C", "200C", "1M"]
  // Common fields
  indications?: string;
  defaultDosage?: string;
  contraIndications?: string;
  notes?: string;
  isGlobal: boolean;
  doctorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const remedySchema = new Schema<IRemedy>(
  {
    name: {
      type: String,
      required: [true, 'Remedy name is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    modality: {
      type: String,
      required: true,
      enum: ['classical_homeopathy'],
      default: 'classical_homeopathy',
    },
    constitutionTraits: {
      type: [String],
      default: [],
    },
    modalities: {
      better: {
        type: [String],
        default: [],
      },
      worse: {
        type: [String],
        default: [],
      },
    },
    clinicalIndications: {
      type: [String],
      default: [],
    },
    incompatibilities: {
      type: [String], // Remedy IDs
      default: [],
    },
    materiaMedica: {
      keynotes: {
        type: [String],
        default: [],
      },
      pathogenesis: {
        type: String,
        default: '',
      },
      clinicalNotes: {
        type: String,
        default: '',
      },
    },
    supportedPotencies: {
      type: [String],
      default: [],
    },
    indications: {
      type: String,
      trim: true,
    },
    defaultDosage: {
      type: String,
      trim: true,
    },
    contraIndications: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isGlobal: {
      type: Boolean,
      default: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
    },
  },
  { timestamps: true }
);

// Indexes
// Note: 'name' index is automatically created by unique: true in schema
remedySchema.index({ category: 1, modality: 1 });
remedySchema.index({ constitutionTraits: 1 });
// Note: Cannot index parallel arrays (better and worse together)
// Removed modalities indexes to avoid MongoDB parallel array indexing error
// These can be added later if needed for specific queries
remedySchema.index({ isGlobal: 1, doctorId: 1 });

const Remedy = mongoose.model<IRemedy>('Remedy', remedySchema);

export default Remedy;
