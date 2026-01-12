import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Payment from '../models/Payment.model.js';
import Subscription from '../models/Subscription.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/payments
 * @desc    Get all payments (admin only)
 */
export const getPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Unauthorized', 403);
    }

    const { limit = 100 } = req.query;

    const payments = await Payment.find()
      .populate('subscriptionId', 'planId status billingCycle')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics (admin only)
 */
export const getPaymentStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Unauthorized', 403);
    }

    const payments = await Payment.find({ status: 'completed' }).lean();

    const now = new Date();
    const thisMonth = payments.filter((p) => {
      const date = new Date(p.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const lastMonth = payments.filter((p) => {
      const date = new Date(p.createdAt);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const thisMonthRevenue = thisMonth.reduce((sum, p) => sum + p.amount, 0);
    const lastMonthRevenue = lastMonth.reduce((sum, p) => sum + p.amount, 0);
    const growthRate = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : '0';

    res.json({
      success: true,
      data: {
        totalRevenue,
        thisMonthRevenue,
        lastMonthRevenue,
        growthRate: parseFloat(growthRate),
        totalTransactions: payments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/payments
 * @desc    Create new payment
 */
export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subscriptionId, amount, currency, paymentMethod, transactionId } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new CustomError('Subscription not found', 404);
    }

    const payment = await Payment.create({
      subscriptionId: subscription._id,
      doctorId: subscription.doctorId,
      amount,
      currency: currency || 'INR',
      status: 'completed',
      paymentMethod,
      transactionId,
    });

    // Update subscription status to active if payment is completed
    if (payment.status === 'completed' && subscription.status === 'pending') {
      subscription.status = 'active';
      await subscription.save();
    }

    const populated = await Payment.findById(payment._id)
      .populate('subscriptionId', 'planId status billingCycle')
      .populate('doctorId', 'name specialization')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

