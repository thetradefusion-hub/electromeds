import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import PatientMedicalReport from '../models/PatientMedicalReport.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/medical-reports
 * @desc    Get all medical reports
 */
export const getMedicalReports = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { patientId } = req.query;

    let query: any = {};

    // For doctors, only show their reports
    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }
      query.doctorId = doctor._id;
    }
    // For super_admin, show all reports

    if (patientId) {
      query.patientId = patientId;
    }

    const reports = await PatientMedicalReport.find(query)
      .populate('patientId', 'name patientId age gender')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/medical-reports/:id
 * @desc    Get single medical report
 */
export const getMedicalReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const report = await PatientMedicalReport.findById(id)
      .populate('patientId', 'name patientId age gender')
      .populate('doctorId', 'name specialization')
      .lean();

    if (!report) {
      throw new CustomError('Medical report not found', 404);
    }

    // Check permissions
    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || report.doctorId?._id?.toString() !== doctor._id.toString()) {
        throw new CustomError('Unauthorized', 403);
      }
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/medical-reports
 * @desc    Create new medical report
 */
export const createMedicalReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { patientId, reportType, fileName, fileUrl, analysis, notes } = req.body;
    
    // Note: fileUrl is optional - file storage not required for AI analysis
    // If fileUrl is not provided, we can still save the analysis results

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const report = await PatientMedicalReport.create({
      patientId,
      doctorId: doctor._id,
      reportType,
      fileName,
      fileUrl,
      analysis: analysis || {
        reportType,
        findings: [],
        summary: '',
        concernAreas: [],
        recommendations: [],
      },
      notes,
    });

    const populated = await PatientMedicalReport.findById(report._id)
      .populate('patientId', 'name patientId age gender')
      .populate('doctorId', 'name specialization')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Medical report created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/medical-reports/:id
 * @desc    Update medical report
 */
export const updateMedicalReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const updateData = req.body;

    const report = await PatientMedicalReport.findById(id);
    if (!report) {
      throw new CustomError('Medical report not found', 404);
    }

    // Check permissions
    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || report.doctorId.toString() !== doctor._id.toString()) {
        throw new CustomError('Unauthorized', 403);
      }
    }

    const updatedReport = await PatientMedicalReport.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name patientId age gender')
      .populate('doctorId', 'name specialization')
      .lean();

    res.json({
      success: true,
      message: 'Medical report updated successfully',
      data: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/medical-reports/:id
 * @desc    Delete medical report
 */
export const deleteMedicalReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const report = await PatientMedicalReport.findById(id);
    if (!report) {
      throw new CustomError('Medical report not found', 404);
    }

    // Check permissions
    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || report.doctorId.toString() !== doctor._id.toString()) {
        throw new CustomError('Unauthorized', 403);
      }
    }

    await PatientMedicalReport.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Medical report deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

