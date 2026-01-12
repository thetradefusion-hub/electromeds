import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Subscription from '../models/Subscription.model.js';
import SubscriptionPlan from '../models/SubscriptionPlan.model.js';
import Doctor from '../models/Doctor.model.js';
import Patient from '../models/Patient.model.js';
import Prescription from '../models/Prescription.model.js';
import PatientMedicalReport from '../models/PatientMedicalReport.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/subscriptions/me
 * @desc    Get current doctor's subscription
 */
export const getMySubscription = async (
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

    const subscription = await Subscription.findOne({ doctorId: doctor._id, status: 'active' })
      .populate('planId', 'name priceMonthly priceYearly features patientLimit doctorLimit aiAnalysisQuota')
      .lean();

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/usage
 * @desc    Get usage statistics for current doctor
 */
export const getUsageStats = async (
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

    const [patientsCount, prescriptionsCount, reportsCount] = await Promise.all([
      Patient.countDocuments({ doctorId: doctor._id }),
      Prescription.countDocuments({ doctorId: doctor._id }),
      PatientMedicalReport.countDocuments({ doctorId: doctor._id }),
    ]);

    res.json({
      success: true,
      data: {
        patientsCount,
        prescriptionsCount,
        aiAnalysisCount: reportsCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/subscriptions/plans
 * @desc    Get all active subscription plans
 */
export const getSubscriptionPlans = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ priceMonthly: 1 })
      .lean();

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/subscriptions
 * @desc    Create new subscription
 */
export const createSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { planId, billingCycle } = req.body;

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      throw new CustomError('Doctor profile not found', 404);
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      throw new CustomError('Subscription plan not found or inactive', 404);
    }

    // Check if doctor already has an active subscription
    const existingSubscription = await Subscription.findOne({
      doctorId: doctor._id,
      status: 'active',
    });

    if (existingSubscription) {
      throw new CustomError('Doctor already has an active subscription', 400);
    }

    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Create subscription with trial (7 days)
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const subscription = await Subscription.create({
      doctorId: doctor._id,
      planId: plan._id,
      status: 'trial',
      billingCycle: billingCycle || 'monthly',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEndsAt,
    });

    const populated = await Subscription.findById(subscription._id)
      .populate('planId', 'name priceMonthly priceYearly features patientLimit doctorLimit aiAnalysisQuota')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/subscriptions/:id/cancel
 * @desc    Cancel subscription
 */
export const cancelSubscription = async (
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

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      throw new CustomError('Subscription not found', 404);
    }

    if (subscription.doctorId.toString() !== doctor._id.toString()) {
      throw new CustomError('Unauthorized', 403);
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

