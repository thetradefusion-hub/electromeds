import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Patient from '../models/Patient.model.js';
import Doctor from '../models/Doctor.model.js';
import { generatePatientId } from '../utils/generateId.js';
import { CustomError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

/**
 * @route   GET /api/patients
 * @desc    Get all patients for logged-in doctor
 */
export const getPatients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let doctorId;

    // For super_admin, get all patients
    if (userRole === 'super_admin') {
      const patients = await Patient.find({})
        .populate('doctorId', 'registrationNo specialization')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        count: patients.length,
        data: patients,
      });
      return;
    }

    // For staff, use assignedDoctorId
    if (userRole === 'staff') {
      const assignedDoctorId = req.user!.assignedDoctorId;
      if (!assignedDoctorId) {
        throw new CustomError('Staff not assigned to any doctor', 400);
      }
      // Convert string to ObjectId
      doctorId = new mongoose.Types.ObjectId(assignedDoctorId);
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }
      doctorId = doctor._id;
    }

    const patients = await Patient.find({ doctorId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/patients/:id
 * @desc    Get single patient
 */
export const getPatient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    let patient;

    // For super_admin, get any patient
    if (userRole === 'super_admin') {
      patient = await Patient.findById(id);
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }

      patient = await Patient.findOne({
        _id: id,
        doctorId: doctor._id,
      });
    }

    if (!patient) {
      throw new CustomError('Patient not found', 404);
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/patients
 * @desc    Create new patient
 */
export const createPatient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { name, age, gender, mobile, address, caseType, doctorId: providedDoctorId } = req.body;

    let doctorIdToUse;

    // For super_admin, they can specify which doctor to assign patient to
    if (userRole === 'super_admin') {
      if (providedDoctorId) {
        doctorIdToUse = providedDoctorId;
      } else {
        throw new CustomError('Doctor ID is required for super_admin', 400);
      }
    } else if (userRole === 'doctor') {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }
      doctorIdToUse = doctor._id;
    } else if (userRole === 'staff') {
      // For staff, use assigned doctor
      if (!req.user!.assignedDoctorId) {
        throw new CustomError('Staff member is not assigned to any doctor. Please contact admin for assignment.', 400);
      }
      // Verify assigned doctor exists
      const assignedDoctor = await Doctor.findById(req.user!.assignedDoctorId);
      if (!assignedDoctor) {
        throw new CustomError('Assigned doctor not found. Please contact admin.', 404);
      }
      doctorIdToUse = req.user!.assignedDoctorId;
    } else {
      throw new CustomError('Invalid user role', 400);
    }

    // Generate patient ID
    const patientId = await generatePatientId();

    const patient = await Patient.create({
      patientId,
      doctorId: doctorIdToUse,
      name,
      age,
      gender,
      mobile,
      address,
      caseType: caseType || 'new',
    });

    res.status(201).json({
      success: true,
      message: `Patient registered with ID: ${patientId}`,
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/patients/:id
 * @desc    Update patient
 */
export const updatePatient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;
    const updateData = req.body;

    let patient;

    // For super_admin, can update any patient
    if (userRole === 'super_admin') {
      patient = await Patient.findOneAndUpdate(
        { _id: id },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }

      patient = await Patient.findOneAndUpdate(
        { _id: id, doctorId: doctor._id },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    }

    if (!patient) {
      throw new CustomError('Patient not found', 404);
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete patient
 */
export const deletePatient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    let patient;

    // For super_admin, can delete any patient
    if (userRole === 'super_admin') {
      patient = await Patient.findOneAndDelete({ _id: id });
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }

      patient = await Patient.findOneAndDelete({
        _id: id,
        doctorId: doctor._id,
      });
    }

    if (!patient) {
      throw new CustomError('Patient not found', 404);
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/patients/:id/visit
 * @desc    Record patient visit
 */
export const recordVisit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Find doctor ID
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const patient = await Patient.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      {
        visitDate: new Date(),
        caseType: 'old',
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!patient) {
      throw new CustomError('Patient not found', 404);
    }

    res.json({
      success: true,
      message: 'Visit recorded successfully',
      data: patient,
    });
  } catch (error) {
    next(error);
  }
};

