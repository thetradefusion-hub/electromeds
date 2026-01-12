import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Patient from '../models/Patient.model.js';
import Prescription from '../models/Prescription.model.js';
import Appointment from '../models/Appointment.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import mongoose from 'mongoose';

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard statistics
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let doctorId;

    // For staff, use assignedDoctorId
    if (userRole === 'staff') {
      const assignedDoctorId = req.user!.assignedDoctorId;
      console.log('getDashboardStats: Staff assignedDoctorId:', assignedDoctorId);
      if (!assignedDoctorId) {
        throw new CustomError('Staff not assigned to any doctor', 400);
      }
      // Convert string to ObjectId
      doctorId = new mongoose.Types.ObjectId(assignedDoctorId);
      console.log('getDashboardStats: Staff doctorId (ObjectId):', doctorId);
    } else {
      // For doctors, find doctor ID
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }
      doctorId = doctor._id;
      console.log('getDashboardStats: Doctor doctorId:', doctorId);
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const weekEnd = endOfDay(addDays(today, 7)); // Next 7 days

    // Total patients
    const totalPatients = await Patient.countDocuments({ doctorId });
    console.log('getDashboardStats: Total patients:', totalPatients);

    // Today's patients
    const todayPatients = await Patient.countDocuments({
      doctorId,
      visitDate: { $gte: todayStart, $lte: todayEnd },
    });
    console.log('getDashboardStats: Today patients:', todayPatients);

    // Pending follow-ups (next 7 days) - from today to 7 days ahead
    // Only count prescriptions with followUpDate set
    const pendingFollowUps = await Prescription.countDocuments({
      doctorId,
      followUpDate: { $exists: true, $gte: todayStart, $lte: weekEnd },
    });
    console.log('getDashboardStats: Pending follow-ups:', pendingFollowUps);

    // Total prescriptions
    const totalPrescriptions = await Prescription.countDocuments({
      doctorId,
    });
    console.log('getDashboardStats: Total prescriptions:', totalPrescriptions);

    res.json({
      success: true,
      data: {
        totalPatients,
        todayPatients,
        pendingFollowUps,
        totalPrescriptions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/patients
 * @desc    Get patient analytics
 */
export const getPatientAnalytics = async (
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
      query.visitDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Patient statistics
    const totalPatients = await Patient.countDocuments(query);
    const newPatients = await Patient.countDocuments({
      ...query,
      caseType: 'new',
    });
    const oldPatients = await Patient.countDocuments({
      ...query,
      caseType: 'old',
    });

    // Gender distribution
    const genderStats = await Patient.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]);

    // Age distribution
    const ageStats = await Patient.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 18] }, then: '0-17' },
                { case: { $lt: ['$age', 30] }, then: '18-29' },
                { case: { $lt: ['$age', 45] }, then: '30-44' },
                { case: { $lt: ['$age', 60] }, then: '45-59' },
              ],
              default: '60+',
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        newPatients,
        oldPatients,
        genderDistribution: genderStats,
        ageDistribution: ageStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/prescriptions
 * @desc    Get prescription analytics
 */
export const getPrescriptionAnalytics = async (
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
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const totalPrescriptions = await Prescription.countDocuments(query);

    // Monthly prescription trend
    const monthlyTrend = await Prescription.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top medicines
    const topMedicines = await Prescription.aggregate([
      { $match: query },
      { $unwind: '$medicines' },
      {
        $group: {
          _id: '$medicines.name',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Top symptoms
    const topSymptoms = await Prescription.aggregate([
      { $match: query },
      { $unwind: '$symptoms' },
      {
        $group: {
          _id: '$symptoms.name',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalPrescriptions,
        monthlyTrend,
        topMedicines,
        topSymptoms,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/appointments
 * @desc    Get appointment analytics
 */
export const getAppointmentAnalytics = async (
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
      query.appointmentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Total appointments
    const totalAppointments = await Appointment.countDocuments(query);

    // Status distribution
    const statusStats = await Appointment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Booking type distribution
    const bookingTypeStats = await Appointment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$bookingType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Daily appointment trend
    const dailyTrend = await Appointment.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalAppointments,
        statusDistribution: statusStats,
        bookingTypeDistribution: bookingTypeStats,
        dailyTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/revenue
 * @desc    Get revenue analytics (for SaaS admin)
 */
export const getRevenueAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Only super_admin can access revenue analytics
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Access denied', 403);
    }

    const { startDate, endDate } = req.query;

    // This would require Payment model - implement when needed
    res.json({
      success: true,
      message: 'Revenue analytics - Coming soon',
      data: {
        totalRevenue: 0,
        monthlyRevenue: [],
      },
    });
  } catch (error) {
    next(error);
  }
};

