/**
 * Case Summary Generator Service
 * 
 * Purpose: Generate AI-powered case summaries for clinical and homeopathic documentation
 * 
 * Uses GPT-4 to generate:
 * - Clinical summary (medical perspective)
 * - Homeopathic summary (homeopathic perspective with rubrics, modalities)
 * - Keynotes (important symptoms)
 * - Strange/rare/peculiar symptoms list
 */

import OpenAI from 'openai';
import AISettings from '../models/AISettings.model.js';
import type { StructuredCase, NormalizedCaseProfile } from './caseEngine.service.js';

export interface CaseSummary {
  clinicalSummary: string;
  homeopathicSummary: string;
  keynotes: string[];
  strangeSymptoms: string[];
}

export class CaseSummaryGeneratorService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  /**
   * Initialize OpenAI client from AISettings or environment
   */
  private async initializeOpenAI(): Promise<void> {
    try {
      // Try to get API key from AISettings first
      const aiSettings = await AISettings.findOne({ isActive: true, aiProvider: 'openai' });
      
      if (aiSettings && aiSettings.apiKey) {
        this.apiKey = aiSettings.apiKey;
      } else {
        // Fallback to environment variable
        this.apiKey = process.env.OPENAI_API_KEY || null;
      }

      if (!this.apiKey) {
        console.warn('[CaseSummaryGenerator] OpenAI API key not found. Summary generation will be disabled.');
        return;
      }

      this.openai = new OpenAI({
        apiKey: this.apiKey,
        timeout: 60000, // 60 seconds timeout
        maxRetries: 2,
      });
    } catch (error) {
      console.error('[CaseSummaryGenerator] Error initializing OpenAI:', error);
    }
  }

  /**
   * Check if summary generation is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.openai) {
      await this.initializeOpenAI();
    }
    return this.openai !== null;
  }

  /**
   * Generate comprehensive case summary
   */
  async generateSummary(
    structuredCase: StructuredCase,
    normalizedCase: NormalizedCaseProfile
  ): Promise<CaseSummary> {
    if (!this.openai) {
      await this.initializeOpenAI();
      if (!this.openai) {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in environment or configure in Admin Panel.');
      }
    }

    // Build case description from normalized case
    const caseDescription = this.buildCaseDescription(normalizedCase, structuredCase);

    try {
      // Generate all summaries in parallel for efficiency
      const [clinicalSummary, homeopathicSummary, keynotes, strangeSymptoms] = await Promise.all([
        this.generateClinicalSummary(caseDescription, normalizedCase),
        this.generateHomeopathicSummary(caseDescription, normalizedCase),
        this.extractKeynotes(caseDescription, normalizedCase),
        this.extractStrangeSymptoms(caseDescription, normalizedCase),
      ]);

      return {
        clinicalSummary,
        homeopathicSummary,
        keynotes,
        strangeSymptoms,
      };
    } catch (error: any) {
      console.error('[CaseSummaryGenerator] Error generating summary:', error);
      throw new Error(`Case summary generation failed: ${error.message}`);
    }
  }

  /**
   * Build a comprehensive case description from normalized case
   */
  private buildCaseDescription(
    normalizedCase: NormalizedCaseProfile,
    _structuredCase: StructuredCase
  ): string {
    const parts: string[] = [];

    // Case type
    if (normalizedCase.isAcute) {
      parts.push('Case Type: Acute');
    }
    if (normalizedCase.isChronic) {
      parts.push('Case Type: Chronic');
    }
    if (normalizedCase.pathologyTags.length > 0) {
      parts.push(`Pathology Tags: ${normalizedCase.pathologyTags.join(', ')}`);
    }

    // Mental symptoms
    if (normalizedCase.mental.length > 0) {
      parts.push('\nMental Symptoms:');
      normalizedCase.mental.forEach((symptom, idx) => {
        parts.push(`${idx + 1}. ${symptom.symptomName} (Weight: ${symptom.weight}x)`);
      });
    }

    // General symptoms
    if (normalizedCase.generals.length > 0) {
      parts.push('\nGeneral Symptoms:');
      normalizedCase.generals.forEach((symptom, idx) => {
        parts.push(`${idx + 1}. ${symptom.symptomName} (Weight: ${symptom.weight}x)`);
      });
    }

    // Particular symptoms
    if (normalizedCase.particulars.length > 0) {
      parts.push('\nParticular Symptoms:');
      normalizedCase.particulars.forEach((symptom, idx) => {
        let desc = `${idx + 1}. ${symptom.symptomName}`;
        if (symptom.location) desc += ` - Location: ${symptom.location}`;
        if (symptom.sensation) desc += ` - Sensation: ${symptom.sensation}`;
        desc += ` (Weight: ${symptom.weight}x)`;
        parts.push(desc);
      });
    }

    // Modalities
    if (normalizedCase.modalities.length > 0) {
      parts.push('\nModalities:');
      normalizedCase.modalities.forEach((modality, idx) => {
        parts.push(`${idx + 1}. ${modality.symptomName} - ${modality.type === 'better' ? 'Better' : 'Worse'} (Weight: ${modality.weight}x)`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Generate clinical summary (medical perspective)
   */
  private async generateClinicalSummary(
    caseDescription: string,
    normalizedCase: NormalizedCaseProfile
  ): Promise<string> {
    const systemPrompt = `You are a medical AI assistant specialized in clinical case documentation. Generate a concise, professional clinical summary of the patient case.

Focus on:
- Chief complaints and presenting symptoms
- Clinical observations and findings
- Symptom patterns and relationships
- Clinical significance of symptoms
- Overall clinical picture

Write in clear, professional medical language suitable for clinical documentation.`;

    const userPrompt = `Generate a clinical summary for the following homeopathic case:

${caseDescription}

Provide a concise clinical summary (2-3 paragraphs) that captures the essential clinical picture of this case.`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 500,
      });

      const summary = response.choices[0]?.message?.content?.trim();
      if (!summary) {
        throw new Error('No clinical summary generated');
      }

      return summary;
    } catch (error: any) {
      console.error('[CaseSummaryGenerator] Error generating clinical summary:', error);
      // Return fallback summary
      return this.generateFallbackClinicalSummary(normalizedCase);
    }
  }

  /**
   * Generate homeopathic summary (homeopathic perspective)
   */
  private async generateHomeopathicSummary(
    caseDescription: string,
    normalizedCase: NormalizedCaseProfile
  ): Promise<string> {
    const systemPrompt = `You are a homeopathic AI assistant specialized in homeopathic case analysis. Generate a comprehensive homeopathic summary of the patient case.

Focus on:
- Homeopathic symptom hierarchy (mental > general > particular)
- Modalities and their significance
- Characteristic symptoms and their peculiarities
- Repertory rubric considerations
- Homeopathic case analysis principles

Write in homeopathic terminology suitable for homeopathic documentation.`;

    const userPrompt = `Generate a homeopathic summary for the following case:

${caseDescription}

Provide a comprehensive homeopathic summary (3-4 paragraphs) that:
1. Analyzes the symptom hierarchy (mental, general, particular)
2. Discusses the significance of modalities
3. Highlights characteristic and peculiar symptoms
4. Provides homeopathic case analysis perspective`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 600,
      });

      const summary = response.choices[0]?.message?.content?.trim();
      if (!summary) {
        throw new Error('No homeopathic summary generated');
      }

      return summary;
    } catch (error: any) {
      console.error('[CaseSummaryGenerator] Error generating homeopathic summary:', error);
      // Return fallback summary
      return this.generateFallbackHomeopathicSummary(normalizedCase);
    }
  }

  /**
   * Extract keynotes (important symptoms)
   */
  private async extractKeynotes(
    caseDescription: string,
    normalizedCase: NormalizedCaseProfile
  ): Promise<string[]> {
    const systemPrompt = `You are a homeopathic AI assistant. Extract the most important keynotes (characteristic symptoms) from a homeopathic case.

Keynotes are symptoms that are:
- Highly characteristic or peculiar
- Strong indicators for specific remedies
- Important for repertorization
- Clinically significant

Return a JSON array of keynotes as strings.`;

    const userPrompt = `Extract keynotes from the following case:

${caseDescription}

Return a JSON array of 5-10 most important keynotes. Each keynote should be a concise symptom description (e.g., "Headache worse in morning", "Thirst for cold water", "Anxiety with palpitations").`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No keynotes generated');
      }

      const result = JSON.parse(content);
      const keynotes = result.keynotes || result.keynote || [];

      // Validate and return
      if (Array.isArray(keynotes)) {
        return keynotes.slice(0, 10).filter((k: any) => typeof k === 'string' && k.length > 0);
      }

      // Fallback: extract from case
      return this.extractFallbackKeynotes(normalizedCase);
    } catch (error: any) {
      console.error('[CaseSummaryGenerator] Error extracting keynotes:', error);
      return this.extractFallbackKeynotes(normalizedCase);
    }
  }

  /**
   * Extract strange/rare/peculiar symptoms
   */
  private async extractStrangeSymptoms(
    caseDescription: string,
    normalizedCase: NormalizedCaseProfile
  ): Promise<string[]> {
    const systemPrompt = `You are a homeopathic AI assistant. Identify strange, rare, and peculiar (SRP) symptoms from a homeopathic case.

SRP symptoms are:
- Uncommon or unusual
- Highly characteristic
- Not typical for the condition
- Strong indicators for remedy selection

Return a JSON array of SRP symptoms as strings.`;

    const userPrompt = `Identify strange, rare, and peculiar symptoms from the following case:

${caseDescription}

Return a JSON array of 3-7 SRP symptoms. Each should be a concise description of the peculiar symptom.`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 250,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No SRP symptoms generated');
      }

      const result = JSON.parse(content);
      const strangeSymptoms = result.strangeSymptoms || result.srpSymptoms || result.peculiarSymptoms || [];

      // Validate and return
      if (Array.isArray(strangeSymptoms)) {
        return strangeSymptoms.slice(0, 7).filter((s: any) => typeof s === 'string' && s.length > 0);
      }

      // Fallback: extract from high-weight symptoms
      return this.extractFallbackStrangeSymptoms(normalizedCase);
    } catch (error: any) {
      console.error('[CaseSummaryGenerator] Error extracting strange symptoms:', error);
      return this.extractFallbackStrangeSymptoms(normalizedCase);
    }
  }

  /**
   * Fallback clinical summary (if AI fails)
   */
  private generateFallbackClinicalSummary(normalizedCase: NormalizedCaseProfile): string {
    const parts: string[] = [];
    
    parts.push('Clinical Summary:');
    
    if (normalizedCase.mental.length > 0) {
      parts.push(`Mental symptoms include: ${normalizedCase.mental.map(s => s.symptomName).join(', ')}.`);
    }
    
    if (normalizedCase.generals.length > 0) {
      parts.push(`General symptoms include: ${normalizedCase.generals.map(s => s.symptomName).join(', ')}.`);
    }
    
    if (normalizedCase.particulars.length > 0) {
      parts.push(`Particular symptoms include: ${normalizedCase.particulars.map(s => s.symptomName).join(', ')}.`);
    }
    
    if (normalizedCase.modalities.length > 0) {
      const better = normalizedCase.modalities.filter(m => m.type === 'better').map(m => m.symptomName);
      const worse = normalizedCase.modalities.filter(m => m.type === 'worse').map(m => m.symptomName);
      if (better.length > 0) parts.push(`Symptoms better from: ${better.join(', ')}.`);
      if (worse.length > 0) parts.push(`Symptoms worse from: ${worse.join(', ')}.`);
    }
    
    return parts.join(' ');
  }

  /**
   * Fallback homeopathic summary (if AI fails)
   */
  private generateFallbackHomeopathicSummary(normalizedCase: NormalizedCaseProfile): string {
    const parts: string[] = [];
    
    parts.push('Homeopathic Summary:');
    
    if (normalizedCase.mental.length > 0) {
      parts.push(`Mental generals: ${normalizedCase.mental.map(s => s.symptomName).join(', ')}.`);
    }
    
    if (normalizedCase.generals.length > 0) {
      parts.push(`Physical generals: ${normalizedCase.generals.map(s => s.symptomName).join(', ')}.`);
    }
    
    if (normalizedCase.particulars.length > 0) {
      parts.push(`Particulars: ${normalizedCase.particulars.map(s => s.symptomName).join(', ')}.`);
    }
    
    if (normalizedCase.modalities.length > 0) {
      parts.push(`Modalities: ${normalizedCase.modalities.map(m => `${m.symptomName} (${m.type})`).join(', ')}.`);
    }
    
    return parts.join(' ');
  }

  /**
   * Fallback keynotes extraction
   */
  private extractFallbackKeynotes(normalizedCase: NormalizedCaseProfile): string[] {
    const keynotes: string[] = [];
    
    // High-weight mental symptoms
    normalizedCase.mental
      .filter(s => s.weight >= 3)
      .forEach(s => keynotes.push(s.symptomName));
    
    // High-weight general symptoms
    normalizedCase.generals
      .filter(s => s.weight >= 2)
      .forEach(s => keynotes.push(s.symptomName));
    
    // Particulars with location/sensation
    normalizedCase.particulars
      .filter(s => s.location || s.sensation)
      .forEach(s => {
        let keynote = s.symptomName;
        if (s.location) keynote += ` - ${s.location}`;
        if (s.sensation) keynote += ` (${s.sensation})`;
        keynotes.push(keynote);
      });
    
    return keynotes.slice(0, 10);
  }

  /**
   * Fallback strange symptoms extraction
   */
  private extractFallbackStrangeSymptoms(normalizedCase: NormalizedCaseProfile): string[] {
    const strange: string[] = [];
    
    // High-weight mental symptoms (often peculiar)
    normalizedCase.mental
      .filter(s => s.weight >= 3)
      .forEach(s => strange.push(s.symptomName));
    
    // Modalities (often characteristic)
    normalizedCase.modalities
      .forEach(m => strange.push(`${m.symptomName} (${m.type})`));
    
    // Particulars with unusual combinations
    normalizedCase.particulars
      .filter(s => s.location && s.sensation)
      .forEach(s => strange.push(`${s.symptomName} - ${s.location} (${s.sensation})`));
    
    return strange.slice(0, 7);
  }
}

export default CaseSummaryGeneratorService;
