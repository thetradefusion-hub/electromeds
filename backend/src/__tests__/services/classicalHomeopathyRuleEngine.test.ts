/**
 * Integration Tests: Classical Homeopathy Rule Engine
 * 
 * Tests for complete end-to-end flow
 */

import mongoose from 'mongoose';
import ClassicalHomeopathyRuleEngine from '../../services/classicalHomeopathyRuleEngine.service.js';
import type { StructuredCase } from '../../services/caseEngine.service.js';
import {
  createTestDoctor,
  createTestPatient,
  createTestSymptoms,
  createTestRemedies,
  createTestRubrics,
  createTestRubricRemedies,
  createTestStructuredCase,
  cleanupTestData,
} from '../utils/testHelpers.js';

describe('Classical Homeopathy Rule Engine - Integration Tests', () => {
  let ruleEngine: ClassicalHomeopathyRuleEngine;
  let doctorId: mongoose.Types.ObjectId;
  let patientId: mongoose.Types.ObjectId;
  let testRubrics: any[];
  let testRemedies: any[];

  beforeAll(async () => {
    const symptoms = await createTestSymptoms();
    const symptomCodes = symptoms.map((s: any) => s.code);
    testRubrics = await createTestRubrics(symptomCodes);
    testRemedies = await createTestRemedies();
    await createTestRubricRemedies(testRubrics, testRemedies);

    const { doctor } = await createTestDoctor();
    doctorId = doctor._id;
    const patient = await createTestPatient(doctor._id);
    patientId = patient._id;

    ruleEngine = new ClassicalHomeopathyRuleEngine();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('processCase - Complete Flow', () => {
    it('should process a complete case end-to-end', async () => {
      const structuredCase = createTestStructuredCase();

      const result = await ruleEngine.processCase(doctorId, patientId, structuredCase);

      expect(result).toBeDefined();
      expect(result.caseRecordId).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.topRemedies).toBeDefined();
      expect(result.suggestions.summary).toBeDefined();
    });

    it('should return suggestions with correct structure', async () => {
      const structuredCase = createTestStructuredCase();

      const result = await ruleEngine.processCase(doctorId, patientId, structuredCase);

      expect(result.suggestions.topRemedies.length).toBeGreaterThan(0);
      expect(result.suggestions.topRemedies.length).toBeLessThanOrEqual(10);

      const firstSuggestion = result.suggestions.topRemedies[0];
      expect(firstSuggestion).toHaveProperty('remedy');
      expect(firstSuggestion).toHaveProperty('matchScore');
      expect(firstSuggestion).toHaveProperty('confidence');
      expect(firstSuggestion).toHaveProperty('clinicalReasoning');
      expect(firstSuggestion).toHaveProperty('suggestedPotency');
      expect(firstSuggestion).toHaveProperty('repetition');
      expect(firstSuggestion).toHaveProperty('warnings');
    });

    it('should save case record in database', async () => {
      const CaseRecord = (await import('../../models/CaseRecord.model.js')).default;
      const structuredCase = createTestStructuredCase();

      const result = await ruleEngine.processCase(doctorId, patientId, structuredCase);

      const savedRecord = await CaseRecord.findById(result.caseRecordId).lean();

      expect(savedRecord).toBeDefined();
      expect(savedRecord?.doctorId.toString()).toBe(doctorId.toString());
      expect(savedRecord?.patientId.toString()).toBe(patientId.toString());
      expect(savedRecord?.structuredCase).toBeDefined();
      expect(savedRecord?.engineOutput).toBeDefined();
    });

    it('should handle patient history for repetition warnings', async () => {
      const structuredCase = createTestStructuredCase();

      // First case
      const result1 = await ruleEngine.processCase(doctorId, patientId, structuredCase);

      // Second case with same patient (should detect repetition)
      const patientHistory = [
        {
          remedyId: result1.suggestions.topRemedies[0].remedy.id,
          date: new Date(),
        },
      ];

      const result2 = await ruleEngine.processCase(doctorId, patientId, structuredCase, patientHistory);

      expect(result2.suggestions.topRemedies.length).toBeGreaterThan(0);
      // Check if warnings are present for repeated remedy
      const repeatedRemedy = result2.suggestions.topRemedies.find(
        (r) => r.remedy.id === result1.suggestions.topRemedies[0].remedy.id
      );

      if (repeatedRemedy) {
        // May have repetition warning
        expect(Array.isArray(repeatedRemedy.warnings)).toBe(true);
      }
    });

    it('should handle empty symptoms gracefully', async () => {
      const emptyCase: StructuredCase = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
      };

      const result = await ruleEngine.processCase(doctorId, patientId, emptyCase);

      expect(result).toBeDefined();
      expect(result.caseRecordId).toBeDefined();
      // May return empty suggestions or handle gracefully
      expect(result.suggestions).toBeDefined();
    });

    it('should rank remedies by match score', async () => {
      const structuredCase = createTestStructuredCase();

      const result = await ruleEngine.processCase(doctorId, patientId, structuredCase);

      if (result.suggestions.topRemedies.length > 1) {
        for (let i = 1; i < result.suggestions.topRemedies.length; i++) {
          expect(result.suggestions.topRemedies[i - 1].matchScore).toBeGreaterThanOrEqual(
            result.suggestions.topRemedies[i].matchScore
          );
        }
      }
    });

    it('should include clinical reasoning for each suggestion', async () => {
      const structuredCase = createTestStructuredCase();

      const result = await ruleEngine.processCase(doctorId, patientId, structuredCase);

      result.suggestions.topRemedies.forEach((suggestion) => {
        expect(suggestion.clinicalReasoning).toBeDefined();
        expect(suggestion.clinicalReasoning.length).toBeGreaterThan(0);
      });
    });

    it('should suggest appropriate potency based on case type', async () => {
      const acuteCase: StructuredCase = {
        ...createTestStructuredCase(),
        pathologyTags: ['Acute', 'Fever'],
      };

      const result = await ruleEngine.processCase(doctorId, patientId, acuteCase);

      if (result.suggestions.topRemedies.length > 0) {
        const potency = result.suggestions.topRemedies[0].suggestedPotency;
        expect(['6C', '30C', '200C', '1M']).toContain(potency);
      }
    });
  });
});
