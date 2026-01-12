import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Doctor from '../models/Doctor.model.js';
import User from '../models/User.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/doctors/public
 * @desc    Get all doctors (public endpoint, no auth required)
 */
export const getPublicDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const doctors = await Doctor.find({})
      .populate('userId', 'name email phone avatar')
      .select('registrationNo qualification specialization clinicName clinicAddress')
      .lean();

    const doctorsList = doctors.map((doctor) => {
      const user = doctor.userId as any;
      return {
        id: doctor._id.toString(),
        name: user?.name || 'Doctor',
        email: user?.email || '',
        phone: user?.phone || '',
        avatar: user?.avatar || '',
        clinicName: doctor.clinicName || null,
        clinicAddress: doctor.clinicAddress || null,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        registrationNo: doctor.registrationNo,
      };
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
 * @route   GET /api/doctors/me
 * @desc    Get current doctor's profile (or user profile for super_admin)
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // For super_admin, return user profile without doctor profile
    if (userRole === 'super_admin') {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      res.json({
        success: true,
        data: {
          doctor: {
            id: user._id.toString(),
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar,
            registrationNo: 'ADMIN',
            qualification: 'System Administrator',
            specialization: 'Administration',
            clinicName: null,
            clinicAddress: null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      });
      return;
    }

    // For doctors, return doctor profile
    const doctor = await Doctor.findOne({ userId })
      .populate('userId', 'name email phone avatar');

    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const user = doctor.userId as any;

    res.json({
      success: true,
      data: {
        doctor: {
          id: doctor._id,
          userId: doctor.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          registrationNo: doctor.registrationNo,
          qualification: doctor.qualification,
          specialization: doctor.specialization,
          clinicName: doctor.clinicName,
          clinicAddress: doctor.clinicAddress,
          createdAt: doctor.createdAt,
          updatedAt: doctor.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/doctors/me
 * @desc    Update current doctor's profile
 */
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      qualification,
      specialization,
      clinicName,
      clinicAddress,
      name,
      phone,
    } = req.body;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    // Update doctor profile
    if (qualification || specialization || clinicName || clinicAddress) {
      await Doctor.findByIdAndUpdate(doctor._id, {
        qualification: qualification || doctor.qualification,
        specialization: specialization || doctor.specialization,
        clinicName: clinicName !== undefined ? clinicName : doctor.clinicName,
        clinicAddress: clinicAddress !== undefined ? clinicAddress : doctor.clinicAddress,
        updatedAt: new Date(),
      });
    }

    // Update user profile
    if (name || phone) {
      await User.findByIdAndUpdate(userId, {
        name: name || undefined,
        phone: phone !== undefined ? phone : undefined,
        updatedAt: new Date(),
      });
    }

    const updatedDoctor = await Doctor.findOne({ userId })
      .populate('userId', 'name email phone avatar');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        doctor: updatedDoctor,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/doctors/staff
 * @desc    Create staff member (doctor only, auto-assigned to creating doctor)
 */
export const createStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Only doctors can create staff
    if (userRole !== 'doctor') {
      throw new CustomError('Only doctors can create staff members', 403);
    }

    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      throw new CustomError('Name, email, and password are required', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new CustomError('Email already registered', 400);
    }

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    // Create staff user (password will be automatically hashed by User model's pre('save') hook)
    const staffUser = await User.create({
      name,
      email: email.toLowerCase(),
      password, // Pass plain password - pre('save') hook will hash it
      phone: phone || undefined,
      role: 'staff',
      assignedDoctorId: doctor._id, // Auto-assign to creating doctor
      createdBy: userId, // Track who created this staff
      isActive: true,
    });

    // Return staff without password
    const staffData = await User.findById(staffUser._id)
      .select('-password')
      .populate('assignedDoctorId', 'registrationNo specialization clinicName')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staffData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/doctors/staff
 * @desc    Get all staff members assigned to current doctor
 */
export const getMyStaff = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Only doctors can view their staff
    if (userRole !== 'doctor') {
      throw new CustomError('Only doctors can view their staff', 403);
    }

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    // Get all staff assigned to this doctor
    const staffMembers = await User.find({
      role: 'staff',
      assignedDoctorId: doctor._id,
    })
      .select('-password')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: staffMembers.length,
      data: staffMembers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/doctors/staff/:id/status
 * @desc    Update staff status (activate/deactivate) - Doctor can only manage their own staff
 */
export const updateStaffStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;
    const { isActive } = req.body;

    // Only doctors can update their staff status
    if (userRole !== 'doctor') {
      throw new CustomError('Only doctors can update staff status', 403);
    }

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    // Find staff member and verify it belongs to this doctor
    const staff = await User.findOne({
      _id: id,
      role: 'staff',
      assignedDoctorId: doctor._id,
    });

    if (!staff) {
      throw new CustomError('Staff member not found or not assigned to you', 404);
    }

    // Update status
    const updatedStaff = await User.findByIdAndUpdate(
      id,
      { isActive, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: `Staff member ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedStaff,
    });
  } catch (error) {
    next(error);
  }
};
