import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getChapters, getRubrics, getRubric } from '../controllers/repertory.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/repertory/chapters - Get all chapters
router.get('/chapters', getChapters);

// GET /api/repertory/rubrics - Get rubrics (with optional chapter/search filters)
router.get('/rubrics', getRubrics);

// GET /api/repertory/rubrics/:id - Get single rubric
router.get('/rubrics/:id', getRubric);

export default router;
