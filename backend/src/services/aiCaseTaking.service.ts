/**
 * AI Case Taking Service
 * 
 * Main service for AI-powered case taking features
 * Orchestrates symptom extraction and related services
 * Uses NLP extraction with keyword fallback
 */

import SymptomExtractionService, { ExtractionResult, ExtractedSymptom } from './symptomExtraction.service.js';
import NLPSymptomExtractionService from './nlpSymptomExtraction.service.js';
import ModalityDetectionService from './modalityDetection.service.js';
import MetaAttributeExtractionService from './metaAttributeExtraction.service.js';

export interface ExtractSymptomsRequest {
  text: string;
  language?: string;
  useNLP?: boolean; // Option to force NLP or keyword extraction
}

export interface ExtractSymptomsResponse {
  success: boolean;
  data: ExtractionResult & {
    entities?: Array<{
      type: string;
      text: string;
      confidence: number;
    }>;
    modalities?: Array<{
      type: string;
      value: string;
      linkedSymptom?: string;
      confidence: number;
    }>;
    metaAttributes?: {
      intensity?: string;
      duration?: string;
      frequency?: string;
      peculiarity?: number;
    };
    extractionMethod?: 'nlp' | 'keyword' | 'hybrid';
  };
  message?: string;
}

export class AICaseTakingService {
  private symptomExtractionService: SymptomExtractionService;
  private nlpExtractionService: NLPSymptomExtractionService;
  private modalityDetectionService: ModalityDetectionService;
  private metaAttributeService: MetaAttributeExtractionService;

  constructor() {
    this.symptomExtractionService = new SymptomExtractionService();
    this.nlpExtractionService = new NLPSymptomExtractionService();
    this.modalityDetectionService = new ModalityDetectionService();
    this.metaAttributeService = new MetaAttributeExtractionService();
  }

  /**
   * Extract symptoms from free text
   * Uses NLP if available, falls back to keyword extraction
   */
  async extractSymptoms(
    request: ExtractSymptomsRequest
  ): Promise<ExtractSymptomsResponse> {
    try {
      const { text, language = 'en', useNLP } = request;

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          data: {
            symptoms: [],
            overallConfidence: 0,
            extractedCount: 0,
            totalTextLength: 0,
          },
          message: 'No text provided',
        };
      }

      // Check if NLP is available and requested
      const nlpAvailable = await this.nlpExtractionService.isAvailable();
      const shouldUseNLP = useNLP !== false && nlpAvailable;

      if (shouldUseNLP) {
        try {
          // Use NLP extraction
          const nlpResult = await this.nlpExtractionService.extractWithNLP(text, language);
          
          // Convert NLP symptoms to ExtractedSymptom format
          const symptoms: ExtractedSymptom[] = nlpResult.symptoms.map((s) => ({
            symptomCode: this.generateSymptomCode(s.name),
            symptomName: s.name,
            category: s.category,
            confidence: this.mapConfidenceToLevel(s.confidence),
            location: s.location,
            sensation: s.sensation,
            context: s.context,
          }));

          // Extract modalities and meta-attributes using rule-based services
          const modalities = this.modalityDetectionService.detectModalities(text);
          const metaAttributes = this.metaAttributeService.extractMetaAttributes(text);

          // Merge meta-attributes from NLP if available
          if (nlpResult.metaAttributes) {
            Object.assign(metaAttributes, nlpResult.metaAttributes);
          }

          return {
            success: true,
            data: {
              symptoms,
              overallConfidence: this.calculateOverallConfidence(symptoms),
              extractedCount: symptoms.length,
              totalTextLength: text.length,
              entities: nlpResult.entities.map((e) => ({
                type: e.type,
                text: e.text,
                confidence: e.confidence,
              })),
              modalities: modalities.map((m) => ({
                type: m.type,
                value: m.value,
                linkedSymptom: m.linkedSymptom,
                confidence: m.confidence,
              })),
              metaAttributes: {
                intensity: metaAttributes.intensity,
                duration: metaAttributes.duration,
                frequency: metaAttributes.frequency,
                peculiarity: metaAttributes.peculiarity,
              },
              extractionMethod: 'nlp',
            },
          };
        } catch (nlpError: any) {
          console.warn('[AICaseTakingService] NLP extraction failed, falling back to keyword extraction:', nlpError.message);
          // Fall through to keyword extraction
        }
      }

      // Fallback to keyword extraction
      const keywordResult = await this.symptomExtractionService.extractSymptomsFromText(
        text,
        language
      );

      // Enhance with modalities and meta-attributes
      const modalities = this.modalityDetectionService.detectModalities(text);
      const metaAttributes = this.metaAttributeService.extractMetaAttributes(text);

      return {
        success: true,
        data: {
          ...keywordResult,
          modalities: modalities.map((m) => ({
            type: m.type,
            value: m.value,
            linkedSymptom: m.linkedSymptom,
            confidence: m.confidence,
          })),
          metaAttributes: {
            intensity: metaAttributes.intensity,
            duration: metaAttributes.duration,
            frequency: metaAttributes.frequency,
            peculiarity: metaAttributes.peculiarity,
          },
          extractionMethod: 'keyword',
        },
      };
    } catch (error: any) {
      console.error('[AICaseTakingService] Error extracting symptoms:', error);
      throw new Error(`Failed to extract symptoms: ${error.message}`);
    }
  }

  /**
   * Generate a temporary symptom code
   */
  private generateSymptomCode(name: string): string {
    return `temp_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
  }

  /**
   * Map confidence score (0-1) to confidence level
   */
  private mapConfidenceToLevel(confidence: number): 'exact' | 'high' | 'medium' | 'low' {
    if (confidence >= 0.9) return 'exact';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate overall confidence from symptoms
   */
  private calculateOverallConfidence(symptoms: ExtractedSymptom[]): number {
    if (symptoms.length === 0) return 0;

    const scores = { exact: 100, high: 80, medium: 60, low: 40 };
    const total = symptoms.reduce((sum, s) => sum + scores[s.confidence], 0);
    return Math.round(total / symptoms.length);
  }
}

export default AICaseTakingService;
