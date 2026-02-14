import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import Rubric from '../models/Rubric.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/repertory/chapters
 * @desc    Get all unique chapters from repertory
 */
export const getChapters = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { repertoryType = 'publicum' } = req.query;

    // Get distinct chapters with rubric counts
    const chaptersWithCounts = await Rubric.aggregate([
      {
        $match: {
          repertoryType: repertoryType as string,
        },
      },
      {
        $group: {
          _id: '$chapter',
          rubricCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          rubricCount: 1,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    res.json({
      success: true,
      data: chaptersWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/repertory/rubrics
 * @desc    Get rubrics by chapter or search query
 */
export const getRubrics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { chapter, search, repertoryType = 'publicum', page = 1, limit = 50 } = req.query;

    const query: any = {
      repertoryType: repertoryType as string,
    };

    if (chapter) {
      query.chapter = chapter as string;
    }

    if (search) {
      query.$or = [
        { rubricText: { $regex: search as string, $options: 'i' } },
        { chapter: { $regex: search as string, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [rubrics, total] = await Promise.all([
      Rubric.find(query)
        .select('_id chapter rubricText repertoryType')
        .sort({ chapter: 1, rubricText: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Rubric.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: rubrics,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/repertory/rubrics/:id
 * @desc    Get single rubric by ID
 */
export const getRubric = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const rubric = await Rubric.findById(id).lean();

    if (!rubric) {
      throw new CustomError('Rubric not found', 404);
    }

    res.json({
      success: true,
      data: rubric,
    });
  } catch (error) {
    next(error);
  }
};
