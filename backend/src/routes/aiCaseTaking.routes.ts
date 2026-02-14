/**
 * AI Case Taking Routes
 *
 * API routes for AI-powered case taking features
 */

import { Router } from 'express';
import multer from 'multer';
import {
  extractSymptoms,
  analyzeCompleteness,
  generateQuestions,
  extractSymptomsFromAnswers,
  generateQuestionsBatch,
  suggestRubrics,
  generateSummary,
  transcribeAudio,
} from '../controllers/aiCaseTaking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Multer: in-memory upload for audio (max 25MB - Whisper limit)
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /audio\/(webm|mpeg|mp4|m4a|wav|x-wav|ogg)|video\/webm/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: webm, mp3, mp4, m4a, wav, ogg'));
    }
  },
});

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

// POST /api/ai-case-taking/transcribe-audio (multipart: audio file, optional body field: language)
router.post('/transcribe-audio', audioUpload.single('audio'), transcribeAudio);

export default router;
