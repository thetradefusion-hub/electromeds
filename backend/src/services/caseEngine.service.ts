/**
 * Case Engine Service
 * 
 * Purpose: Accept structured case and return normalized case profile
 * 
 * This service normalizes symptoms by category and determines case type (acute/chronic)
 * ENHANCED: Now uses configurable weights from ruleEngineConfig
 */

import Symptom from '../models/Symptom.model.js';
import ruleEngineConfig from '../config/ruleEngine.config.js';

export interface StructuredCase {
  mental: Array<{
    symptomCode?: string;
    symptomText: string; // Free text or code
    weight?: number;
  }>;
  generals: Array<{
    symptomCode?: string;
    symptomText: string;
    weight?: number;
  }>;
  particulars: Array<{
    symptomCode?: string;
    symptomText: string;
    location?: string;
    sensation?: string;
    weight?: number;
  }>;
  modalities: Array<{
    symptomCode?: string;
    symptomText: string;
    type: 'better' | 'worse';
    weight?: number;
  }>;
  pathologyTags: string[]; // ["Acute", "Chronic", "Fever", etc.]
}

export interface NormalizedCaseProfile {
  mental: Array<{
    symptomCode: string;
    symptomName: string;
    category: 'mental';
    weight: number; // Default: 3
  }>;
  generals: Array<{
    symptomCode: string;
    symptomName: string;
    category: 'general';
    weight: number; // Default: 2
  }>;
  particulars: Array<{
    symptomCode: string;
    symptomName: string;
    category: 'particular';
    location?: string;
    sensation?: string;
    weight: number; // Default: 1
  }>;
  modalities: Array<{
    symptomCode: string;
    symptomName: string;
    category: 'modality';
    type: 'better' | 'worse';
    weight: number; // Default: 1.5
  }>;
  pathologyTags: string[];
  isAcute: boolean;
  isChronic: boolean;
}

export class CaseEngine {
  /**
   * Normalize structured case to normalized case profile
   */
  async normalizeCase(structuredCase: StructuredCase): Promise<NormalizedCaseProfile> {
    try {
      console.log('[CaseEngine] Normalizing case...', {
        mental: structuredCase.mental?.length || 0,
        generals: structuredCase.generals?.length || 0,
        particulars: structuredCase.particulars?.length || 0,
        modalities: structuredCase.modalities?.length || 0,
      });

      // Ensure arrays exist
      const mental = structuredCase.mental || [];
      const generals = structuredCase.generals || [];
      const particulars = structuredCase.particulars || [];
      const modalities = structuredCase.modalities || [];
      const pathologyTags = structuredCase.pathologyTags || [];

      // Step 1.1: Normalize mental symptoms
      const normalizedMental = await Promise.all(
        mental.map(async (symptom) => {
        const normalized = await this.normalizeSymptom(symptom.symptomText, 'mental');
        return {
          symptomCode: normalized.code,
          symptomName: normalized.name,
          category: 'mental' as const,
          weight: symptom.weight || ruleEngineConfig.scoring.weights.mental,
        };
      })
    );

      // Step 1.2: Normalize general symptoms
      const normalizedGenerals = await Promise.all(
        generals.map(async (symptom) => {
        const normalized = await this.normalizeSymptom(symptom.symptomText, 'general');
        return {
          symptomCode: normalized.code,
          symptomName: normalized.name,
          category: 'general' as const,
          weight: symptom.weight || ruleEngineConfig.scoring.weights.generals,
        };
      })
    );

      // Step 1.3: Normalize particular symptoms
      const normalizedParticulars = await Promise.all(
        particulars.map(async (symptom) => {
        const normalized = await this.normalizeSymptom(symptom.symptomText, 'particular');
        return {
          symptomCode: normalized.code,
          symptomName: normalized.name,
          category: 'particular' as const,
          location: symptom.location,
          sensation: symptom.sensation,
          weight: symptom.weight || 1, // Default weight for particulars
        };
      })
    );

      // Step 1.4: Normalize modalities
      const normalizedModalities = await Promise.all(
        modalities.map(async (modality) => {
        const normalized = await this.normalizeSymptom(modality.symptomText, 'modality');
        return {
          symptomCode: normalized.code,
          symptomName: normalized.name,
          category: 'modality' as const,
          type: modality.type,
          weight: modality.weight || ruleEngineConfig.scoring.weights.modalities,
        };
      })
    );

      // Step 1.5: Determine case type
      const isAcute =
        pathologyTags.includes('Acute') ||
        pathologyTags.some((tag) => ['Fever', 'Injury', 'Sudden'].includes(tag));
      const isChronic = pathologyTags.includes('Chronic');

      console.log('[CaseEngine] Normalization complete:', {
        mental: normalizedMental.length,
        generals: normalizedGenerals.length,
        particulars: normalizedParticulars.length,
        modalities: normalizedModalities.length,
        isAcute,
        isChronic,
      });

      return {
        mental: normalizedMental,
        generals: normalizedGenerals,
        particulars: normalizedParticulars,
        modalities: normalizedModalities,
        pathologyTags,
        isAcute,
        isChronic,
      };
    } catch (error: any) {
      console.error('[CaseEngine] Error normalizing case:', error);
      console.error('[CaseEngine] Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Normalize individual symptom text to symptom code and name
   */
  private async normalizeSymptom(
    symptomText: string,
    category: 'mental' | 'general' | 'particular' | 'modality'
  ): Promise<{ code: string; name: string }> {
    // If already a code, fetch from DB
    if (symptomText.startsWith('SYM_')) {
      const symptom = await Symptom.findOne({ code: symptomText });
      if (symptom) {
        return { code: symptom.code, name: symptom.name };
      }
    }

    // Search by name or synonym
    const symptom = await Symptom.findOne({
      $or: [{ name: { $regex: symptomText, $options: 'i' } }, { synonyms: { $in: [symptomText] } }],
      category,
      modality: 'classical_homeopathy',
    });

    if (symptom) {
      return { code: symptom.code, name: symptom.name };
    }

    // If not found, return as-is (will be handled by Symptom Normalization Engine)
    return { code: `TEMP_${Date.now()}`, name: symptomText };
  }
}

export default CaseEngine;
