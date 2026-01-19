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
   * 
   * Uses text-based matching when linkedSymptoms is empty (for OOREP data)
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

    // Get all symptom texts for text-based matching (use symptomName since symptomText doesn't exist in NormalizedCaseProfile)
    const allSymptomTexts = [
      ...(normalizedCase.mental || []).map((s) => s.symptomName?.toLowerCase() || '').filter(Boolean),
      ...(normalizedCase.generals || []).map((s) => s.symptomName?.toLowerCase() || '').filter(Boolean),
      ...(normalizedCase.particulars || []).map((s) => s.symptomName?.toLowerCase() || '').filter(Boolean),
      ...(normalizedCase.modalities || []).map((s) => s.symptomName?.toLowerCase() || '').filter(Boolean),
    ].filter(text => text && text.length > 0);

    // Step 3.1: Try to find rubrics by linkedSymptoms first
    let rubrics = await Rubric.find({
      linkedSymptoms: { $in: allSymptomCodes, $ne: [], $exists: true },
      modality: 'classical_homeopathy',
    }).lean();

    // Step 3.1b: If no rubrics found by linkedSymptoms, use text-based matching
    // This handles OOREP data where linkedSymptoms might be empty
    // Only use publicum (English) repertory - no German fallback
    if (rubrics.length === 0 && allSymptomTexts.length > 0) {
      // Direct English-to-English matching for publicum repertory
      // Limit to first 50 symptoms to avoid query performance issues
      const symptomsToSearch = allSymptomTexts
        .filter(text => text && text.length >= 2)
        .slice(0, 50); // Limit to 50 symptoms to avoid MongoDB query limits
      
      const englishPatterns = symptomsToSearch.map(text => {
        const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escaped, 'i');
      });

      if (englishPatterns.length > 0) {
        // Split into batches if too many patterns (MongoDB $or limit)
        const batchSize = 50; // MongoDB $or typically handles 50-100 conditions well
        const batches: Array<Array<{ rubricText: RegExp }>> = [];
        
        for (let i = 0; i < englishPatterns.length; i += batchSize) {
          const batch = englishPatterns.slice(i, i + batchSize);
          batches.push(batch.map(pattern => ({ rubricText: pattern })));
        }

        // Query each batch and combine results
        const rubricResults: any[] = [];
        for (const batch of batches) {
          const batchResults = await Rubric.find({
            modality: 'classical_homeopathy',
            repertoryType: 'publicum',
            $or: batch
          }).limit(300).lean();
          rubricResults.push(...batchResults);
        }

        // Remove duplicates by _id
        const uniqueRubrics = new Map<string, any>();
        for (const rubric of rubricResults) {
          if (!uniqueRubrics.has(rubric._id.toString())) {
            uniqueRubrics.set(rubric._id.toString(), rubric);
          }
        }
        rubrics = Array.from(uniqueRubrics.values());

        if (rubrics.length > 0) {
          console.log(`[RubricMapping] Found ${rubrics.length} English rubrics in 'publicum' repertory`);
        } else {
          console.log(`[RubricMapping] No English rubrics found in 'publicum' repertory for given symptoms`);
        }
      }
    }

    // Step 3.2: Score rubrics based on symptom matches
    const scoredRubrics = rubrics.map((rubric) => {
      let matchedSymptoms: string[] = [];
      let confidence = 0;

      // Method 1: Match by linkedSymptoms (if available)
      if (rubric.linkedSymptoms && rubric.linkedSymptoms.length > 0) {
        matchedSymptoms = rubric.linkedSymptoms.filter((code) =>
          allSymptomCodes.includes(code)
        );
        const matchRatio = matchedSymptoms.length / rubric.linkedSymptoms.length;
        confidence = Math.min(matchRatio * 100, 100);
      } else {
        // Method 2: Match by text similarity (English-to-English for publicum)
        const rubricTextLower = (rubric.rubricText || '').toLowerCase();
        const matchedTexts: string[] = [];
        const matchedCodes: string[] = [];
        const matchStrengths: number[] = [];

        // Direct English-to-English matching (publicum repertory only)
        allSymptomTexts.forEach((symptomText, idx) => {
          if (!symptomText) return;
          
          const symptomLower = symptomText.toLowerCase();
          let maxMatchStrength = 0;
          
          // Direct English-to-English matching for publicum repertory
          // Exact match = 100% strength
          if (rubricTextLower === symptomLower) {
            maxMatchStrength = Math.max(maxMatchStrength, 100);
          }
          // Word boundary match = 90% strength
          else if (new RegExp(`\\b${symptomLower}\\b`, 'i').test(rubricTextLower)) {
            maxMatchStrength = Math.max(maxMatchStrength, 90);
          }
          // Contains match = 70% strength
          else if (rubricTextLower.includes(symptomLower)) {
            maxMatchStrength = Math.max(maxMatchStrength, 70);
          }
          // Partial match (for compound words) = 50% strength
          else if (symptomLower.length > 4 && rubricTextLower.includes(symptomLower.substring(0, 4))) {
            maxMatchStrength = Math.max(maxMatchStrength, 50);
          }
          
          // If match found, add to matched symptoms
          if (maxMatchStrength >= 30) {
            matchedTexts.push(symptomText);
            if (allSymptomCodes[idx]) {
              matchedCodes.push(allSymptomCodes[idx]);
              matchStrengths.push(maxMatchStrength);
            }
          }
        });

        matchedSymptoms = matchedCodes;

        // Calculate confidence: average of match strengths, weighted by number of matches
        if (matchStrengths.length > 0) {
          const avgStrength = matchStrengths.reduce((sum, s) => sum + s, 0) / matchStrengths.length;
          const matchRatio = matchStrengths.length / allSymptomTexts.length;
          
          // Confidence = average match strength * ratio of symptoms matched
          confidence = avgStrength * matchRatio;
          
          // Boost confidence if multiple symptoms match well
          if (matchStrengths.length > 1 && avgStrength > 50) {
            confidence = Math.min(confidence * 1.2, 100);
          }
        }
      }

      return {
        rubricId: rubric._id,
        rubricText: rubric.rubricText,
        repertoryType: rubric.repertoryType,
        chapter: rubric.chapter,
        matchedSymptoms: matchedSymptoms.filter(code => code), // Remove empty strings
        autoSelected: confidence >= 30, // Lower threshold (30%) for text-based matching to handle German/English mismatch
        confidence: Math.min(confidence, 100),
      };
    }).filter(r => r.matchedSymptoms.length > 0); // Only return rubrics with matches

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
