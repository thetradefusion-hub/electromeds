/**
 * Seed top symptom synonyms for better rubric matching (Quick Win).
 * Run: npx tsx src/scripts/seedSymptomSynonyms.ts
 * Adds synonyms so that TEMP_ codes are less common and repertory mapping works better.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Symptom from '../models/Symptom.model.js';

const TOP_SYMPTOM_SYNONYMS: Record<string, string[]> = {
  fever: ['pyrexia', 'high temperature', 'temp', 'bukhaar', 'bukhar'],
  cough: ['khasi', 'coughing', 'kasi', 'dry cough', 'wet cough'],
  cold: ['common cold', 'rhinitis', 'sardi', 'nasal congestion', 'running nose'],
  headache: ['head pain', 'cephalgia', 'sir dard', 'migraine'],
  pain: ['dard', 'suffering', 'sore'],
  weakness: ['debility', 'kamzori', 'fatigue', 'tiredness'],
  anxiety: ['tension', 'anxious', 'chinta', 'worry'],
  fear: ['dar', 'darr', 'phobia', 'afraid'],
  anger: ['gussa', 'irritability', 'irritable', 'rage'],
  sadness: ['depression', 'depressed', 'udaasi', 'low mood'],
  insomnia: ['sleeplessness', 'sleep problem', 'neend nahi aana', 'cannot sleep'],
  thirst: ['durst', 'pyaas', 'dehydration', 'dry mouth'],
  appetite: ['hunger', 'bhook', 'eating', 'food desire'],
  nausea: ['vomiting sensation', 'ultii', 'feeling to vomit'],
  vomiting: ['vomiting', 'ulti', 'emesis'],
  diarrhoea: ['diarrhea', 'loose motions', 'dast', 'loose stool'],
  constipation: ['constipation', 'kabz', 'hard stool'],
  burning: ['burning sensation', 'jalaal', 'heat'],
  swelling: ['oedema', 'sujan', 'inflammation'],
};

async function seedSymptomSynonyms() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    let updated = 0;
    for (const [canonical, synonyms] of Object.entries(TOP_SYMPTOM_SYNONYMS)) {
      const found = await Symptom.find({
        modality: 'classical_homeopathy',
        name: new RegExp(`^${canonical}$`, 'i'),
      }).lean();
      for (const s of found) {
        const current = (s.synonyms as string[]) || [];
        const toAdd = synonyms.filter((x) => x && !current.map((c) => c.toLowerCase()).includes(x.toLowerCase()));
        if (toAdd.length > 0) {
          await Symptom.updateOne(
            { _id: s._id },
            { $addToSet: { synonyms: { $each: toAdd } } }
          );
          updated++;
          console.log(`  Added synonyms to symptom: ${s.name}`);
        }
      }
    }

    console.log(`\nDone. Updated ${updated} symptom(s) with synonyms.`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedSymptomSynonyms();
