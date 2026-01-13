/**
 * Rubric Mapping Engine Service
 * 
 * Purpose: Map symptoms → relevant rubrics with auto-selection + manual confirmation
 * 
 * This service finds relevant repertory rubrics for selected symptoms
 */

import mongoose from 'mongoose';
import Rubric from '../models/Rubric.model.js';
import type { NormalizedCaseProfile } from './caseEngine.service.js';

export interface RubricMapping {
  rubricId: mongoose.Types.ObjectId;
  rubricText: string;
  repertoryType: string;
  chapter: string;
  matchedSymptoms: string[];
  autoSelected: boolean;
  confidence: number;
}

export class RubricMappingEngine {
  /**
   * Map symptoms to relevant rubrics
   */
  async mapSymptomsToRubrics(
    normalizedCase: NormalizedCaseProfile
  ): Promise<RubricMapping[]> {
    const allSymptomCodes = [
      ...normalizedCase.mental.map((s) => s.symptomCode),
      ...normalizedCase.generals.map((s) => s.symptomCode),
      ...normalizedCase.particulars.map((s) => s.symptomCode),
      ...normalizedCase.modalities.map((s) => s.symptomCode),
    ];

    // Step 3.1: Find rubrics that contain any of the symptoms
    const rubrics = await Rubric.find({
      linkedSymptoms: { $in: allSymptomCodes },
      modality: 'classical_homeopathy',
    }).lean();

    // Step 3.2: Score rubrics based on symptom matches
    const scoredRubrics = rubrics.map((rubric) => {
      const matchedSymptoms = rubric.linkedSymptoms.filter((code) =>
        allSymptomCodes.includes(code)
      );
      const matchRatio = matchedSymptoms.length / rubric.linkedSymptoms.length;
      const confidence = Math.min(matchRatio * 100, 100);

      return {
        rubricId: rubric._id,
        rubricText: rubric.rubricText,
        repertoryType: rubric.repertoryType,
        chapter: rubric.chapter,
        matchedSymptoms,
        autoSelected: confidence >= 70, // Auto-select if 70%+ match
        confidence,
      };
    });

    // Step 3.3: Sort by confidence
    return scoredRubrics.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get rubric suggestions for manual selection
   */
  async suggestRubrics(
    symptomCode: string,
    repertoryType?: 'kent' | 'bbcr' | 'boericke' | 'synthesis'
  ): Promise<Array<{
    rubricId: mongoose.Types.ObjectId;
    rubricText: string;
    chapter: string;
    matchScore: number;
  }>> {
    const query: any = {
      linkedSymptoms: symptomCode,
      modality: 'classical_homeopathy',
    };

    if (repertoryType) {
      query.repertoryType = repertoryType;
    }

    const rubrics = await Rubric.find(query).lean();

    return rubrics.map((rubric) => ({
      rubricId: rubric._id,
      rubricText: rubric.rubricText,
      chapter: rubric.chapter,
      matchScore: rubric.linkedSymptoms.length, // More symptoms = better match
    }));
  }
}

export default RubricMappingEngine;
