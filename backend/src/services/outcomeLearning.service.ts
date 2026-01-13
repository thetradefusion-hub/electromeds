/**
 * Outcome & Learning Hook Service
 * 
 * Purpose: Store doctor decisions and outcomes for future learning
 * 
 * This service captures case data for future ML/statistics analysis
 */

import mongoose from 'mongoose';
import CaseRecord from '../models/CaseRecord.model.js';
import type { NormalizedCaseProfile } from './caseEngine.service.js';
import type { RemedyFinalScore } from './scoringEngine.service.js';
import type { ContradictionWarning } from './contradictionEngine.service.js';

export interface CaseRecordInput {
  structuredCase: NormalizedCaseProfile; // Use normalized case (has symptomCode and symptomName)
  selectedRubrics: Array<{
    rubricId: mongoose.Types.ObjectId;
    rubricText: string;
    repertoryType: string;
    autoSelected: boolean;
  }>;
  engineOutput: {
    remedyScores: RemedyFinalScore[];
    clinicalReasoning: string;
    warnings: ContradictionWarning[];
  };
}

export class OutcomeLearningHook {
  /**
   * Save case record with engine output
   */
  async saveCaseRecord(
    doctorId: mongoose.Types.ObjectId,
    patientId: mongoose.Types.ObjectId,
    caseData: CaseRecordInput
  ): Promise<any> {
    return CaseRecord.create({
      doctorId,
      patientId,
      structuredCase: caseData.structuredCase,
      selectedRubrics: caseData.selectedRubrics,
      engineOutput: {
        remedyScores: caseData.engineOutput.remedyScores.map((score) => ({
          remedyId: score.remedyId,
          remedyName: score.remedyName,
          finalScore: score.finalScore,
          baseScore: score.baseScore,
          constitutionBonus: score.constitutionBonus,
          modalityBonus: score.modalityBonus,
          pathologySupport: score.pathologySupport,
          contradictionPenalty: score.contradictionPenalty,
          matchedRubrics: score.matchedRubrics,
          matchedSymptoms: score.matchedSymptoms,
          confidence: score.confidence,
        })),
        clinicalReasoning: caseData.engineOutput.clinicalReasoning,
        warnings: caseData.engineOutput.warnings,
      },
      finalRemedy: null, // Will be set when doctor selects
      outcomeStatus: 'pending',
    });
  }

  /**
   * Update with doctor's final decision
   */
  async updateDoctorDecision(
    caseRecordId: mongoose.Types.ObjectId,
    finalRemedy: {
      remedyId: mongoose.Types.ObjectId;
      remedyName: string;
      potency: string;
      repetition: string;
      notes?: string;
    }
  ): Promise<void> {
    await CaseRecord.findByIdAndUpdate(caseRecordId, {
      finalRemedy,
    });
  }

  /**
   * Update outcome status
   */
  async updateOutcome(
    caseRecordId: mongoose.Types.ObjectId,
    outcomeStatus: 'improved' | 'no_change' | 'worsened' | 'not_followed',
    followUpNotes?: string
  ): Promise<void> {
    await CaseRecord.findByIdAndUpdate(caseRecordId, {
      outcomeStatus,
      followUpNotes,
    });
  }

  /**
   * Calculate success rate (for statistics)
   */
  async calculateSuccessRate(
    remedyId: mongoose.Types.ObjectId,
    timeRange?: { start: Date; end: Date }
  ): Promise<{
    totalCases: number;
    improved: number;
    noChange: number;
    worsened: number;
    successRate: number;
  }> {
    const query: any = {
      'finalRemedy.remedyId': remedyId,
      outcomeStatus: { $ne: 'pending' },
    };

    if (timeRange) {
      query.createdAt = { $gte: timeRange.start, $lte: timeRange.end };
    }

    const cases = await CaseRecord.find(query).lean();

    const improved = cases.filter((c) => c.outcomeStatus === 'improved').length;
    const noChange = cases.filter((c) => c.outcomeStatus === 'no_change').length;
    const worsened = cases.filter((c) => c.outcomeStatus === 'worsened').length;

    return {
      totalCases: cases.length,
      improved,
      noChange,
      worsened,
      successRate: cases.length > 0 ? (improved / cases.length) * 100 : 0,
    };
  }

  /**
   * Find symptom-remedy patterns (for future ML)
   */
  async findSymptomRemedyPatterns(
    symptomCode: string
  ): Promise<Array<{
    remedyId: string;
    remedyName: string;
    frequency: number;
    successRate: number;
  }>> {
    const cases = await CaseRecord.find({
      'structuredCase.mental.symptomCode': symptomCode,
      outcomeStatus: 'improved',
    }).lean();

    // Count remedy frequency
    const remedyCounts = new Map<string, { count: number; name: string }>();

    cases.forEach((c) => {
      if (c.finalRemedy) {
        const remedyId = c.finalRemedy.remedyId.toString();
        if (!remedyCounts.has(remedyId)) {
          remedyCounts.set(remedyId, {
            count: 0,
            name: c.finalRemedy.remedyName,
          });
        }
        remedyCounts.get(remedyId)!.count++;
      }
    });

    // Calculate success rates
    const patterns = await Promise.all(
      Array.from(remedyCounts.entries()).map(async ([remedyId, data]) => {
        const successRate = await this.calculateSuccessRate(new mongoose.Types.ObjectId(remedyId));

        return {
          remedyId,
          remedyName: data.name,
          frequency: data.count,
          successRate: successRate.successRate,
        };
      })
    );

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }
}

export default OutcomeLearningHook;
