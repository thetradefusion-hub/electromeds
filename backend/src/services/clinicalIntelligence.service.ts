/**
 * Clinical Intelligence Layer Service
 * 
 * Purpose: Apply clinical filters (acute vs chronic bias, mental dominance, etc.)
 * 
 * Important: This layer ADJUSTS scores, does NOT override repertory results
 */

import Remedy from '../models/Remedy.model.js';
import type { NormalizedCaseProfile } from './caseEngine.service.js';
import type { RemedyFinalScore } from './scoringEngine.service.js';
import ruleEngineConfig from '../config/ruleEngine.config.js';

export class ClinicalIntelligenceLayer {
  /**
   * Apply clinical intelligence filters
   * This layer ADJUSTS scores, does NOT override repertory results
   */
  async applyClinicalFilters(
    scoredRemedies: RemedyFinalScore[],
    normalizedCase: NormalizedCaseProfile
  ): Promise<RemedyFinalScore[]> {
    const adjustedRemedies = await Promise.all(
      scoredRemedies.map(async (remedy) => {
        let adjustedScore = remedy.finalScore;
        const remedyDetails = await Remedy.findById(remedy.remedyId).lean();

        if (!remedyDetails) return remedy;

        // Filter 1: Acute vs Chronic bias (ENHANCED)
        if (normalizedCase.isAcute) {
          // Boost acute remedies more
          if ((remedyDetails.clinicalIndications || []).includes('Acute')) {
            adjustedScore *= ruleEngineConfig.clinicalIntelligence.acute.boost;
          }
          // Penalize chronic-only remedies
          if ((remedyDetails.clinicalIndications || []).includes('Chronic Only')) {
            adjustedScore *= ruleEngineConfig.clinicalIntelligence.acute.penalty;
          }
        } else if (normalizedCase.isChronic) {
          // Boost constitutional remedies more for chronic cases
          if (remedy.constitutionBonus > 5) {
            adjustedScore *= ruleEngineConfig.clinicalIntelligence.chronic.boost;
          }
          // Penalize acute-only remedies
          if ((remedyDetails.clinicalIndications || []).includes('Acute Only')) {
            adjustedScore *= ruleEngineConfig.clinicalIntelligence.chronic.penalty;
          }
        }

        // Filter 2: Mental Dominance (ENHANCED)
        const totalSymptoms =
          normalizedCase.mental.length +
          normalizedCase.generals.length +
          normalizedCase.particulars.length;
        
        const mentalPercentage = totalSymptoms > 0 
          ? (normalizedCase.mental.length / totalSymptoms) * 100 
          : 0;

        if (mentalPercentage > ruleEngineConfig.clinicalIntelligence.mentalDominance.threshold) {
          // Mental symptoms dominate - boost mental remedies more
          if (remedy.constitutionBonus > 3) {
            adjustedScore *= ruleEngineConfig.clinicalIntelligence.mentalDominance.boost;
          }
          // Extra boost if remedy has strong mental keynotes
          if (remedyDetails.materiaMedica?.keynotes) {
            const mentalKeynotes = remedyDetails.materiaMedica.keynotes.filter(
              (k: string) =>
                normalizedCase.mental.some((m) =>
                  m.symptomName.toLowerCase().includes(k.toLowerCase())
                )
            );
            if (mentalKeynotes.length > 0) {
              adjustedScore *= ruleEngineConfig.clinicalIntelligence.mentalDominance.keynoteBoost;
            }
          }
        }

        // Filter 3: Pathology Match (NEW)
        if (normalizedCase.pathologyTags.length > 0) {
          const matchingIndications = (remedyDetails.clinicalIndications || []).filter(
            (ind: string) =>
              normalizedCase.pathologyTags.some((tag) =>
                ind.toLowerCase().includes(tag.toLowerCase())
              )
          );
          if (matchingIndications.length > 0) {
            adjustedScore += ruleEngineConfig.bonuses.pathology; // Fixed bonus
          }
        }

        // Filter 4: Remedy Category Match (NEW)
        // If case is primarily mental, boost mental/constitutional remedies
        if (normalizedCase.mental.length > normalizedCase.generals.length) {
          if (remedyDetails.category === 'Mental' || remedyDetails.category === 'Constitutional') {
            adjustedScore *= 1.1;
          }
        }

        // Filter 3: Constitutional similarity
        // (Already handled in constitution bonus, but can add more logic here)

        // Filter 4: Disease support (non-ruling)
        // Pathology support already calculated, but can add disease-specific logic

        return {
          ...remedy,
          finalScore: adjustedScore,
        };
      })
    );

    return adjustedRemedies;
  }
}

export default ClinicalIntelligenceLayer;
