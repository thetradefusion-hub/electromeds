import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import SupportTicket from '../models/SupportTicket.model.js';
import Doctor from '../models/Doctor.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/support-tickets
 * @desc    Get all support tickets
 */
export const getSupportTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let query: any = {};

    // For doctors, only show their tickets
    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }
      query.doctorId = doctor._id;
    }
    // For super_admin, show all tickets

    const tickets = await SupportTicket.find(query)
      .populate('doctorId', 'name specialization')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/support-tickets/:id
 * @desc    Get single support ticket
 */
export const getSupportTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const ticket = await SupportTicket.findById(id)
      .populate('doctorId', 'name specialization')
      .populate('assignedTo', 'name email')
      .lean();

    if (!ticket) {
      throw new CustomError('Support ticket not found', 404);
    }

    // Check permissions
    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || ticket.doctorId?._id?.toString() !== doctor._id.toString()) {
        throw new CustomError('Unauthorized', 403);
      }
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/support-tickets
 * @desc    Create new support ticket
 */
export const createSupportTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { subject, description, category, priority } = req.body;

    let doctorId;

    // For doctors, use their doctor ID
    if (req.user!.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        throw new CustomError('Doctor profile not found', 404);
      }
      doctorId = doctor._id;
    }
    // For super_admin, doctorId can be null

    const ticket = await SupportTicket.create({
      doctorId,
      subject,
      description,
      category: category || 'general',
      priority: priority || 'medium',
      status: 'open',
    });

    const populated = await SupportTicket.findById(ticket._id)
      .populate('doctorId', 'name specialization')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/support-tickets/:id
 * @desc    Update support ticket
 */
export const updateSupportTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const updateData = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      throw new CustomError('Support ticket not found', 404);
    }

    // Check permissions
    if (userRole === 'doctor') {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor || ticket.doctorId?.toString() !== doctor._id.toString()) {
        throw new CustomError('Unauthorized', 403);
      }
      // Doctors can only update their own tickets, and only certain fields
      const allowedFields = ['subject', 'description', 'status'];
      Object.keys(updateData).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateData[key];
        }
      });
    }

    // If status is being set to resolved, set resolvedAt
    if (updateData.status === 'resolved' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    } else if (updateData.status !== 'resolved' && ticket.resolvedAt) {
      updateData.resolvedAt = null;
    }

    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('doctorId', 'name specialization')
      .populate('assignedTo', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'Support ticket updated successfully',
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/support-tickets/:id
 * @desc    Delete support ticket
 */
export const deleteSupportTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    // const userId = req.user!.id; // Reserved for future use
    const userRole = req.user!.role;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      throw new CustomError('Support ticket not found', 404);
    }

    // Only super_admin can delete tickets
    if (userRole !== 'super_admin') {
      throw new CustomError('Unauthorized', 403);
    }

    await SupportTicket.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Support ticket deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

