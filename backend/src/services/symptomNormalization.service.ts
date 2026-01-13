/**
 * Symptom Normalization Engine Service
 * 
 * Purpose: Map free text to standard symptom codes using synonym dictionary
 * 
 * This service handles symptom text normalization with confidence levels
 */

import Symptom from '../models/Symptom.model.js';

export interface NormalizedSymptom {
  symptomCode: string;
  symptomName: string;
  confidence: 'exact' | 'high' | 'medium' | 'low';
}

export class SymptomNormalizationEngine {
  /**
   * Normalize symptom text to standard symptom code
   */
  async normalizeSymptomText(
    symptomText: string,
    category?: 'mental' | 'general' | 'particular' | 'modality'
  ): Promise<NormalizedSymptom> {
    // Step 2.1: Exact match by code
    if (symptomText.startsWith('SYM_')) {
      const symptom = await Symptom.findOne({ code: symptomText });
      if (symptom) {
        return {
          symptomCode: symptom.code,
          symptomName: symptom.name,
          confidence: 'exact',
        };
      }
    }

    // Step 2.2: Exact match by name
    const exactMatch = await Symptom.findOne({
      name: { $regex: `^${symptomText}$`, $options: 'i' },
      ...(category && { category }),
      modality: 'classical_homeopathy',
    });

    if (exactMatch) {
      return {
        symptomCode: exactMatch.code,
        symptomName: exactMatch.name,
        confidence: 'exact',
      };
    }

    // Step 2.3: Synonym match
    const synonymMatch = await Symptom.findOne({
      synonyms: { $in: [new RegExp(symptomText, 'i')] },
      ...(category && { category }),
      modality: 'classical_homeopathy',
    });

    if (synonymMatch) {
      return {
        symptomCode: synonymMatch.code,
        symptomName: synonymMatch.name,
        confidence: 'high',
      };
    }

    // Step 2.4: Fuzzy text search
    const fuzzyMatches = await Symptom.find({
      $or: [
        { name: { $regex: symptomText, $options: 'i' } },
        { synonyms: { $regex: symptomText, $options: 'i' } },
      ],
      ...(category && { category }),
      modality: 'classical_homeopathy',
    })
      .limit(5)
      .lean();

    if (fuzzyMatches.length > 0) {
      // Return best match (exact substring match preferred)
      const bestMatch =
        fuzzyMatches.find((s) => s.name.toLowerCase().includes(symptomText.toLowerCase())) ||
        fuzzyMatches[0];

      return {
        symptomCode: bestMatch.code,
        symptomName: bestMatch.name,
        confidence: 'medium',
      };
    }

    // Step 2.5: No match found - return original text
    // (Doctor will need to confirm or create new symptom)
    return {
      symptomCode: `UNKNOWN_${Date.now()}`,
      symptomName: symptomText,
      confidence: 'low',
    };
  }

  /**
   * Normalize array of symptoms
   */
  async normalizeSymptomVector(
    symptoms: Array<{ text: string; category?: 'mental' | 'general' | 'particular' | 'modality' }>
  ): Promise<NormalizedSymptom[]> {
    return Promise.all(
      symptoms.map((symptom) =>
        this.normalizeSymptomText(symptom.text, symptom.category)
      )
    );
  }
}

export default SymptomNormalizationEngine;
