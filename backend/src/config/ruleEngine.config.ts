/**
 * Classical Homeopathy Rule Engine Configuration
 * 
 * This file contains all configurable parameters for the rule engine
 * Adjust these values to fine-tune accuracy and suggestion quality
 */

export const ruleEngineConfig = {
  // Scoring weights for different symptom categories
  scoring: {
    weights: {
      mental: 5,        // Increased from 3 - Mental symptoms are most important
      generals: 3,      // Increased from 2
      particulars: 1,   // Same
      modalities: 2,    // Increased from 1.5
    },
    // Minimum score threshold - remedies below this won't be suggested
    minimumScore: 30,
    // Maximum number of suggestions to show
    maxSuggestions: 5,
    // Score gap analysis thresholds
    scoreGapThresholds: {
      large: 50,   // If gap > 50%, show only top 2 remedies
      medium: 30,  // If gap > 30%, show top 3 remedies
      // Otherwise show top 5
    },
    // Rubric grade multipliers
    rubricGradeMultipliers: {
      4: 1.5,  // Highest grade - maximum weight
      3: 1.2,  // High grade - increased weight
      2: 1.0,  // Normal grade
      1: 0.8,  // Low grade - reduced weight
    },
  },
  // Bonus calculations
  bonuses: {
    constitution: {
      mental: 3,      // Mental constitution traits
      physical: 2,    // Physical constitution traits
      emotional: 2.5, // Emotional traits
    },
    keynote: 3,       // Per matching keynote
    pathology: 15,    // Fixed bonus for pathology match
    coverage: {
      high: 10,    // >70% symptom coverage
      medium: 5,   // >50% symptom coverage
    },
    modality: {
      worse: 3,    // Matches "worse" modality
      better: 2,  // Matches "better" modality
    },
  },
  // Penalties for safety
  penalties: {
    recentUse: {
      veryRecent: 50,  // Used <7 days ago
      recent: 20,      // Used <30 days ago
      moderate: 5,     // Used <90 days ago
    },
    incompatibility: 20, // Incompatible with other suggested remedies
  },
  // Clinical intelligence adjustments
  clinicalIntelligence: {
    acute: {
      boost: 1.25,        // Boost for acute remedies in acute cases
      penalty: 0.8,       // Penalty for chronic-only remedies
    },
    chronic: {
      boost: 1.2,         // Boost for constitutional remedies in chronic cases
      penalty: 0.7,       // Penalty for acute-only remedies
    },
    mentalDominance: {
      threshold: 50,      // Mental symptoms > 50% of total
      boost: 1.2,         // Boost for mental remedies
      keynoteBoost: 1.15, // Additional boost for matching keynotes
    },
  },
  // Confidence thresholds
  confidence: {
    veryHigh: 100,
    high: 70,
    medium: 40,
    low: 0,
  },
  // Rubric mapping
  rubricMapping: {
    autoSelectThreshold: 70, // Auto-select rubrics with 70%+ confidence
  },
};

export default ruleEngineConfig;
