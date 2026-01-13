import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Symptom from '../models/Symptom.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/symptoms
 * @desc    Get all symptoms (global + doctor-specific)
 */
export const getSymptoms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Find doctor ID
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;

    // Determine which modality to filter by
    let modalityFilter: string[] = [];
    if (doctor) {
      if (doctor.modality === 'electro_homeopathy') {
        modalityFilter = ['electro_homeopathy'];
      } else if (doctor.modality === 'classical_homeopathy') {
        modalityFilter = ['classical_homeopathy'];
      } else if (doctor.modality === 'both') {
        // If both, use preferredModality, or show both if not set
        if (doctor.preferredModality) {
          modalityFilter = [doctor.preferredModality];
        } else {
          modalityFilter = ['electro_homeopathy', 'classical_homeopathy'];
        }
      } else {
        // Default to electro_homeopathy if modality is not set
        modalityFilter = ['electro_homeopathy'];
      }
    } else {
      // If no doctor profile, default to electro_homeopathy
      modalityFilter = ['electro_homeopathy'];
    }

    // Get global symptoms and doctor-specific symptoms filtered by modality
    const symptoms = await Symptom.find({
      $or: [{ isGlobal: true }, { doctorId }],
      modality: { $in: modalityFilter },
    })
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      count: symptoms.length,
      data: symptoms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/symptoms/:id
 * @desc    Get single symptom
 */
export const getSymptom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const symptom = await Symptom.findById(id);

    if (!symptom) {
      throw new CustomError('Symptom not found', 404);
    }

    res.json({
      success: true,
      data: symptom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/symptoms
 * @desc    Create new symptom
 */
export const createSymptom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, category, description, isGlobal } = req.body;

    // Find doctor ID
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;

    // Only super_admin can create global symptoms
    if (isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Only super admin can create global symptoms', 403);
    }

    const symptom = await Symptom.create({
      name,
      category,
      description,
      isGlobal: isGlobal || false,
      doctorId: isGlobal ? undefined : doctorId,
    });

    res.status(201).json({
      success: true,
      message: 'Symptom created successfully',
      data: symptom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/symptoms/:id
 * @desc    Update symptom
 */
export const updateSymptom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body;

    const symptom = await Symptom.findById(id);
    if (!symptom) {
      throw new CustomError('Symptom not found', 404);
    }

    // Check permissions
    if (symptom.isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Cannot modify global symptoms', 403);
    }

    const doctor = await Doctor.findOne({ userId });
    if (!symptom.isGlobal && symptom.doctorId?.toString() !== doctor?._id.toString()) {
      throw new CustomError('Cannot modify other doctor\'s symptoms', 403);
    }

    const updatedSymptom = await Symptom.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Symptom updated successfully',
      data: updatedSymptom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/symptoms/:id
 * @desc    Delete symptom
 */
export const deleteSymptom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const symptom = await Symptom.findById(id);
    if (!symptom) {
      throw new CustomError('Symptom not found', 404);
    }

    // Check permissions
    if (symptom.isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Cannot delete global symptoms', 403);
    }

    const doctor = await Doctor.findOne({ userId });
    if (!symptom.isGlobal && symptom.doctorId?.toString() !== doctor?._id.toString()) {
      throw new CustomError('Cannot delete other doctor\'s symptoms', 403);
    }

    await Symptom.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Symptom deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

