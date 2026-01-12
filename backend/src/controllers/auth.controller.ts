import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User.model.js';
import Doctor from '../models/Doctor.model.js';
import { generateToken } from '../utils/generateToken.js';
import { CustomError } from '../middleware/errorHandler.js';

interface SignUpRequest extends Request {
  body: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: 'super_admin' | 'doctor' | 'staff';
    registration_no?: string;
    qualification?: string;
    specialization?: string;
    clinic_name?: string;
    clinic_address?: string;
  };
}

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 */
export const signUp = async (
  req: SignUpRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const {
      email,
      password,
      name,
      phone,
      role,
      registration_no,
      qualification,
      specialization,
      clinic_name,
      clinic_address,
    } = req.body;

    // Normalize email: lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists (using normalized email)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Create user (email will be automatically lowercased by schema)
    const user = await User.create({
      email: normalizedEmail,
      password,
      name,
      phone,
      role,
    });

    // If role is doctor, create doctor profile
    if (role === 'doctor' && registration_no && qualification) {
      await Doctor.create({
        userId: user._id,
        registrationNo: registration_no,
        qualification,
        specialization: specialization || 'Electro Homoeopathy',
        clinicName: clinic_name,
        clinicAddress: clinic_address,
      });
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    // Find user and include password (normalize email to lowercase for case-insensitive search)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new CustomError('User not authenticated', 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          assignedDoctorId: user.assignedDoctorId?.toString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 */
export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Since we're using JWT, logout is handled client-side
    // This endpoint just confirms the logout
    res.json({
      success: true,
      message: 'Logout successful. Please remove token from client storage.',
    });
  } catch (error) {
    next(error);
  }
};

