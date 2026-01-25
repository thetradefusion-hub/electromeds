/**
 * NLP Symptom Extraction Service
 * 
 * Uses OpenAI GPT-4 to extract symptoms, entities, and modalities from free text
 * Provides structured output with high accuracy
 */

import OpenAI from 'openai';
import AISettings from '../models/AISettings.model.js';

export interface ExtractedEntity {
  type: 'body_part' | 'sensation' | 'complaint' | 'emotion' | 'food' | 'sleep' | 'thermal' | 'discharge' | 'other';
  text: string;
  confidence: number;
  context?: string;
}

export interface ExtractedModality {
  type: 'better' | 'worse' | 'time' | 'weather' | 'motion' | 'position' | 'eating' | 'emotional';
  value: string;
  linkedSymptom?: string;
  confidence: number;
}

export interface NLPExtractionResult {
  symptoms: Array<{
    name: string;
    category: 'mental' | 'general' | 'particular' | 'modality';
    confidence: number;
    location?: string;
    sensation?: string;
    intensity?: 'mild' | 'moderate' | 'severe';
    duration?: string;
    frequency?: 'constant' | 'intermittent' | 'occasional';
    context: string;
  }>;
  entities: ExtractedEntity[];
  modalities: ExtractedModality[];
  metaAttributes: {
    intensity?: 'mild' | 'moderate' | 'severe';
    duration?: string;
    frequency?: 'constant' | 'intermittent' | 'occasional';
    peculiarity?: number; // 0-100 score
  };
}

export class NLPSymptomExtractionService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  /**
   * Initialize OpenAI client from AISettings or environment
   */
  private async initializeOpenAI(): Promise<void> {
    try {
      // Try to get API key from AISettings first
      const aiSettings = await AISettings.findOne({ isActive: true, aiProvider: 'openai' });
      
      if (aiSettings && aiSettings.apiKey) {
        this.apiKey = aiSettings.apiKey;
      } else {
        // Fallback to environment variable
        this.apiKey = process.env.OPENAI_API_KEY || null;
      }

      if (!this.apiKey) {
        console.warn('[NLPSymptomExtraction] OpenAI API key not found. NLP extraction will be disabled.');
        return;
      }

      this.openai = new OpenAI({
        apiKey: this.apiKey,
        timeout: 60000, // 60 seconds timeout for OpenAI API calls
        maxRetries: 2, // Retry up to 2 times on failure
      });
    } catch (error) {
      console.error('[NLPSymptomExtraction] Error initializing OpenAI:', error);
    }
  }

  /**
   * Check if NLP extraction is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.openai) {
      await this.initializeOpenAI();
    }
    return this.openai !== null;
  }

  /**
   * Extract symptoms, entities, and modalities using GPT-4
   */
  async extractWithNLP(text: string, _language: string = 'en'): Promise<NLPExtractionResult> {
    if (!this.openai) {
      await this.initializeOpenAI();
      if (!this.openai) {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in environment or configure in Admin Panel.');
      }
    }

    const systemPrompt = `You are a medical AI assistant specialized in homeopathic case analysis. Extract symptoms, entities, and modalities from patient case narratives.

CRITICAL REQUIREMENTS:
1. ALL symptom names, entity text, and modality values MUST be in ENGLISH only, even if the input text is in Hindi, Hinglish, or other languages.
2. Translate any non-English medical terms to standard English medical terminology.
3. Use standard homeopathic terminology that matches repertory rubrics (e.g., "headache" not "sir dard", "anxiety" not "chinta", "cold" not "thand").

Extract the following:
1. Symptoms: Medical complaints, sensations, and conditions (IN ENGLISH)
2. Entities: Body parts, sensations, emotions, food cravings, sleep patterns, thermal reactions, discharges (IN ENGLISH)
3. Modalities: Better/worse factors, time patterns, weather influences, motion/posture impacts, eating patterns, emotional triggers (IN ENGLISH)
4. Meta-attributes: Intensity (mild/moderate/severe), duration, frequency (constant/intermittent/occasional), peculiarity score (0-100)

Return structured JSON with all extracted information in ENGLISH only.`;

    const userPrompt = `Analyze the following patient case narrative and extract all symptoms, entities, modalities, and meta-attributes.

IMPORTANT: Translate all extracted terms to ENGLISH. Use standard medical and homeopathic terminology that matches repertory rubrics.

Input text:
"${text}"

Return a JSON object with this structure (ALL TEXT VALUES MUST BE IN ENGLISH):
{
  "symptoms": [
    {
      "name": "symptom name",
      "category": "mental|general|particular|modality",
      "confidence": 0.0-1.0,
      "location": "optional location",
      "sensation": "optional sensation type",
      "intensity": "mild|moderate|severe",
      "duration": "e.g., 2 weeks, 3 months",
      "frequency": "constant|intermittent|occasional",
      "context": "original text context"
    }
  ],
  "entities": [
    {
      "type": "body_part|sensation|complaint|emotion|food|sleep|thermal|discharge|other",
      "text": "entity text",
      "confidence": 0.0-1.0,
      "context": "optional context"
    }
  ],
  "modalities": [
    {
      "type": "better|worse|time|weather|motion|position|eating|emotional",
      "value": "modality value",
      "linkedSymptom": "optional linked symptom",
      "confidence": 0.0-1.0
    }
  ],
  "metaAttributes": {
    "intensity": "mild|moderate|severe",
    "duration": "overall duration",
    "frequency": "constant|intermittent|occasional",
    "peculiarity": 0-100
  }
}`;

    try {
      const response = await this.openai.chat.completions.create(
        {
          model: 'gpt-4o-mini', // Using mini for cost efficiency, can upgrade to gpt-4 if needed
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3, // Lower temperature for more consistent extraction
          max_tokens: 2000,
        },
        {
          timeout: 60000, // 60 seconds timeout
        }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as NLPExtractionResult;

      // Validate and normalize the result
      return this.validateAndNormalize(result);
    } catch (error: any) {
      console.error('[NLPSymptomExtraction] Error extracting with NLP:', error);
      throw new Error(`NLP extraction failed: ${error.message}`);
    }
  }

  /**
   * Check if text contains non-English characters (Hindi/Devanagari, etc.)
   */
  private containsNonEnglish(text: string): boolean {
    if (!text) return false;
    // Check for Devanagari script (Hindi) - Unicode range: 0900-097F
    const devanagariRegex = /[\u0900-\u097F]/;
    // Check for other common Indic scripts
    const indicRegex = /[\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/;
    return devanagariRegex.test(text) || indicRegex.test(text);
  }

  /**
   * Validate and normalize NLP extraction result
   */
  private validateAndNormalize(result: NLPExtractionResult): NLPExtractionResult {
    // Ensure all required fields exist
    if (!result.symptoms) result.symptoms = [];
    if (!result.entities) result.entities = [];
    if (!result.modalities) result.modalities = [];
    if (!result.metaAttributes) result.metaAttributes = {};

    // Filter out symptoms with non-English text
    result.symptoms = result.symptoms
      .filter((symptom) => {
        const hasNonEnglish = 
          this.containsNonEnglish(symptom.name) ||
          (symptom.location && this.containsNonEnglish(symptom.location)) ||
          (symptom.sensation && this.containsNonEnglish(symptom.sensation));
        
        if (hasNonEnglish) {
          console.warn(`[NLPSymptomExtraction] Filtered out non-English symptom: ${symptom.name}`);
        }
        return !hasNonEnglish;
      })
      .map((symptom) => ({
        ...symptom,
        category: this.validateCategory(symptom.category),
        confidence: Math.max(0, Math.min(1, symptom.confidence || 0.7)),
        // Ensure name is properly capitalized
        name: this.normalizeEnglishText(symptom.name),
        location: symptom.location ? this.normalizeEnglishText(symptom.location) : undefined,
        sensation: symptom.sensation ? this.normalizeEnglishText(symptom.sensation) : undefined,
      }));

    // Filter out entities with non-English text
    result.entities = result.entities
      .filter((entity) => {
        const hasNonEnglish = this.containsNonEnglish(entity.text);
        if (hasNonEnglish) {
          console.warn(`[NLPSymptomExtraction] Filtered out non-English entity: ${entity.text}`);
        }
        return !hasNonEnglish;
      })
      .map((entity) => ({
        ...entity,
        text: this.normalizeEnglishText(entity.text),
        confidence: Math.max(0, Math.min(1, entity.confidence || 0.7)),
      }));

    // Filter out modalities with non-English text
    result.modalities = result.modalities
      .filter((modality) => {
        const hasNonEnglish = 
          this.containsNonEnglish(modality.value) ||
          (modality.linkedSymptom && this.containsNonEnglish(modality.linkedSymptom));
        
        if (hasNonEnglish) {
          console.warn(`[NLPSymptomExtraction] Filtered out non-English modality: ${modality.value}`);
        }
        return !hasNonEnglish;
      })
      .map((modality) => ({
        ...modality,
        value: this.normalizeEnglishText(modality.value),
        linkedSymptom: modality.linkedSymptom ? this.normalizeEnglishText(modality.linkedSymptom) : undefined,
        confidence: Math.max(0, Math.min(1, modality.confidence || 0.7)),
      }));

    return result;
  }

  /**
   * Normalize English text (trim, capitalize first letter, etc.)
   */
  private normalizeEnglishText(text: string): string {
    if (!text) return text;
    // Trim whitespace
    text = text.trim();
    // Capitalize first letter
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    return text;
  }

  /**
   * Validate category
   */
  private validateCategory(category: string): 'mental' | 'general' | 'particular' | 'modality' {
    const validCategories = ['mental', 'general', 'particular', 'modality'];
    if (validCategories.includes(category)) {
      return category as 'mental' | 'general' | 'particular' | 'modality';
    }
    return 'particular'; // Default
  }
}

export default NLPSymptomExtractionService;
