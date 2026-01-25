/**
 * Modality Detection Service
 * 
 * Detects and extracts modalities (better/worse factors, time patterns, etc.)
 * from text using both rule-based and NLP approaches
 */

export interface Modality {
  type: 'better' | 'worse' | 'time' | 'weather' | 'motion' | 'position' | 'eating' | 'emotional';
  value: string;
  linkedSymptom?: string;
  confidence: number;
  context?: string;
}

export class ModalityDetectionService {
  // Time patterns
  private timePatterns = [
    { pattern: /\b(morning|am|a\.m\.)\b/i, type: 'time' as const, value: 'morning' },
    { pattern: /\b(afternoon|pm|p\.m\.)\b/i, type: 'time' as const, value: 'afternoon' },
    { pattern: /\b(evening|dusk)\b/i, type: 'time' as const, value: 'evening' },
    { pattern: /\b(night|midnight|late night)\b/i, type: 'time' as const, value: 'night' },
    { pattern: /\b(dawn|early morning|sunrise)\b/i, type: 'time' as const, value: 'dawn' },
  ];

  // Better/worse patterns
  private betterPatterns = [
    { pattern: /\b(better|improved|relieved|ameliorated|eased)\b/i, type: 'better' as const },
    { pattern: /\b(better with|relieved by|improved by)\b/i, type: 'better' as const },
  ];

  private worsePatterns = [
    { pattern: /\b(worse|aggravated|increased|intensified|exacerbated)\b/i, type: 'worse' as const },
    { pattern: /\b(worse with|aggravated by|increased by)\b/i, type: 'worse' as const },
  ];

  // Weather patterns
  private weatherPatterns = [
    { pattern: /\b(cold|chilly|freezing)\b/i, type: 'weather' as const, value: 'cold' },
    { pattern: /\b(heat|hot|warm|warmth)\b/i, type: 'weather' as const, value: 'heat' },
    { pattern: /\b(rain|rainy|wet|humidity|humid)\b/i, type: 'weather' as const, value: 'rain' },
    { pattern: /\b(sun|sunny|sunlight)\b/i, type: 'weather' as const, value: 'sun' },
    { pattern: /\b(wind|windy|breeze)\b/i, type: 'weather' as const, value: 'wind' },
  ];

  // Motion patterns
  private motionPatterns = [
    { pattern: /\b(motion|movement|moving|walking|exercise)\b/i, type: 'motion' as const, value: 'motion' },
    { pattern: /\b(rest|resting|still|stationary)\b/i, type: 'motion' as const, value: 'rest' },
    { pattern: /\b(jarring|jolting|shaking)\b/i, type: 'motion' as const, value: 'jarring' },
  ];

  // Position patterns
  private positionPatterns = [
    { pattern: /\b(lying|lying down|supine)\b/i, type: 'position' as const, value: 'lying' },
    { pattern: /\b(sitting|seated)\b/i, type: 'position' as const, value: 'sitting' },
    { pattern: /\b(standing|upright)\b/i, type: 'position' as const, value: 'standing' },
    { pattern: /\b(bending|bent)\b/i, type: 'position' as const, value: 'bending' },
  ];

  // Eating patterns
  private eatingPatterns = [
    { pattern: /\b(before eating|before food|pre-meal)\b/i, type: 'eating' as const, value: 'before eating' },
    { pattern: /\b(after eating|after food|post-meal)\b/i, type: 'eating' as const, value: 'after eating' },
    { pattern: /\b(while eating|during meal)\b/i, type: 'eating' as const, value: 'during eating' },
  ];

  // Emotional patterns
  private emotionalPatterns = [
    { pattern: /\b(anger|angry|irritation|irritated)\b/i, type: 'emotional' as const, value: 'anger' },
    { pattern: /\b(sadness|sad|grief|mourning)\b/i, type: 'emotional' as const, value: 'sadness' },
    { pattern: /\b(joy|happy|happiness|elation)\b/i, type: 'emotional' as const, value: 'joy' },
    { pattern: /\b(fear|afraid|anxiety|anxious)\b/i, type: 'emotional' as const, value: 'fear' },
  ];

  /**
   * Detect all modalities from text
   */
  detectModalities(text: string): Modality[] {
    const modalities: Modality[] = [];

    // Detect time modalities
    for (const pattern of this.timePatterns) {
      if (pattern.pattern.test(text)) {
        modalities.push({
          type: pattern.type,
          value: pattern.value,
          confidence: 0.8,
          context: this.extractContext(text, pattern.pattern),
        });
      }
    }

    // Detect better modalities
    for (const pattern of this.betterPatterns) {
      const match = text.match(pattern.pattern);
      if (match) {
        const context = this.extractContext(text, pattern.pattern);
        const linkedSymptom = this.extractLinkedSymptom(context);
        modalities.push({
          type: pattern.type,
          value: this.extractBetterValue(context),
          linkedSymptom,
          confidence: 0.85,
          context,
        });
      }
    }

    // Detect worse modalities
    for (const pattern of this.worsePatterns) {
      const match = text.match(pattern.pattern);
      if (match) {
        const context = this.extractContext(text, pattern.pattern);
        const linkedSymptom = this.extractLinkedSymptom(context);
        modalities.push({
          type: pattern.type,
          value: this.extractWorseValue(context),
          linkedSymptom,
          confidence: 0.85,
          context,
        });
      }
    }

    // Detect weather modalities
    for (const pattern of this.weatherPatterns) {
      if (pattern.pattern.test(text)) {
        modalities.push({
          type: pattern.type,
          value: pattern.value,
          confidence: 0.75,
          context: this.extractContext(text, pattern.pattern),
        });
      }
    }

    // Detect motion modalities
    for (const pattern of this.motionPatterns) {
      if (pattern.pattern.test(text)) {
        modalities.push({
          type: pattern.type,
          value: pattern.value,
          confidence: 0.75,
          context: this.extractContext(text, pattern.pattern),
        });
      }
    }

    // Detect position modalities
    for (const pattern of this.positionPatterns) {
      if (pattern.pattern.test(text)) {
        modalities.push({
          type: pattern.type,
          value: pattern.value,
          confidence: 0.75,
          context: this.extractContext(text, pattern.pattern),
        });
      }
    }

    // Detect eating modalities
    for (const pattern of this.eatingPatterns) {
      if (pattern.pattern.test(text)) {
        modalities.push({
          type: pattern.type,
          value: pattern.value,
          confidence: 0.75,
          context: this.extractContext(text, pattern.pattern),
        });
      }
    }

    // Detect emotional modalities
    for (const pattern of this.emotionalPatterns) {
      if (pattern.pattern.test(text)) {
        modalities.push({
          type: pattern.type,
          value: pattern.value,
          confidence: 0.75,
          context: this.extractContext(text, pattern.pattern),
        });
      }
    }

    // Remove duplicates
    return this.deduplicateModalities(modalities);
  }

  /**
   * Extract context around a match
   */
  private extractContext(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    if (!match || !match.index) return text.substring(0, 100);

    const start = Math.max(0, match.index - 50);
    const end = Math.min(text.length, match.index + match[0].length + 50);
    return text.substring(start, end);
  }

  /**
   * Extract linked symptom from context
   */
  private extractLinkedSymptom(context: string): string | undefined {
    // Try to find symptom words near the modality
    const symptomKeywords = [
      'pain', 'headache', 'ache', 'discomfort', 'symptom',
      'feeling', 'sensation', 'problem', 'issue', 'complaint',
    ];

    for (const keyword of symptomKeywords) {
      if (context.toLowerCase().includes(keyword)) {
        // Extract a few words around the keyword
        const index = context.toLowerCase().indexOf(keyword);
        const start = Math.max(0, index - 20);
        const end = Math.min(context.length, index + keyword.length + 20);
        return context.substring(start, end).trim();
      }
    }

    return undefined;
  }

  /**
   * Extract better value from context
   */
  private extractBetterValue(context: string): string {
    // Look for what makes it better
    const betterWithPatterns = [
      /\b(better with|relieved by|improved by)\s+([^.]+)/i,
      /\b(better)\s+([^.]+)/i,
    ];

    for (const pattern of betterWithPatterns) {
      const match = context.match(pattern);
      if (match && match[2]) {
        return match[2].trim();
      }
    }

    return 'general improvement';
  }

  /**
   * Extract worse value from context
   */
  private extractWorseValue(context: string): string {
    // Look for what makes it worse
    const worseWithPatterns = [
      /\b(worse with|aggravated by|increased by)\s+([^.]+)/i,
      /\b(worse)\s+([^.]+)/i,
    ];

    for (const pattern of worseWithPatterns) {
      const match = context.match(pattern);
      if (match && match[2]) {
        return match[2].trim();
      }
    }

    return 'general aggravation';
  }

  /**
   * Remove duplicate modalities
   */
  private deduplicateModalities(modalities: Modality[]): Modality[] {
    const seen = new Set<string>();
    const unique: Modality[] = [];

    for (const modality of modalities) {
      const key = `${modality.type}_${modality.value}_${modality.linkedSymptom || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(modality);
      }
    }

    return unique;
  }
}

export default ModalityDetectionService;
