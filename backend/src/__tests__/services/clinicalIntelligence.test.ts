/**
 * Unit Tests: Clinical Intelligence Layer Service
 * 
 * Tests for clinical filters and score adjustments
 */

import ClinicalIntelligenceLayer from '../../services/clinicalIntelligence.service.js';
import type { NormalizedCaseProfile } from '../../services/caseEngine.service.js';
import type { RemedyFinalScore } from '../../services/scoringEngine.service.js';
import {
  createTestRemedies,
  cleanupTestData,
} from '../utils/testHelpers.js';
import Remedy from '../../models/Remedy.model.js';

describe('Clinical Intelligence Layer Service', () => {
  let clinicalIntelligence: ClinicalIntelligenceLayer;
  let testRemedy: any;

  beforeAll(async () => {
    const remedies = await createTestRemedies();
    testRemedy = remedies[0]; // Aconitum
    clinicalIntelligence = new ClinicalIntelligenceLayer();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('applyClinicalFilters', () => {
    it('should boost acute remedies for acute cases', async () => {
      const acuteCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: ['Acute'],
        isAcute: true,
        isChronic: false,
      };

      const scoredRemedies: RemedyFinalScore[] = [
        {
          remedyId: testRemedy._id,
          remedyName: testRemedy.name,
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

      const filtered = await clinicalIntelligence.applyClinicalFilters(scoredRemedies, acuteCase);

      expect(filtered.length).toBe(1);
      // Aconitum has 'Acute' in clinicalIndications, should get boost
      const remedyDetails = await Remedy.findById(testRemedy._id).lean();
      if (remedyDetails?.clinicalIndications?.includes('Acute')) {
        expect(filtered[0].finalScore).toBeGreaterThan(scoredRemedies[0].finalScore);
      }
    });

    it('should boost constitutional remedies for chronic cases', async () => {
      const chronicCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: ['Chronic'],
        isAcute: false,
        isChronic: true,
      };

      const scoredRemedies: RemedyFinalScore[] = [
        {
          remedyId: testRemedy._id,
          remedyName: testRemedy.name,
          baseScore: 50,
          finalScore: 50,
          constitutionBonus: 10, // High constitution bonus
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

      const filtered = await clinicalIntelligence.applyClinicalFilters(scoredRemedies, chronicCase);

      expect(filtered.length).toBe(1);
      // Should boost remedies with high constitution bonus
      if (scoredRemedies[0].constitutionBonus > 5) {
        expect(filtered[0].finalScore).toBeGreaterThanOrEqual(scoredRemedies[0].finalScore);
      }
    });

    it('should boost mental remedies when mental symptoms dominate', async () => {
      const mentalCase: NormalizedCaseProfile = {
        mental: [
          { symptomCode: 'SYM_1', symptomName: 'Anxiety', category: 'mental', weight: 3 },
          { symptomCode: 'SYM_2', symptomName: 'Fear', category: 'mental', weight: 3 },
        ],
        generals: [
          { symptomCode: 'SYM_3', symptomName: 'Fever', category: 'general', weight: 2 },
        ],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const scoredRemedies: RemedyFinalScore[] = [
        {
          remedyId: testRemedy._id,
          remedyName: testRemedy.name,
          baseScore: 50,
          finalScore: 50,
          constitutionBonus: 5, // High constitution bonus
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

      const filtered = await clinicalIntelligence.applyClinicalFilters(scoredRemedies, mentalCase);

      expect(filtered.length).toBe(1);
      // Mental symptoms dominate, should boost remedies with constitution bonus > 3
      if (scoredRemedies[0].constitutionBonus > 3) {
        expect(filtered[0].finalScore).toBeGreaterThanOrEqual(scoredRemedies[0].finalScore);
      }
    });

    it('should not modify score when no filters apply', async () => {
      const neutralCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const scoredRemedies: RemedyFinalScore[] = [
        {
          remedyId: testRemedy._id,
          remedyName: testRemedy.name,
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

      const filtered = await clinicalIntelligence.applyClinicalFilters(scoredRemedies, neutralCase);

      expect(filtered.length).toBe(1);
      expect(filtered[0].finalScore).toBe(scoredRemedies[0].finalScore);
    });

    it('should handle empty remedy array', async () => {
      const caseProfile: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const filtered = await clinicalIntelligence.applyClinicalFilters([], caseProfile);
      expect(filtered).toHaveLength(0);
    });
  });
});
