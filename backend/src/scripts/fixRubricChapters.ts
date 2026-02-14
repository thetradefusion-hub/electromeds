/**
 * Fix Rubric Chapters Script
 * 
 * This script updates existing rubrics in the database that have "Unknown" chapter
 * by extracting chapter information from rubric text patterns or OOREP mapping.
 * 
 * Run: npm run fix-rubric-chapters
 * Or: ts-node backend/src/scripts/fixRubricChapters.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Client } from 'pg';
import config from '../config/env.js';
import Rubric from '../models/Rubric.model.js';

// Chapter keywords mapping (for pattern matching)
const CHAPTER_KEYWORDS: Record<string, string[]> = {
  'Mind': ['mind', 'mental', 'fear', 'anxiety', 'anger', 'irritability', 'weeping', 'delusion', 'confusion', 'memory'],
  'Vertigo': ['vertigo', 'dizziness', 'giddiness'],
  'Head': ['head', 'headache', 'pain head', 'pain in head'],
  'Eye': ['eye', 'eyes', 'vision', 'sight', 'conjunctiva', 'pupil'],
  'Ear': ['ear', 'ears', 'hearing', 'deafness', 'tinnitus'],
  'Nose': ['nose', 'nasal', 'sneezing', 'coryza', 'discharge nose'],
  'Face': ['face', 'facial', 'cheek', 'chin', 'lips'],
  'Mouth': ['mouth', 'teeth', 'tongue', 'gums', 'saliva', 'taste'],
  'Throat': ['throat', 'swallowing', 'pharynx', 'uvula'],
  'Stomach': ['stomach', 'appetite', 'thirst', 'nausea', 'vomiting', 'eructation'],
  'Abdomen': ['abdomen', 'abdominal', 'pain abdomen', 'colic', 'flatulence'],
  'Rectum': ['rectum', 'anus', 'prolapse', 'hemorrhoids'],
  'Stool': ['stool', 'constipation', 'diarrhea', 'bowel'],
  'Urine': ['urine', 'urination', 'bladder', 'kidney'],
  'Male': ['male', 'genital', 'penis', 'prostate', 'sperm'],
  'Female': ['female', 'menses', 'menstruation', 'ovary', 'uterus', 'vagina'],
  'Larynx': ['larynx', 'voice', 'hoarseness', 'laryngitis'],
  'Cough': ['cough', 'coughing'],
  'Expectoration': ['expectoration', 'sputum', 'phlegm'],
  'Respiration': ['respiration', 'breathing', 'dyspnea', 'asthma'],
  'Chest': ['chest', 'breast', 'sternum'],
  'Heart': ['heart', 'cardiac', 'palpitation', 'pulse'],
  'Back': ['back', 'spine', 'lumbar', 'sacrum', 'coccyx'],
  'Extremities': ['extremities', 'limbs', 'arms', 'legs', 'hands', 'feet', 'joints'],
  'Sleep': ['sleep', 'sleeplessness', 'insomnia', 'somnolence'],
  'Dreams': ['dreams', 'dreaming'],
  'Fever': ['fever', 'chill', 'heat', 'sweat'],
  'Generals': ['generals', 'general', 'constitution', 'modalities', 'agg', 'amel'],
  'Skin': ['skin', 'eruption', 'rash', 'itching', 'ulcer'],
};

/**
 * Try to infer chapter from rubric text
 */
function inferChapterFromText(rubricText: string): string | null {
  const text = rubricText.toLowerCase();
  
  // Check each chapter's keywords
  for (const [chapter, keywords] of Object.entries(CHAPTER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return chapter;
      }
    }
  }
  
  return null;
}

// Cache for OOREP availability check
let oorepAvailable: boolean | null = null;
let oorepClient: Client | null = null;

/**
 * Check if OOREP database is available and initialize connection
 */
async function initOorepConnection(): Promise<boolean> {
  if (oorepAvailable !== null) {
    return oorepAvailable;
  }

  const oorepDbHost = process.env.OOREP_DB_HOST || 'localhost';
  const oorepDbPort = parseInt(process.env.OOREP_DB_PORT || '5432');
  const oorepDbName = process.env.OOREP_DB_NAME || 'oorep';
  const oorepDbUser = process.env.OOREP_DB_USER || 'postgres';
  const oorepDbPass = process.env.OOREP_DB_PASS || '';

  // Skip if OOREP DB not configured
  if (!oorepDbHost || (oorepDbHost === 'localhost' && !oorepDbName)) {
    oorepAvailable = false;
    return false;
  }

  try {
    const pgClient = new Client({
      host: oorepDbHost,
      port: oorepDbPort,
      database: oorepDbName,
      user: oorepDbUser,
      password: oorepDbPass,
    });

    await pgClient.connect();
    oorepClient = pgClient;
    oorepAvailable = true;
    console.log('✅ Connected to OOREP database');
    return true;
  } catch (error) {
    oorepAvailable = false;
    console.log('   ⚠️  OOREP database not available, using pattern matching...');
    return false;
  }
}

/**
 * Try to get chapter from OOREP database (if available)
 */
async function getChapterFromOorep(rubricText: string): Promise<string | null> {
  if (!oorepAvailable || !oorepClient) {
    return null;
  }

  try {
    // Try to find matching rubric in OOREP and get its chapter
    const result = await oorepClient.query(
      `SELECT c.textt as chapter_name
       FROM rubric r
       LEFT JOIN chapter c ON r.chapterid = c.id
       WHERE r.abbrev = 'publicum' 
         AND (r.textt = $1 OR r.textt LIKE $2)
       LIMIT 1`,
      [rubricText, `%${rubricText}%`]
    );

    if (result.rows.length > 0 && result.rows[0].chapter_name) {
      return result.rows[0].chapter_name;
    }
  } catch (error) {
    // Connection lost, mark as unavailable
    oorepAvailable = false;
    oorepClient = null;
  }

  return null;
}

/**
 * Close OOREP connection
 */
async function closeOorepConnection() {
  if (oorepClient) {
    try {
      await oorepClient.end();
      oorepClient = null;
    } catch (error) {
      // Ignore errors
    }
  }
}

/**
 * Main function to fix rubric chapters
 */
async function fixRubricChapters() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB');

    // Initialize OOREP connection (if available)
    await initOorepConnection();

    // Find all rubrics with "Unknown" chapter
    const unknownRubrics = await Rubric.find({ chapter: 'Unknown' }).lean();
    console.log(`\n📊 Found ${unknownRubrics.length} rubrics with "Unknown" chapter`);

    if (unknownRubrics.length === 0) {
      console.log('✅ No rubrics need fixing!');
      await closeOorepConnection();
      await mongoose.disconnect();
      return;
    }

    let updated = 0;
    let failed = 0;
    let fromOorep = 0;
    let fromPattern = 0;

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < unknownRubrics.length; i += batchSize) {
      const batch = unknownRubrics.slice(i, i + batchSize);
      
      for (const rubric of batch) {
        try {
          let chapter: string | null = null;

          // First, try to get from OOREP database (if available)
          chapter = await getChapterFromOorep(rubric.rubricText);
          if (chapter) {
            fromOorep++;
          } else {
            // Fallback to pattern matching
            chapter = inferChapterFromText(rubric.rubricText);
            if (chapter) {
              fromPattern++;
            }
          }
          
          if (chapter) {
            await Rubric.updateOne(
              { _id: rubric._id },
              { $set: { chapter: chapter } }
            );
            updated++;
            
            if (updated % 100 === 0) {
              console.log(`   Updated ${updated}/${unknownRubrics.length} rubrics...`);
            }
          } else {
            // If can't infer, leave as "Unknown"
            failed++;
          }
        } catch (error: any) {
          console.error(`Error updating rubric ${rubric._id}:`, error.message);
          failed++;
        }
      }
    }

    console.log(`\n✅ Fixed ${updated} rubrics`);
    console.log(`   - ${fromOorep} from OOREP database`);
    console.log(`   - ${fromPattern} from pattern matching`);
    if (failed > 0) {
      console.log(`⚠️  ${failed} rubrics could not be auto-fixed (may need manual review)`);
    }

    // Show chapter distribution
    console.log('\n📊 Chapter distribution after fix:');
    const chapterStats = await Rubric.aggregate([
      {
        $group: {
          _id: '$chapter',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    chapterStats.forEach((stat) => {
      console.log(`   ${stat._id}: ${stat.count} rubrics`);
    });

  } catch (error) {
    console.error('❌ Error fixing rubric chapters:', error);
    throw error;
  } finally {
    await closeOorepConnection();
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('fixRubricChapters.ts') ||
                     process.argv[1]?.includes('fixRubricChapters');

if (isMainModule) {
  fixRubricChapters()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export default fixRubricChapters;
