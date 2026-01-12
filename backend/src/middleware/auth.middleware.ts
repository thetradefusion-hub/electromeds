import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { CustomError } from './errorHandler.js';
import User from '../models/User.model.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    assignedDoctorId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new CustomError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
    };

    // Verify user still exists and get assignedDoctorId for staff
    const user = await User.findById(decoded.id).select('email role assignedDoctorId');
    
    if (!user) {
      throw new CustomError('User not found', 401);
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      assignedDoctorId: user.assignedDoctorId?.toString(),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new CustomError('Authentication required', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new CustomError('Access denied. Insufficient permissions', 403));
      return;
    }

    next();
  };
};

