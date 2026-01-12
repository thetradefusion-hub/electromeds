import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Prescription from '../models/Prescription.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';
import { generatePrescriptionNo } from '../utils/generateId.js';

/**
 * @route   GET /api/prescriptions
 * @desc    Get all prescriptions for logged-in doctor
 */
export const getPrescriptions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { patientId, startDate, endDate } = req.query;

    let doctorId;

    // For super_admin, get all prescriptions
    if (userRole === 'super_admin') {
      const query: any = {};

      if (patientId) {
        query.patientId = patientId;
      }

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      }

      const prescriptions = await Prescription.find(query)
        .populate('patientId', 'patientId name age gender mobile address')
        .populate('doctorId', 'registrationNo specialization')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        count: prescriptions.length,
        data: prescriptions,
      });
      return;
    }

    // For doctors, find doctor ID
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    doctorId = doctor._id;

    const query: any = { doctorId };

    if (patientId) {
      query.patientId = patientId;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'patientId name age gender mobile address')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/prescriptions/:id
 * @desc    Get single prescription
 */
export const getPrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    let prescription;

    // For super_admin, get any prescription
    if (userRole === 'super_admin') {
      prescription = await Prescription.findById(id)
        .populate('patientId', 'patientId name age gender mobile address')
        .populate('doctorId', 'registrationNo specialization');
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }

      prescription = await Prescription.findOne({
        _id: id,
        doctorId: doctor._id,
      }).populate('patientId', 'patientId name age gender mobile address');
    }

    if (!prescription) {
      throw new CustomError('Prescription not found', 404);
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/prescriptions
 * @desc    Create new prescription
 */
export const createPrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const {
      patientId,
      symptoms,
      medicines,
      diagnosis,
      advice,
      followUpDate,
      doctorId: providedDoctorId,
    } = req.body;

    let doctorIdToUse;

    // For super_admin, they can specify which doctor to assign prescription to
    if (userRole === 'super_admin') {
      if (providedDoctorId) {
        doctorIdToUse = providedDoctorId;
      } else {
        throw new CustomError('Doctor ID is required for super_admin', 400);
      }
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }
      doctorIdToUse = doctor._id;
    }

    const prescriptionNo = await generatePrescriptionNo(doctorIdToUse.toString());

    const prescription = await Prescription.create({
      prescriptionNo,
      patientId,
      doctorId: doctorIdToUse,
      symptoms: symptoms || [],
      medicines: medicines || [],
      diagnosis: diagnosis || undefined,
      advice: advice || undefined,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'patientId name age gender mobile address');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: populatedPrescription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/prescriptions/:id
 * @desc    Update prescription
 */
export const updatePrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;
    const updateData: any = req.body;

    // Handle followUpDate: if undefined/null, remove it
    const updateQuery: any = { ...updateData, updatedAt: new Date() };
    
    if (updateData.followUpDate === undefined || updateData.followUpDate === null) {
      updateQuery.$unset = { followUpDate: '' };
      delete updateQuery.followUpDate;
    } else if (updateData.followUpDate) {
      updateQuery.followUpDate = new Date(updateData.followUpDate);
    }

    let prescription;

    // For super_admin, can update any prescription
    if (userRole === 'super_admin') {
      prescription = await Prescription.findOneAndUpdate(
        { _id: id },
        updateQuery,
        { new: true, runValidators: true }
      )
        .populate('patientId', 'patientId name age gender mobile address')
        .populate('doctorId', 'registrationNo specialization');
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }

      prescription = await Prescription.findOneAndUpdate(
        { _id: id, doctorId: doctor._id },
        updateQuery,
        { new: true, runValidators: true }
      ).populate('patientId', 'patientId name age gender mobile address');
    }

    if (!prescription) {
      throw new CustomError('Prescription not found', 404);
    }

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/prescriptions/:id
 * @desc    Delete prescription
 */
export const deletePrescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { id } = req.params;

    let prescription;

    // For super_admin, can delete any prescription
    if (userRole === 'super_admin') {
      prescription = await Prescription.findOneAndDelete({ _id: id });
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }

      prescription = await Prescription.findOneAndDelete({
        _id: id,
        doctorId: doctor._id,
      });
    }

    if (!prescription) {
      throw new CustomError('Prescription not found', 404);
    }

    res.json({
      success: true,
      message: 'Prescription deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
