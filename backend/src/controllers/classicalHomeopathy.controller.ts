/**
 * Classical Homeopathy Controller
 * 
 * Handles all API endpoints for Classical Homeopathy Smart Rule Engine
 */

import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Doctor from '../models/Doctor.model.js';
import CaseRecord from '../models/CaseRecord.model.js';
import Prescription from '../models/Prescription.model.js';
import Remedy from '../models/Remedy.model.js';
import ClassicalHomeopathyRuleEngine from '../services/classicalHomeopathyRuleEngine.service.js';
import OutcomeLearningHook from '../services/outcomeLearning.service.js';
import remedyProfileGenerator from '../services/remedyProfileGenerator.service.js';
import { generatePrescriptionNo } from '../utils/generateId.js';
import type { StructuredCase } from '../services/caseEngine.service.js';

/**
 * @route   POST /api/classical-homeopathy/suggest
 * @desc    Get remedy suggestions based on structured case
 * @access  Private (Doctor only)
 */
export const suggestRemedies = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  try {
    console.log('[suggestRemedies] Request received');
    const userId = req.user!.id;
    const { patientId, structuredCase, patientHistory, selectedRubricIds } = req.body;

    console.log('[suggestRemedies] Request data:', {
      patientId,
      structuredCaseKeys: structuredCase ? Object.keys(structuredCase) : null,
      mentalCount: structuredCase?.mental?.length || 0,
      generalsCount: structuredCase?.generals?.length || 0,
      particularsCount: structuredCase?.particulars?.length || 0,
      modalitiesCount: structuredCase?.modalities?.length || 0,
      hasPatientHistory: !!patientHistory,
    });

    // Validation
    if (!patientId) {
      res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
      return;
    }

    if (!structuredCase) {
      res.status(400).json({
        success: false,
        message: 'Structured case is required',
      });
      return;
    }

    // Validate structured case structure
    if (
      !structuredCase.mental &&
      !structuredCase.generals &&
      !structuredCase.particulars &&
      !structuredCase.modalities
    ) {
      res.status(400).json({
        success: false,
        message: 'At least one symptom category (mental, generals, particulars, or modalities) is required',
      });
      return;
    }

    // Get doctor
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Check if doctor has Classical Homeopathy modality
    if (
      doctor.modality !== 'classical_homeopathy' &&
      doctor.modality !== 'both'
    ) {
      res.status(403).json({
        success: false,
        message: 'Classical Homeopathy is not enabled for your account',
      });
      return;
    }

    const doctorId = doctor._id;

    console.log('[suggestRemedies] Doctor found:', {
      doctorId: doctorId.toString(),
      modality: doctor.modality,
    });

    // Initialize rule engine
    console.log('[suggestRemedies] Initializing rule engine...');
    const ruleEngine = new ClassicalHomeopathyRuleEngine();

    // Normalize patientHistory dates (from JSON they may be strings)
    const normalizedHistory =
      Array.isArray(patientHistory) && patientHistory.length > 0
        ? patientHistory.map((h: { remedyId: string; date: string | Date }) => ({
            remedyId: h.remedyId,
            date: h.date instanceof Date ? h.date : new Date(h.date),
          }))
        : undefined;

    // Process case (optionally with user-confirmed rubric IDs from AI input)
    console.log('[suggestRemedies] Processing case...', selectedRubricIds?.length ? `with ${selectedRubricIds.length} user-selected rubrics` : '', normalizedHistory?.length ? `with ${normalizedHistory.length} past remedies` : '');
    const result = await ruleEngine.processCase(
      doctorId,
      new mongoose.Types.ObjectId(patientId),
      structuredCase as StructuredCase,
      normalizedHistory,
      selectedRubricIds
    );

    console.log('[suggestRemedies] Case processed successfully:', {
      suggestionsCount: result.suggestions?.topRemedies?.length || 0,
      caseRecordId: result.caseRecordId?.toString(),
    });

    res.json({
      success: true,
      data: {
        suggestions: result.suggestions,
        caseRecordId: result.caseRecordId,
      },
    });
  } catch (error: any) {
    console.error('Error in suggestRemedies:', error);
    console.error('Error stack:', error.stack);
    // Return more detailed error message for debugging
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get remedy suggestions',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * @route   PUT /api/classical-homeopathy/case/:id/decision
 * @desc    Update doctor's final remedy decision
 * @access  Private (Doctor only)
 */
export const updateDoctorDecision = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { finalRemedy } = req.body;

    // Validation
    if (!finalRemedy) {
      res.status(400).json({
        success: false,
        message: 'Final remedy is required',
      });
      return;
    }

    if (!finalRemedy.remedyId || !finalRemedy.remedyName || !finalRemedy.potency || !finalRemedy.repetition) {
      res.status(400).json({
        success: false,
        message: 'Remedy ID, name, potency, and repetition are required',
      });
      return;
    }

    // Get doctor
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Get case record
    const caseRecord = await CaseRecord.findById(id);
    if (!caseRecord) {
      res.status(404).json({
        success: false,
        message: 'Case record not found',
      });
      return;
    }

    // Verify doctor owns this case record
    if (caseRecord.doctorId.toString() !== doctor._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this case record',
      });
      return;
    }

    // Initialize outcome hook
    const outcomeHook = new OutcomeLearningHook();

    // Update decision
    await outcomeHook.updateDoctorDecision(
      new mongoose.Types.ObjectId(id),
      {
        remedyId: new mongoose.Types.ObjectId(finalRemedy.remedyId),
        remedyName: finalRemedy.remedyName,
        potency: finalRemedy.potency,
        repetition: finalRemedy.repetition,
        notes: finalRemedy.notes,
      }
    );

    // Convert case record to prescription format
    const allSymptoms = [
      ...(caseRecord.structuredCase?.mental || []).map((s) => ({ ...s, category: 'mental' })),
      ...(caseRecord.structuredCase?.generals || []).map((s) => ({ ...s, category: 'general' })),
      ...(caseRecord.structuredCase?.particulars || []).map((s) => ({ ...s, category: 'particular' })),
      ...(caseRecord.structuredCase?.modalities || []).map((s) => ({ ...s, category: 'modality' })),
    ];

    // Convert symptoms to prescription format
    const prescriptionSymptoms = allSymptoms
      .filter((symptom) => symptom.symptomName) // Filter out any invalid symptoms
      .map((symptom) => ({
        symptomId: symptom.symptomCode || symptom.symptomName || 'UNKNOWN',
        name: symptom.symptomName || 'Unknown Symptom',
        severity: (symptom.weight || 1) >= 2.5 ? 'high' : (symptom.weight || 1) >= 1.5 ? 'medium' : 'low',
        duration: 7, // Default duration
        durationUnit: 'days' as const,
      }));

    // Convert remedy to prescription format
    const prescriptionMedicines = [
      {
        medicineId: finalRemedy.remedyId.toString(),
        name: finalRemedy.remedyName,
        category: 'Classical Remedy',
        modality: 'classical_homeopathy' as const,
        potency: finalRemedy.potency,
        repetition: finalRemedy.repetition,
        instructions: finalRemedy.notes || '',
      },
    ];

    // Generate prescription number
    const prescriptionNo = await generatePrescriptionNo();

    // Build diagnosis from pathology tags (if available)
    const pathologyTags = caseRecord.structuredCase?.pathologyTags || [];
    const diagnosis = pathologyTags.length > 0 ? pathologyTags.join(', ') : undefined;

    // Create prescription
    const prescription = await Prescription.create({
      prescriptionNo,
      patientId: caseRecord.patientId,
      doctorId: doctor._id,
      modality: 'classical_homeopathy',
      symptoms: prescriptionSymptoms,
      medicines: prescriptionMedicines,
      diagnosis,
      advice: finalRemedy.notes || undefined,
    });

    // Populate prescription
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'patientId name age gender mobile address')
      .lean();

    res.json({
      success: true,
      message: 'Doctor decision updated and prescription created successfully',
      data: {
        prescription: populatedPrescription,
        caseRecordId: id,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in updateDoctorDecision:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    next(error);
  }
};

/**
 * @route   PUT /api/classical-homeopathy/case/:id/summary
 * @desc    Save case summary to case record
 * @access  Private (Doctor only)
 */
export const saveCaseSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { caseSummary } = req.body;

    // Validation
    if (!caseSummary) {
      res.status(400).json({
        success: false,
        message: 'Case summary is required',
      });
      return;
    }

    if (!caseSummary.clinicalSummary || !caseSummary.homeopathicSummary) {
      res.status(400).json({
        success: false,
        message: 'Clinical summary and homeopathic summary are required',
      });
      return;
    }

    // Get doctor
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Get case record
    const caseRecord = await CaseRecord.findById(id);
    if (!caseRecord) {
      res.status(404).json({
        success: false,
        message: 'Case record not found',
      });
      return;
    }

    // Verify doctor owns this case
    if (caseRecord.doctorId.toString() !== doctor._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to update this case record',
      });
      return;
    }

    // Update case summary
    caseRecord.caseSummary = {
      clinicalSummary: caseSummary.clinicalSummary,
      homeopathicSummary: caseSummary.homeopathicSummary,
      keynotes: caseSummary.keynotes || [],
      strangeSymptoms: caseSummary.strangeSymptoms || [],
      generatedAt: caseRecord.caseSummary?.generatedAt || new Date(),
      updatedAt: new Date(),
    };

    await caseRecord.save();

    res.json({
      success: true,
      message: 'Case summary saved successfully',
      data: {
        caseRecord,
      },
    });
  } catch (error: any) {
    console.error('Error in saveCaseSummary:', error);
    next(error);
  }
};

/**
 * @route   PUT /api/classical-homeopathy/case/:id/outcome
 * @desc    Update case outcome status
 * @access  Private (Doctor only)
 */
export const updateOutcome = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { outcomeStatus, followUpNotes } = req.body;

    // Validation
    if (!outcomeStatus) {
      res.status(400).json({
        success: false,
        message: 'Outcome status is required',
      });
      return;
    }

    const validStatuses = ['improved', 'no_change', 'worsened', 'not_followed'];
    if (!validStatuses.includes(outcomeStatus)) {
      res.status(400).json({
        success: false,
        message: `Outcome status must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    // Get doctor
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Initialize outcome hook
    const outcomeHook = new OutcomeLearningHook();

    // Update outcome
    await outcomeHook.updateOutcome(
      new mongoose.Types.ObjectId(id),
      outcomeStatus,
      followUpNotes
    );

    res.json({
      success: true,
      message: 'Outcome updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/classical-homeopathy/remedies
 * @desc    Get all remedies (global + doctor-specific) with search, filter, and sort
 * @access  Private (Doctor only)
 */
export const getRemedies = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { search, category, sortBy = 'name', page = 1, limit = 1000 } = req.query;

    // Find doctor ID
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;

    // Determine if doctor can see remedies
    // Remedies should be shown if:
    // 1. Doctor has classical_homeopathy modality
    // 2. Doctor has both modalities (regardless of preferred)
    let shouldShowRemedies = false;
    
    if (doctor) {
      if (doctor.modality === 'classical_homeopathy' || doctor.modality === 'both') {
        shouldShowRemedies = true;
      }
    }

    if (!shouldShowRemedies) {
      // If only electro_homeopathy, don't show remedies
      res.json({
        success: true,
        count: 0,
        data: [],
        pagination: {
          page: 1,
          limit: Number(limit),
          total: 0,
          pages: 0,
        },
      });
      return;
    }

    // Build query: base + optional search + category
    const baseMatch = {
      $or: [{ isGlobal: true }, { doctorId }],
      modality: 'classical_homeopathy',
    } as any;

    if (category && typeof category === 'string' && category !== 'all') {
      baseMatch.category = category;
    }

    const andConditions: any[] = [baseMatch];

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search, 'i');
      andConditions.push({
        $or: [
          { name: searchRegex },
          { 'materiaMedica.keynotes': { $in: [searchRegex] } },
          { 'materiaMedica.pathogenesis': searchRegex },
          { 'materiaMedica.clinicalNotes': searchRegex },
          { clinicalIndications: { $in: [searchRegex] } },
          { constitutionTraits: { $in: [searchRegex] } },
        ],
      });
    }

    const query = andConditions.length === 1 ? baseMatch : { $and: andConditions };

    // Sort options
    let sortOption: any = { name: 1 }; // Default: sort by name
    if (sortBy === 'name') {
      sortOption = { name: 1 };
    } else if (sortBy === 'category') {
      sortOption = { category: 1, name: 1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get remedies with pagination
    const [remedies, total] = await Promise.all([
      Remedy.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Remedy.countDocuments(query),
    ]);

    console.log(`[getRemedies] Found ${remedies.length} remedies (${total} total) for doctor ${doctorId?.toString() || 'none'}, doctor modality: ${doctor?.modality || 'none'}`);

    res.json({
      success: true,
      count: remedies.length,
      data: remedies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/classical-homeopathy/remedies/:id/profile
 * @desc    Get AI-generated remedy profile (Quick Highlights, Mind, Physical, Modalities, Differentials)
 * @access  Private (Doctor only)
 */
export const getRemedyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findOne({ userId: req.user!.id });
    const doctorId = doctor?._id;

    const remedy = await Remedy.findOne({
      _id: id,
      $or: [{ isGlobal: true }, { doctorId }],
    }).lean();

    if (!remedy) {
      res.status(404).json({ success: false, message: 'Remedy not found' });
      return;
    }

    const existingData = {
      category: remedy.category,
      materiaMedica: remedy.materiaMedica,
      modalities: remedy.modalities,
    };

    const profile = await remedyProfileGenerator.generateProfile(remedy.name, existingData);

    res.json({
      success: true,
      data: {
        remedyId: remedy._id,
        ...profile,
      },
    });
  } catch (error: any) {
    console.error('[getRemedyProfile] Error:', error?.message);
    next(error);
  }
};

/**
 * @route   PUT /api/classical-homeopathy/case/:id/question-answers
 * @desc    Update case record with question answers and history
 * @access  Private (Doctor only)
 */
export const updateQuestionAnswers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { questionAnswers, questionHistory } = req.body;

    // Verify case record exists and belongs to doctor
    const caseRecord = await CaseRecord.findOne({
      _id: id,
      doctorId: userId,
    });

    if (!caseRecord) {
      res.status(404).json({
        success: false,
        message: 'Case record not found',
      });
      return;
    }

    // Update question answers
    const outcomeHook = new OutcomeLearningHook();
    await outcomeHook.updateQuestionAnswers(
      new mongoose.Types.ObjectId(id),
      questionAnswers || [],
      questionHistory || []
    );

    res.status(200).json({
      success: true,
      message: 'Question answers updated successfully',
    });
  } catch (error: any) {
    console.error('❌ Error in updateQuestionAnswers:', error);
    next(error);
  }
};

/**
 * @route   GET /api/classical-homeopathy/case/patient/:patientId
 * @desc    Get all case records for a patient
 * @access  Private (Doctor only)
 */
export const getPatientCaseRecords = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { patientId } = req.params;

    // Validation
    if (!patientId) {
      res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
      return;
    }

    // Get doctor
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Get case records for this patient
    const caseRecords = await CaseRecord.find({
      patientId: new mongoose.Types.ObjectId(patientId),
      doctorId: doctor._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: {
        caseRecords,
      },
    });
  } catch (error: any) {
    console.error('Error in getPatientCaseRecords:', error);
    next(error);
  }
};

/**
 * @route   GET /api/classical-homeopathy/statistics/remedy/:id
 * @desc    Get success rate statistics for a remedy
 * @access  Private (Doctor only)
 */
export const getRemedyStatistics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Get doctor
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Initialize outcome hook
    const outcomeHook = new OutcomeLearningHook();

    // Prepare time range if provided
    const timeRange = startDate && endDate
      ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        }
      : undefined;

    // Calculate success rate
    const statistics = await outcomeHook.calculateSuccessRate(
      new mongoose.Types.ObjectId(id),
      timeRange
    );

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/classical-homeopathy/statistics/patterns
 * @desc    Get symptom-remedy patterns for analysis
 * @access  Private (Doctor only)
 */
export const getSymptomRemedyPatterns = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { symptomCode } = req.query;

    // Validation
    if (!symptomCode) {
      res.status(400).json({
        success: false,
        message: 'Symptom code is required',
      });
      return;
    }

    // Get doctor
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
      return;
    }

    // Initialize outcome hook
    const outcomeHook = new OutcomeLearningHook();

    // Find patterns
    const patterns = await outcomeHook.findSymptomRemedyPatterns(symptomCode as string);

    res.json({
      success: true,
      data: {
        symptomCode,
        patterns,
      },
    });
  } catch (error) {
    next(error);
  }
};
