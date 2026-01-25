/**
 * Meta-Attributes Extraction Service
 * 
 * Extracts intensity, duration, frequency, and peculiarity from text
 */

export interface MetaAttributes {
  intensity?: 'mild' | 'moderate' | 'severe';
  duration?: string;
  frequency?: 'constant' | 'intermittent' | 'occasional';
  peculiarity?: number; // 0-100 score
}

export class MetaAttributeExtractionService {
  // Intensity patterns
  private intensityPatterns = {
    mild: /\b(mild|slight|minor|gentle|subtle|low)\b/i,
    moderate: /\b(moderate|medium|average|modest)\b/i,
    severe: /\b(severe|intense|extreme|strong|sharp|acute|severe|excruciating)\b/i,
  };

  // Duration patterns
  private durationPatterns = [
    /\b(\d+)\s*(second|seconds|sec|secs)\b/i,
    /\b(\d+)\s*(minute|minutes|min|mins)\b/i,
    /\b(\d+)\s*(hour|hours|hr|hrs)\b/i,
    /\b(\d+)\s*(day|days|d)\b/i,
    /\b(\d+)\s*(week|weeks|wk|wks)\b/i,
    /\b(\d+)\s*(month|months|mo|mos)\b/i,
    /\b(\d+)\s*(year|years|yr|yrs)\b/i,
    /\b(recent|recently|new|newly)\b/i,
    /\b(chronic|long-standing|persistent|ongoing)\b/i,
    /\b(acute|sudden|abrupt)\b/i,
  ];

  // Frequency patterns
  private frequencyPatterns = {
    constant: /\b(constant|continuous|persistent|ongoing|always|all the time|non-stop)\b/i,
    intermittent: /\b(intermittent|occasional|sometimes|now and then|periodic|sporadic)\b/i,
    occasional: /\b(occasional|rare|seldom|infrequent|once in a while)\b/i,
  };

  // Peculiarity indicators
  private peculiarityIndicators = [
    /\b(strange|unusual|peculiar|odd|weird|bizarre|unique|rare)\b/i,
    /\b(never seen|never experienced|uncommon|atypical)\b/i,
    /\b(only|exclusively|specifically|particularly)\b/i,
  ];

  /**
   * Extract all meta-attributes from text
   */
  extractMetaAttributes(text: string): MetaAttributes {
    const attributes: MetaAttributes = {};

    // Extract intensity
    attributes.intensity = this.extractIntensity(text);

    // Extract duration
    attributes.duration = this.extractDuration(text);

    // Extract frequency
    attributes.frequency = this.extractFrequency(text);

    // Calculate peculiarity score
    attributes.peculiarity = this.calculatePeculiarity(text);

    return attributes;
  }

  /**
   * Extract intensity
   */
  private extractIntensity(text: string): 'mild' | 'moderate' | 'severe' | undefined {
    // Check for severe first (most specific)
    if (this.intensityPatterns.severe.test(text)) {
      return 'severe';
    }
    if (this.intensityPatterns.moderate.test(text)) {
      return 'moderate';
    }
    if (this.intensityPatterns.mild.test(text)) {
      return 'mild';
    }
    return undefined;
  }

  /**
   * Extract duration
   */
  private extractDuration(text: string): string | undefined {
    // Try to match duration patterns
    for (const pattern of this.durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1]) {
          // Numeric duration
          return `${match[1]} ${match[2] || match[3] || ''}`.trim();
        } else {
          // Descriptive duration
          return match[0].trim();
        }
      }
    }

    // Check for relative durations
    if (/\b(recent|recently|new|newly)\b/i.test(text)) {
      return 'recent';
    }
    if (/\b(chronic|long-standing|persistent|ongoing)\b/i.test(text)) {
      return 'chronic';
    }
    if (/\b(acute|sudden|abrupt)\b/i.test(text)) {
      return 'acute';
    }

    return undefined;
  }

  /**
   * Extract frequency
   */
  private extractFrequency(text: string): 'constant' | 'intermittent' | 'occasional' | undefined {
    // Check in order of specificity
    if (this.frequencyPatterns.constant.test(text)) {
      return 'constant';
    }
    if (this.frequencyPatterns.intermittent.test(text)) {
      return 'intermittent';
    }
    if (this.frequencyPatterns.occasional.test(text)) {
      return 'occasional';
    }
    return undefined;
  }

  /**
   * Calculate peculiarity score (0-100)
   */
  private calculatePeculiarity(text: string): number {
    let score = 0;

    // Check for peculiarity indicators
    for (const indicator of this.peculiarityIndicators) {
      const matches = text.match(new RegExp(indicator.source, 'gi'));
      if (matches) {
        score += matches.length * 15; // Each match adds 15 points
      }
    }

    // Check for specific patterns that indicate peculiarity
    if (/\b(only|exclusively)\s+([^.]+)\b/i.test(text)) {
      score += 20;
    }

    if (/\b(never|never before|first time)\b/i.test(text)) {
      score += 25;
    }

    // Check for unusual combinations
    const unusualCombinations = [
      /\b(cold\s+but\s+thirsty|thirsty\s+but\s+cold)\b/i,
      /\b(hot\s+but\s+chilly|chilly\s+but\s+hot)\b/i,
      /\b(better\s+lying\s+but\s+worse\s+sitting)\b/i,
    ];

    for (const pattern of unusualCombinations) {
      if (pattern.test(text)) {
        score += 30;
      }
    }

    // Cap at 100
    return Math.min(100, score);
  }
}

export default MetaAttributeExtractionService;
