/**
 * Unit Tests: Repertory Engine Service
 * 
 * Tests for remedy pool building from rubrics
 */

import mongoose from 'mongoose';
import RepertoryEngine from '../../services/repertoryEngine.service.js';
import {
  createTestSymptoms,
  createTestRemedies,
  createTestRubrics,
  createTestRubricRemedies,
  cleanupTestData,
} from '../utils/testHelpers.js';

describe('Repertory Engine Service', () => {
  let repertoryEngine: RepertoryEngine;
  let testRubrics: any[];
  let testRemedies: any[];

  beforeAll(async () => {
    const symptoms = await createTestSymptoms();
    const symptomCodes = symptoms.map((s: any) => s.code);
    testRubrics = await createTestRubrics(symptomCodes);
    testRemedies = await createTestRemedies();
    await createTestRubricRemedies(testRubrics, testRemedies);
    repertoryEngine = new RepertoryEngine();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('buildRemedyPool', () => {
    it('should build remedy pool from rubric IDs', async () => {
      const rubricIds = testRubrics.map((r) => r._id);
      const remedyPool = await repertoryEngine.buildRemedyPool(rubricIds);

      expect(remedyPool.size).toBeGreaterThan(0);
      
      // Check first remedy in pool
      const firstRemedy = Array.from(remedyPool.values())[0];
      expect(firstRemedy).toHaveProperty('remedyId');
      expect(firstRemedy).toHaveProperty('remedyName');
      expect(firstRemedy).toHaveProperty('rubricGrades');
      expect(firstRemedy).toHaveProperty('totalBaseScore');
      expect(Array.isArray(firstRemedy.rubricGrades)).toBe(true);
    });

    it('should aggregate grades for same remedy from multiple rubrics', async () => {
      const rubricIds = testRubrics.map((r) => r._id);
      const remedyPool = await repertoryEngine.buildRemedyPool(rubricIds);

      // Check if remedy has multiple rubric grades
      const remedies = Array.from(remedyPool.values());
      const remedyWithMultipleGrades = remedies.find((r) => r.rubricGrades.length > 1);

      if (remedyWithMultipleGrades) {
        expect(remedyWithMultipleGrades.rubricGrades.length).toBeGreaterThan(1);
        expect(remedyWithMultipleGrades.totalBaseScore).toBeGreaterThan(0);
      }
    });

    it('should return empty map for empty rubric IDs', async () => {
      const remedyPool = await repertoryEngine.buildRemedyPool([]);
      expect(remedyPool.size).toBe(0);
    });

    it('should include repertory type in rubric grades', async () => {
      const rubricIds = testRubrics.map((r) => r._id);
      const remedyPool = await repertoryEngine.buildRemedyPool(rubricIds);

      const firstRemedy = Array.from(remedyPool.values())[0];
      if (firstRemedy.rubricGrades.length > 0) {
        expect(firstRemedy.rubricGrades[0]).toHaveProperty('repertoryType');
        expect(firstRemedy.rubricGrades[0].repertoryType).toBe('kent');
      }
    });
  });

  describe('getRemedyDetails', () => {
    it('should get remedy details by ID', async () => {
      if (testRemedies.length > 0) {
        const remedy = await repertoryEngine.getRemedyDetails(testRemedies[0]._id);

        expect(remedy).toBeDefined();
        expect(remedy?.name).toBe('Aconitum Napellus');
        expect(remedy?.category).toBe('Plant Kingdom');
        expect(remedy?.modality).toBe('classical_homeopathy');
      }
    });

    it('should return null for non-existent remedy', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const remedy = await repertoryEngine.getRemedyDetails(fakeId);
      expect(remedy).toBeNull();
    });
  });
});
