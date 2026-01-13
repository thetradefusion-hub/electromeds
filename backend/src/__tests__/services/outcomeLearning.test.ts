/**
 * Unit Tests: Outcome & Learning Hook Service
 * 
 * Tests for case record saving and outcome tracking
 */

import mongoose from 'mongoose';
import OutcomeLearningHook from '../../services/outcomeLearning.service.js';
import type { NormalizedCaseProfile } from '../../services/caseEngine.service.js';
import {
  createTestDoctor,
  createTestPatient,
  createTestSymptoms,
  createTestRemedies,
  cleanupTestData,
} from '../utils/testHelpers.js';
import CaseRecord from '../../models/CaseRecord.model.js';

describe('Outcome Learning Hook Service', () => {
  let outcomeHook: OutcomeLearningHook;
  let doctorId: mongoose.Types.ObjectId;
  let patientId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await createTestSymptoms();
    await createTestRemedies();
    const { doctor } = await createTestDoctor();
    doctorId = doctor._id;
    const patient = await createTestPatient(doctor._id);
    patientId = patient._id;
    outcomeHook = new OutcomeLearningHook();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('saveCaseRecord', () => {
    it('should save case record with engine output', async () => {
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

      const caseData = {
        structuredCase: normalizedCase,
        selectedRubrics: [
          {
            rubricId: new mongoose.Types.ObjectId(),
            rubricText: 'FEAR - death, of',
            repertoryType: 'kent',
            autoSelected: true,
          },
        ],
        engineOutput: {
          remedyScores: [
            {
              remedyId: new mongoose.Types.ObjectId(),
              remedyName: 'Aconitum',
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
              confidence: 'high' as const,
            },
          ],
          clinicalReasoning: 'Test reasoning',
          warnings: [],
        },
      };

      const caseRecord = await outcomeHook.saveCaseRecord(doctorId, patientId, caseData);

      expect(caseRecord).toBeDefined();
      expect(caseRecord._id).toBeDefined();
      expect(caseRecord.doctorId.toString()).toBe(doctorId.toString());
      expect(caseRecord.patientId.toString()).toBe(patientId.toString());
      expect(caseRecord.structuredCase).toBeDefined();
      expect(caseRecord.engineOutput).toBeDefined();
      expect(caseRecord.finalRemedy).toBeNull();
      expect(caseRecord.outcomeStatus).toBe('pending');
    });

    it('should save remedy scores correctly', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const remedyId = new mongoose.Types.ObjectId();
      const caseData = {
        structuredCase: normalizedCase,
        selectedRubrics: [],
        engineOutput: {
          remedyScores: [
            {
              remedyId,
              remedyName: 'Test Remedy',
              baseScore: 50,
              finalScore: 60,
              constitutionBonus: 5,
              modalityBonus: 2,
              pathologySupport: 3,
              keynoteBonus: 0,
              coverageBonus: 0,
              contradictionPenalty: 0,
              matchedRubrics: ['RUBRIC_1'],
              matchedSymptoms: ['SYM_1'],
              confidence: 'high' as const,
            },
          ],
          clinicalReasoning: 'Test',
          warnings: [],
        },
      };

      const caseRecord = await outcomeHook.saveCaseRecord(doctorId, patientId, caseData);

      expect(caseRecord.engineOutput.remedyScores.length).toBe(1);
      expect(caseRecord.engineOutput.remedyScores[0].remedyId.toString()).toBe(remedyId.toString());
      expect(caseRecord.engineOutput.remedyScores[0].finalScore).toBe(60);
      expect(caseRecord.engineOutput.remedyScores[0].baseScore).toBe(50);
    });
  });

  describe('updateDoctorDecision', () => {
    it('should update case record with doctor decision', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const caseData = {
        structuredCase: normalizedCase,
        selectedRubrics: [],
        engineOutput: {
          remedyScores: [],
          clinicalReasoning: '',
          warnings: [],
        },
      };

      const caseRecord = await outcomeHook.saveCaseRecord(doctorId, patientId, caseData);

      const finalRemedy = {
        remedyId: new mongoose.Types.ObjectId(),
        remedyName: 'Aconitum',
        potency: '30C',
        repetition: 'TDS',
        notes: 'Test notes',
      };

      await outcomeHook.updateDoctorDecision(caseRecord._id, finalRemedy);

      const updated = await CaseRecord.findById(caseRecord._id).lean();
      expect(updated?.finalRemedy).toBeDefined();
      expect(updated?.finalRemedy?.remedyId).toBeDefined();
      expect(updated?.finalRemedy?.remedyName).toBe('Aconitum');
      expect(updated?.finalRemedy?.potency).toBe('30C');
      expect(updated?.finalRemedy?.repetition).toBe('TDS');
      expect(updated?.finalRemedy?.notes).toBe('Test notes');
    });
  });

  describe('updateOutcome', () => {
    it('should update outcome status', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const caseData = {
        structuredCase: normalizedCase,
        selectedRubrics: [],
        engineOutput: {
          remedyScores: [],
          clinicalReasoning: '',
          warnings: [],
        },
      };

      const caseRecord = await outcomeHook.saveCaseRecord(doctorId, patientId, caseData);

      await outcomeHook.updateOutcome(caseRecord._id, 'improved', 'Patient showed significant improvement');

      const updated = await CaseRecord.findById(caseRecord._id).lean();
      expect(updated?.outcomeStatus).toBe('improved');
      expect(updated?.followUpNotes).toBe('Patient showed significant improvement');
    });

    it('should handle all outcome statuses', async () => {
      const normalizedCase: NormalizedCaseProfile = {
        mental: [],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
        isAcute: false,
        isChronic: false,
      };

      const caseData = {
        structuredCase: normalizedCase,
        selectedRubrics: [],
        engineOutput: {
          remedyScores: [],
          clinicalReasoning: '',
          warnings: [],
        },
      };

      const statuses: Array<'improved' | 'no_change' | 'worsened' | 'not_followed'> = [
        'improved',
        'no_change',
        'worsened',
        'not_followed',
      ];

      for (const status of statuses) {
        const caseRecord = await outcomeHook.saveCaseRecord(doctorId, patientId, caseData);
        await outcomeHook.updateOutcome(caseRecord._id, status);

        const updated = await CaseRecord.findById(caseRecord._id).lean();
        expect(updated?.outcomeStatus).toBe(status);
      }
    });
  });
});
