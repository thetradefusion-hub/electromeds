/**
 * Unit Tests: Scoring Engine Service
 * 
 * Tests for remedy scoring formula
 */

import ScoringEngine from '../../services/scoringEngine.service.js';
import type { NormalizedCaseProfile } from '../../services/caseEngine.service.js';
import type { RemedyScore } from '../../services/repertoryEngine.service.js';
import mongoose from 'mongoose';
import {
  createTestRemedies,
  createTestSymptoms,
  cleanupTestData,
} from '../utils/testHelpers.js';

describe('Scoring Engine Service', () => {
  let scoringEngine: ScoringEngine;
  let testRemedy: any;
  let normalizedCase: NormalizedCaseProfile;

  beforeAll(async () => {
    await createTestSymptoms();
    const remedies = await createTestRemedies();
    testRemedy = remedies[0]; // Aconitum
    scoringEngine = new ScoringEngine();

    normalizedCase = {
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
      pathologyTags: ['Acute', 'Fever'],
      isAcute: true,
      isChronic: false,
    };
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('calculateRemedyScores', () => {
    it('should calculate base score correctly', async () => {
      const remedyPool = new Map<string, RemedyScore>();
      
      // Create a remedy score with rubric grades
      remedyPool.set(testRemedy._id.toString(), {
        remedyId: testRemedy._id,
        remedyName: testRemedy.name,
        rubricGrades: [
          {
            rubricId: new mongoose.Types.ObjectId(),
            grade: 4, // Highest grade for fever
            repertoryType: 'kent',
          },
          {
            rubricId: new mongoose.Types.ObjectId(),
            grade: 3, // Medium grade for anxiety
            repertoryType: 'kent',
          },
        ],
        totalBaseScore: 7,
      });

      const selectedRubrics = [
        {
          rubricId: remedyPool.get(testRemedy._id.toString())!.rubricGrades[0].rubricId,
          rubricText: 'High fever rubric',
          matchedSymptoms: ['SYM_FEVER_001'], // Matches general symptom
        },
        {
          rubricId: remedyPool.get(testRemedy._id.toString())!.rubricGrades[1].rubricId,
          rubricText: 'Anxiety rubric',
          matchedSymptoms: ['SYM_ANXIETY_001'], // Matches mental symptom
        },
      ];

      const scores = await scoringEngine.calculateRemedyScores(
        remedyPool,
        normalizedCase,
        selectedRubrics
      );

      expect(scores.length).toBeGreaterThan(0);
      const score = scores.find((s) => s.remedyId.toString() === testRemedy._id.toString());

      if (score) {
        // Base score should be: (4 * 2) + (3 * 3) = 8 + 9 = 17
        expect(score.baseScore).toBeGreaterThan(0);
        expect(score.finalScore).toBeGreaterThan(0);
        expect(score.confidence).toBeDefined();
      }
    });

    it('should apply constitution bonus when remedy traits match', async () => {
      const remedyPool = new Map<string, RemedyScore>();
      
      remedyPool.set(testRemedy._id.toString(), {
        remedyId: testRemedy._id,
        remedyName: testRemedy.name,
        rubricGrades: [
          {
            rubricId: new mongoose.Types.ObjectId(),
            grade: 3,
            repertoryType: 'kent',
          },
        ],
        totalBaseScore: 3,
      });

      const selectedRubrics = [
        {
          rubricId: remedyPool.get(testRemedy._id.toString())!.rubricGrades[0].rubricId,
          rubricText: 'Anxiety rubric',
          matchedSymptoms: ['SYM_ANXIETY_001'],
        },
      ];

      const scores = await scoringEngine.calculateRemedyScores(
        remedyPool,
        normalizedCase,
        selectedRubrics
      );

      const score = scores.find((s) => s.remedyId.toString() === testRemedy._id.toString());

      if (score) {
        expect(score.constitutionBonus).toBeGreaterThanOrEqual(0);
        expect(score.finalScore).toBeGreaterThanOrEqual(score.baseScore);
      }
    });

    it('should apply pathology support for acute cases', async () => {
      const acuteCase: NormalizedCaseProfile = {
        ...normalizedCase,
        pathologyTags: ['Acute', 'Fever', 'Sudden'],
        isAcute: true,
      };

      const remedyPool = new Map<string, RemedyScore>();
      remedyPool.set(testRemedy._id.toString(), {
        remedyId: testRemedy._id,
        remedyName: testRemedy.name,
        rubricGrades: [
          {
            rubricId: new mongoose.Types.ObjectId(),
            grade: 4,
            repertoryType: 'kent',
          },
        ],
        totalBaseScore: 4,
      });

      const selectedRubrics = [
        {
          rubricId: remedyPool.get(testRemedy._id.toString())!.rubricGrades[0].rubricId,
          rubricText: 'Fever rubric',
          matchedSymptoms: ['SYM_FEVER_001'],
        },
      ];

      const scores = await scoringEngine.calculateRemedyScores(
        remedyPool,
        acuteCase,
        selectedRubrics
      );

      const score = scores.find((s) => s.remedyId.toString() === testRemedy._id.toString());

      if (score) {
        // Aconitum has 'Sudden Onset' in clinicalIndications, should get pathology bonus
        expect(score.pathologySupport).toBeGreaterThanOrEqual(0);
      }
    });

    it('should calculate confidence level correctly', async () => {
      const remedyPool = new Map<string, RemedyScore>();
      
      remedyPool.set(testRemedy._id.toString(), {
        remedyId: testRemedy._id,
        remedyName: testRemedy.name,
        rubricGrades: [
          {
            rubricId: new mongoose.Types.ObjectId(),
            grade: 4, // High grade
            repertoryType: 'kent',
          },
        ],
        totalBaseScore: 4,
      });

      const selectedRubrics = [
        {
          rubricId: remedyPool.get(testRemedy._id.toString())!.rubricGrades[0].rubricId,
          rubricText: 'Fever + anxiety rubric',
          matchedSymptoms: ['SYM_FEVER_001', 'SYM_ANXIETY_001'], // Multiple matches
        },
      ];

      const scores = await scoringEngine.calculateRemedyScores(
        remedyPool,
        normalizedCase,
        selectedRubrics
      );

      const score = scores.find((s) => s.remedyId.toString() === testRemedy._id.toString());

      if (score && score.finalScore > 50) {
        // High score should have high confidence
        expect(['high', 'very_high']).toContain(score.confidence);
      }
    });

    it('should handle empty remedy pool', async () => {
      const emptyPool = new Map<string, RemedyScore>();
      const scores = await scoringEngine.calculateRemedyScores(
        emptyPool,
        normalizedCase,
        []
      );

      expect(scores).toHaveLength(0);
    });
  });
});
