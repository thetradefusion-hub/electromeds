import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import Doctor from '../models/Doctor.model.js';
import Medicine from '../models/Medicine.model.js';
import Symptom from '../models/Symptom.model.js';
import Patient from '../models/Patient.model.js';
import Prescription from '../models/Prescription.model.js';
import Appointment from '../models/Appointment.model.js';
import Subscription from '../models/Subscription.model.js';
import CaseRecord from '../models/CaseRecord.model.js';
import Remedy from '../models/Remedy.model.js';
import Rubric from '../models/Rubric.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (super_admin only)
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const users = await User.find({})
      .select('-password')
      .populate('assignedDoctorId', 'registrationNo specialization clinicName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role (super_admin only)
 */
export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    user.role = role;
    await user.save();

    const updated = await User.findById(id)
      .select('-password')
      .populate('assignedDoctorId', 'registrationNo specialization clinicName')
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (super_admin only)
 */
export const updateUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    user.isActive = isActive;
    await user.save();

    const updated = await User.findById(id)
      .select('-password')
      .populate('assignedDoctorId', 'registrationNo specialization clinicName')
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/users/:id/assign-doctor
 * @desc    Assign doctor to staff (super_admin only)
 */
export const assignDoctorToStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;
    const { doctorId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (user.role !== 'staff') {
      throw new CustomError('Can only assign doctors to staff users', 400);
    }

    user.assignedDoctorId = doctorId as any;
    await user.save();

    const updated = await User.findById(id)
      .select('-password')
      .populate('assignedDoctorId', 'registrationNo specialization clinicName')
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'Doctor assigned to staff successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/users/:id/unassign-doctor
 * @desc    Unassign doctor from staff (super_admin only)
 */
export const unassignDoctorFromStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    if (user.role !== 'staff') {
      throw new CustomError('Can only unassign doctors from staff users', 400);
    }

    user.assignedDoctorId = undefined;
    await user.save();

    const updated = await User.findById(id)
      .select('-password')
      .populate('assignedDoctorId', 'registrationNo specialization clinicName')
      .populate('createdBy', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'Doctor unassigned from staff successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/staff
 * @desc    Create staff by admin (super_admin only)
 */
export const createStaffByAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { name, email, password, phone, doctorId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new CustomError('User with this email already exists', 400);
    }

    // Create staff user
    const staffUser = await User.create({
      name,
      email: email.toLowerCase(),
      password, // Pass plain password - pre('save') hook will hash it
      phone: phone || undefined,
      role: 'staff',
      assignedDoctorId: doctorId,
      createdBy: req.user!.id,
      isActive: true,
    });

    const created = await User.findById(staffUser._id)
      .select('-password')
      .populate('assignedDoctorId', 'registrationNo specialization clinicName')
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/doctors
 * @desc    Get all doctors (super_admin only)
 * @note    Returns all users with role='doctor', including those without Doctor profiles
 */
export const getAllDoctors = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    // Get all users with role='doctor'
    const doctorUsers = await User.find({ role: 'doctor' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Get all Doctor profiles
    const doctorProfiles = await Doctor.find({})
      .populate('userId', 'name email phone role isActive')
      .lean();

    // Create a map of userId to Doctor profile for quick lookup
    const doctorProfileMap = new Map();
    doctorProfiles.forEach((profile: any) => {
      const userId = profile.userId?._id?.toString() || profile.userId?.toString();
      if (userId) {
        doctorProfileMap.set(userId, profile);
      }
    });

    // Combine user data with doctor profile data
    const doctorsList = doctorUsers.map((user: any) => {
      const doctorProfile = doctorProfileMap.get(user._id.toString());
      
      if (doctorProfile) {
        // User has Doctor profile - return combined data
        const profile = doctorProfile;
        const populatedUser = profile.userId as any;
        return {
          id: profile._id.toString(),
          userId: user._id.toString(),
          name: populatedUser?.name || user.name,
          email: populatedUser?.email || user.email,
          phone: populatedUser?.phone || user.phone,
          registrationNo: profile.registrationNo || 'N/A',
          qualification: profile.qualification || 'N/A',
          specialization: profile.specialization || 'Electro Homoeopathy',
          clinicName: profile.clinicName,
          clinicAddress: profile.clinicAddress,
          role: populatedUser?.role || user.role,
          isActive: populatedUser?.isActive !== undefined ? populatedUser.isActive : user.isActive,
          createdAt: user.createdAt,
        };
      } else {
        // User doesn't have Doctor profile yet - return user data with defaults
        return {
          id: user._id.toString(), // Use userId as id since no Doctor profile exists
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          registrationNo: 'Not set',
          qualification: 'Not set',
          specialization: 'Electro Homoeopathy',
          clinicName: null,
          clinicAddress: null,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        };
      }
    });

    res.json({
      success: true,
      count: doctorsList.length,
      data: doctorsList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/doctors/:id
 * @desc    Update doctor (super_admin only)
 */
export const updateDoctor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;
    const { name, phone, qualification, specialization, clinic_name, clinic_address, registration_no } = req.body;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      throw new CustomError('Doctor not found', 404);
    }

    // Update doctor fields
    if (qualification) doctor.qualification = qualification;
    if (specialization) doctor.specialization = specialization;
    if (clinic_name) doctor.clinicName = clinic_name;
    if (clinic_address) doctor.clinicAddress = clinic_address;
    if (registration_no) doctor.registrationNo = registration_no;

    await doctor.save();

    // Update user name and phone if provided
    if (name || phone) {
      const user = await User.findById(doctor.userId);
      if (user) {
        if (name) user.name = name;
        if (phone) user.phone = phone;
        await user.save();
      }
    }

    const updated = await Doctor.findById(id)
      .populate('userId', 'name email phone role isActive')
      .lean();

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/global-medicines
 * @desc    Get all global medicines (super_admin only)
 */
export const getGlobalMedicines = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const medicines = await Medicine.find({ isGlobal: true })
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
 * @route   POST /api/admin/global-medicines
 * @desc    Create global medicine (super_admin only)
 */
export const createGlobalMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const medicine = await Medicine.create({
      ...req.body,
      isGlobal: true,
    });

    res.status(201).json({
      success: true,
      message: 'Global medicine created successfully',
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/global-medicines/:id
 * @desc    Update global medicine (super_admin only)
 */
export const updateGlobalMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;
    const medicine = await Medicine.findByIdAndUpdate(id, req.body, { new: true });

    if (!medicine) {
      throw new CustomError('Medicine not found', 404);
    }

    res.json({
      success: true,
      message: 'Global medicine updated successfully',
      data: medicine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/global-medicines/:id
 * @desc    Delete global medicine (super_admin only)
 */
export const deleteGlobalMedicine = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;
    const medicine = await Medicine.findByIdAndDelete(id);

    if (!medicine) {
      throw new CustomError('Medicine not found', 404);
    }

    res.json({
      success: true,
      message: 'Global medicine deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/global-symptoms
 * @desc    Get all global symptoms (super_admin only)
 */
export const getGlobalSymptoms = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    // Get all global symptoms (both Electro and Classical Homeopathy)
    const symptoms = await Symptom.find({ isGlobal: true })
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
 * @route   POST /api/admin/global-symptoms
 * @desc    Create global symptom (super_admin only)
 */
export const createGlobalSymptom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const symptom = await Symptom.create({
      ...req.body,
      isGlobal: true,
    });

    res.status(201).json({
      success: true,
      message: 'Global symptom created successfully',
      data: symptom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/admin/global-symptoms/:id
 * @desc    Update global symptom (super_admin only)
 */
export const updateGlobalSymptom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;
    const symptom = await Symptom.findByIdAndUpdate(id, req.body, { new: true });

    if (!symptom) {
      throw new CustomError('Symptom not found', 404);
    }

    res.json({
      success: true,
      message: 'Global symptom updated successfully',
      data: symptom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/global-symptoms/:id
 * @desc    Delete global symptom (super_admin only)
 */
export const deleteGlobalSymptom = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { id } = req.params;
    const symptom = await Symptom.findByIdAndDelete(id);

    if (!symptom) {
      throw new CustomError('Symptom not found', 404);
    }

    res.json({
      success: true,
      message: 'Global symptom deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics (super_admin only)
 */
export const getPlatformStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const [
      totalUsers,
      totalDoctors,
      totalStaff,
      totalPatients,
      totalPrescriptions,
      totalAppointments,
      // Classical Homeopathy stats
      totalCaseRecords,
      totalRemedies,
      totalRubrics,
      // Modality breakdown
      electroPrescriptions,
      classicalPrescriptions,
      electroDoctors,
      classicalDoctors,
      bothModalityDoctors,
      // Global symptoms and medicines
      totalGlobalSymptoms,
      totalGlobalMedicines,
      totalSymptoms,
      totalMedicines,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'staff' }),
      Patient.countDocuments({}),
      Prescription.countDocuments({}),
      Appointment.countDocuments({}),
      // Classical Homeopathy
      CaseRecord.countDocuments({}),
      Remedy.countDocuments({}),
      Rubric.countDocuments({}),
      // Modality breakdown
      Prescription.countDocuments({ modality: 'electro_homeopathy' }),
      Prescription.countDocuments({ modality: 'classical_homeopathy' }),
      Doctor.countDocuments({ modality: 'electro_homeopathy' }),
      Doctor.countDocuments({ modality: 'classical_homeopathy' }),
      Doctor.countDocuments({ modality: 'both' }),
      // Global symptoms and medicines
      Symptom.countDocuments({ isGlobal: true }),
      Medicine.countDocuments({ isGlobal: true }),
      Symptom.countDocuments({}),
      Medicine.countDocuments({}),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalStaff,
        totalPatients,
        totalPrescriptions,
        totalAppointments,
        // Classical Homeopathy
        totalCaseRecords,
        totalRemedies,
        totalRubrics,
        // Global symptoms and medicines
        totalGlobalSymptoms,
        totalGlobalMedicines,
        totalSymptoms,
        totalMedicines,
        // Modality breakdown
        prescriptionsByModality: {
          electro_homeopathy: electroPrescriptions,
          classical_homeopathy: classicalPrescriptions,
        },
        doctorsByModality: {
          electro_homeopathy: electroDoctors,
          classical_homeopathy: classicalDoctors,
          both: bothModalityDoctors,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/subscriptions
 * @desc    Get all subscriptions (Admin only)
 */
export const getAllSubscriptions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const subscriptions = await Subscription.find({})
      .populate('doctorId', 'name specialization clinicName')
      .populate('planId', 'name priceMonthly priceYearly')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    next(error);
  }
};
