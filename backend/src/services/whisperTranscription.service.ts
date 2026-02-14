/**
 * Whisper Transcription Service
 *
 * Uses OpenAI Whisper API for server-side speech-to-text.
 * Same API key as other OpenAI features (AISettings or OPENAI_API_KEY).
 */

import OpenAI from 'openai';
import { Readable } from 'stream';
import AISettings from '../models/AISettings.model.js';

// Map frontend language codes to Whisper language codes (optional; Whisper can auto-detect)
const LANGUAGE_MAP: Record<string, string> = {
  'en-US': 'en',
  'en-IN': 'en',
  'hi-IN': 'hi',
  'es-ES': 'es',
  'fr-FR': 'fr',
};

export class WhisperTranscriptionService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  private async initializeOpenAI(): Promise<void> {
    try {
      const aiSettings = await AISettings.findOne({ isActive: true, aiProvider: 'openai' });
      if (aiSettings?.apiKey) {
        this.apiKey = aiSettings.apiKey;
      } else {
        this.apiKey = process.env.OPENAI_API_KEY || null;
      }
      if (!this.apiKey) {
        console.warn('[WhisperTranscription] OpenAI API key not found. Whisper transcription will be disabled.');
        return;
      }
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        timeout: 60000,
        maxRetries: 2,
      });
    } catch (error) {
      console.error('[WhisperTranscription] Error initializing OpenAI:', error);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.openai) await this.initializeOpenAI();
    return this.openai !== null;
  }

  /**
   * Transcribe audio buffer using Whisper API.
   * @param buffer - Raw audio file buffer (e.g. from multer)
   * @param mimeType - e.g. audio/webm, audio/mpeg
   * @param languageHint - Optional, e.g. 'en', 'hi'. Pass null for auto-detect.
   */
  async transcribe(
    buffer: Buffer,
    mimeType: string,
    languageHint: string | null
  ): Promise<{ text: string }> {
    if (!this.openai) {
      await this.initializeOpenAI();
      if (!this.openai) {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY or configure in Admin Panel.');
      }
    }

    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3' : 'wav';
    const stream = Readable.from(buffer) as Readable & { path?: string };
    stream.path = `audio.${ext}`;

    const language = languageHint ? LANGUAGE_MAP[languageHint] || languageHint.split('-')[0] || undefined : undefined;

    const response = await this.openai.audio.transcriptions.create({
      file: stream as any,
      model: 'whisper-1',
      language: language || undefined,
      response_format: 'text',
    });

    const text = typeof response === 'string' ? response : (response as any).text ?? '';
    return { text: text.trim() };
  }
}

export default new WhisperTranscriptionService();
