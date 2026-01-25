/**
 * Classical Homeopathy Routes
 * 
 * API endpoints for Classical Homeopathy Smart Rule Engine
 */

import express from 'express';
import { body, query } from 'express-validator';
import {
  getRemedies,
  suggestRemedies,
  updateDoctorDecision,
  saveCaseSummary,
  getPatientCaseRecords,
  updateOutcome,
  updateQuestionAnswers,
  getRemedyStatistics,
  getSymptomRemedyPatterns,
} from '../controllers/classicalHomeopathy.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Only doctors can access Classical Homeopathy endpoints
router.use(authorize('doctor', 'super_admin'));

// Validation rules
const suggestValidation = [
  body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  body('structuredCase')
    .notEmpty()
    .withMessage('Structured case is required')
    .isObject()
    .withMessage('Structured case must be an object'),
  body('structuredCase.mental')
    .optional()
    .isArray()
    .withMessage('Mental symptoms must be an array'),
  body('structuredCase.generals')
    .optional()
    .isArray()
    .withMessage('General symptoms must be an array'),
  body('structuredCase.particulars')
    .optional()
    .isArray()
    .withMessage('Particular symptoms must be an array'),
  body('structuredCase.modalities')
    .optional()
    .isArray()
    .withMessage('Modalities must be an array'),
  body('structuredCase.pathologyTags')
    .optional()
    .isArray()
    .withMessage('Pathology tags must be an array'),
  body('patientHistory')
    .optional()
    .isArray()
    .withMessage('Patient history must be an array'),
];

const updateDecisionValidation = [
  body('finalRemedy')
    .notEmpty()
    .withMessage('Final remedy is required')
    .isObject()
    .withMessage('Final remedy must be an object'),
  body('finalRemedy.remedyId')
    .notEmpty()
    .withMessage('Remedy ID is required')
    .isMongoId()
    .withMessage('Invalid remedy ID'),
  body('finalRemedy.remedyName')
    .notEmpty()
    .withMessage('Remedy name is required')
    .trim(),
  body('finalRemedy.potency')
    .notEmpty()
    .withMessage('Potency is required')
    .trim(),
  body('finalRemedy.repetition')
    .notEmpty()
    .withMessage('Repetition is required')
    .trim(),
  body('finalRemedy.notes')
    .optional()
    .trim(),
];

const updateOutcomeValidation = [
  body('outcomeStatus')
    .notEmpty()
    .withMessage('Outcome status is required')
    .isIn(['improved', 'no_change', 'worsened', 'not_followed'])
    .withMessage('Invalid outcome status'),
  body('followUpNotes')
    .optional()
    .trim(),
];

// Routes
router.get('/remedies', getRemedies);
router.post('/suggest', suggestValidation, suggestRemedies);
router.get('/case/patient/:patientId', getPatientCaseRecords);
router.put('/case/:id/decision', updateDecisionValidation, updateDoctorDecision);
router.put('/case/:id/summary', saveCaseSummary);
router.put('/case/:id/outcome', updateOutcomeValidation, updateOutcome);
router.put('/case/:id/question-answers', updateQuestionAnswers);
router.get('/statistics/remedy/:id', getRemedyStatistics);
router.get('/statistics/patterns', [
  query('symptomCode')
    .notEmpty()
    .withMessage('Symptom code is required'),
], getSymptomRemedyPatterns);

export default router;
