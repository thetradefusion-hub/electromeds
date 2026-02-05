/**
 * Smart Scoring Engine Service (CORE)
 * 
 * Purpose: Implement scoring formula with weights and bonuses
 * 
 * Formula:
 * FinalScore = Σ(rubric_grade × symptom_weight × grade_multiplier)
 *            + constitution_bonus
 *            + modality_bonus
 *            + pathology_support
 *            + keynote_bonus
 *            + coverage_bonus
 *            - contradiction_penalty
 * 
 * Symptom Weights (ENHANCED):
 * - Mental = 5 (increased - most important in homeopathy)
 * - Generals = 3 (increased)
 * - Particulars = 1 (same)
 * - Modalities = 2 (increased)
 */

import mongoose from 'mongoose';
import Remedy from '../models/Remedy.model.js';
import type { NormalizedCaseProfile } from './caseEngine.service.js';
import type { RemedyScore } from './repertoryEngine.service.js';
import ruleEngineConfig from '../config/ruleEngine.config.js';

export interface RemedyFinalScore {
  remedyId: mongoose.Types.ObjectId;
  remedyName: string;
  finalScore: number;
  baseScore: number;
  constitutionBonus: number;
  modalityBonus: number;
  pathologySupport: number;
  keynoteBonus: number;
  coverageBonus: number;
  contradictionPenalty: number;
  matchedRubrics: string[];
  matchedSymptoms: string[];
  confidence: 'low' | 'medium' | 'high' | 'very_high';
}

export class ScoringEngine {
  /**
   * Calculate final score for remedies
   */
  async calculateRemedyScores(
    remedyPool: Map<string, RemedyScore>,
    normalizedCase: NormalizedCaseProfile,
    selectedRubrics: Array<{
      rubricId: mongoose.Types.ObjectId;
      rubricText: string;
      matchedSymptoms: string[];
    }>
  ): Promise<RemedyFinalScore[]> {
    const scoredRemedies: RemedyFinalScore[] = [];

    for (const [remedyId, remedyScore] of remedyPool.entries()) {
      const remedy = await Remedy.findById(remedyId).lean();

      if (!remedy) continue;

      // Step 5.1: Calculate base score (Σ(rubric_grade × symptom_weight × grade_multiplier))
      let baseScore = 0;

      remedyScore.rubricGrades.forEach((rg) => {
        // Find which symptoms matched this rubric
        const rubric = selectedRubrics.find(
          (sr) => sr.rubricId.toString() === rg.rubricId.toString()
        );

        if (rubric) {
          // Get grade multiplier (higher grades = more weight)
          const gradeMultiplier = this.getRubricGradeMultiplier(rg.grade);
          
          // Calculate weight for each matched symptom
          rubric.matchedSymptoms.forEach((symptomCode) => {
            // Find symptom in normalized case to get weight
            const symptom = this.findSymptomInCase(normalizedCase, symptomCode);
            if (symptom) {
              baseScore += rg.grade * symptom.weight * gradeMultiplier;
            }
          });
        }
      });

      // Step 5.2: Constitution bonus
      const constitutionBonus = this.calculateConstitutionBonus(remedy, normalizedCase);

      // Step 5.3: Modality bonus
      const modalityBonus = this.calculateModalityBonus(remedy, normalizedCase);

      // Step 5.4: Pathology support
      const pathologySupport = this.calculatePathologySupport(remedy, normalizedCase.pathologyTags);

      // Step 5.5: Keynote matching bonus (NEW - very important in Classical Homeopathy)
      const keynoteBonus = this.calculateKeynoteBonus(remedy, normalizedCase);

      // Step 5.6: Symptom coverage bonus (NEW)
      const coverageBonus = this.calculateCoverageBonus(
        remedyScore,
        normalizedCase,
        selectedRubrics
      );

      // Step 5.7: Contradiction penalty (will be calculated in Step 7)
      const contradictionPenalty = 0; // Placeholder

      // Step 5.8: Calculate final score
      const finalScore =
        baseScore +
        constitutionBonus +
        modalityBonus +
        pathologySupport +
        keynoteBonus +
        coverageBonus -
        contradictionPenalty;

      scoredRemedies.push({
        remedyId: remedy._id,
        remedyName: remedy.name,
        finalScore,
        baseScore,
        constitutionBonus,
        modalityBonus,
        pathologySupport,
        keynoteBonus,
        coverageBonus,
        contradictionPenalty: 0, // Will be set in Step 7
        // Map rubric IDs back to human-readable rubric texts using selectedRubrics
        matchedRubrics: remedyScore.rubricGrades
          .map((rg) => {
            const rubric = selectedRubrics.find(
              (sr) => sr.rubricId.toString() === rg.rubricId.toString()
            );
            return rubric?.rubricText || rg.rubricId.toString();
          })
          .filter(Boolean),
        matchedSymptoms: this.getMatchedSymptoms(selectedRubrics),
        confidence: this.calculateConfidence(finalScore, remedyScore.rubricGrades.length),
      });
    }

    // Step 5.7: Sort by final score
    return scoredRemedies.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Find symptom in normalized case to get weight
   * Symptom weights (ENHANCED):
   * - mental = 5 (increased - most important in homeopathy)
   * - generals = 3 (increased)
   * - particulars = 1 (same)
   * - modalities = 2 (increased)
   */
  private findSymptomInCase(
    normalizedCase: NormalizedCaseProfile,
    symptomCode: string
  ): { weight: number; category: string } | null {
    // Check mental first (highest priority)
    const mentalSymptom = normalizedCase.mental.find((s) => s.symptomCode === symptomCode);
    if (mentalSymptom) {
      return { weight: ruleEngineConfig.scoring.weights.mental, category: 'mental' };
    }

    // Check generals
    const generalSymptom = normalizedCase.generals.find((s) => s.symptomCode === symptomCode);
    if (generalSymptom) {
      return { weight: ruleEngineConfig.scoring.weights.generals, category: 'generals' };
    }

    // Check particulars
    const particularSymptom = normalizedCase.particulars.find((s) => s.symptomCode === symptomCode);
    if (particularSymptom) {
      return { weight: ruleEngineConfig.scoring.weights.particulars, category: 'particulars' };
    }

    // Check modalities
    const modalitySymptom = normalizedCase.modalities.find((s) => s.symptomCode === symptomCode);
    if (modalitySymptom) {
      return { weight: ruleEngineConfig.scoring.weights.modalities, category: 'modalities' };
    }

    return null;
  }

  /**
   * Get rubric grade multiplier
   * Higher grades = more weight
   */
  private getRubricGradeMultiplier(grade: number): number {
    return ruleEngineConfig.scoring.rubricGradeMultipliers[grade as keyof typeof ruleEngineConfig.scoring.rubricGradeMultipliers] || 1.0;
  }

  /**
   * Calculate constitution bonus (ENHANCED)
   * Now supports mental, physical, and emotional traits separately
   */
  private calculateConstitutionBonus(
    remedy: any,
    normalizedCase: NormalizedCaseProfile
  ): number {
    const mentalSymptomNames = normalizedCase.mental.map((s) => s.symptomName.toLowerCase());
    const generalSymptomNames = normalizedCase.generals.map((s) => s.symptomName.toLowerCase());
    let bonus = 0;

    // Mental constitution traits (most important)
    const mentalTraits = (remedy.constitutionTraits || []).filter((trait: string) =>
      mentalSymptomNames.some((name) => name.includes(trait.toLowerCase()))
    );
    bonus += mentalTraits.length * ruleEngineConfig.bonuses.constitution.mental;

    // Physical constitution traits
    const physicalTraits = (remedy.constitutionTraits || []).filter((trait: string) =>
      generalSymptomNames.some((name) => name.includes(trait.toLowerCase()))
    );
    bonus += physicalTraits.length * ruleEngineConfig.bonuses.constitution.physical;

    // Emotional traits (check mental symptoms for emotional traits)
    const emotionalTraits = (remedy.constitutionTraits || []).filter((trait: string) => {
      const traitLower = trait.toLowerCase();
      return mentalSymptomNames.some((name) => name.includes(traitLower)) ||
             generalSymptomNames.some((name) => name.includes(traitLower));
    });
    bonus += emotionalTraits.length * ruleEngineConfig.bonuses.constitution.emotional;

    return bonus;
  }

  /**
   * Calculate modality bonus (ENHANCED - uses config)
   */
  private calculateModalityBonus(remedy: any, normalizedCase: NormalizedCaseProfile): number {
    let bonus = 0;

    normalizedCase.modalities.forEach((modality) => {
      if (modality.type === 'worse') {
        // Check if remedy has this "worse" modality
        if ((remedy.modalities?.worse || []).includes(modality.symptomName)) {
          bonus += ruleEngineConfig.bonuses.modality.worse; // Strong match
        }
      } else if (modality.type === 'better') {
        // Check if remedy has this "better" modality
        if ((remedy.modalities?.better || []).includes(modality.symptomName)) {
          bonus += ruleEngineConfig.bonuses.modality.better; // Moderate match
        }
      }
    });

    return bonus;
  }

  /**
   * Calculate pathology support (ENHANCED - fixed bonus per match)
   */
  private calculatePathologySupport(remedy: any, pathologyTags: string[]): number {
    if (pathologyTags.length === 0) return 0;

    // Check if remedy's clinical indications match pathology tags
    const matchingIndications = (remedy.clinicalIndications || []).filter((ind: string) =>
      pathologyTags.some((tag) => ind.toLowerCase().includes(tag.toLowerCase()))
    );

    // Fixed bonus per matching indication (more significant)
    return matchingIndications.length > 0 ? ruleEngineConfig.bonuses.pathology : 0;
  }

  /**
   * Calculate keynote matching bonus (NEW)
   * Keynotes are very important in Classical Homeopathy
   */
  private calculateKeynoteBonus(remedy: any, normalizedCase: NormalizedCaseProfile): number {
    if (!remedy.materiaMedica?.keynotes || remedy.materiaMedica.keynotes.length === 0) {
      return 0;
    }

    const keynotes = remedy.materiaMedica.keynotes;
    const mentalSymptoms = normalizedCase.mental.map((s) => s.symptomName.toLowerCase());
    const allSymptoms = [
      ...normalizedCase.mental,
      ...normalizedCase.generals,
      ...normalizedCase.particulars,
    ].map((s) => s.symptomName.toLowerCase());

    let matchingKeynotes = 0;

    keynotes.forEach((keynote: string) => {
      const keynoteLower = keynote.toLowerCase();
      
      // Check mental symptoms first (most important)
      if (mentalSymptoms.some((s) => s.includes(keynoteLower) || keynoteLower.includes(s))) {
        matchingKeynotes += 2; // Higher weight for mental
      } else if (allSymptoms.some((s) => s.includes(keynoteLower) || keynoteLower.includes(s))) {
        matchingKeynotes += 1;
      }
    });

    // Bonus = matching keynotes × config value
    return matchingKeynotes * ruleEngineConfig.bonuses.keynote;
  }

  /**
   * Calculate symptom coverage bonus (NEW)
   * Rewards remedies that match a higher percentage of symptoms
   */
  private calculateCoverageBonus(
    _remedyScore: RemedyScore,
    normalizedCase: NormalizedCaseProfile,
    selectedRubrics: Array<{ matchedSymptoms: string[] }>
  ): number {
    const totalSymptoms =
      normalizedCase.mental.length +
      normalizedCase.generals.length +
      normalizedCase.particulars.length +
      normalizedCase.modalities.length;

    if (totalSymptoms === 0) return 0;

    // Count unique matched symptoms
    const allMatchedSymptoms = selectedRubrics.flatMap((sr) => sr.matchedSymptoms);
    const uniqueMatchedSymptoms = new Set(allMatchedSymptoms).size;
    const coverage = (uniqueMatchedSymptoms / totalSymptoms) * 100;

    // Bonus based on coverage
    if (coverage >= 70) {
      return ruleEngineConfig.bonuses.coverage.high;
    } else if (coverage >= 50) {
      return ruleEngineConfig.bonuses.coverage.medium;
    }

    return 0;
  }

  /**
   * Calculate confidence level (ENHANCED - uses config)
   */
  private calculateConfidence(
    finalScore: number,
    matchedRubrics: number = 0
  ): 'low' | 'medium' | 'high' | 'very_high' {
    // Base confidence from score
    let confidence: 'low' | 'medium' | 'high' | 'very_high' = 'low';
    
    if (finalScore >= ruleEngineConfig.confidence.veryHigh) {
      confidence = 'very_high';
    } else if (finalScore >= ruleEngineConfig.confidence.high) {
      confidence = 'high';
    } else if (finalScore >= ruleEngineConfig.confidence.medium) {
      confidence = 'medium';
    }

    // Adjust based on rubric count (more rubrics = higher confidence)
    if (matchedRubrics >= 5 && confidence === 'medium') {
      confidence = 'high';
    }

    return confidence;
  }

  /**
   * Get all matched symptoms from selected rubrics
   */
  private getMatchedSymptoms(
    selectedRubrics: Array<{ matchedSymptoms: string[] }>
  ): string[] {
    const allMatched = selectedRubrics.flatMap((sr) => sr.matchedSymptoms);
    return [...new Set(allMatched)]; // Unique symptoms
  }
}

export default ScoringEngine;
