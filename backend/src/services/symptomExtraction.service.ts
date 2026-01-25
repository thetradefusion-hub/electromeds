/**
 * Symptom Extraction Service
 * 
 * Purpose: Extract symptoms from free-text narrative using keyword matching
 * 
 * This service provides basic keyword-based symptom extraction for Phase 1
 * Will be enhanced with NLP in Phase 3
 */

import Symptom from '../models/Symptom.model.js';
// import SymptomNormalizationEngine from './symptomNormalization.service.js'; // Will be used in Phase 3

export interface ExtractedSymptom {
  symptomCode: string;
  symptomName: string;
  category: 'mental' | 'general' | 'particular' | 'modality';
  confidence: 'exact' | 'high' | 'medium' | 'low';
  location?: string;
  sensation?: string;
  context?: string; // Original text context
  matchedText?: string; // The text that matched
}

export interface ExtractionResult {
  symptoms: ExtractedSymptom[];
  overallConfidence: number;
  extractedCount: number;
  totalTextLength: number;
}

// Category detection keywords
const CATEGORY_KEYWORDS = {
  mental: [
    'anxiety', 'fear', 'anger', 'sadness', 'depression', 'irritability',
    'worry', 'stress', 'mood', 'emotion', 'mental', 'mind', 'thought',
    'memory', 'concentration', 'confusion', 'delusion', 'hallucination',
    'company', 'aversion', 'desire', 'alone', 'solitude'
  ],
  general: [
    'fever', 'weakness', 'fatigue', 'tiredness', 'exhaustion', 'energy',
    'appetite', 'thirst', 'hunger', 'sleep', 'insomnia', 'sweat', 'chill',
    'cold', 'heat', 'temperature', 'thermal', 'constitution', 'general'
  ],
  particular: [
    'head', 'headache', 'eye', 'ear', 'nose', 'throat', 'chest', 'heart',
    'stomach', 'abdomen', 'back', 'joint', 'knee', 'elbow', 'shoulder',
    'pain', 'ache', 'burning', 'stinging', 'throbbing', 'pulsating',
    'numbness', 'tingling', 'itching', 'rash', 'skin', 'hair', 'nail'
  ],
  modality: [
    'better', 'worse', 'aggravated', 'ameliorated', 'improved', 'relieved',
    'morning', 'evening', 'night', 'afternoon', 'day', 'night',
    'cold', 'heat', 'warm', 'cool', 'weather', 'rain', 'sun',
    'motion', 'rest', 'lying', 'sitting', 'standing', 'walking',
    'eating', 'drinking', 'before', 'after', 'during'
  ]
};

export class SymptomExtractionService {
  constructor() {
    // Normalization engine will be used in future phases
  }

  /**
   * Extract symptoms from free text using keyword matching
   */
  async extractSymptomsFromText(
    text: string,
    _language: string = 'en' // Will be used in Phase 3 for multilingual support
  ): Promise<ExtractionResult> {
    if (!text || text.trim().length === 0) {
      return {
        symptoms: [],
        overallConfidence: 0,
        extractedCount: 0,
        totalTextLength: 0,
      };
    }

    // Clean and normalize text
    const cleanedText = this.cleanText(text);
    const sentences = this.splitIntoSentences(cleanedText);
    
    const extractedSymptoms: ExtractedSymptom[] = [];
    const seenSymptoms = new Set<string>(); // Avoid duplicates

    // Process each sentence
    for (const sentence of sentences) {
      const sentenceSymptoms = await this.extractFromSentence(sentence, seenSymptoms);
      extractedSymptoms.push(...sentenceSymptoms);
    }

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(extractedSymptoms);

    return {
      symptoms: extractedSymptoms,
      overallConfidence,
      extractedCount: extractedSymptoms.length,
      totalTextLength: text.length,
    };
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/[^\w\s.,!?;:()-]/g, '') // Remove special chars except punctuation
      .trim();
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Split by sentence endings
    return text
      .split(/[.!?;]\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Extract symptoms from a single sentence
   */
  private async extractFromSentence(
    sentence: string,
    seenSymptoms: Set<string>
  ): Promise<ExtractedSymptom[]> {
    const symptoms: ExtractedSymptom[] = [];
    const lowerSentence = sentence.toLowerCase();

    // Detect category based on keywords
    const category = this.detectCategory(lowerSentence);

    // Find symptom matches in database
    const symptomMatches = await this.findSymptomMatches(sentence, category);

    for (const match of symptomMatches) {
      // Avoid duplicates
      const key = `${match.symptomCode}_${category}`;
      if (seenSymptoms.has(key)) {
        continue;
      }
      seenSymptoms.add(key);

      // Extract context and modifiers
      const context = this.extractContext(sentence, match.matchedText);
      const { location, sensation } = this.extractModifiers(sentence);

      symptoms.push({
        symptomCode: match.symptomCode,
        symptomName: match.symptomName,
        category,
        confidence: match.confidence,
        location,
        sensation,
        context,
        matchedText: match.matchedText,
      });
    }

    return symptoms;
  }

  /**
   * Detect symptom category from sentence
   */
  private detectCategory(sentence: string): 'mental' | 'general' | 'particular' | 'modality' {
    // Count keyword matches for each category
    const scores = {
      mental: 0,
      general: 0,
      particular: 0,
      modality: 0,
    };

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (sentence.includes(keyword)) {
          scores[category as keyof typeof scores]++;
        }
      }
    }

    // Return category with highest score, default to 'particular'
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return 'particular'; // Default
    }

    const maxCategory = Object.entries(scores).find(
      ([, score]) => score === maxScore
    )?.[0] as 'mental' | 'general' | 'particular' | 'modality';

    return maxCategory || 'particular';
  }

  /**
   * Find symptom matches in database
   */
  private async findSymptomMatches(
    sentence: string,
    _category: string // Will be used for category filtering in future
  ): Promise<Array<{ symptomCode: string; symptomName: string; confidence: 'exact' | 'high' | 'medium' | 'low'; matchedText: string }>> {
    const matches: Array<{ symptomCode: string; symptomName: string; confidence: 'exact' | 'high' | 'medium' | 'low'; matchedText: string }> = [];
    const lowerSentence = sentence.toLowerCase();
    const words = lowerSentence.split(/\s+/);

    // Search for symptoms matching words in sentence
    const symptomQuery = {
      modality: 'classical_homeopathy',
      isGlobal: true,
      $or: [
        { name: { $regex: lowerSentence, $options: 'i' } },
        { synonyms: { $in: words.map(w => new RegExp(w, 'i')) } },
      ],
    };

    const symptoms = await Symptom.find(symptomQuery)
      .limit(20)
      .lean();

    for (const symptom of symptoms) {
      // Check for exact match
      if (lowerSentence.includes(symptom.name.toLowerCase())) {
        matches.push({
          symptomCode: symptom.code,
          symptomName: symptom.name,
          confidence: 'exact',
          matchedText: symptom.name,
        });
        continue;
      }

      // Check for synonym match
      const synonymMatch = symptom.synonyms?.find(syn =>
        lowerSentence.includes(syn.toLowerCase())
      );
      if (synonymMatch) {
        matches.push({
          symptomCode: symptom.code,
          symptomName: symptom.name,
          confidence: 'high',
          matchedText: synonymMatch,
        });
        continue;
      }

      // Check for word match
      const wordMatch = words.find(word =>
        symptom.name.toLowerCase().includes(word) ||
        symptom.synonyms?.some(syn => syn.toLowerCase().includes(word))
      );
      if (wordMatch && wordMatch.length > 3) {
        matches.push({
          symptomCode: symptom.code,
          symptomName: symptom.name,
          confidence: 'medium',
          matchedText: wordMatch,
        });
      }
    }

    return matches;
  }

  /**
   * Extract context from sentence
   */
  private extractContext(sentence: string, matchedText: string): string {
    // Return sentence as context, or a portion around the match
    const matchIndex = sentence.toLowerCase().indexOf(matchedText.toLowerCase());
    if (matchIndex === -1) {
      return sentence.substring(0, 100); // First 100 chars
    }

    const start = Math.max(0, matchIndex - 30);
    const end = Math.min(sentence.length, matchIndex + matchedText.length + 30);
    return sentence.substring(start, end);
  }

  /**
   * Extract modifiers (location, sensation) from sentence
   */
  private extractModifiers(sentence: string): { location?: string; sensation?: string } {
    const result: { location?: string; sensation?: string } = {};

    // Common location words
    const locationKeywords = [
      'head', 'forehead', 'temple', 'eye', 'ear', 'nose', 'throat',
      'chest', 'heart', 'stomach', 'abdomen', 'back', 'spine',
      'arm', 'hand', 'leg', 'foot', 'knee', 'elbow', 'shoulder',
      'right', 'left', 'upper', 'lower', 'side'
    ];

    // Common sensation words
    const sensationKeywords = [
      'pain', 'ache', 'burning', 'stinging', 'throbbing', 'pulsating',
      'numbness', 'tingling', 'itching', 'cramping', 'sharp', 'dull',
      'pressure', 'heaviness', 'lightness'
    ];

    const lowerSentence = sentence.toLowerCase();

    // Find location
    for (const keyword of locationKeywords) {
      if (lowerSentence.includes(keyword)) {
        result.location = keyword;
        break;
      }
    }

    // Find sensation
    for (const keyword of sensationKeywords) {
      if (lowerSentence.includes(keyword)) {
        result.sensation = keyword;
        break;
      }
    }

    return result;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(symptoms: ExtractedSymptom[]): number {
    if (symptoms.length === 0) {
      return 0;
    }

    const confidenceScores = {
      exact: 100,
      high: 80,
      medium: 60,
      low: 40,
    };

    const totalScore = symptoms.reduce((sum, symptom) => {
      return sum + confidenceScores[symptom.confidence];
    }, 0);

    return Math.round(totalScore / symptoms.length);
  }
}

export default SymptomExtractionService;
