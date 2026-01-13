/**
 * Unit Tests: Case Engine Service
 * 
 * Tests for case normalization and symptom categorization
 */

import CaseEngine, { type StructuredCase } from '../../services/caseEngine.service.js';
import {
  createTestSymptoms,
  createTestStructuredCase,
  cleanupTestData,
} from '../utils/testHelpers.js';

describe('Case Engine Service', () => {
  let caseEngine: CaseEngine;

  beforeAll(async () => {
    // Create test symptoms
    await createTestSymptoms();
    caseEngine = new CaseEngine();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('normalizeCase', () => {
    it('should normalize a structured case correctly', async () => {
      const structuredCase = createTestStructuredCase();
      const normalized = await caseEngine.normalizeCase(structuredCase);

      // Check structure
      expect(normalized).toHaveProperty('mental');
      expect(normalized).toHaveProperty('generals');
      expect(normalized).toHaveProperty('particulars');
      expect(normalized).toHaveProperty('modalities');
      expect(normalized).toHaveProperty('pathologyTags');

      // Check mental symptoms
      expect(normalized.mental.length).toBeGreaterThan(0);
      expect(normalized.mental[0]).toHaveProperty('symptomCode');
      expect(normalized.mental[0]).toHaveProperty('symptomName');
      expect(normalized.mental[0].category).toBe('mental');
      expect(normalized.mental[0].weight).toBe(3);

      // Check general symptoms
      expect(normalized.generals.length).toBeGreaterThan(0);
      expect(normalized.generals[0]).toHaveProperty('symptomCode');
      expect(normalized.generals[0].category).toBe('general');
      expect(normalized.generals[0].weight).toBe(2);

      // Check particular symptoms
      expect(normalized.particulars.length).toBeGreaterThan(0);
      expect(normalized.particulars[0]).toHaveProperty('location');
      expect(normalized.particulars[0]).toHaveProperty('sensation');
      expect(normalized.particulars[0].category).toBe('particular');
      expect(normalized.particulars[0].weight).toBe(1);

      // Check modalities
      expect(normalized.modalities.length).toBeGreaterThan(0);
      expect(normalized.modalities[0]).toHaveProperty('type');
      expect(normalized.modalities[0].category).toBe('modality');
      expect(normalized.modalities[0].weight).toBe(1.5);

      // Check case type detection
      expect(normalized.isAcute).toBe(true);
      expect(normalized.isChronic).toBe(false);
    });

    it('should handle empty symptoms arrays', async () => {
      const emptyCase: StructuredCase = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
      };

      const normalized = await caseEngine.normalizeCase(emptyCase);

      expect(normalized.mental).toHaveLength(0);
      expect(normalized.generals).toHaveLength(0);
      expect(normalized.particulars).toHaveLength(0);
      expect(normalized.modalities).toHaveLength(0);
      expect(normalized.isAcute).toBe(false);
      expect(normalized.isChronic).toBe(false);
    });

    it('should detect acute case from pathology tags', async () => {
      const acuteCase: StructuredCase = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: ['Acute', 'Fever', 'Sudden'],
      };

      const normalized = await caseEngine.normalizeCase(acuteCase);
      expect(normalized.isAcute).toBe(true);
    });

    it('should detect chronic case from pathology tags', async () => {
      const chronicCase: StructuredCase = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: ['Chronic', 'Long-standing'],
      };

      const normalized = await caseEngine.normalizeCase(chronicCase);
      expect(normalized.isChronic).toBe(true);
    });

    it('should use default weights when not provided', async () => {
      const caseWithoutWeights: StructuredCase = {
        mental: [{ symptomText: 'Anxiety' }],
        generals: [{ symptomText: 'High Fever' }],
        particulars: [{ symptomText: 'Throbbing Headache' }],
        modalities: [{ symptomText: 'No Thirst', type: 'worse' }],
        pathologyTags: [],
      };

      const normalized = await caseEngine.normalizeCase(caseWithoutWeights);

      expect(normalized.mental[0].weight).toBe(3); // Default mental weight
      expect(normalized.generals[0].weight).toBe(2); // Default general weight
      expect(normalized.particulars[0].weight).toBe(1); // Default particular weight
      expect(normalized.modalities[0].weight).toBe(1.5); // Default modality weight
    });
  });
});
