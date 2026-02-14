/**
 * Remedy Profile Generator Service
 *
 * Uses OpenAI to generate a detailed remedy profile (Materia Medica style) for display
 * on the Remedy Profile screen: Quick Highlights, Mind, Physical, Modalities, Differentials.
 */

import OpenAI from 'openai';
import AISettings from '../models/AISettings.model.js';

export interface RemedyProfile {
  remedyName: string;
  abbreviation: string;
  commonName: string;
  family: string;
  quickHighlights: string[];
  mind: {
    description: string;
    keyTraits: string[];
  };
  physical: {
    sections: Array<{ title: string; content: string }>;
  };
  modalities: {
    aggravation: string[];
    amelioration: string[];
  };
  differentials: string[];
  referenceSource: string;
}

export class RemedyProfileGeneratorService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  private async initializeOpenAI(): Promise<void> {
    try {
      const aiSettings = await AISettings.findOne({ isActive: true, aiProvider: 'openai' });
      if (aiSettings?.apiKey) {
        this.apiKey = aiSettings.apiKey;
      } else {
        this.apiKey = process.env.OPENAI_API_KEY || null;
      }
      if (!this.apiKey) {
        console.warn('[RemedyProfileGenerator] OpenAI API key not found.');
        return;
      }
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        timeout: 60000,
        maxRetries: 2,
      });
    } catch (error) {
      console.error('[RemedyProfileGenerator] Error initializing OpenAI:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.openai) await this.initializeOpenAI();
    return this.openai !== null;
  }

  /**
   * Generate a full remedy profile for the given remedy name (and optional existing DB fields).
   */
  async generateProfile(
    remedyName: string,
    existingData?: {
      category?: string;
      materiaMedica?: { keynotes?: string[]; pathogenesis?: string; clinicalNotes?: string };
      modalities?: { better?: string[]; worse?: string[] };
    }
  ): Promise<RemedyProfile> {
    if (!this.openai) {
      await this.initializeOpenAI();
      if (!this.openai) {
        throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY or configure in Admin Panel.');
      }
    }

    const existingContext = existingData
      ? `
Existing data from database (use to enrich, keep if accurate):
- Category: ${existingData.category || 'unknown'}
- Keynotes: ${(existingData.materiaMedica?.keynotes || []).join('; ')}
- Pathogenesis: ${existingData.materiaMedica?.pathogenesis || 'none'}
- Clinical notes: ${existingData.materiaMedica?.clinicalNotes || 'none'}
- Better: ${(existingData.modalities?.better || []).join('; ')}
- Worse: ${(existingData.modalities?.worse || []).join('; ')}
`
      : '';

    const systemPrompt = `You are an expert homeopathic Materia Medica writer. Generate a detailed remedy profile in valid JSON only, no markdown or extra text.

Output must be exactly this JSON structure (use empty arrays/strings if unknown):
{
  "remedyName": "Full Latin name",
  "abbreviation": "Abbrev. (e.g. Lyc.)",
  "commonName": "Common name",
  "family": "Family e.g. Lycopodiaceae",
  "quickHighlights": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "mind": {
    "description": "One or two paragraphs on mental/emotional picture.",
    "keyTraits": ["trait 1", "trait 2"]
  },
  "physical": {
    "sections": [
      { "title": "GASTROINTESTINAL", "content": "paragraph" },
      { "title": "RENAL", "content": "paragraph" }
    ]
  },
  "modalities": {
    "aggravation": ["4 PM to 8 PM", "Right side", "..."],
    "amelioration": ["Warm drinks", "Motion", "..."]
  },
  "differentials": ["Nux Vomica", "Lachesis", "Carbo Veg.", "Sulphur"],
  "referenceSource": "Boericke's Materia Medica"
}

Rules: quickHighlights 4 bullets; mind.description 1-2 short paragraphs; physical.sections 2-4 body systems; modalities 3-6 each; differentials 3-5 remedy names. Use standard homeopathic terminology.`;

    const userPrompt = `Generate the remedy profile for: ${remedyName}
${existingContext}
Return only the JSON object, no other text.`;

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1800,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('No remedy profile generated');

    // Strip markdown code block if present
    let jsonStr = content;
    const codeMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) jsonStr = codeMatch[1].trim();

    const parsed = JSON.parse(jsonStr) as RemedyProfile;
    parsed.remedyName = parsed.remedyName || remedyName;
    parsed.abbreviation = parsed.abbreviation || remedyName.split(/\s+/).map((w) => w[0]).join('.').slice(0, 5);
    parsed.referenceSource = parsed.referenceSource || "Boericke's Materia Medica";
    return parsed;
  }
}

const remedyProfileGenerator = new RemedyProfileGeneratorService();
export default remedyProfileGenerator;
