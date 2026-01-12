import mongoose, { Document, Schema } from 'mongoose';

export interface ReportFinding {
  parameter: string;
  value: string;
  normalRange?: string;
  status: 'normal' | 'abnormal' | 'critical';
  interpretation: string;
}

export interface ReportAnalysis {
  reportType: string;
  findings: ReportFinding[];
  summary: string;
  concernAreas: string[];
  recommendations: string[];
}

export interface IPatientMedicalReport extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  reportType: string;
  fileName: string;
  fileUrl?: string; // Optional - file storage not required for AI analysis
  analysis: ReportAnalysis;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const patientMedicalReportSchema = new Schema<IPatientMedicalReport>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    reportType: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
  fileUrl: {
    type: String,
    required: false, // Optional - file storage not required for AI analysis
  },
    analysis: {
      reportType: { type: String },
      findings: [
        {
          parameter: { type: String },
          value: { type: String },
          normalRange: { type: String },
          status: {
            type: String,
            enum: ['normal', 'abnormal', 'critical'],
          },
          interpretation: { type: String },
        },
      ],
      summary: { type: String },
      concernAreas: [String],
      recommendations: [String],
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
patientMedicalReportSchema.index({ patientId: 1 });
patientMedicalReportSchema.index({ doctorId: 1 });
patientMedicalReportSchema.index({ reportType: 1 });

const PatientMedicalReport = mongoose.model<IPatientMedicalReport>('PatientMedicalReport', patientMedicalReportSchema);

export default PatientMedicalReport;

