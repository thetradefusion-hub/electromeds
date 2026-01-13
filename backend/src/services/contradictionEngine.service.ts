/**
 * Contradiction & Safety Engine Service
 * 
 * Purpose: Detect incompatibilities, opposite modality conflicts, repetition warnings
 * 
 * This service ensures safety by detecting contradictions and applying penalties
 * ENHANCED: Now includes remedy history consideration with time-based penalties
 */

import mongoose from 'mongoose';
import Remedy from '../models/Remedy.model.js';
import type { RemedyFinalScore } from './scoringEngine.service.js';
import ruleEngineConfig from '../config/ruleEngine.config.js';

export interface ContradictionWarning {
  type: 'contradiction' | 'incompatibility' | 'repetition';
  message: string;
  severity: 'low' | 'medium' | 'high';
  remedyId?: mongoose.Types.ObjectId;
}

export interface SafetyCheckedRemedy {
  remedy: RemedyFinalScore;
  warnings: ContradictionWarning[];
  penalty: number;
}

export class ContradictionEngine {
  /**
   * Detect contradictions and safety issues
   */
  async detectContradictions(
    scoredRemedies: RemedyFinalScore[],
    patientHistory?: Array<{ remedyId: string; date: Date }>
  ): Promise<SafetyCheckedRemedy[]> {
    const results: SafetyCheckedRemedy[] = [];

    for (const remedy of scoredRemedies) {
      const remedyDetails = await Remedy.findById(remedy.remedyId).lean();
      const warnings: ContradictionWarning[] = [];
      let penalty = 0;

      if (!remedyDetails) {
        results.push({
          remedy,
          warnings,
          penalty,
        });
        continue;
      }

      // Check 1: Incompatible remedies (ENHANCED)
      if (remedyDetails.incompatibilities && remedyDetails.incompatibilities.length > 0) {
        const incompatibleRemedies = scoredRemedies.filter((r) =>
          remedyDetails.incompatibilities!.includes(r.remedyId.toString())
        );

        if (incompatibleRemedies.length > 0) {
          warnings.push({
            type: 'incompatibility',
            message: `Incompatible with: ${incompatibleRemedies.map((r) => r.remedyName).join(', ')}`,
            severity: 'high',
            remedyId: remedy.remedyId,
          });
          penalty += ruleEngineConfig.penalties.incompatibility;
        }
      }

      // Check 2: Opposite modality conflicts
      // (Can add logic to detect remedies with opposite modalities)

      // Check 3: Repetition warnings (ENHANCED - time-based penalties)
      if (patientHistory && patientHistory.length > 0) {
        const remedyHistory = patientHistory.filter(
          (h) => h.remedyId === remedy.remedyId.toString()
        );

        if (remedyHistory.length > 0) {
          const mostRecent = remedyHistory.sort(
            (a, b) => b.date.getTime() - a.date.getTime()
          )[0];
          const daysSince = Math.floor(
            (Date.now() - mostRecent.date.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSince <= 7) {
            // Used very recently - strong penalty
            penalty += ruleEngineConfig.penalties.recentUse.veryRecent;
            warnings.push({
              type: 'repetition',
              message: `This remedy was used ${daysSince} days ago. Consider waiting or using different remedy.`,
              severity: 'high',
              remedyId: remedy.remedyId,
            });
          } else if (daysSince <= 30) {
            // Used recently - moderate penalty
            penalty += ruleEngineConfig.penalties.recentUse.recent;
            warnings.push({
              type: 'repetition',
              message: `This remedy was used ${daysSince} days ago.`,
              severity: 'medium',
              remedyId: remedy.remedyId,
            });
          } else if (daysSince <= 90) {
            // Used in last 3 months - small penalty
            penalty += ruleEngineConfig.penalties.recentUse.moderate;
          }
        }
      }

      results.push({
        remedy: {
          ...remedy,
          contradictionPenalty: penalty,
          finalScore: remedy.finalScore - penalty,
        },
        warnings,
        penalty,
      });
    }

    return results;
  }
}

export default ContradictionEngine;
