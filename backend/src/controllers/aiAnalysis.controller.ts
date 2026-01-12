import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import AISettings from '../models/AISettings.model.js';
import { CustomError } from '../middleware/errorHandler.js';

/**
 * @route   POST /api/ai/analyze-report
 * @desc    Analyze medical report using AI
 */
export const analyzeMedicalReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { imageBase64, reportType, mimeType } = req.body;

    if (!imageBase64) {
      throw new CustomError('No image provided', 400);
    }

    // Get active AI settings
    const aiSettings = await AISettings.findOne({ isActive: true });
    if (!aiSettings) {
      throw new CustomError('AI settings not configured. Please configure AI API key in admin settings.', 500);
    }

    if (!aiSettings.apiKey) {
      throw new CustomError('AI API key not configured', 500);
    }

    const systemPrompt = `You are an expert medical report analyzer. Analyze the provided medical report image and extract key findings.

Your response should be in the following JSON format:
{
  "reportType": "detected type of report (e.g., Blood Test, X-Ray, CT Scan, MRI, Sonography, ECG, etc.)",
  "findings": [
    {
      "parameter": "parameter name",
      "value": "observed value",
      "normalRange": "normal range if applicable",
      "status": "normal" | "abnormal" | "critical",
      "interpretation": "brief interpretation"
    }
  ],
  "summary": "Brief summary of overall findings",
  "concernAreas": ["list of areas that need attention"],
  "recommendations": ["list of recommendations based on findings"]
}

Important guidelines:
- Be accurate and precise in your analysis
- Highlight any abnormal or critical values clearly
- Provide helpful interpretations in simple language
- If the image is unclear or not a medical report, indicate that in the summary
- Focus on clinically significant findings`;

    const userPrompt = reportType
      ? `Analyze this ${reportType} report and provide detailed findings.`
      : `Analyze this medical report and provide detailed findings. First identify what type of report this is.`;

    // Determine API endpoint based on provider
    let apiEndpoint: string;
    let headers: Record<string, string>;
    let body: any;

    switch (aiSettings.aiProvider) {
      case 'lovable':
        apiEndpoint = aiSettings.apiEndpoint || 'https://ai.gateway.lovable.dev/v1/chat/completions';
        headers = {
          Authorization: `Bearer ${aiSettings.apiKey}`,
          'Content-Type': 'application/json',
        };
        body = {
          model: aiSettings.modelName || 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        };
        break;

      case 'openai':
        apiEndpoint = aiSettings.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
        headers = {
          Authorization: `Bearer ${aiSettings.apiKey}`,
          'Content-Type': 'application/json',
        };
        body = {
          model: aiSettings.modelName || 'gpt-4-vision-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userPrompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        };
        break;

      case 'google':
        const modelName = aiSettings.modelName || 'gemini-2.0-flash-exp';
        apiEndpoint = aiSettings.apiEndpoint || `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${aiSettings.apiKey}`;
        headers = {
          'Content-Type': 'application/json',
        };
        body = {
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\n${userPrompt}` },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        };
        break;

      case 'custom':
        if (!aiSettings.apiEndpoint) {
          throw new CustomError('Custom API endpoint not configured', 500);
        }
        apiEndpoint = aiSettings.apiEndpoint;
        headers = {
          Authorization: `Bearer ${aiSettings.apiKey}`,
          'Content-Type': 'application/json',
        };
        body = {
          imageBase64,
          reportType,
          mimeType,
          systemPrompt,
          userPrompt,
        };
        break;

      default:
        throw new CustomError('Invalid AI provider', 500);
    }

    // Make API call
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new CustomError('Rate limit exceeded. Please try again later.', 429);
      }
      if (response.status === 402) {
        throw new CustomError('AI credits exhausted. Please add more credits.', 402);
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new CustomError('Failed to analyze report', 500);
    }

    const data = await response.json() as any;

    // Parse response based on provider
    let analysis: any;
    if (aiSettings.aiProvider === 'google') {
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new CustomError('No response from AI', 500);
      }
      try {
        analysis = JSON.parse(content);
      } catch {
        analysis = {
          reportType: 'Unknown',
          findings: [],
          summary: content,
          concernAreas: [],
          recommendations: [],
        };
      }
    } else {
      // Lovable, OpenAI, or custom
      const content = data.choices?.[0]?.message?.content || data.analysis || data.content;
      if (!content) {
        throw new CustomError('No response from AI', 500);
      }
      try {
        analysis = typeof content === 'string' ? JSON.parse(content) : content;
      } catch {
        analysis = {
          reportType: 'Unknown',
          findings: [],
          summary: typeof content === 'string' ? content : JSON.stringify(content),
          concernAreas: [],
          recommendations: [],
        };
      }
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

