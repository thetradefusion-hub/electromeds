/**
 * Suggestion Engine Service
 * 
 * Purpose: Return ranked remedies with transparent reasoning
 * 
 * This service generates final suggestions with clinical reasoning and potency recommendations
 * ENHANCED: Now includes minimum score threshold and score gap analysis
 */

import Remedy from '../models/Remedy.model.js';
import type { NormalizedCaseProfile } from './caseEngine.service.js';
import type { SafetyCheckedRemedy } from './contradictionEngine.service.js';
import ruleEngineConfig from '../config/ruleEngine.config.js';

export interface RemedySuggestion {
  remedy: {
    id: string;
    name: string;
    category: string;
  };
  matchScore: number;
  confidence: string;
  matchedSymptoms: string[];
  matchedRubrics: string[];
  clinicalReasoning: string;
  suggestedPotency: string;
  repetition: string;
  warnings: Array<{
    type: 'contradiction' | 'incompatibility' | 'repetition';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface SuggestionSummary {
  totalRemedies: number;
  highConfidence: number;
  warnings: number;
}

export interface SuggestionResult {
  topRemedies: RemedySuggestion[];
  summary: SuggestionSummary;
}

export class SuggestionEngine {
  /**
   * Generate final suggestions with transparent reasoning (ENHANCED)
   */
  async generateSuggestions(
    filteredRemedies: SafetyCheckedRemedy[],
    normalizedCase: NormalizedCaseProfile
  ): Promise<SuggestionResult> {
    // Step 8.1: Filter by minimum score threshold
    const MIN_SCORE_THRESHOLD = ruleEngineConfig.scoring.minimumScore;
    const qualifiedRemedies = filteredRemedies.filter(
      (r) => r.remedy.finalScore >= MIN_SCORE_THRESHOLD
    );

    // Step 8.2: Filter by confidence (at least medium)
    const confidentRemedies = qualifiedRemedies.filter(
      (r) => r.remedy.confidence !== 'low'
    );

    // Step 8.3: Sort by score
    const sortedRemedies = confidentRemedies.length > 0
      ? confidentRemedies.sort((a, b) => b.remedy.finalScore - a.remedy.finalScore)
      : qualifiedRemedies.sort((a, b) => b.remedy.finalScore - a.remedy.finalScore);

    // Step 8.4: Score gap analysis - determine how many to show
    let topRemedies: SafetyCheckedRemedy[];
    
    if (sortedRemedies.length === 0) {
      // No qualified remedies - show top 3 anyway for doctor's consideration
      topRemedies = filteredRemedies
        .sort((a, b) => b.remedy.finalScore - a.remedy.finalScore)
        .slice(0, 3);
    } else if (sortedRemedies.length === 1) {
      topRemedies = sortedRemedies;
    } else {
      const topScore = sortedRemedies[0].remedy.finalScore;
      const secondScore = sortedRemedies[1].remedy.finalScore;
      const scoreGap = topScore > 0 ? ((topScore - secondScore) / topScore) * 100 : 0;

      if (scoreGap > ruleEngineConfig.scoring.scoreGapThresholds.large) {
        // Large gap - show only top 1-2
        topRemedies = sortedRemedies.slice(0, 2);
      } else if (scoreGap > ruleEngineConfig.scoring.scoreGapThresholds.medium) {
        // Medium gap - show top 3
        topRemedies = sortedRemedies.slice(0, 3);
      } else {
        // Small gap - show top 5 (or maxSuggestions)
        topRemedies = sortedRemedies.slice(0, ruleEngineConfig.scoring.maxSuggestions);
      }
    }

    // Step 8.2: Generate suggestions with reasoning
    const suggestions = await Promise.all(
      topRemedies.map(async (item) => {
        const remedyDetails = await Remedy.findById(item.remedy.remedyId).lean();

        // Generate clinical reasoning
        const clinicalReasoning = this.generateClinicalReasoning(
          item.remedy,
          normalizedCase,
          remedyDetails
        );

        // Suggest potency
        const potencySuggestion = this.suggestPotency(
          item.remedy.finalScore,
          normalizedCase.isAcute
        );

        return {
          remedy: {
            id: item.remedy.remedyId.toString(),
            name: item.remedy.remedyName,
            category: remedyDetails?.category || 'Unknown',
          },
          matchScore: item.remedy.finalScore,
          confidence: item.remedy.confidence,
          matchedSymptoms: item.remedy.matchedSymptoms,
          matchedRubrics: item.remedy.matchedRubrics,
          clinicalReasoning,
          suggestedPotency: potencySuggestion.potency,
          repetition: potencySuggestion.repetition,
          warnings: item.warnings,
        };
      })
    );

    return {
      topRemedies: suggestions,
      summary: {
        totalRemedies: filteredRemedies.length,
        highConfidence: suggestions.filter(
          (s) => s.confidence === 'high' || s.confidence === 'very_high'
        ).length,
        warnings: suggestions.reduce((sum, s) => sum + s.warnings.length, 0),
      },
    };
  }

  /**
   * Generate transparent clinical reasoning
   */
  private generateClinicalReasoning(
    remedy: any,
    normalizedCase: NormalizedCaseProfile,
    remedyDetails: any
  ): string {
    const reasons: string[] = [];

    // Base score reasoning
    reasons.push(
      `Base score: ${remedy.baseScore.toFixed(2)} (from ${remedy.matchedRubrics.length} matched rubrics)`
    );

    // Constitution bonus
    if (remedy.constitutionBonus > 0) {
      reasons.push(
        `Constitution match: +${remedy.constitutionBonus} (matches patient's constitutional traits)`
      );
    }

    // Modality bonus
    if (remedy.modalityBonus > 0) {
      reasons.push(
        `Modality match: +${remedy.modalityBonus} (matches patient's better/worse conditions)`
      );
    }

    // Pathology support
    if (remedy.pathologySupport > 0) {
      reasons.push(
        `Pathology support: +${remedy.pathologySupport} (indicated for ${normalizedCase.pathologyTags.join(', ')})`
      );
    }

    // Keynote bonus (NEW)
    if (remedy.keynoteBonus > 0) {
      reasons.push(
        `Keynote match: +${remedy.keynoteBonus} (remedy's keynotes match patient symptoms)`
      );
    }

    // Coverage bonus (NEW)
    if (remedy.coverageBonus > 0) {
      reasons.push(
        `Symptom coverage: +${remedy.coverageBonus} (covers high percentage of patient symptoms)`
      );
    }

    // Contradiction penalty
    if (remedy.contradictionPenalty > 0) {
      reasons.push(`Safety adjustment: -${remedy.contradictionPenalty} (contradictions detected)`);
    }

    // Keynotes match
    if (remedyDetails?.materiaMedica?.keynotes) {
      const matchingKeynotes = remedyDetails.materiaMedica.keynotes.filter((keynote: string) =>
        normalizedCase.mental.some((s) => s.symptomName.toLowerCase().includes(keynote.toLowerCase()))
      );

      if (matchingKeynotes.length > 0) {
        reasons.push(`Keynotes match: ${matchingKeynotes.join(', ')}`);
      }
    }

    return reasons.join('. ');
  }

  /**
   * Suggest potency based on score and case type
   */
  private suggestPotency(
    finalScore: number,
    isAcute: boolean
  ): { potency: string; repetition: string } {
    if (isAcute) {
      if (finalScore >= 80) {
        return { potency: '200C', repetition: 'Every 1-2 hours' };
      } else if (finalScore >= 50) {
        return { potency: '30C', repetition: 'Every 2-4 hours' };
      } else {
        return { potency: '6C', repetition: 'Every 4-6 hours' };
      }
    } else {
      // Chronic case
      if (finalScore >= 80) {
        return { potency: '200C', repetition: 'Once daily' };
      } else if (finalScore >= 60) {
        return { potency: '30C', repetition: 'Twice daily' };
      } else {
        return { potency: '6C', repetition: 'Three times daily' };
      }
    }
  }
}

export default SuggestionEngine;
