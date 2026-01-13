/**
 * Integration Tests: Classical Homeopathy API Endpoints
 * 
 * Tests for API endpoints end-to-end
 */

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import {
  createTestDoctor,
  createTestPatient,
  createTestSymptoms,
  createTestRemedies,
  createTestRubrics,
  createTestRubricRemedies,
  cleanupTestData,
} from '../utils/testHelpers.js';
import jwt from 'jsonwebtoken';
import config from '../../config/env.js';

describe('Classical Homeopathy API - Integration Tests', () => {
  let authToken: string;
  let patientId: mongoose.Types.ObjectId;
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await createTestSymptoms();
    const symptomCodes = (await createTestSymptoms()).map((s: any) => s.code);
    await createTestRubrics(symptomCodes);
    const testRemedies = await createTestRemedies();
    const testRubrics = await createTestRubrics(symptomCodes);
    await createTestRubricRemedies(testRubrics, testRemedies);

    const { user, doctor } = await createTestDoctor();
    userId = user._id;
    const patient = await createTestPatient(doctor._id);
    patientId = patient._id;

    // Generate auth token
    authToken = jwt.sign({ id: userId, role: 'doctor' }, config.jwtSecret, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /api/classical-homeopathy/suggest', () => {
    it('should suggest remedies for a structured case', async () => {
      const structuredCase = {
        mental: [
          {
            symptomText: 'Anxiety',
            weight: 3,
          },
        ],
        generals: [
          {
            symptomText: 'High Fever',
            weight: 2,
          },
        ],
        particulars: [],
        modalities: [],
        pathologyTags: ['Acute'],
      };

      const response = await request(app)
        .post('/api/classical-homeopathy/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: patientId.toString(),
          structuredCase,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.suggestions).toBeDefined();
      expect(response.body.data.suggestions.topRemedies).toBeDefined();
      expect(response.body.data.caseRecordId).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/classical-homeopathy/suggest')
        .send({
          patientId: patientId.toString(),
          structuredCase: {},
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/classical-homeopathy/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/classical-homeopathy/case/:id/decision', () => {
    it('should update doctor decision', async () => {
      // First create a case
      const structuredCase = {
        mental: [{ symptomText: 'Anxiety', weight: 3 }],
        generals: [],
        particulars: [],
        modalities: [],
        pathologyTags: [],
      };

      const suggestResponse = await request(app)
        .post('/api/classical-homeopathy/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: patientId.toString(),
          structuredCase,
        })
        .expect(200);

      const caseRecordId = suggestResponse.body.data.caseRecordId;

      // Update decision
      const updateResponse = await request(app)
        .put(`/api/classical-homeopathy/case/${caseRecordId}/decision`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          remedyId: suggestResponse.body.data.suggestions.topRemedies[0].remedy.id,
          remedyName: suggestResponse.body.data.suggestions.topRemedies[0].remedy.name,
          potency: '30C',
          repetition: 'TDS',
          notes: 'Test decision',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data).toBeDefined();
    });

    it('should require valid case record ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/classical-homeopathy/case/${fakeId}/decision`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          remedyId: new mongoose.Types.ObjectId().toString(),
          remedyName: 'Test',
          potency: '30C',
          repetition: 'TDS',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/classical-homeopathy/remedies', () => {
    it('should return remedies for classical homeopathy doctors', async () => {
      const response = await request(app)
        .get('/api/classical-homeopathy/remedies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/classical-homeopathy/remedies')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
