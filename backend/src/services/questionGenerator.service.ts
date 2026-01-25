/**
 * Smart Question Generator Service
 * 
 * Generates context-aware questions using both rule-based and AI-powered approaches
 */

import OpenAI from 'openai';
import AISettings from '../models/AISettings.model.js';
import { StructuredCase } from './caseEngine.service.js';
import { Question } from './caseCompleteness.service.js';

export interface QuestionGenerationRequest {
  caseData: StructuredCase;
  missingDomain?: string;
  context?: string; // Additional context about what to ask
}

export interface QuestionGenerationResult {
  questions: Question[];
  reasoning: string; // Why these questions were generated
  priority: 'high' | 'medium' | 'low';
}

export class QuestionGeneratorService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  /**
   * Initialize OpenAI client
   */
  private async initializeOpenAI(): Promise<void> {
    try {
      const aiSettings = await AISettings.findOne({ isActive: true, aiProvider: 'openai' });
      
      if (aiSettings && aiSettings.apiKey) {
        this.apiKey = aiSettings.apiKey;
      } else {
        this.apiKey = process.env.OPENAI_API_KEY || null;
      }

      if (!this.apiKey) {
        console.warn('[QuestionGenerator] OpenAI API key not found. Will use rule-based questions only.');
        return;
      }

      this.openai = new OpenAI({
        apiKey: this.apiKey,
      });
    } catch (error) {
      console.error('[QuestionGenerator] Error initializing OpenAI:', error);
    }
  }

  /**
   * Check if AI question generation is available
   */
  async isAIAvailable(): Promise<boolean> {
    if (!this.openai) {
      await this.initializeOpenAI();
    }
    return this.openai !== null;
  }

  /**
   * Generate smart questions
   */
  async generateQuestions(
    request: QuestionGenerationRequest
  ): Promise<QuestionGenerationResult> {
    const { caseData, missingDomain, context } = request;

    // Try AI generation first if available
    if (await this.isAIAvailable()) {
      try {
        return await this.generateWithAI(caseData, missingDomain, context);
      } catch (error) {
        console.warn('[QuestionGenerator] AI generation failed, falling back to rule-based:', error);
      }
    }

    // Fallback to rule-based generation
    return this.generateRuleBased(caseData, missingDomain, context);
  }

  /**
   * Generate questions using AI
   */
  private async generateWithAI(
    caseData: StructuredCase,
    missingDomain?: string,
    _context?: string
  ): Promise<QuestionGenerationResult> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const caseSummary = this.summarizeCase(caseData);

    const systemPrompt = `You are a homeopathic case-taking assistant. Generate smart, context-aware questions to help complete a patient case.

Your questions should:
1. Be specific to the missing information
2. Follow homeopathic case-taking principles
3. Be clear and easy for patients to answer
4. Prioritize mental symptoms, then generals, then particulars
5. Focus on modalities (better/worse factors)

Return questions in JSON format.`;

    const userPrompt = `Analyze this homeopathic case and generate smart questions to complete it:

Current Case:
${caseSummary}

${missingDomain ? `Missing Domain: ${missingDomain}` : 'General case completion needed'}
${_context ? `Context: ${_context}` : ''}

Generate 3-5 high-priority questions that will help complete this case. Focus on what's missing.

Return JSON:
{
  "questions": [
    {
      "text": "question text",
      "domain": "mental|general|particular|modality|thermal|sleep|appetite",
      "type": "yes_no|multiple_choice|open_ended",
      "options": ["option1", "option2"] (only for multiple_choice),
      "priority": "high|medium|low",
      "reasoning": "why this question is important"
    }
  ],
  "reasoning": "overall reasoning for these questions",
  "priority": "high|medium|low"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as QuestionGenerationResult;
      
      // Validate and normalize
      return {
        questions: result.questions.map((q, i) => ({
          ...q,
          id: `ai-${Date.now()}-${i}`,
          domain: q.domain || 'general',
          type: q.type || 'yes_no',
          priority: q.priority || 'medium',
        })),
        reasoning: result.reasoning || 'AI-generated questions based on case analysis',
        priority: result.priority || 'medium',
      };
    } catch (error: any) {
      console.error('[QuestionGenerator] AI generation error:', error);
      throw error;
    }
  }

  /**
   * Generate questions using rule-based approach
   */
  private generateRuleBased(
    caseData: StructuredCase,
    missingDomain?: string,
    _context?: string
  ): QuestionGenerationResult {
    const questions: Question[] = [];

    if (missingDomain) {
      // Generate domain-specific questions
      questions.push(...this.getDomainSpecificQuestions(missingDomain, caseData));
    } else {
      // Generate general completion questions
      if (caseData.mental.length === 0) {
        questions.push({
          id: 'rule-mental-1',
          text: 'How would you describe your emotional state and mental well-being?',
          domain: 'mental',
          type: 'open_ended',
          priority: 'high',
          reasoning: 'Mental symptoms are highest priority in homeopathy',
        });
      }

      if (caseData.generals.length < 2) {
        questions.push({
          id: 'rule-general-1',
          text: 'How is your appetite and thirst?',
          domain: 'general',
          type: 'open_ended',
          priority: 'high',
          reasoning: 'Physical generals are essential',
        });
      }

      if (caseData.modalities.length < 2) {
        questions.push({
          id: 'rule-modality-1',
          text: 'What makes your symptoms better or worse?',
          domain: 'modality',
          type: 'open_ended',
          priority: 'high',
          reasoning: 'Modalities are crucial for remedy selection',
        });
      }

      // Check for thermal
      const hasThermal = this.hasThermalReaction(caseData);
      if (!hasThermal) {
        questions.push({
          id: 'rule-thermal-1',
          text: 'Do you prefer hot or cold weather?',
          domain: 'thermal',
          type: 'multiple_choice',
          options: ['Hot weather', 'Cold weather', 'No preference', 'Varies'],
          priority: 'high',
          reasoning: 'Thermal reaction is a key differentiator',
        });
      }
    }

    // Sort by priority
    questions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    return {
      questions: questions.slice(0, 5), // Limit to 5 questions
      reasoning: 'Rule-based questions generated based on missing case information',
      priority: questions.length > 0 && questions[0].priority === 'high' ? 'high' : 'medium',
    };
  }

  /**
   * Get domain-specific questions
   */
  private getDomainSpecificQuestions(domain: string, _caseData: StructuredCase): Question[] {
    const questions: Question[] = [];

    switch (domain) {
      case 'mental':
        questions.push(
          {
            id: 'domain-mental-1',
            text: 'How would you describe your emotional state?',
            domain: 'mental',
            type: 'open_ended',
            priority: 'high',
            reasoning: 'Mental state is crucial for homeopathic analysis',
          },
          {
            id: 'domain-mental-2',
            text: 'Do you have any fears or anxieties?',
            domain: 'mental',
            type: 'yes_no',
            priority: 'high',
          }
        );
        break;

      case 'general':
        questions.push(
          {
            id: 'domain-general-1',
            text: 'How is your appetite?',
            domain: 'general',
            type: 'multiple_choice',
            options: ['Increased', 'Decreased', 'Normal', 'Variable'],
            priority: 'high',
          },
          {
            id: 'domain-general-2',
            text: 'How is your thirst?',
            domain: 'general',
            type: 'multiple_choice',
            options: ['Increased', 'Decreased', 'Normal', 'No thirst'],
            priority: 'high',
          }
        );
        break;

      case 'modality':
        questions.push(
          {
            id: 'domain-modality-1',
            text: 'What makes your symptoms better?',
            domain: 'modality',
            type: 'open_ended',
            priority: 'high',
          },
          {
            id: 'domain-modality-2',
            text: 'What makes your symptoms worse?',
            domain: 'modality',
            type: 'open_ended',
            priority: 'high',
          }
        );
        break;
    }

    return questions;
  }

  /**
   * Summarize case for AI
   */
  private summarizeCase(caseData: StructuredCase): string {
    const parts: string[] = [];

    if (caseData.mental.length > 0) {
      parts.push(`Mental: ${caseData.mental.map(s => s.symptomText).join(', ')}`);
    }
    if (caseData.generals.length > 0) {
      parts.push(`Generals: ${caseData.generals.map(s => s.symptomText).join(', ')}`);
    }
    if (caseData.particulars.length > 0) {
      parts.push(`Particulars: ${caseData.particulars.map(s => s.symptomText).join(', ')}`);
    }
    if (caseData.modalities.length > 0) {
      parts.push(`Modalities: ${caseData.modalities.map(s => `${s.type} - ${s.symptomText}`).join(', ')}`);
    }

    return parts.join('\n') || 'No symptoms recorded yet';
  }

  /**
   * Check if case has thermal reaction
   */
  private hasThermalReaction(caseData: StructuredCase): boolean {
    const thermalKeywords = ['hot', 'cold', 'warm', 'chilly', 'heat', 'thermal'];
    
    for (const general of caseData.generals) {
      if (thermalKeywords.some(k => general.symptomText.toLowerCase().includes(k))) {
        return true;
      }
    }
    return false;
  }
}

export default QuestionGeneratorService;
