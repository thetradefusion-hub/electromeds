/**
 * Case Completeness Analyzer Service
 * 
 * Analyzes case structure and identifies missing domains
 * Provides completeness score and suggestions for missing symptoms
 */

import { StructuredCase } from './caseEngine.service.js';
// import NLPSymptomExtractionService from './nlpSymptomExtraction.service.js';

export interface MissingDomain {
  domain: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedQuestions: string[];
}

export interface CompletenessAnalysis {
  completenessScore: number; // 0-100
  missingDomains: MissingDomain[];
  suggestions: Question[];
  strengths: string[]; // What's good about the case
  warnings: string[]; // Critical missing items
}

export interface Question {
  id: string;
  text: string;
  domain: string;
  type: 'yes_no' | 'multiple_choice' | 'open_ended';
  options?: string[]; // For multiple choice
  priority: 'high' | 'medium' | 'low';
  reasoning?: string; // Why this question is important
}

// Required domains for a complete homeopathic case
const REQUIRED_DOMAINS = {
  mental: {
    name: 'Mental Generals',
    description: 'Mental state, emotions, fears, anxieties, desires, aversions',
    priority: 'high' as const,
    minSymptoms: 1,
  },
  general: {
    name: 'Physical Generals',
    description: 'Appetite, thirst, sleep, thermal reaction, perspiration',
    priority: 'high' as const,
    minSymptoms: 2,
  },
  particular: {
    name: 'Particular Symptoms',
    description: 'Specific location with sensation',
    priority: 'medium' as const,
    minSymptoms: 1,
  },
  modality: {
    name: 'Modalities',
    description: 'Better/worse factors, time patterns, weather influences',
    priority: 'high' as const,
    minSymptoms: 2,
  },
  thermal: {
    name: 'Thermal Reaction',
    description: 'Hot or cold preference, reaction to weather',
    priority: 'high' as const,
    minSymptoms: 1,
  },
  sleep: {
    name: 'Sleep Patterns',
    description: 'Sleep quality, position, dreams, disturbances',
    priority: 'medium' as const,
    minSymptoms: 1,
  },
  appetite: {
    name: 'Appetite & Thirst',
    description: 'Hunger, thirst, food cravings, aversions',
    priority: 'high' as const,
    minSymptoms: 1,
  },
};

export class CaseCompletenessService {
  // private nlpService: NLPSymptomExtractionService;

  constructor() {
    // this.nlpService = new NLPSymptomExtractionService();
  }

  /**
   * Analyze case completeness
   */
  async analyzeCompleteness(caseData: StructuredCase): Promise<CompletenessAnalysis> {
    const missingDomains: MissingDomain[] = [];
    const suggestions: Question[] = [];
    const strengths: string[] = [];
    const warnings: string[] = [];

    // Analyze each domain
    const domainScores: Record<string, number> = {};

    // Check Mental domain
    if (caseData.mental.length === 0) {
      missingDomains.push({
        domain: 'mental',
        description: REQUIRED_DOMAINS.mental.description,
        priority: REQUIRED_DOMAINS.mental.priority,
        suggestedQuestions: this.getMentalQuestions(),
      });
      domainScores.mental = 0;
      warnings.push('No mental symptoms recorded. Mental generals are crucial for homeopathic analysis.');
    } else {
      domainScores.mental = Math.min(100, (caseData.mental.length / 3) * 100);
      strengths.push(`Good mental symptom coverage (${caseData.mental.length} symptoms)`);
    }

    // Check General domain
    if (caseData.generals.length < REQUIRED_DOMAINS.general.minSymptoms) {
      missingDomains.push({
        domain: 'general',
        description: REQUIRED_DOMAINS.general.description,
        priority: REQUIRED_DOMAINS.general.priority,
        suggestedQuestions: this.getGeneralQuestions(),
      });
      domainScores.general = Math.min(100, (caseData.generals.length / REQUIRED_DOMAINS.general.minSymptoms) * 50);
      if (caseData.generals.length === 0) {
        warnings.push('No general symptoms recorded. Physical generals are essential.');
      }
    } else {
      domainScores.general = 100;
      strengths.push(`Good general symptom coverage (${caseData.generals.length} symptoms)`);
    }

    // Check Particular domain
    if (caseData.particulars.length === 0) {
      missingDomains.push({
        domain: 'particular',
        description: REQUIRED_DOMAINS.particular.description,
        priority: REQUIRED_DOMAINS.particular.priority,
        suggestedQuestions: this.getParticularQuestions(),
      });
      domainScores.particular = 0;
    } else {
      domainScores.particular = Math.min(100, (caseData.particulars.length / 2) * 100);
      strengths.push(`Good particular symptom coverage (${caseData.particulars.length} symptoms)`);
    }

    // Check Modality domain
    if (caseData.modalities.length < REQUIRED_DOMAINS.modality.minSymptoms) {
      missingDomains.push({
        domain: 'modality',
        description: REQUIRED_DOMAINS.modality.description,
        priority: REQUIRED_DOMAINS.modality.priority,
        suggestedQuestions: this.getModalityQuestions(),
      });
      domainScores.modality = Math.min(100, (caseData.modalities.length / REQUIRED_DOMAINS.modality.minSymptoms) * 50);
      if (caseData.modalities.length === 0) {
        warnings.push('No modalities recorded. Modalities are crucial for remedy selection.');
      }
    } else {
      domainScores.modality = 100;
      strengths.push(`Good modality coverage (${caseData.modalities.length} modalities)`);
    }

    // Check for thermal reaction in generals or modalities
    const hasThermal = this.hasThermalReaction(caseData);
    if (!hasThermal) {
      missingDomains.push({
        domain: 'thermal',
        description: REQUIRED_DOMAINS.thermal.description,
        priority: REQUIRED_DOMAINS.thermal.priority,
        suggestedQuestions: this.getThermalQuestions(),
      });
      domainScores.thermal = 0;
      warnings.push('Thermal reaction not clear. Ask about hot/cold preference.');
    } else {
      domainScores.thermal = 100;
    }

    // Check for sleep patterns
    const hasSleep = this.hasSleepPatterns(caseData);
    if (!hasSleep) {
      missingDomains.push({
        domain: 'sleep',
        description: REQUIRED_DOMAINS.sleep.description,
        priority: REQUIRED_DOMAINS.sleep.priority,
        suggestedQuestions: this.getSleepQuestions(),
      });
      domainScores.sleep = 50;
    } else {
      domainScores.sleep = 100;
    }

    // Check for appetite/thirst
    const hasAppetite = this.hasAppetiteThirst(caseData);
    if (!hasAppetite) {
      missingDomains.push({
        domain: 'appetite',
        description: REQUIRED_DOMAINS.appetite.description,
        priority: REQUIRED_DOMAINS.appetite.priority,
        suggestedQuestions: this.getAppetiteQuestions(),
      });
      domainScores.appetite = 0;
      warnings.push('Appetite and thirst not recorded. These are important generals.');
    } else {
      domainScores.appetite = 100;
    }

    // Calculate overall completeness score
    const totalScore = Object.values(domainScores).reduce((sum, score) => sum + score, 0);
    const completenessScore = Math.round(totalScore / Object.keys(domainScores).length);

    // Generate smart questions for missing domains
    for (const missingDomain of missingDomains) {
      const domainQuestions = await this.generateQuestionsForDomain(missingDomain.domain, caseData);
      suggestions.push(...domainQuestions);
    }

    // Sort suggestions by priority
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return {
      completenessScore,
      missingDomains,
      suggestions,
      strengths,
      warnings,
    };
  }

  /**
   * Check if case has thermal reaction
   */
  private hasThermalReaction(caseData: StructuredCase): boolean {
    const thermalKeywords = ['hot', 'cold', 'warm', 'chilly', 'heat', 'thermal', 'temperature'];
    
    // Check in generals
    for (const general of caseData.generals) {
      if (thermalKeywords.some(keyword => general.symptomText.toLowerCase().includes(keyword))) {
        return true;
      }
    }

    // Check in modalities
    for (const modality of caseData.modalities) {
      if (thermalKeywords.some(keyword => modality.symptomText.toLowerCase().includes(keyword))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if case has sleep patterns
   */
  private hasSleepPatterns(caseData: StructuredCase): boolean {
    const sleepKeywords = ['sleep', 'insomnia', 'dream', 'sleepless', 'restless', 'snoring'];
    
    for (const general of caseData.generals) {
      if (sleepKeywords.some(keyword => general.symptomText.toLowerCase().includes(keyword))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if case has appetite/thirst
   */
  private hasAppetiteThirst(caseData: StructuredCase): boolean {
    const appetiteKeywords = ['appetite', 'hunger', 'thirst', 'craving', 'aversion', 'desire', 'eating'];
    
    for (const general of caseData.generals) {
      if (appetiteKeywords.some(keyword => general.symptomText.toLowerCase().includes(keyword))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generate smart questions for a domain
   */
  private async generateQuestionsForDomain(
    domain: string,
    _caseData: StructuredCase
  ): Promise<Question[]> {
    const questions: Question[] = [];

    switch (domain) {
      case 'mental':
        questions.push(...this.getMentalQuestions().map((q, i) => ({
          id: `mental-${i}`,
          text: q,
          domain: 'mental',
          type: 'yes_no' as const,
          priority: 'high' as const,
          reasoning: 'Mental symptoms are the highest priority in homeopathy',
        })));
        break;

      case 'general':
        questions.push(...this.getGeneralQuestions().map((q, i) => ({
          id: `general-${i}`,
          text: q,
          domain: 'general',
          type: 'yes_no' as const,
          priority: 'high' as const,
          reasoning: 'Physical generals help determine constitutional remedy',
        })));
        break;

      case 'modality':
        questions.push(...this.getModalityQuestions().map((q, i) => ({
          id: `modality-${i}`,
          text: q,
          domain: 'modality',
          type: 'yes_no' as const,
          priority: 'high' as const,
          reasoning: 'Modalities are crucial for remedy differentiation',
        })));
        break;

      case 'thermal':
        questions.push({
          id: 'thermal-1',
          text: 'Do you feel more comfortable in hot or cold weather?',
          domain: 'thermal',
          type: 'multiple_choice',
          options: ['Hot weather', 'Cold weather', 'No preference', 'Varies'],
          priority: 'high',
          reasoning: 'Thermal reaction is a key differentiator',
        });
        break;

      case 'sleep':
        questions.push(...this.getSleepQuestions().map((q, i) => ({
          id: `sleep-${i}`,
          text: q,
          domain: 'sleep',
          type: 'yes_no' as const,
          priority: 'medium' as const,
        })));
        break;

      case 'appetite':
        questions.push(...this.getAppetiteQuestions().map((q, i) => ({
          id: `appetite-${i}`,
          text: q,
          domain: 'appetite',
          type: 'yes_no' as const,
          priority: 'high' as const,
        })));
        break;
    }

    return questions;
  }

  /**
   * Get mental questions
   */
  private getMentalQuestions(): string[] {
    return [
      'Do you experience any anxiety or fear?',
      'What is your emotional state? (sad, angry, irritable, etc.)',
      'Do you prefer company or being alone?',
      'Do you have any specific fears or phobias?',
      'How is your memory and concentration?',
    ];
  }

  /**
   * Get general questions
   */
  private getGeneralQuestions(): string[] {
    return [
      'How is your appetite?',
      'How is your thirst? (increased, decreased, or normal)',
      'How is your sleep?',
      'Do you sweat? (increased, decreased, or normal)',
      'Do you feel weak or tired?',
    ];
  }

  /**
   * Get modality questions
   */
  private getModalityQuestions(): string[] {
    return [
      'What makes your symptoms better?',
      'What makes your symptoms worse?',
      'Is there a specific time when symptoms are worse? (morning, evening, night)',
      'Does weather affect your symptoms?',
      'Does motion or rest affect your symptoms?',
    ];
  }

  /**
   * Get thermal questions
   */
  private getThermalQuestions(): string[] {
    return [
      'Do you prefer hot or cold weather?',
      'Do you feel hot or cold more often?',
      'How do you react to temperature changes?',
    ];
  }

  /**
   * Get sleep questions
   */
  private getSleepQuestions(): string[] {
    return [
      'How is your sleep quality?',
      'Do you have any sleep disturbances?',
      'Do you remember your dreams?',
      'What position do you sleep in?',
    ];
  }

  /**
   * Get appetite questions
   */
  private getAppetiteQuestions(): string[] {
    return [
      'How is your appetite? (increased, decreased, or normal)',
      'How is your thirst? (increased, decreased, or normal)',
      'Do you have any food cravings?',
      'Do you have any food aversions?',
    ];
  }

  /**
   * Get particular questions
   */
  private getParticularQuestions(): string[] {
    return [
      'Where exactly is the problem located?',
      'What kind of sensation do you feel? (pain, burning, stinging, etc.)',
      'Is the problem on one side or both sides?',
    ];
  }
}

export default CaseCompletenessService;
