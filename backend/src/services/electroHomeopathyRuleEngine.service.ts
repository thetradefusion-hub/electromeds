/**
 * Electro Homeopathy Rule Engine Service
 * 
 * Purpose: Enhanced rule matching and scoring for Electro Homeopathy
 * 
 * This service provides intelligent medicine suggestions based on symptom matching,
 * rule priority, and match scores
 */

import mongoose from 'mongoose';
import MedicineRule from '../models/MedicineRule.model.js';
import Medicine from '../models/Medicine.model.js';
import electroHomeopathyRuleEngineConfig from '../config/electroHomeopathyRuleEngine.config.js';

export interface ScoredMedicine {
  medicineId: string;
  medicineName: string;
  matchScore: number;
  baseScore: number;
  priorityBonus: number;
  coverageBonus: number;
  matchedRules: Array<{
    ruleId: string;
    ruleName: string;
    matchPercentage: number;
    priority: number;
  }>;
  symptomCoverage: number;
  dosage: string;
  duration: string;
  confidence: 'low' | 'medium' | 'high' | 'very_high';
}

export interface MedicineSuggestionResult {
  suggestions: ScoredMedicine[];
  summary: {
    totalRules: number;
    matchedRules: number;
    totalMedicines: number;
    highConfidence: number;
  };
}

export class ElectroHomeopathyRuleEngine {
  /**
   * Get medicine suggestions with intelligent scoring
   */
  async suggestMedicines(
    symptomIds: string[],
    doctorId?: mongoose.Types.ObjectId
  ): Promise<MedicineSuggestionResult> {
    // Step 1: Find matching rules
    const matchingRules = await this.findMatchingRules(symptomIds, doctorId);

    if (matchingRules.length === 0) {
      return {
        suggestions: [],
        summary: {
          totalRules: 0,
          matchedRules: 0,
          totalMedicines: 0,
          highConfidence: 0,
        },
      };
    }

    // Step 2: Score medicines based on matched rules
    const scoredMedicines = await this.scoreMedicines(
      matchingRules,
      symptomIds
    );

    // Step 3: Filter and rank medicines
    const filteredMedicines = this.filterAndRankMedicines(scoredMedicines);

    // Step 4: Calculate summary
    const summary = {
      totalRules: matchingRules.length,
      matchedRules: matchingRules.length,
      totalMedicines: scoredMedicines.size,
      highConfidence: filteredMedicines.filter(
        (m) => m.confidence === 'high' || m.confidence === 'very_high'
      ).length,
    };

    return {
      suggestions: filteredMedicines,
      summary,
    };
  }

  /**
   * Find matching rules based on symptom IDs
   */
  private async findMatchingRules(
    symptomIds: string[],
    doctorId?: mongoose.Types.ObjectId
  ): Promise<any[]> {
    const symptomObjectIds = symptomIds.map((id) => {
      try {
        return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
      } catch {
        return id;
      }
    });

    // Find all rules that match any symptom
    const allRules = await MedicineRule.find({
      $or: [{ isGlobal: true }, { doctorId }],
      symptomIds: { $in: symptomObjectIds },
      modality: 'electro_homeopathy',
    })
      .sort({ priority: -1 })
      .lean();

    // Filter rules based on matching strategy
    const matchingRules = allRules.filter((rule) => {
      const ruleSymptomIds = rule.symptomIds.map((id: any) => id.toString());
      const selectedSymptomIds = symptomObjectIds.map((id) => id.toString());

      const matchedSymptoms = ruleSymptomIds.filter((rs: string) =>
        selectedSymptomIds.includes(rs)
      );
      const matchPercentage = matchedSymptoms.length / ruleSymptomIds.length;

      const config = electroHomeopathyRuleEngineConfig.matching;

      if (config.strategy === 'all') {
        // ALL symptoms must match
        return matchPercentage === 1.0;
      } else if (config.strategy === 'majority') {
        // More than threshold must match
        return matchPercentage > config.majorityThreshold;
      } else {
        // ANY symptom matches (default)
        return (
          matchPercentage >= config.minMatchPercentage &&
          matchedSymptoms.length > 0
        );
      }
    });

    return matchingRules;
  }

  /**
   * Score medicines based on matched rules
   */
  private async scoreMedicines(
    matchingRules: any[],
    symptomIds: string[]
  ): Promise<Map<string, ScoredMedicine>> {
    const medicineScores = new Map<string, ScoredMedicine>();
    const symptomObjectIds = symptomIds.map((id) => {
      try {
        return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
      } catch {
        return id;
      }
    });

    for (const rule of matchingRules) {
      const ruleSymptomIds = rule.symptomIds.map((id: any) => id.toString());
      const selectedSymptomIds = symptomObjectIds.map((id) => id.toString());

      const matchedSymptoms = ruleSymptomIds.filter((rs: string) =>
        selectedSymptomIds.includes(rs)
      );
      const matchPercentage = matchedSymptoms.length / ruleSymptomIds.length;

      // Calculate base score for this rule
      const baseScore =
        matchedSymptoms.length *
        electroHomeopathyRuleEngineConfig.scoring.baseScorePerSymptom;

      // Add bonuses
      let ruleScore = baseScore;
      if (matchPercentage === 1.0) {
        // Perfect match
        ruleScore +=
          electroHomeopathyRuleEngineConfig.scoring.perfectMatchBonus;
      } else if (matchPercentage > 0.5) {
        // Majority match
        ruleScore +=
          electroHomeopathyRuleEngineConfig.scoring.majorityMatchBonus;
      }

      // Priority bonus
      const priorityMultiplier = this.getPriorityMultiplier(rule.priority || 0);
      ruleScore *= priorityMultiplier;

      // Process each medicine in the rule
      for (const medicineId of rule.medicineIds || []) {
        const medIdStr = medicineId.toString();

        if (!medicineScores.has(medIdStr)) {
          // Initialize medicine score
          const medicine = await Medicine.findById(medicineId).lean();
          if (!medicine) continue;

          medicineScores.set(medIdStr, {
            medicineId: medIdStr,
            medicineName: medicine.name,
            matchScore: 0,
            baseScore: 0,
            priorityBonus: 0,
            coverageBonus: 0,
            matchedRules: [],
            symptomCoverage: 0,
            dosage: rule.dosage || medicine.defaultDosage || '10 drops twice daily',
            duration: rule.duration || '7 days',
            confidence: 'low',
          });
        }

        const medicineScore = medicineScores.get(medIdStr)!;

        // Add rule score to medicine
        medicineScore.baseScore += ruleScore;
        medicineScore.matchedRules.push({
          ruleId: rule._id.toString(),
          ruleName: rule.name,
          matchPercentage,
          priority: rule.priority || 0,
        });
      }
    }

    // Calculate coverage bonus and final scores
    for (const [, medicineScore] of medicineScores.entries()) {
      // Calculate symptom coverage based on number of matched rules

      // Coverage bonus based on number of matched rules
      const ruleCount = medicineScore.matchedRules.length;
      if (ruleCount >= 3) {
        medicineScore.coverageBonus =
          electroHomeopathyRuleEngineConfig.scoring.coverageBonus.high;
      } else if (ruleCount >= 2) {
        medicineScore.coverageBonus =
          electroHomeopathyRuleEngineConfig.scoring.coverageBonus.medium;
      } else if (ruleCount >= 1) {
        medicineScore.coverageBonus =
          electroHomeopathyRuleEngineConfig.scoring.coverageBonus.low;
      }

      // Calculate final match score
      medicineScore.matchScore =
        medicineScore.baseScore + medicineScore.coverageBonus;

      // Calculate confidence
      medicineScore.confidence = this.calculateConfidence(
        medicineScore.matchScore
      );

      // Calculate symptom coverage percentage (approximate)
      medicineScore.symptomCoverage = Math.min(
        (ruleCount / matchingRules.length) * 100,
        100
      );
    }

    return medicineScores;
  }

  /**
   * Get priority multiplier
   */
  private getPriorityMultiplier(priority: number): number {
    const config = electroHomeopathyRuleEngineConfig.priority;

    if (priority >= 10) {
      return config.highest;
    } else if (priority >= 7) {
      return config.high;
    } else if (priority >= 4) {
      return config.medium;
    } else {
      return config.low;
    }
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(
    matchScore: number
  ): 'low' | 'medium' | 'high' | 'very_high' {
    if (matchScore >= 100) return 'very_high';
    if (matchScore >= 60) return 'high';
    if (matchScore >= 30) return 'medium';
    return 'low';
  }

  /**
   * Filter and rank medicines
   */
  private filterAndRankMedicines(
    scoredMedicines: Map<string, ScoredMedicine>
  ): ScoredMedicine[] {
    // Convert to array and filter by minimum score
    const medicines = Array.from(scoredMedicines.values()).filter(
      (m) =>
        m.matchScore >=
        electroHomeopathyRuleEngineConfig.filtering.minMatchScore
    );

    // Sort by match score (descending)
    const sortedMedicines = medicines.sort(
      (a, b) => b.matchScore - a.matchScore
    );

    // Score gap analysis
    if (sortedMedicines.length === 0) {
      return [];
    } else if (sortedMedicines.length === 1) {
      return sortedMedicines;
    }

    const topScore = sortedMedicines[0].matchScore;
    const secondScore = sortedMedicines[1].matchScore;
    const scoreGap = topScore > 0 ? ((topScore - secondScore) / topScore) * 100 : 0;

    const config = electroHomeopathyRuleEngineConfig.filtering;

    if (scoreGap > config.scoreGapThresholds.large) {
      // Large gap - show only top 2
      return sortedMedicines.slice(0, 2);
    } else if (scoreGap > config.scoreGapThresholds.medium) {
      // Medium gap - show top 3
      return sortedMedicines.slice(0, 3);
    } else {
      // Small gap - show top 5 (or maxSuggestions)
      return sortedMedicines.slice(0, config.maxSuggestions);
    }
  }
}

export default ElectroHomeopathyRuleEngine;
