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

export interface ScoreBreakdown {
  baseScore: number;
  constitutionBonus: number;
  modalityBonus: number;
  pathologySupport: number;
  keynoteBonus: number;
  coverageBonus: number;
  contradictionPenalty: number;
  total: number;
}

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
  repertoryType?: string;
  scoreBreakdown?: ScoreBreakdown;
  warnings: Array<{
    type: 'contradiction' | 'incompatibility' | 'repetition' | 'contraindication';
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
    // Step 8.1: Filter by minimum score threshold and minimum rubrics (quick win: at least 2 rubrics)
    const MIN_SCORE_THRESHOLD = ruleEngineConfig.scoring.minimumScore;
    const MIN_RUBRICS = ruleEngineConfig.scoring.minRubricsForSuggestion ?? 2;
    const qualifiedRemedies = filteredRemedies.filter(
      (r) =>
        r.remedy.finalScore >= MIN_SCORE_THRESHOLD &&
        (r.remedy.matchedRubrics?.length ?? 0) >= MIN_RUBRICS
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

        // Suggest potency (only from remedy's supported potencies)
        const potencySuggestion = this.suggestPotency(
          remedyDetails,
          item.remedy.finalScore,
          normalizedCase.isAcute
        );

        // Contraindication check: case pathology/tags vs remedy contraIndications
        const contraindicationWarnings = this.checkContraindications(
          remedyDetails,
          normalizedCase.pathologyTags
        );
        const allWarnings = [...item.warnings, ...contraindicationWarnings];

        const scoreBreakdown = {
          baseScore: item.remedy.baseScore,
          constitutionBonus: item.remedy.constitutionBonus,
          modalityBonus: item.remedy.modalityBonus,
          pathologySupport: item.remedy.pathologySupport,
          keynoteBonus: item.remedy.keynoteBonus,
          coverageBonus: item.remedy.coverageBonus,
          contradictionPenalty: item.remedy.contradictionPenalty,
          total: item.remedy.finalScore,
        };

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
          repertoryType: 'publicum',
          scoreBreakdown,
          warnings: allWarnings,
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
   * Suggest potency from remedy's supportedPotencies only (quick win for safety)
   */
  private suggestPotency(
    remedyDetails: any,
    finalScore: number,
    isAcute: boolean
  ): { potency: string; repetition: string } {
    const supported = remedyDetails?.supportedPotencies as string[] | undefined;
    const order = isAcute
      ? ['200C', '1M', '30C', '6C', '12C'] // prefer higher for acute when score high
      : ['200C', '1M', '30C', '6C', '12C'];

    let potency = '30C';
    let repetition = isAcute ? 'Every 2-4 hours' : 'Twice daily';

    if (supported && supported.length > 0) {
      const preferred = isAcute
        ? (finalScore >= 80 ? '200C' : finalScore >= 50 ? '30C' : '6C')
        : (finalScore >= 80 ? '200C' : finalScore >= 60 ? '30C' : '6C');
      potency = supported.includes(preferred)
        ? preferred
        : order.find((p) => supported.includes(p)) || supported[0];
      if (isAcute) {
        repetition =
          potency === '200C'
            ? 'Every 1-2 hours'
            : potency === '30C'
              ? 'Every 2-4 hours'
              : 'Every 4-6 hours';
      } else {
        repetition =
          potency === '200C'
            ? 'Once daily'
            : potency === '30C'
              ? 'Twice daily'
              : 'Three times daily';
      }
    } else {
      if (isAcute) {
        potency = finalScore >= 80 ? '200C' : finalScore >= 50 ? '30C' : '6C';
        repetition =
          potency === '200C'
            ? 'Every 1-2 hours'
            : potency === '30C'
              ? 'Every 2-4 hours'
              : 'Every 4-6 hours';
      } else {
        potency = finalScore >= 80 ? '200C' : finalScore >= 60 ? '30C' : '6C';
        repetition =
          potency === '200C' ? 'Once daily' : potency === '30C' ? 'Twice daily' : 'Three times daily';
      }
    }

    return { potency, repetition };
  }

  /**
   * Check remedy contraindications against case pathology/tags; return warnings
   */
  private checkContraindications(
    remedyDetails: any,
    pathologyTags: string[]
  ): Array<{ type: 'contraindication'; message: string; severity: 'low' | 'medium' | 'high' }> {
    const contra = (remedyDetails?.contraIndications as string) || '';
    if (!contra.trim() || pathologyTags.length === 0) return [];

    const contraLower = contra.toLowerCase();
    const warnings: Array<{
      type: 'contraindication';
      message: string;
      severity: 'low' | 'medium' | 'high';
    }> = [];

    for (const tag of pathologyTags) {
      const tagLower = tag.toLowerCase();
      if (tagLower && contraLower.includes(tagLower)) {
        warnings.push({
          type: 'contraindication',
          message: `Caution: This remedy has contraindications that may relate to "${tag}". Please verify before prescribing.`,
          severity: tagLower.includes('pregnancy') || tagLower.includes('child') ? 'high' : 'medium',
        });
        break;
      }
    }
    return warnings;
  }
}

export default SuggestionEngine;
