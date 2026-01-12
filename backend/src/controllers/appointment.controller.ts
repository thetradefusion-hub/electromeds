import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Appointment from '../models/Appointment.model.js';
import DoctorAvailability from '../models/DoctorAvailability.model.js';
import BlockedDate from '../models/BlockedDate.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/appointments
 * @desc    Get all appointments for logged-in doctor
 */
export const getAppointments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { date, status } = req.query;

    // Find doctor ID
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const query: any = { doctorId: doctor._id };

    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'patientId name age gender mobile')
      .sort({ appointmentDate: 1, timeSlot: 1 })
      .lean();

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment
 */
export const getAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctorId: doctor._id,
    }).populate('patientId', 'patientId name age gender mobile');

    if (!appointment) {
      throw new CustomError('Appointment not found', 404);
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 */
export const createAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      patientId,
      patientName,
      patientMobile,
      appointmentDate,
      timeSlot,
      status,
      bookingType,
      notes,
    } = req.body;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    // Validate: either patientId or patientName+patientMobile required
    if (!patientId && (!patientName || !patientMobile)) {
      res.status(400).json({
        success: false,
        message: 'Either patientId or patientName+patientMobile is required',
      });
      return;
    }

    const appointment = await Appointment.create({
      doctorId: doctor._id,
      patientId: patientId || undefined,
      patientName: patientName || undefined,
      patientMobile: patientMobile || undefined,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: status || 'pending',
      bookingType: bookingType || 'walk_in',
      notes: notes || undefined,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'patientId name age gender mobile');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: populatedAppointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment
 */
export const updateAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const updateData = req.body;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    if (updateData.appointmentDate) {
      updateData.appointmentDate = new Date(updateData.appointmentDate);
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, doctorId: doctor._id },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('patientId', 'patientId name age gender mobile');

    if (!appointment) {
      throw new CustomError('Appointment not found', 404);
    }

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete appointment
 */
export const deleteAppointment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const appointment = await Appointment.findOneAndDelete({
      _id: id,
      doctorId: doctor._id,
    });

    if (!appointment) {
      throw new CustomError('Appointment not found', 404);
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/appointments/availability
 * @desc    Get doctor availability schedule
 */
export const getAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const availability = await DoctorAvailability.find({
      doctorId: doctor._id,
      isActive: true,
    }).sort({ dayOfWeek: 1 });

    res.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/appointments/availability
 * @desc    Set doctor availability
 */
export const setAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { dayOfWeek, startTime, endTime, slotDuration, isActive } = req.body;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const availability = await DoctorAvailability.findOneAndUpdate(
      { doctorId: doctor._id, dayOfWeek },
      {
        startTime,
        endTime,
        slotDuration: slotDuration || 15,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/appointments/blocked-dates
 * @desc    Get blocked dates
 */
export const getBlockedDates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const query: any = { doctorId: doctor._id };

    if (startDate && endDate) {
      query.blockedDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const blockedDates = await BlockedDate.find(query).sort({ blockedDate: 1 });

    res.json({
      success: true,
      data: blockedDates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/appointments/blocked-dates
 * @desc    Block a date
 */
export const blockDate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { blockedDate, reason } = req.body;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const blocked = await BlockedDate.findOneAndUpdate(
      { doctorId: doctor._id, blockedDate: new Date(blockedDate) },
      { reason: reason || undefined },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Date blocked successfully',
      data: blocked,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/appointments/blocked-dates/:id
 * @desc    Unblock a date
 */
export const unblockDate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const blocked = await BlockedDate.findOneAndDelete({
      _id: id,
      doctorId: doctor._id,
    });

    if (!blocked) {
      throw new CustomError('Blocked date not found', 404);
    }

    res.json({
      success: true,
      message: 'Date unblocked successfully',
    });
  } catch (error) {
    next(error);
  }
};

