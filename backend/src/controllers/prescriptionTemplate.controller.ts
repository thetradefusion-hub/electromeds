import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import PrescriptionTemplate from '../models/PrescriptionTemplate.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/prescription-templates
 * @desc    Get all prescription templates for logged-in doctor
 */
export const getPrescriptionTemplates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let doctorId;

    // For super_admin, get all templates
    if (userRole === 'super_admin') {
      const templates = await PrescriptionTemplate.find()
        .populate('doctorId', 'name specialization')
        .sort({ name: 1 })
        .lean();

      res.json({
        success: true,
        count: templates.length,
        data: templates,
      });
      return;
    }

    // For doctors, find doctor ID
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    doctorId = doctor._id;

    const templates = await PrescriptionTemplate.find({ doctorId })
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/prescription-templates/:id
 * @desc    Get single prescription template
 */
export const getPrescriptionTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const template = await PrescriptionTemplate.findById(id);
    if (!template) {
      throw new CustomError('Prescription template not found', 404);
    }

    // Check permissions (only owner or super_admin can view)
    if (userRole !== 'super_admin') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || template.doctorId.toString() !== doctor._id.toString()) {
        throw new CustomError('Unauthorized', 403);
      }
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/prescription-templates
 * @desc    Create new prescription template
 */
export const createPrescriptionTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, description, symptoms, medicines, diagnosis, advice } = req.body;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const template = await PrescriptionTemplate.create({
      doctorId: doctor._id,
      name,
      description,
      symptoms: symptoms || [],
      medicines: medicines || [],
      diagnosis,
      advice,
    });

    res.status(201).json({
      success: true,
      message: 'Prescription template created successfully',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/prescription-templates/:id
 * @desc    Update prescription template
 */
export const updatePrescriptionTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const updateData = req.body;

    const template = await PrescriptionTemplate.findById(id);
    if (!template) {
      throw new CustomError('Prescription template not found', 404);
    }

    // Check permissions
    if (userRole !== 'super_admin') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || template.doctorId.toString() !== doctor._id.toString()) {
        throw new CustomError('Unauthorized', 403);
      }
    }

    const updatedTemplate = await PrescriptionTemplate.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Prescription template updated successfully',
      data: updatedTemplate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/prescription-templates/:id
 * @desc    Delete prescription template
 */
export const deletePrescriptionTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const template = await PrescriptionTemplate.findById(id);
    if (!template) {
      throw new CustomError('Prescription template not found', 404);
    }

    // Check permissions
    if (userRole !== 'super_admin') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || template.doctorId.toString() !== doctor._id.toString()) {
        throw new CustomError('Unauthorized', 403);
      }
    }

    await PrescriptionTemplate.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Prescription template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

