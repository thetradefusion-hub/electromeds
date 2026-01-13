import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
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

    // Get global rules and doctor-specific rules filtered by modality
    const rules = await MedicineRule.find({
      $or: [{ isGlobal: true }, { doctorId }],
      modality: { $in: modalityFilter },
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
 * @desc    Get medicine suggestions based on symptoms (ENHANCED with intelligent scoring)
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

    // Determine which modality to filter by
    let modalityFilter: string[] = [];
    if (doctor) {
      if (doctor.modality === 'electro_homeopathy') {
        modalityFilter = ['electro_homeopathy'];
      } else if (doctor.modality === 'classical_homeopathy') {
        modalityFilter = ['classical_homeopathy'];
      } else if (doctor.modality === 'both') {
        if (doctor.preferredModality) {
          modalityFilter = [doctor.preferredModality];
        } else {
          modalityFilter = ['electro_homeopathy', 'classical_homeopathy'];
        }
      } else {
        modalityFilter = ['electro_homeopathy'];
      }
    } else {
      modalityFilter = ['electro_homeopathy'];
    }

    // Use enhanced rule engine for Electro Homeopathy
    if (modalityFilter.includes('electro_homeopathy') && modalityFilter.length === 1) {
      // Import here to avoid circular dependency
      const ElectroHomeopathyRuleEngine = (await import('../services/electroHomeopathyRuleEngine.service.js')).default;
      const ruleEngine = new ElectroHomeopathyRuleEngine();
      
      const result = await ruleEngine.suggestMedicines(symptomIds, doctorId);
      
      // Convert to expected format
      const suggestedMedicineIds = result.suggestions.map((s) => s.medicineId);
      const rules = result.suggestions.flatMap((s) => s.matchedRules);

      res.json({
        success: true,
        data: {
          rules: rules.slice(0, 10),
          suggestedMedicineIds,
          scoredMedicines: result.suggestions, // Include scored medicines for frontend
          summary: result.summary,
        },
      });
      return;
    }

    // Fallback to original logic for Classical Homeopathy or mixed modalities
    // Convert symptomIds to ObjectIds if they're strings
    const symptomObjectIds = symptomIds.map((id) => {
      try {
        return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
      } catch {
        return id; // Keep as is if not a valid ObjectId
      }
    });

    // Find matching rules filtered by modality
    // A rule matches if ANY of the provided symptomIds is in the rule's symptomIds array
    const rules = await MedicineRule.find({
      $or: [{ isGlobal: true }, { doctorId }],
      symptomIds: { $in: symptomObjectIds },
      modality: { $in: modalityFilter },
    })
      .sort({ priority: -1 })
      .lean();

    console.log(`[suggestMedicines] Query details:`, {
      symptomIdsCount: symptomIds.length,
      symptomObjectIdsCount: symptomObjectIds.length,
      doctorId: doctorId?.toString() || 'none',
      modalityFilter: modalityFilter,
      rulesFound: rules.length,
    });

    // Extract unique medicine IDs from matching rules
    const medicineIds = new Set<string>();
    rules.forEach((rule) => {
      if (rule.medicineIds && rule.medicineIds.length > 0) {
        rule.medicineIds.forEach((id) => {
          const idStr = id.toString();
          medicineIds.add(idStr);
        });
      }
    });

    console.log(`[suggestMedicines] Extracted ${medicineIds.size} unique medicine IDs from ${rules.length} rules`);
    
    if (rules.length === 0) {
      console.log(`[suggestMedicines] No rules found. Checking if any rules exist with modality filter...`);
      const totalRulesWithModality = await MedicineRule.countDocuments({
        $or: [{ isGlobal: true }, { doctorId }],
        modality: { $in: modalityFilter },
      });
      console.log(`[suggestMedicines] Total rules with modality ${modalityFilter.join(', ')}: ${totalRulesWithModality}`);
      
      if (totalRulesWithModality > 0) {
        const sampleRule = await MedicineRule.findOne({
          $or: [{ isGlobal: true }, { doctorId }],
          modality: { $in: modalityFilter },
        }).select('symptomIds').lean();
        if (sampleRule) {
          console.log(`[suggestMedicines] Sample rule symptomIds:`, sampleRule.symptomIds?.slice(0, 3));
          console.log(`[suggestMedicines] Requested symptomIds:`, symptomIds.slice(0, 3));
        }
      }
    }

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

