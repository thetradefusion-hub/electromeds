/**
 * Answer to Symptom Extraction Service
 * 
 * Converts question answers into structured symptoms
 */

import NLPSymptomExtractionService from './nlpSymptomExtraction.service.js';
import SymptomExtractionService from './symptomExtraction.service.js';

export interface QuestionAnswer {
  questionId: string;
  questionText: string;
  answer: string;
  domain: string;
  type: 'yes_no' | 'multiple_choice' | 'open_ended';
}

export interface ExtractedSymptomFromAnswer {
  symptomText: string;
  category: 'mental' | 'general' | 'particular' | 'modality';
  confidence: 'exact' | 'high' | 'medium' | 'low';
  source: string; // Question ID or text
  location?: string;
  sensation?: string;
  type?: 'better' | 'worse'; // For modalities
  weight?: number;
}

export class AnswerToSymptomService {
  private nlpService: NLPSymptomExtractionService;
  private keywordService: SymptomExtractionService;

  constructor() {
    this.nlpService = new NLPSymptomExtractionService();
    this.keywordService = new SymptomExtractionService();
  }

  /**
   * Extract symptoms from question answers
   */
  async extractSymptomsFromAnswers(
    answers: QuestionAnswer[],
    useNLP: boolean = true
  ): Promise<ExtractedSymptomFromAnswer[]> {
    const extractedSymptoms: ExtractedSymptomFromAnswer[] = [];

    for (const answer of answers) {
      // Skip empty answers
      if (!answer.answer || answer.answer.trim().length === 0) {
        console.log(`[AnswerToSymptom] Skipping empty answer for question: ${answer.questionId}`);
        continue;
      }

      // Skip "No" answers for yes/no questions (but log for debugging)
      if (answer.type === 'yes_no' && answer.answer.toLowerCase() === 'no') {
        console.log(`[AnswerToSymptom] Skipping "No" answer for question: ${answer.questionText}`);
        continue;
      }

      console.log(`[AnswerToSymptom] Processing answer for question: ${answer.questionText}, answer: ${answer.answer}`);

      // Extract symptoms from answer
      const symptoms = await this.extractFromAnswer(answer, useNLP);
      extractedSymptoms.push(...symptoms);
    }

    // Remove duplicates
    return this.deduplicateSymptoms(extractedSymptoms);
  }

  /**
   * Extract symptoms from a single answer
   */
  private async extractFromAnswer(
    answer: QuestionAnswer,
    useNLP: boolean
  ): Promise<ExtractedSymptomFromAnswer[]> {
    const symptoms: ExtractedSymptomFromAnswer[] = [];

    // For yes/no questions with "Yes", create a symptom from the question
    if (answer.type === 'yes_no' && answer.answer.toLowerCase() === 'yes') {
      const symptomText = this.formatQuestionAsSymptom(answer.questionText);
      symptoms.push({
        symptomText,
        category: this.mapDomainToCategory(answer.domain),
        confidence: 'high',
        source: answer.questionId,
        weight: this.getDefaultWeight(answer.domain),
      });
      return symptoms;
    }

    // For multiple choice, use the selected option
    if (answer.type === 'multiple_choice') {
      const symptomText = `${this.formatQuestionAsSymptom(answer.questionText)}: ${answer.answer}`;
      symptoms.push({
        symptomText,
        category: this.mapDomainToCategory(answer.domain),
        confidence: 'high',
        source: answer.questionId,
        weight: this.getDefaultWeight(answer.domain),
      });
      return symptoms;
    }

    // For open-ended, try to extract symptoms using NLP or keyword matching
    if (answer.type === 'open_ended') {
      try {
        if (useNLP && await this.nlpService.isAvailable()) {
          const nlpResult = await this.nlpService.extractWithNLP(answer.answer, 'en');
          for (const symptom of nlpResult.symptoms) {
            symptoms.push({
              symptomText: symptom.name,
              category: symptom.category,
              confidence: this.mapConfidenceToLevel(symptom.confidence),
              source: answer.questionId,
              location: symptom.location,
              sensation: symptom.sensation,
              weight: this.getDefaultWeight(answer.domain),
            });
          }
        } else {
          // Fallback to keyword extraction
          const keywordResult = await this.keywordService.extractSymptomsFromText(answer.answer);
          for (const symptom of keywordResult.symptoms) {
            symptoms.push({
              symptomText: symptom.symptomName,
              category: symptom.category,
              confidence: symptom.confidence,
              source: answer.questionId,
              location: symptom.location,
              sensation: symptom.sensation,
              weight: this.getDefaultWeight(answer.domain),
            });
          }
        }
      } catch (error) {
        console.warn('[AnswerToSymptom] Extraction failed, using simple format:', error);
        // Fallback: create symptom from answer text
        symptoms.push({
          symptomText: answer.answer,
          category: this.mapDomainToCategory(answer.domain),
          confidence: 'medium',
          source: answer.questionId,
          weight: this.getDefaultWeight(answer.domain),
        });
      }
    }

    return symptoms;
  }

  /**
   * Format question text as symptom
   */
  private formatQuestionAsSymptom(questionText: string): string {
    // Remove question words and format
    let text = questionText
      .replace(/^(do you|are you|have you|is there|what|how|when|where|why)\s+/i, '')
      .replace(/\?$/, '')
      .trim();

    // Capitalize first letter
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Map domain to symptom category
   */
  private mapDomainToCategory(domain: string): 'mental' | 'general' | 'particular' | 'modality' {
    const domainMap: Record<string, 'mental' | 'general' | 'particular' | 'modality'> = {
      mental: 'mental',
      general: 'general',
      particular: 'particular',
      modality: 'modality',
      thermal: 'general',
      sleep: 'general',
      appetite: 'general',
    };

    return domainMap[domain] || 'general';
  }

  /**
   * Get default weight for domain
   */
  private getDefaultWeight(domain: string): number {
    const weightMap: Record<string, number> = {
      mental: 3,
      general: 2,
      particular: 1,
      modality: 1.5,
      thermal: 2,
      sleep: 2,
      appetite: 2,
    };

    return weightMap[domain] || 1;
  }

  /**
   * Map confidence number to level
   */
  private mapConfidenceToLevel(confidence: number): 'exact' | 'high' | 'medium' | 'low' {
    if (confidence >= 0.9) return 'exact';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Remove duplicate symptoms
   */
  private deduplicateSymptoms(symptoms: ExtractedSymptomFromAnswer[]): ExtractedSymptomFromAnswer[] {
    const seen = new Map<string, ExtractedSymptomFromAnswer>();

    for (const symptom of symptoms) {
      const key = `${symptom.symptomText.toLowerCase()}_${symptom.category}`;
      if (!seen.has(key)) {
        seen.set(key, symptom);
      } else {
        // Keep the one with higher confidence
        const existing = seen.get(key)!;
        const confidenceOrder = { exact: 4, high: 3, medium: 2, low: 1 };
        if (confidenceOrder[symptom.confidence] > confidenceOrder[existing.confidence]) {
          seen.set(key, symptom);
        }
      }
    }

    return Array.from(seen.values());
  }
}

export default AnswerToSymptomService;
