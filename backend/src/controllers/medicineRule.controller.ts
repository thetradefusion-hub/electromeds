import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import MedicineRule from '../models/MedicineRule.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/rules
 * @desc    Get all medicine rules (global + doctor-specific)
 */
export const getMedicineRules = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;

    // Get global rules and doctor-specific rules
    const rules = await MedicineRule.find({
      $or: [{ isGlobal: true }, { doctorId }],
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: rules.length,
      data: rules,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rules/:id
 * @desc    Get single medicine rule
 */
export const getMedicineRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const rule = await MedicineRule.findById(id);

    if (!rule) {
      throw new CustomError('Medicine rule not found', 404);
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/rules
 * @desc    Create new medicine rule
 */
export const createMedicineRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      description,
      symptomIds,
      medicineIds,
      dosage,
      duration,
      priority,
      isGlobal,
    } = req.body;

    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;

    // Only super_admin can create global rules
    if (isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Only super admin can create global rules', 403);
    }

    const rule = await MedicineRule.create({
      name,
      description,
      symptomIds: symptomIds || [],
      medicineIds: medicineIds || [],
      dosage,
      duration,
      priority: priority || 0,
      isGlobal: isGlobal || false,
      doctorId: isGlobal ? undefined : doctorId,
    });

    res.status(201).json({
      success: true,
      message: 'Medicine rule created successfully',
      data: rule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/rules/:id
 * @desc    Update medicine rule
 */
export const updateMedicineRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body;

    const rule = await MedicineRule.findById(id);
    if (!rule) {
      throw new CustomError('Medicine rule not found', 404);
    }

    // Check permissions
    if (rule.isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Cannot modify global rules', 403);
    }

    const doctor = await Doctor.findOne({ userId });
    if (!rule.isGlobal && rule.doctorId?.toString() !== doctor?._id.toString()) {
      throw new CustomError('Cannot modify other doctor\'s rules', 403);
    }

    const updatedRule = await MedicineRule.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Medicine rule updated successfully',
      data: updatedRule,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/rules/:id
 * @desc    Delete medicine rule
 */
export const deleteMedicineRule = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const rule = await MedicineRule.findById(id);
    if (!rule) {
      throw new CustomError('Medicine rule not found', 404);
    }

    // Check permissions
    if (rule.isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Cannot delete global rules', 403);
    }

    const doctor = await Doctor.findOne({ userId });
    if (!rule.isGlobal && rule.doctorId?.toString() !== doctor?._id.toString()) {
      throw new CustomError('Cannot delete other doctor\'s rules', 403);
    }

    await MedicineRule.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Medicine rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/rules/suggest
 * @desc    Get medicine suggestions based on symptoms
 */
export const suggestMedicines = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { symptomIds } = req.body;

    if (!symptomIds || !Array.isArray(symptomIds) || symptomIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Symptom IDs array is required',
      });
      return;
    }

    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;

    // Find matching rules
    const rules = await MedicineRule.find({
      $or: [{ isGlobal: true }, { doctorId }],
      symptomIds: { $in: symptomIds },
    })
      .sort({ priority: -1 })
      .lean();

    // Extract unique medicine IDs from matching rules
    const medicineIds = new Set<string>();
    rules.forEach((rule) => {
      rule.medicineIds.forEach((id) => medicineIds.add(id));
    });

    res.json({
      success: true,
      data: {
        rules: rules.slice(0, 10), // Top 10 matching rules
        suggestedMedicineIds: Array.from(medicineIds),
      },
    });
  } catch (error) {
    next(error);
  }
};

