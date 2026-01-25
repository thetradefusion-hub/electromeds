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

export interface RubricSuggestion {
  rubricId: mongoose.Types.ObjectId | string;
  rubricText: string;
  repertoryType: string;
  chapter: string;
  matchScore: number;
  confidence: 'exact' | 'high' | 'medium' | 'low';
  relevanceScore: number; // 0-100, based on multiple factors
  isRare: boolean; // Rare rubric indicator
  matchedSymptoms: string[];
  remedyCount?: number; // Number of remedies in this rubric
  avgGrade?: number; // Average remedy grade in this rubric
  matchedText?: string; // The text that matched
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
        autoSelected: confidence >= 20, // Lower threshold (20%) to be more inclusive
        confidence: Math.min(confidence, 100),
      };
    }).filter(r => r.matchedSymptoms.length > 0); // Only return rubrics with matches

    // Step 3.3: Sort by confidence
    return scoredRubrics.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get enhanced rubric suggestions for a symptom with multiple options
   * Returns ranked rubrics with confidence, relevance, and rare detection
   */
  async suggestRubrics(
    symptomCode: string,
    symptomText?: string,
    repertoryType?: 'kent' | 'bbcr' | 'boericke' | 'synthesis' | 'publicum'
  ): Promise<RubricSuggestion[]> {
    const query: any = {
      modality: 'classical_homeopathy',
    };

    if (repertoryType) {
      query.repertoryType = repertoryType;
    } else {
      // Default to publicum (English) if not specified
      query.repertoryType = 'publicum';
    }

    // Try linkedSymptoms first (only if not a temporary code)
    let rubrics: any[] = [];
    if (symptomCode && !symptomCode.startsWith('TEMP_') && !symptomCode.startsWith('temp_')) {
      rubrics = await Rubric.find({
        ...query,
        linkedSymptoms: { $in: [symptomCode], $ne: [], $exists: true },
      }).lean();
    }

    // If no rubrics found by linkedSymptoms and symptomText provided, use text matching
    if (rubrics.length === 0 && symptomText) {
      const symptomLower = symptomText.toLowerCase().trim();
      
      // Try multiple search strategies
      const searchStrategies: Array<{ pattern: RegExp; limit: number }> = [];
      
      // Strategy 1: Exact word match (highest priority)
      const exactWord = symptomLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchStrategies.push({ pattern: new RegExp(`\\b${exactWord}\\b`, 'i'), limit: 30 });
      
      // Strategy 2: Contains match
      searchStrategies.push({ pattern: new RegExp(exactWord, 'i'), limit: 20 });
      
      // Strategy 3: Partial match (for compound words like "headache" -> "head" + "ache")
      if (symptomLower.length > 4) {
        const partial = symptomLower.substring(0, Math.min(6, symptomLower.length));
        searchStrategies.push({ pattern: new RegExp(partial, 'i'), limit: 10 });
      }
      
      // Execute searches in order until we have enough results
      const foundRubrics = new Map<string, any>();
      
      for (const strategy of searchStrategies) {
        if (foundRubrics.size >= 50) break;
        
        const results = await Rubric.find({
          ...query,
          rubricText: strategy.pattern,
        }).limit(strategy.limit).lean();
        
        results.forEach(r => {
          if (!foundRubrics.has(r._id.toString())) {
            foundRubrics.set(r._id.toString(), r);
          }
        });
      }
      
      rubrics = Array.from(foundRubrics.values());
      
      console.log(`[RubricMapping] Found ${rubrics.length} rubrics for symptom "${symptomText}" using text matching`);
    }

    // Get remedy counts for each rubric (for rarity detection)
    const RubricRemedy = (await import('../models/RubricRemedy.model.js')).default;
    const rubricIds = rubrics.map(r => r._id);
    const remedyCounts = await RubricRemedy.aggregate([
      {
        $match: {
          rubricId: { $in: rubricIds },
          repertoryType: query.repertoryType,
        },
      },
      {
        $group: {
          _id: '$rubricId',
          count: { $sum: 1 },
          avgGrade: { $avg: '$grade' },
        },
      },
    ]);

    const remedyCountMap = new Map();
    remedyCounts.forEach((item) => {
      remedyCountMap.set(item._id.toString(), {
        count: item.count,
        avgGrade: item.avgGrade || 0,
      });
    });

    // Score and rank rubrics
    const suggestions: RubricSuggestion[] = rubrics.map((rubric) => {
      const remedyInfo = remedyCountMap.get(rubric._id.toString()) || { count: 0, avgGrade: 0 };
      
      // Calculate match score
      let matchScore = 0;
      let matchedText = '';
      
      if (rubric.linkedSymptoms && rubric.linkedSymptoms.includes(symptomCode)) {
        matchScore = 100; // Exact match via linkedSymptoms
        matchedText = symptomText || symptomCode;
      } else if (symptomText) {
        const rubricTextLower = (rubric.rubricText || '').toLowerCase();
        const symptomLower = symptomText.toLowerCase();
        
        // Exact match
        if (rubricTextLower === symptomLower) {
          matchScore = 100;
          matchedText = symptomText;
        }
        // Word boundary match
        else if (new RegExp(`\\b${symptomLower}\\b`, 'i').test(rubricTextLower)) {
          matchScore = 90;
          matchedText = symptomText;
        }
        // Contains match
        else if (rubricTextLower.includes(symptomLower)) {
          matchScore = 70;
          matchedText = symptomText;
        }
        // Partial match
        else if (symptomLower.length > 4 && rubricTextLower.includes(symptomLower.substring(0, 4))) {
          matchScore = 50;
          matchedText = symptomText;
        }
      }

      // Calculate relevance score (combination of match score, remedy count, avg grade)
      let relevanceScore = matchScore;
      
      // Boost for rubrics with more remedies (more comprehensive)
      if (remedyInfo.count > 0) {
        const remedyBoost = Math.min(remedyInfo.count / 10, 10); // Max 10 point boost
        relevanceScore += remedyBoost;
      }
      
      // Boost for higher average grades (more important remedies)
      if (remedyInfo.avgGrade > 0) {
        const gradeBoost = Math.min(remedyInfo.avgGrade * 2, 10); // Max 10 point boost
        relevanceScore += gradeBoost;
      }
      
      relevanceScore = Math.min(relevanceScore, 100);

      // Determine confidence level
      let confidence: 'exact' | 'high' | 'medium' | 'low';
      if (matchScore >= 90) confidence = 'exact';
      else if (matchScore >= 70) confidence = 'high';
      else if (matchScore >= 50) confidence = 'medium';
      else confidence = 'low';

      // Detect rare rubrics (few remedies, high average grade, or specific patterns)
      const isRare = 
        remedyInfo.count > 0 && remedyInfo.count <= 3 && remedyInfo.avgGrade >= 2.5 ||
        remedyInfo.count === 0 || // No remedies = rare
        (rubric.rubricText && /peculiar|strange|rare/i.test(rubric.rubricText));

      return {
        rubricId: rubric._id,
        rubricText: rubric.rubricText,
        repertoryType: rubric.repertoryType,
        chapter: rubric.chapter,
        matchScore,
        confidence,
        relevanceScore,
        isRare,
        matchedSymptoms: rubric.linkedSymptoms || [],
        remedyCount: remedyInfo.count,
        avgGrade: remedyInfo.avgGrade,
        matchedText,
      };
    });

    // Sort by relevance score (highest first)
    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get rubric suggestions for an extracted symptom (from AI case taking)
   */
  async suggestRubricsForExtractedSymptom(
    symptom: {
      symptomCode?: string;
      symptomName: string;
      category?: string;
      location?: string;
      sensation?: string;
    },
    repertoryType?: 'kent' | 'bbcr' | 'boericke' | 'synthesis' | 'publicum'
  ): Promise<{
    rubrics: RubricSuggestion[];
    rareRubrics: RubricSuggestion[];
  }> {
    // Build search text from symptom components
    const searchTerms: string[] = [];
    
    // Primary search: symptom name (most important)
    if (symptom.symptomName) {
      searchTerms.push(symptom.symptomName);
    }
    
    // Secondary search: location + sensation (for particulars)
    if (symptom.location && symptom.sensation) {
      searchTerms.push(`${symptom.location} ${symptom.sensation}`);
    } else if (symptom.location) {
      searchTerms.push(symptom.location);
    } else if (symptom.sensation) {
      searchTerms.push(symptom.sensation);
    }
    
    // Try multiple search strategies
    const allSuggestions: RubricSuggestion[] = [];
    
    // Strategy 1: Search with full symptom name
    if (symptom.symptomName) {
      const suggestions1 = await this.suggestRubrics(
        symptom.symptomCode || '',
        symptom.symptomName,
        repertoryType || 'publicum'
      );
      allSuggestions.push(...suggestions1);
    }
    
    // Strategy 2: Search with location + sensation (if available)
    if (symptom.location && symptom.sensation) {
      const combinedText = `${symptom.location} ${symptom.sensation}`;
      const suggestions2 = await this.suggestRubrics(
        '',
        combinedText,
        repertoryType || 'publicum'
      );
      // Add only if not already present
      suggestions2.forEach(s => {
        if (!allSuggestions.find(existing => existing.rubricId.toString() === s.rubricId.toString())) {
          allSuggestions.push(s);
        }
      });
    }
    
    // Strategy 3: Search individual components if full search didn't work well
    if (allSuggestions.length < 5) {
      if (symptom.location) {
        const suggestions3 = await this.suggestRubrics('', symptom.location, repertoryType || 'publicum');
        suggestions3.forEach(s => {
          if (!allSuggestions.find(existing => existing.rubricId.toString() === s.rubricId.toString())) {
            allSuggestions.push(s);
          }
        });
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueSuggestions = new Map<string, RubricSuggestion>();
    allSuggestions.forEach(s => {
      const key = s.rubricId.toString();
      if (!uniqueSuggestions.has(key) || uniqueSuggestions.get(key)!.relevanceScore < s.relevanceScore) {
        uniqueSuggestions.set(key, s);
      }
    });
    
    const sortedSuggestions = Array.from(uniqueSuggestions.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Separate rare rubrics
    const rareRubrics = sortedSuggestions.filter(r => r.isRare);
    const regularRubrics = sortedSuggestions.filter(r => !r.isRare);

    console.log(`[RubricMapping] Found ${regularRubrics.length} regular and ${rareRubrics.length} rare rubrics for "${symptom.symptomName}"`);

    return {
      rubrics: regularRubrics.slice(0, 10), // Top 10 regular rubrics
      rareRubrics: rareRubrics.slice(0, 5), // Top 5 rare rubrics
    };
  }
}

export default RubricMappingEngine;
