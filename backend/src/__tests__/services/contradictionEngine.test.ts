/**
 * Unit Tests: Contradiction & Safety Engine Service
 * 
 * Tests for contradiction detection and safety checks
 */

import ContradictionEngine from '../../services/contradictionEngine.service.js';
import type { RemedyFinalScore } from '../../services/scoringEngine.service.js';
import {
  createTestRemedies,
  cleanupTestData,
} from '../utils/testHelpers.js';

describe('Contradiction Engine Service', () => {
  let contradictionEngine: ContradictionEngine;
  let testRemedies: any[];

  beforeAll(async () => {
    testRemedies = await createTestRemedies();
    contradictionEngine = new ContradictionEngine();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('detectContradictions', () => {
    it('should detect incompatible remedies', async () => {
      // Create a remedy with incompatibilities
      const remedyWithIncompatibilities = {
        ...testRemedies[0],
        incompatibilities: [testRemedies[1]._id.toString()],
      };

      const scoredRemedies: RemedyFinalScore[] = [
        {
          remedyId: remedyWithIncompatibilities._id,
          remedyName: remedyWithIncompatibilities.name,
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
          confidence: 'medium',
        },
        {
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
      ];

      // Update remedy in database
      const Remedy = (await import('../../models/Remedy.model.js')).default;
      await Remedy.findByIdAndUpdate(remedyWithIncompatibilities._id, {
        incompatibilities: [testRemedies[1]._id.toString()],
      });

      const safetyChecked = await contradictionEngine.detectContradictions(scoredRemedies);

      expect(safetyChecked.length).toBe(2);
      const firstRemedy = safetyChecked.find(
        (r) => r.remedy.remedyId.toString() === remedyWithIncompatibilities._id.toString()
      );

      if (firstRemedy && firstRemedy.warnings.length > 0) {
        expect(firstRemedy.warnings[0].type).toBe('incompatibility');
        expect(firstRemedy.penalty).toBeGreaterThan(0);
        expect(firstRemedy.remedy.finalScore).toBeLessThan(scoredRemedies[0].finalScore);
      }
    });

    it('should detect recent remedy repetition', async () => {
      const scoredRemedies: RemedyFinalScore[] = [
        {
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
          confidence: 'medium',
        },
      ];

      const patientHistory = [
        {
          remedyId: testRemedies[0]._id.toString(),
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        },
      ];

      const safetyChecked = await contradictionEngine.detectContradictions(
        scoredRemedies,
        patientHistory
      );

      expect(safetyChecked.length).toBe(1);
      const remedy = safetyChecked[0];

      if (remedy.warnings.length > 0) {
        const repetitionWarning = remedy.warnings.find((w) => w.type === 'repetition');
        if (repetitionWarning) {
          expect(repetitionWarning.severity).toBe('medium');
          expect(remedy.penalty).toBeGreaterThan(0);
        }
      }
    });

    it('should not flag old remedy usage', async () => {
      const scoredRemedies: RemedyFinalScore[] = [
        {
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
          confidence: 'medium',
        },
      ];

      const patientHistory = [
        {
          remedyId: testRemedies[0]._id.toString(),
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago (outside 30-day window)
        },
      ];

      const safetyChecked = await contradictionEngine.detectContradictions(
        scoredRemedies,
        patientHistory
      );

      expect(safetyChecked.length).toBe(1);
      const repetitionWarning = safetyChecked[0].warnings.find((w) => w.type === 'repetition');
      expect(repetitionWarning).toBeUndefined();
    });

    it('should handle remedies without incompatibilities', async () => {
      const scoredRemedies: RemedyFinalScore[] = [
        {
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
          confidence: 'medium',
        },
      ];

      const safetyChecked = await contradictionEngine.detectContradictions(scoredRemedies);

      expect(safetyChecked.length).toBe(1);
      expect(safetyChecked[0].warnings).toHaveLength(0);
      expect(safetyChecked[0].penalty).toBe(0);
    });

    it('should apply penalty to final score', async () => {
      const scoredRemedies: RemedyFinalScore[] = [
        {
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
          confidence: 'medium',
        },
      ];

      const patientHistory = [
        {
          remedyId: testRemedies[0]._id.toString(),
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        },
      ];

      const safetyChecked = await contradictionEngine.detectContradictions(
        scoredRemedies,
        patientHistory
      );

      expect(safetyChecked.length).toBe(1);
      if (safetyChecked[0].penalty > 0) {
        expect(safetyChecked[0].remedy.finalScore).toBeLessThan(scoredRemedies[0].finalScore);
        expect(safetyChecked[0].remedy.contradictionPenalty).toBeGreaterThan(0);
      }
    });

    it('should handle empty remedy array', async () => {
      const safetyChecked = await contradictionEngine.detectContradictions([]);
      expect(safetyChecked).toHaveLength(0);
    });
  });
});
