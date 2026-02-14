/**
 * AI Case Taking Controller
 * 
 * Handles HTTP requests for AI case taking features
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import AICaseTakingService from '../services/aiCaseTaking.service.js';
import CaseCompletenessService, { Question } from '../services/caseCompleteness.service.js';
import QuestionGeneratorService from '../services/questionGenerator.service.js';
import AnswerToSymptomService from '../services/answerToSymptom.service.js';
import RubricMappingEngine from '../services/rubricMapping.service.js';
import CaseSummaryGeneratorService from '../services/caseSummaryGenerator.service.js';
import whisperTranscription from '../services/whisperTranscription.service.js';
import { CustomError } from '../middleware/errorHandler.js';
import { StructuredCase, NormalizedCaseProfile } from '../services/caseEngine.service.js';

const aiCaseTakingService = new AICaseTakingService();
const completenessService = new CaseCompletenessService();
const questionGeneratorService = new QuestionGeneratorService();
const answerToSymptomService = new AnswerToSymptomService();
const rubricMappingEngine = new RubricMappingEngine();
const caseSummaryGenerator = new CaseSummaryGeneratorService();

/**
 * @route   POST /api/ai-case-taking/extract-symptoms
 * @desc    Extract symptoms from free text
 * @access  Private (Doctor only)
 */
export const extractSymptoms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, language, useNLP } = req.body;

    // Validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new CustomError('Text is required and must be a non-empty string', 400);
    }

    if (text.length > 10000) {
      throw new CustomError('Text is too long. Maximum 10,000 characters allowed.', 400);
    }

    // Extract symptoms (with optional NLP)
    const result = await aiCaseTakingService.extractSymptoms({
      text: text.trim(),
      language: language || 'en',
      useNLP: useNLP !== false, // Default to true, can be explicitly set to false
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai-case-taking/analyze-completeness
 * @desc    Analyze case completeness and identify missing domains
 * @access  Private (Doctor only)
 */
export const analyzeCompleteness = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { case: caseData } = req.body;

    // Validation
    if (!caseData) {
      throw new CustomError('Case data is required', 400);
    }

    // Validate case structure
    const structuredCase: StructuredCase = {
      mental: caseData.mental || [],
      generals: caseData.generals || [],
      particulars: caseData.particulars || [],
      modalities: caseData.modalities || [],
      pathologyTags: caseData.pathologyTags || [],
    };

    // Analyze completeness
    const analysis = await completenessService.analyzeCompleteness(structuredCase);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai-case-taking/generate-questions
 * @desc    Generate smart questions for case completion
 * @access  Private (Doctor only)
 */
export const generateQuestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { case: caseData, missingDomain, context } = req.body;

    // Validation
    if (!caseData) {
      throw new CustomError('Case data is required', 400);
    }

    // Validate case structure
    const structuredCase: StructuredCase = {
      mental: caseData.mental || [],
      generals: caseData.generals || [],
      particulars: caseData.particulars || [],
      modalities: caseData.modalities || [],
      pathologyTags: caseData.pathologyTags || [],
    };

    // Generate questions
    const result = await questionGeneratorService.generateQuestions({
      caseData: structuredCase,
      missingDomain,
      context,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai-case-taking/extract-symptoms-from-answers
 * @desc    Extract symptoms from question answers
 * @access  Private (Doctor only)
 */
export const extractSymptomsFromAnswers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { answers, useNLP } = req.body;

    console.log('[extractSymptomsFromAnswers] Request received:', {
      answersCount: answers?.length || 0,
      useNLP: useNLP !== false,
    });

    // Validation
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      throw new CustomError('Answers array is required and must not be empty', 400);
    }

    // Extract symptoms from answers
    const extractedSymptoms = await answerToSymptomService.extractSymptomsFromAnswers(
      answers,
      useNLP !== false
    );

    console.log('[extractSymptomsFromAnswers] Extracted symptoms:', {
      count: extractedSymptoms.length,
      symptoms: extractedSymptoms.map(s => s.symptomText),
    });

    res.status(200).json({
      success: true,
      data: {
        extractedSymptoms,
        count: extractedSymptoms.length,
      },
    });
  } catch (error) {
    console.error('[extractSymptomsFromAnswers] Error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/ai-case-taking/generate-questions-batch
 * @desc    Generate multiple question sets for different domains
 * @access  Private (Doctor only)
 */
export const generateQuestionsBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { case: caseData, domains } = req.body;

    // Validation
    if (!caseData) {
      throw new CustomError('Case data is required', 400);
    }

    // Validate case structure
    const structuredCase: StructuredCase = {
      mental: caseData.mental || [],
      generals: caseData.generals || [],
      particulars: caseData.particulars || [],
      modalities: caseData.modalities || [],
      pathologyTags: caseData.pathologyTags || [],
    };

    // Generate questions for each domain
    const domainQuestions: Record<string, Question[]> = {};
    const allQuestions: Question[] = [];

    // If domains specified, generate for those; otherwise generate for all missing domains
    if (domains && Array.isArray(domains)) {
      for (const domain of domains) {
        const result = await questionGeneratorService.generateQuestions({
          caseData: structuredCase,
          missingDomain: domain,
        });
        domainQuestions[domain] = result.questions;
        allQuestions.push(...result.questions);
      }
    } else {
      // Generate general questions
      const result = await questionGeneratorService.generateQuestions({
        caseData: structuredCase,
      });
      allQuestions.push(...result.questions);
    }

    res.status(200).json({
      success: true,
      data: {
        questions: allQuestions,
        domainQuestions,
        totalCount: allQuestions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai-case-taking/suggest-rubrics
 * @desc    Get rubric suggestions for a symptom
 * @access  Private (Doctor only)
 */
export const suggestRubrics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { symptom, repertoryType } = req.body;

    if (!symptom) {
      throw new CustomError('Symptom data is required', 400);
    }

    // Validate symptom structure
    if (!symptom.symptomName && !symptom.symptomCode) {
      throw new CustomError('Symptom must have either symptomName or symptomCode', 400);
    }

    // Get rubric suggestions
    const result = await rubricMappingEngine.suggestRubricsForExtractedSymptom(
      {
        symptomCode: symptom.symptomCode,
        symptomName: symptom.symptomName,
        category: symptom.category,
        location: symptom.location,
        sensation: symptom.sensation,
      },
      repertoryType || 'publicum'
    );

    res.status(200).json({
      success: true,
      data: {
        rubrics: result.rubrics,
        rareRubrics: result.rareRubrics,
        totalCount: result.rubrics.length + result.rareRubrics.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai-case-taking/generate-summary
 * @desc    Generate AI-powered case summary (clinical and homeopathic)
 * @access  Private (Doctor only)
 */
export const generateSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { structuredCase, normalizedCase } = req.body;

    // Validation
    if (!structuredCase) {
      throw new CustomError('Structured case is required', 400);
    }

    if (!normalizedCase) {
      throw new CustomError('Normalized case is required', 400);
    }

    // Validate structure
    if (
      !structuredCase.mental &&
      !structuredCase.generals &&
      !structuredCase.particulars &&
      !structuredCase.modalities
    ) {
      throw new CustomError('At least one symptom category is required', 400);
    }

    // Check if summary generation is available
    const isAvailable = await caseSummaryGenerator.isAvailable();
    if (!isAvailable) {
      throw new CustomError('AI summary generation is not available. Please configure OpenAI API key.', 503);
    }

    // Generate summary
    const summary = await caseSummaryGenerator.generateSummary(
      structuredCase as StructuredCase,
      normalizedCase as NormalizedCaseProfile
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai-case-taking/transcribe-audio
 * @desc    Transcribe audio file using OpenAI Whisper
 * @access  Private (Doctor only)
 * @body    multipart: audio (file), language (optional, e.g. en-US, hi-IN)
 */
export const transcribeAudio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file || !req.file.buffer) {
      throw new CustomError('Audio file is required', 400);
    }

    const isAvailable = await whisperTranscription.isAvailable();
    if (!isAvailable) {
      throw new CustomError('Whisper transcription is not available. Please configure OpenAI API key.', 503);
    }

    const language = (req.body?.language as string) || null;
    const { text } = await whisperTranscription.transcribe(
      req.file.buffer,
      req.file.mimetype || 'audio/webm',
      language
    );

    res.status(200).json({
      success: true,
      data: { text },
    });
  } catch (error) {
    next(error);
  }
};
