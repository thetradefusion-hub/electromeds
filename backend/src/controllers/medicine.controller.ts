import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Medicine from '../models/Medicine.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/medicines
 * @desc    Get all medicines (global + doctor-specific)
 */
export const getMedicines = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Find doctor ID
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;

    // Get global medicines and doctor-specific medicines
    const medicines = await Medicine.find({
      $or: [{ isGlobal: true }, { doctorId }],
    })
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/medicines/:id
 * @desc    Get single medicine
 */
export const getMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      throw new CustomError('Medicine not found', 404);
    }

    res.json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/medicines
 * @desc    Create new medicine
 */
export const createMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      category,
      indications,
      defaultDosage,
      contraIndications,
      notes,
      isGlobal,
    } = req.body;

    // Find doctor ID
    const doctor = await Doctor.findOne({ userId });
    const doctorId = doctor?._id;

    // Only super_admin can create global medicines
    if (isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Only super admin can create global medicines', 403);
    }

    const medicine = await Medicine.create({
      name,
      category,
      indications,
      defaultDosage,
      contraIndications,
      notes,
      isGlobal: isGlobal || false,
      doctorId: isGlobal ? undefined : doctorId,
    });

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/medicines/:id
 * @desc    Update medicine
 */
export const updateMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body;

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      throw new CustomError('Medicine not found', 404);
    }

    // Check permissions
    if (medicine.isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Cannot modify global medicines', 403);
    }

    const doctor = await Doctor.findOne({ userId });
    if (!medicine.isGlobal && medicine.doctorId?.toString() !== doctor?._id.toString()) {
      throw new CustomError('Cannot modify other doctor\'s medicines', 403);
    }

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: updatedMedicine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/medicines/:id
 * @desc    Delete medicine
 */
export const deleteMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      throw new CustomError('Medicine not found', 404);
    }

    // Check permissions
    if (medicine.isGlobal && req.user!.role !== 'super_admin') {
      throw new CustomError('Cannot delete global medicines', 403);
    }

    const doctor = await Doctor.findOne({ userId });
    if (!medicine.isGlobal && medicine.doctorId?.toString() !== doctor?._id.toString()) {
      throw new CustomError('Cannot delete other doctor\'s medicines', 403);
    }

    await Medicine.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Medicine deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

