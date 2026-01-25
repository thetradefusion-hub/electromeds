/**
 * AI Case Taking Routes
 * 
 * API routes for AI-powered case taking features
 */

import { Router } from 'express';
import {
  extractSymptoms,
  analyzeCompleteness,
  generateQuestions,
  extractSymptomsFromAnswers,
  generateQuestionsBatch,
  suggestRubrics,
  generateSummary,
} from '../controllers/aiCaseTaking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/ai-case-taking/extract-symptoms
router.post('/extract-symptoms', extractSymptoms);

// POST /api/ai-case-taking/analyze-completeness
router.post('/analyze-completeness', analyzeCompleteness);

// POST /api/ai-case-taking/generate-questions
router.post('/generate-questions', generateQuestions);

// POST /api/ai-case-taking/extract-symptoms-from-answers
router.post('/extract-symptoms-from-answers', extractSymptomsFromAnswers);

// POST /api/ai-case-taking/generate-questions-batch
router.post('/generate-questions-batch', generateQuestionsBatch);

// POST /api/ai-case-taking/suggest-rubrics
router.post('/suggest-rubrics', suggestRubrics);

// POST /api/ai-case-taking/generate-summary
router.post('/generate-summary', generateSummary);

export default router;
