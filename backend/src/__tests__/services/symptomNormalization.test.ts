/**
 * Unit Tests: Symptom Normalization Engine Service
 * 
 * Tests for symptom text normalization and synonym matching
 */

import SymptomNormalizationEngine from '../../services/symptomNormalization.service.js';
import {
  createTestSymptoms,
  cleanupTestData,
} from '../utils/testHelpers.js';

describe('Symptom Normalization Engine Service', () => {
  let normalizationEngine: SymptomNormalizationEngine;

  beforeAll(async () => {
    await createTestSymptoms();
    normalizationEngine = new SymptomNormalizationEngine();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('normalizeSymptomText', () => {
    it('should normalize by exact code match', async () => {
      const result = await normalizationEngine.normalizeSymptomText('SYM_FEVER_001');
      
      expect(result.symptomCode).toBe('SYM_FEVER_001');
      expect(result.symptomName).toBe('High Fever');
      expect(result.confidence).toBe('exact');
    });

    it('should normalize by exact name match', async () => {
      const result = await normalizationEngine.normalizeSymptomText('Anxiety');
      
      expect(result.symptomCode).toBe('SYM_ANXIETY_001');
      expect(result.symptomName).toBe('Anxiety');
      expect(result.confidence).toBe('exact');
    });

    it('should normalize by synonym match', async () => {
      const result = await normalizationEngine.normalizeSymptomText('Fever');
      
      expect(result.symptomCode).toBe('SYM_FEVER_001');
      expect(result.symptomName).toBe('High Fever');
      expect(result.confidence).toBe('high');
    });

    it('should normalize by fuzzy match', async () => {
      const result = await normalizationEngine.normalizeSymptomText('anxiet');
      
      expect(result.confidence).toBe('medium');
      expect(result.symptomName).toBeDefined();
    });

    it('should return low confidence for unknown symptoms', async () => {
      const result = await normalizationEngine.normalizeSymptomText('Unknown Symptom XYZ');
      
      expect(result.confidence).toBe('low');
      expect(result.symptomCode).toContain('UNKNOWN_');
      expect(result.symptomName).toBe('Unknown Symptom XYZ');
    });

    it('should filter by category when provided', async () => {
      const result = await normalizationEngine.normalizeSymptomText('Anxiety', 'mental');
      
      expect(result.symptomCode).toBe('SYM_ANXIETY_001');
      expect(result.confidence).toBe('exact');
    });
  });

  describe('normalizeSymptomVector', () => {
    it('should normalize multiple symptoms', async () => {
      const symptoms = [
        { text: 'Anxiety', category: 'mental' as const },
        { text: 'High Fever', category: 'general' as const },
        { text: 'Throbbing Headache', category: 'particular' as const },
      ];

      const results = await normalizationEngine.normalizeSymptomVector(symptoms);

      expect(results).toHaveLength(3);
      expect(results[0].symptomCode).toBe('SYM_ANXIETY_001');
      expect(results[1].symptomCode).toBe('SYM_FEVER_001');
      expect(results[2].symptomCode).toBe('SYM_HEADACHE_001');
    });

    it('should handle empty array', async () => {
      const results = await normalizationEngine.normalizeSymptomVector([]);
      expect(results).toHaveLength(0);
    });
  });
});
