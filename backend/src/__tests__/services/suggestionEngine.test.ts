/**
 * Unit Tests: Suggestion Engine Service
 * 
 * Tests for final suggestion generation with reasoning
 */

import SuggestionEngine from '../../services/suggestionEngine.service.js';
import type { NormalizedCaseProfile } from '../../services/caseEngine.service.js';
import type { SafetyCheckedRemedy } from '../../services/contradictionEngine.service.js';
import {
  createTestRemedies,
  cleanupTestData,
} from '../utils/testHelpers.js';
import mongoose from 'mongoose';

describe('Suggestion Engine Service', () => {
  let suggestionEngine: SuggestionEngine;
  let testRemedies: any[];

  beforeAll(async () => {
    testRemedies = await createTestRemedies();
    suggestionEngine = new SuggestionEngine();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions from safety-checked remedies', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [
          {
            symptomCode: 'SYM_ANXIETY_001',
            symptomName: 'Anxiety',
            category: 'mental',
            weight: 3,
          },
        ],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: ['Acute'],
        isAcute: true,
        isChronic: false,
      };

      const safetyChecked: SafetyCheckedRemedy[] = [
        {
          remedy: {
            remedyId: testRemedies[0]._id,
            remedyName: testRemedies[0].name,
            baseScore: 50,
            finalScore: 50,
            constitutionBonus: 5,
            modalityBonus: 0,
            pathologySupport: 10,
            keynoteBonus: 0,
            coverageBonus: 0,
            contradictionPenalty: 0,
            matchedRubrics: ['RUBRIC_1'],
            matchedSymptoms: ['SYM_ANXIETY_001'],
            confidence: 'high',
          },
          warnings: [],
          penalty: 0,
        },
        {
          remedy: {
            remedyId: testRemedies[1]._id,
            remedyName: testRemedies[1].name,
            baseScore: 40,
            finalScore: 40,
            constitutionBonus: 3,
            modalityBonus: 0,
            pathologySupport: 5,
            keynoteBonus: 0,
            coverageBonus: 0,
            contradictionPenalty: 0,
            matchedRubrics: ['RUBRIC_2'],
            matchedSymptoms: ['SYM_ANXIETY_001'],
            confidence: 'medium',
          },
          warnings: [],
          penalty: 0,
        },
      ];

      const suggestions = await suggestionEngine.generateSuggestions(safetyChecked, normalizedCase);

      expect(suggestions.topRemedies.length).toBeGreaterThan(0);
      expect(suggestions.topRemedies.length).toBeLessThanOrEqual(10);
      expect(suggestions.summary).toHaveProperty('totalRemedies');
      expect(suggestions.summary).toHaveProperty('highConfidence');
      expect(suggestions.summary).toHaveProperty('warnings');
    });

    it('should sort remedies by final score', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const safetyChecked: SafetyCheckedRemedy[] = [
        {
          remedy: {
            remedyId: testRemedies[1]._id,
            remedyName: testRemedies[1].name,
            baseScore: 40,
            finalScore: 40,
            constitutionBonus: 0,
            modalityBonus: 0,
            pathologySupport: 0,
            keynoteBonus: 0,
            coverageBonus: 0,
            contradictionPenalty: 0,
            matchedRubrics: [],
            matchedSymptoms: [],
            confidence: 'medium',
          },
          warnings: [],
          penalty: 0,
        },
        {
          remedy: {
            remedyId: testRemedies[0]._id,
            remedyName: testRemedies[0].name,
            baseScore: 50,
            finalScore: 50,
            constitutionBonus: 0,
            modalityBonus: 0,
          pathologySupport: 0,
          keynoteBonus: 0,
          coverageBonus: 0,
          contradictionPenalty: 0,
          matchedRubrics: [],
          matchedSymptoms: [],
          confidence: 'high',
          },
          warnings: [],
          penalty: 0,
        },
      ];

      const suggestions = await suggestionEngine.generateSuggestions(safetyChecked, normalizedCase);

      expect(suggestions.topRemedies.length).toBe(2);
      // First remedy should have higher score
      expect(suggestions.topRemedies[0].matchScore).toBeGreaterThanOrEqual(
        suggestions.topRemedies[1].matchScore
      );
    });

    it('should include clinical reasoning', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [
          {
            symptomCode: 'SYM_ANXIETY_001',
            symptomName: 'Anxiety',
            category: 'mental',
            weight: 3,
          },
        ],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: ['Acute'],
        isAcute: true,
        isChronic: false,
      };

      const safetyChecked: SafetyCheckedRemedy[] = [
        {
          remedy: {
            remedyId: testRemedies[0]._id,
            remedyName: testRemedies[0].name,
            baseScore: 50,
            finalScore: 50,
            constitutionBonus: 5,
            modalityBonus: 0,
            pathologySupport: 10,
            keynoteBonus: 0,
            coverageBonus: 0,
            contradictionPenalty: 0,
            matchedRubrics: ['RUBRIC_1'],
            matchedSymptoms: ['SYM_ANXIETY_001'],
            confidence: 'high',
          },
          warnings: [],
          penalty: 0,
        },
      ];

      const suggestions = await suggestionEngine.generateSuggestions(safetyChecked, normalizedCase);

      expect(suggestions.topRemedies[0].clinicalReasoning).toBeDefined();
      expect(suggestions.topRemedies[0].clinicalReasoning.length).toBeGreaterThan(0);
    });

    it('should suggest appropriate potency', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: ['Acute'],
        isAcute: true,
        isChronic: false,
      };

      const safetyChecked: SafetyCheckedRemedy[] = [
        {
          remedy: {
            remedyId: testRemedies[0]._id,
            remedyName: testRemedies[0].name,
            baseScore: 50,
            finalScore: 50,
            constitutionBonus: 0,
            modalityBonus: 0,
          pathologySupport: 0,
          keynoteBonus: 0,
          coverageBonus: 0,
          contradictionPenalty: 0,
          matchedRubrics: [],
          matchedSymptoms: [],
          confidence: 'high',
          },
          warnings: [],
          penalty: 0,
        },
      ];

      const suggestions = await suggestionEngine.generateSuggestions(safetyChecked, normalizedCase);

      expect(suggestions.topRemedies[0].suggestedPotency).toBeDefined();
      expect(['6C', '30C', '200C', '1M']).toContain(suggestions.topRemedies[0].suggestedPotency);
      expect(suggestions.topRemedies[0].repetition).toBeDefined();
    });

    it('should include warnings in suggestions', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const safetyChecked: SafetyCheckedRemedy[] = [
        {
          remedy: {
            remedyId: testRemedies[0]._id,
            remedyName: testRemedies[0].name,
            baseScore: 50,
            finalScore: 50,
            constitutionBonus: 0,
            modalityBonus: 0,
          pathologySupport: 0,
          keynoteBonus: 0,
          coverageBonus: 0,
          contradictionPenalty: 0,
          matchedRubrics: [],
          matchedSymptoms: [],
          confidence: 'high',
          },
          warnings: [
            {
              type: 'repetition',
              message: 'Used recently',
              severity: 'medium',
              remedyId: testRemedies[0]._id,
            },
          ],
          penalty: 10,
        },
      ];

      const suggestions = await suggestionEngine.generateSuggestions(safetyChecked, normalizedCase);

      expect(suggestions.topRemedies[0].warnings.length).toBe(1);
      expect(suggestions.topRemedies[0].warnings[0].type).toBe('repetition');
      expect(suggestions.summary.warnings).toBe(1);
    });

    it('should limit to top 10 remedies', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      // Create 15 remedies
      const safetyChecked: SafetyCheckedRemedy[] = Array.from({ length: 15 }, (_, i) => ({
        remedy: {
          remedyId: new mongoose.Types.ObjectId(),
          remedyName: `Remedy ${i}`,
          baseScore: 50 - i,
          finalScore: 50 - i,
          constitutionBonus: 0,
          modalityBonus: 0,
          pathologySupport: 0,
          keynoteBonus: 0,
          coverageBonus: 0,
          contradictionPenalty: 0,
          matchedRubrics: [],
          matchedSymptoms: [],
          confidence: 'medium',
        },
        warnings: [],
        penalty: 0,
      }));

      const suggestions = await suggestionEngine.generateSuggestions(safetyChecked, normalizedCase);

      expect(suggestions.topRemedies.length).toBe(10);
      expect(suggestions.summary.totalRemedies).toBe(15);
    });

    it('should handle empty remedy array', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const suggestions = await suggestionEngine.generateSuggestions([], normalizedCase);

      expect(suggestions.topRemedies).toHaveLength(0);
      expect(suggestions.summary.totalRemedies).toBe(0);
      expect(suggestions.summary.highConfidence).toBe(0);
      expect(suggestions.summary.warnings).toBe(0);
    });
  });
});
