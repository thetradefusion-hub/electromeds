/**
 * Electro Homeopathy Rule Engine Configuration
 * 
 * This file contains all configurable parameters for Electro Homeopathy rule engine
 * Adjust these values to fine-tune accuracy and suggestion quality
 */

export const electroHomeopathyRuleEngineConfig = {
  // Rule matching strategy
  matching: {
    // Match strategy: 'any' = rule matches if ANY symptom matches, 'all' = ALL symptoms must match
    strategy: 'any', // 'any' | 'all' | 'majority'
    // Minimum symptom match percentage for rule to trigger (0-1)
    minMatchPercentage: 0.3, // At least 30% of rule symptoms must match
    // Majority threshold (if strategy is 'majority')
    majorityThreshold: 0.5, // More than 50% of symptoms must match
  },
  // Scoring weights
  scoring: {
    // Base score per matched symptom
    baseScorePerSymptom: 10,
    // Bonus for matching all symptoms in a rule
    perfectMatchBonus: 50,
    // Bonus for matching majority of symptoms
    majorityMatchBonus: 25,
    // Rule priority multiplier
    priorityMultiplier: 2, // Higher priority rules get more weight
    // Symptom coverage bonus (if medicine matches multiple rules)
    coverageBonus: {
      high: 30,    // >70% symptom coverage
      medium: 15,  // >50% symptom coverage
      low: 5,      // >30% symptom coverage
    },
  },
  // Filtering
  filtering: {
    // Minimum match score to include medicine
    minMatchScore: 20,
    // Maximum number of suggestions
    maxSuggestions: 5,
    // Score gap analysis thresholds
    scoreGapThresholds: {
      large: 40,   // If gap > 40%, show only top 2 remedies
      medium: 25,  // If gap > 25%, show top 3 remedies
      // Otherwise show top 5
    },
  },
  // Rule priority weights
  priority: {
    // Priority 10 (highest) = ×3 multiplier
    highest: 3,
    // Priority 7-9 = ×2 multiplier
    high: 2,
    // Priority 4-6 = ×1.5 multiplier
    medium: 1.5,
    // Priority 1-3 = ×1.0 multiplier
    low: 1.0,
  },
};

export default electroHomeopathyRuleEngineConfig;
