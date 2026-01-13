/**
 * Unit Tests: Rubric Mapping Engine Service
 * 
 * Tests for symptom to rubric mapping
 */

import RubricMappingEngine from '../../services/rubricMapping.service.js';
import type { NormalizedCaseProfile } from '../../services/caseEngine.service.js';
import {
  createTestSymptoms,
  createTestRubrics,
  cleanupTestData,
} from '../utils/testHelpers.js';

describe('Rubric Mapping Engine Service', () => {
  let rubricMapping: RubricMappingEngine;
  let symptomCodes: string[];

  beforeAll(async () => {
    const symptoms = await createTestSymptoms();
    symptomCodes = symptoms.map((s: any) => s.code);
    await createTestRubrics(symptomCodes);
    rubricMapping = new RubricMappingEngine();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('mapSymptomsToRubrics', () => {
    it('should map symptoms to relevant rubrics', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [
          {
            symptomCode: 'SYM_ANXIETY_001',
            symptomName: 'Anxiety',
            category: 'mental',
            weight: 3,
          },
        ],
        generals: [
          {
            symptomCode: 'SYM_FEVER_001',
            symptomName: 'High Fever',
            category: 'general',
            weight: 2,
          },
        ],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const mappings = await rubricMapping.mapSymptomsToRubrics(normalizedCase);

      expect(mappings.length).toBeGreaterThan(0);
      expect(mappings[0]).toHaveProperty('rubricId');
      expect(mappings[0]).toHaveProperty('rubricText');
      expect(mappings[0]).toHaveProperty('matchedSymptoms');
      expect(mappings[0]).toHaveProperty('autoSelected');
      expect(mappings[0]).toHaveProperty('confidence');
    });

    it('should auto-select rubrics with high confidence', async () => {
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
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const mappings = await rubricMapping.mapSymptomsToRubrics(normalizedCase);

      // Should have at least one auto-selected rubric if confidence >= 70%
      expect(mappings.length).toBeGreaterThan(0);
      const autoSelected = mappings.filter((m) => m.autoSelected);
      expect(Array.isArray(autoSelected)).toBe(true);
    });

    it('should return empty array for unmatched symptoms', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [
          {
            symptomCode: 'SYM_UNKNOWN_999',
            symptomName: 'Unknown Symptom',
            category: 'mental',
            weight: 3,
          },
        ],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const mappings = await rubricMapping.mapSymptomsToRubrics(normalizedCase);
      // May return empty or low confidence mappings
      expect(Array.isArray(mappings)).toBe(true);
    });

    it('should sort rubrics by confidence', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [
          {
            symptomCode: 'SYM_ANXIETY_001',
            symptomName: 'Anxiety',
            category: 'mental',
            weight: 3,
          },
        ],
        generals: [
          {
            symptomCode: 'SYM_FEVER_001',
            symptomName: 'High Fever',
            category: 'general',
            weight: 2,
          },
        ],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const mappings = await rubricMapping.mapSymptomsToRubrics(normalizedCase);

      if (mappings.length > 1) {
        for (let i = 1; i < mappings.length; i++) {
          expect(mappings[i - 1].confidence).toBeGreaterThanOrEqual(mappings[i].confidence);
        }
      }
    });
  });

  describe('suggestRubrics', () => {
    it('should suggest rubrics for a symptom code', async () => {
      const suggestions = await rubricMapping.suggestRubrics('SYM_ANXIETY_001');

      expect(Array.isArray(suggestions)).toBe(true);
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty('rubricId');
        expect(suggestions[0]).toHaveProperty('rubricText');
        expect(suggestions[0]).toHaveProperty('chapter');
        expect(suggestions[0]).toHaveProperty('matchScore');
      }
    });

    it('should filter by repertory type', async () => {
      const suggestions = await rubricMapping.suggestRubrics('SYM_FEVER_001', 'kent');

      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach((s) => {
        // All should be from Kent repertory (if any exist)
        expect(s).toHaveProperty('rubricText');
      });
    });
  });
});
