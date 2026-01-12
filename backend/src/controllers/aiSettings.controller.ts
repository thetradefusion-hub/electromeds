import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import AISettings from '../models/AISettings.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   GET /api/admin/ai-settings
 * @desc    Get AI settings (admin only)
 */
export const getAISettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Unauthorized', 403);
    }

    const settings = await AISettings.findOne({ isActive: true }).lean();

    if (!settings) {
      res.json({
        success: true,
        data: null,
        message: 'AI settings not configured',
      });
      return;
    }

    // Don't return full API key for security
    res.json({
      success: true,
      data: {
        _id: settings._id,
        aiProvider: settings.aiProvider,
        apiEndpoint: settings.apiEndpoint,
        modelName: settings.modelName,
        isActive: settings.isActive,
        apiKeyConfigured: !!settings.apiKey,
        apiKeyPreview: settings.apiKey ? `${settings.apiKey.substring(0, 8)}...${settings.apiKey.substring(settings.apiKey.length - 4)}` : null,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/admin/ai-settings
 * @desc    Create or update AI settings (admin only)
 */
export const updateAISettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Unauthorized', 403);
    }

    const { aiProvider, apiKey, apiEndpoint, modelName } = req.body;

    if (!aiProvider || !apiKey) {
      throw new CustomError('AI provider and API key are required', 400);
    }

    // Deactivate all existing settings
    await AISettings.updateMany({ isActive: true }, { isActive: false });

    // Create or update settings
    const settings = await AISettings.findOneAndUpdate(
      { isActive: false },
      {
        aiProvider,
        apiKey,
        apiEndpoint: apiEndpoint || undefined,
        modelName: modelName || (aiProvider === 'lovable' ? 'google/gemini-2.5-flash' : aiProvider === 'openai' ? 'gpt-4-vision-preview' : 'gemini-2.0-flash-exp'),
        isActive: true,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: 'AI settings updated successfully',
      data: {
        _id: settings._id,
        aiProvider: settings.aiProvider,
        apiEndpoint: settings.apiEndpoint,
        modelName: settings.modelName,
        isActive: settings.isActive,
        apiKeyConfigured: true,
        apiKeyPreview: `${settings.apiKey.substring(0, 8)}...${settings.apiKey.substring(settings.apiKey.length - 4)}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/admin/ai-settings
 * @desc    Delete AI settings (admin only)
 */
export const deleteAISettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user!.role !== 'super_admin') {
      throw new CustomError('Unauthorized', 403);
    }

    await AISettings.updateMany({ isActive: true }, { isActive: false });

    res.json({
      success: true,
      message: 'AI settings deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

