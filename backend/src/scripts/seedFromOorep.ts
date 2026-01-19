/**
 * OOREP Data Seeding Script
 * 
 * Yeh script OOREP ke SQL file se data extract karke aapke MongoDB database me seed karta hai.
 * 
 * Requirements:
 * 1. OOREP SQL file (oorep.sql.gz extract karke oorep.sql)
 * 2. Ya PostgreSQL me OOREP database import karke
 * 
 * Usage:
 * Option 1: PostgreSQL se directly (Recommended)
 *   - OOREP database PostgreSQL me import karein
 *   - .env me PostgreSQL connection details set karein
 *   - npm run seed:oorep
 * 
 * Option 2: SQL file se parse (Alternative)
 *   - OOREP SQL file path provide karein
 *   - npm run seed:oorep:file -- --file=path/to/oorep.sql
 * 
 * Note: Yeh script sirf Classical Homeopathy data seed karta hai
 * IMPORTANT: Sirf 'publicum' (English) repertory seed hota hai, German (kent-de) skip hota hai
 */

import mongoose from 'mongoose';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import config from '../config/env.js';
import Remedy from '../models/Remedy.model.js';
import Rubric from '../models/Rubric.model.js';
import RubricRemedy from '../models/RubricRemedy.model.js';
import Symptom from '../models/Symptom.model.js';

// OOREP to MongoDB ID mapping
const rubricIdMap = new Map<number, mongoose.Types.ObjectId>();
const remedyIdMap = new Map<number, mongoose.Types.ObjectId>();

// Repertory type mapping (OOREP abbrev → Your schema)
// IMPORTANT: Only 'publicum' (English) is being seeded, German (kent-de) is skipped
const repertoryTypeMap: Record<string, 'kent' | 'bbcr' | 'boericke' | 'synthesis' | 'publicum'> = {
  'kent': 'kent',
  'bbcr': 'bbcr',
  'boericke': 'boericke',
  'synthesis': 'synthesis',
  'publicum': 'publicum', // English repertory
  // kent-de (German) is NOT included - will be skipped
};

/**
 * Extract data from SQL file (Direct parsing)
 */
async function extractFromSQLFile(sqlFilePath: string): Promise<{
  rubrics: any[];
  remedies: any[];
  mappings: any[];
  chapters: Map<number, string>;
}> {
  console.log(`📄 Reading SQL file: ${sqlFilePath}`);
  const fileContent = fs.readFileSync(sqlFilePath, 'utf-8');
  const lines = fileContent.split('\n');

  const chapters = new Map<number, string>();
  const remedies: any[] = [];
  const rubrics: any[] = [];
  const mappings: any[] = [];

  let currentTable: string | null = null;
  let currentColumns: string[] = [];
  let inDataSection = false;

  // First, extract chapters for later lookup
  console.log('📚 Extracting chapters...');
  let inChapterData = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('COPY public.chapter')) {
      inChapterData = true;
      continue;
    }
    
    if (inChapterData) {
      if (line === '\\.') {
        inChapterData = false;
        continue;
      }
      
      // Parse chapter data: abbrev, id, textt
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const chapterId = parseInt(parts[1]);
        const chapterText = parts[2] || '';
        if (chapterId && chapterText) {
          chapters.set(chapterId, chapterText);
        }
      }
    }
  }
  console.log(`   Found ${chapters.size} chapters`);

  // Extract remedies
  console.log('💊 Extracting remedies...');
  let inRemedyData = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('COPY public.remedy')) {
      inRemedyData = true;
      continue;
    }
    
    if (inRemedyData) {
      if (line === '\\.') {
        inRemedyData = false;
        continue;
      }
      
      // Parse remedy data: id, nameabbrev, namelong, namealt
      const parts = line.split('\t');
      if (parts.length >= 3) {
        const id = parseInt(parts[0]);
        const nameabbrev = parts[1] || '';
        const namelong = parts[2] || nameabbrev;
        
        if (id && namelong) {
          remedies.push({
            id,
            name: namelong,
            nameabbrev,
            category: 'Unknown', // Will be determined later if available
          });
        }
      }
    }
  }
  console.log(`   Found ${remedies.length} remedies`);

  // Extract rubrics
  console.log('📖 Extracting rubrics...');
  let inRubricData = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('COPY public.rubric')) {
      inRubricData = true;
      continue;
    }
    
    if (inRubricData) {
      if (line === '\\.') {
        inRubricData = false;
        continue;
      }
      
      // Parse rubric data: abbrev, id, mother, ismother, chapterid, fullpath, path, textt
      const parts = line.split('\t');
      if (parts.length >= 8) {
        const abbrev = parts[0] || '';
        const id = parseInt(parts[1]);
        const chapterid = parseInt(parts[4]) || 0;
        const fullpath = parts[5] || '';
        const path = parts[6] || '';
        const textt = parts[7] || '';
        
        // Use textt if available, otherwise use fullpath, otherwise use path
        const rubricText = textt && textt !== '\\N' ? textt : (fullpath && fullpath !== '\\N' ? fullpath : (path && path !== '\\N' ? path : ''));
        
        // Only process publicum (English) repertory - skip German (kent-de) and others
        if (id && rubricText && abbrev === 'publicum') {
          const chapterName = chapters.get(chapterid) || 'Unknown';
          
          // Verify it's English (not German)
          const isEnglish = !rubricText.match(/[äöüßÄÖÜ]/); // German has special characters
          
          if (isEnglish || rubricText.length > 0) { // Allow all publicum rubrics
            rubrics.push({
              id,
              repertory_type: abbrev, // publicum (English)
              rubric_text: rubricText.trim(),
              chapter: chapterName,
              chapterid,
            });
          }
        }
      }
    }
  }
  console.log(`   Found ${rubrics.length} rubrics`);

  // Extract rubric-remedy mappings
  console.log('🔗 Extracting rubric-remedy mappings...');
  let inMappingData = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('COPY public.rubricremedy')) {
      inMappingData = true;
      continue;
    }
    
    if (inMappingData) {
      if (line === '\\.') {
        inMappingData = false;
        continue;
      }
      
      // Parse mapping data: abbrev, rubricid, remedyid, weight, chapterid
      const parts = line.split('\t');
      if (parts.length >= 4) {
        const abbrev = parts[0] || '';
        const rubricid = parseInt(parts[1]);
        const remedyid = parseInt(parts[2]);
        const weight = parseInt(parts[3]) || 1;
        
        // Only process publicum (English) repertory mappings - skip German (kent-de) and others
        if (rubricid && remedyid && abbrev === 'publicum') {
          mappings.push({
            rubric_id: rubricid,
            remedy_id: remedyid,
            repertory_type: abbrev, // publicum
            grade: weight, // weight is the grade in OOREP
          });
        }
      }
    }
  }
  console.log(`   Found ${mappings.length} English (publicum) mappings`);

  return { rubrics, remedies, mappings, chapters };
}

/**
 * Extract data from PostgreSQL (Alternative method)
 */
async function extractFromPostgreSQL(): Promise<{
  rubrics: any[];
  remedies: any[];
  mappings: any[];
  chapters: Map<number, string>;
}> {
  const pgClient = new Client({
    host: process.env.OOREP_DB_HOST || 'localhost',
    port: parseInt(process.env.OOREP_DB_PORT || '5432'),
    database: process.env.OOREP_DB_NAME || 'oorep',
    user: process.env.OOREP_DB_USER || 'postgres',
    password: process.env.OOREP_DB_PASS || '',
  });

  await pgClient.connect();
  console.log('✅ Connected to PostgreSQL (OOREP database)');

  try {
    // Extract chapters
    console.log('📚 Extracting chapters...');
    const chaptersResult = await pgClient.query(`
      SELECT id, textt as text
      FROM chapter
    `);
    const chapters = new Map<number, string>();
    chaptersResult.rows.forEach((row) => {
      if (row.id && row.text) {
        chapters.set(row.id, row.text);
      }
    });
    console.log(`   Found ${chapters.size} chapters`);

    // Extract rubrics
    console.log('📖 Extracting rubrics...');
    const rubricsResult = await pgClient.query(`
      SELECT DISTINCT
        r.id,
        r.abbrev as repertory_type,
        r.textt as rubric_text,
        r.chapterid,
        c.textt as chapter
      FROM rubric r
      LEFT JOIN chapter c ON r.chapterid = c.id
      WHERE r.abbrev = 'publicum'
      ORDER BY r.chapterid, r.textt
    `);

    console.log(`   Found ${rubricsResult.rows.length} rubrics`);

    // Extract remedies
    console.log('💊 Extracting remedies...');
    const remediesResult = await pgClient.query(`
      SELECT 
        id,
        namelong as name,
        nameabbrev as abbreviation
      FROM remedy
      ORDER BY namelong
    `);

    console.log(`   Found ${remediesResult.rows.length} remedies`);

    // Extract rubric-remedy mappings
    console.log('🔗 Extracting rubric-remedy mappings...');
    const mappingsResult = await pgClient.query(`
      SELECT 
        rr.rubricid as rubric_id,
        rr.remedyid as remedy_id,
        rr.abbrev as repertory_type,
        rr.weight as grade
      FROM rubricremedy rr
      WHERE rr.abbrev = 'publicum'
      ORDER BY rr.rubricid, rr.weight DESC
    `);

    console.log(`   Found ${mappingsResult.rows.length} mappings`);

    return {
      rubrics: rubricsResult.rows.map((r) => ({
        id: r.id,
        repertory_type: r.repertory_type,
        rubric_text: r.rubric_text || r.rubric_text,
        chapter: r.chapter || 'Unknown',
        chapterid: r.chapterid,
      })),
      remedies: remediesResult.rows,
      mappings: mappingsResult.rows,
      chapters,
    };
  } finally {
    await pgClient.end();
    console.log('🔌 Disconnected from PostgreSQL');
  }
}

/**
 * Transform OOREP rubrics to your schema
 */
function transformRubrics(oorepRubrics: any[]): any[] {
  return oorepRubrics.map((r) => {
    // Ensure publicum stays as 'publicum' (English repertory)
    const repertoryType = r.repertory_type === 'publicum' ? 'publicum' : (repertoryTypeMap[r.repertory_type] || 'kent');
    
    // Verify it's English rubric
    if (repertoryType !== 'publicum') {
      console.warn(`⚠️  Warning: Non-publicum rubric found: ${r.repertory_type} - Skipping`);
      return null;
    }
    
    return {
      oorepId: r.id, // Store for ID mapping
      repertoryType: 'publicum', // Force to publicum (English)
      chapter: r.chapter || 'Unknown',
      rubricText: r.rubric_text,
      linkedSymptoms: [], // Will be populated later if needed
      modality: 'classical_homeopathy',
      isGlobal: true,
    };
  }).filter(r => r !== null); // Remove any null entries
}

/**
 * Transform OOREP remedies to your schema
 */
function transformRemedies(oorepRemedies: any[]): any[] {
  return oorepRemedies.map((r) => {
    // Map kingdom to category
    const categoryMap: Record<string, string> = {
      'plant': 'Plant Kingdom',
      'mineral': 'Mineral Kingdom',
      'animal': 'Animal Kingdom',
      'nosode': 'Nosode',
      'sarcode': 'Sarcode',
      'imponderabilia': 'Imponderabilia',
    };

    return {
      oorepId: r.id, // Store for ID mapping
      name: r.name || r.abbreviation || 'Unknown',
      category: categoryMap[r.category?.toLowerCase() || ''] || r.category || 'Unknown',
      modality: 'classical_homeopathy',
      constitutionTraits: [],
      modalities: {
        better: [],
        worse: [],
      },
      clinicalIndications: [],
      incompatibilities: [],
      materiaMedica: {
        keynotes: [],
        pathogenesis: '',
        clinicalNotes: '',
      },
      supportedPotencies: ['6C', '30C', '200C', '1M'],
      isGlobal: true,
    };
  });
}

/**
 * Transform OOREP mappings to your schema
 */
function transformMappings(
  oorepMappings: any[],
  rubricIdMap: Map<number, mongoose.Types.ObjectId>,
  remedyIdMap: Map<number, mongoose.Types.ObjectId>
): any[] {
  const validMappings: any[] = [];

  for (const m of oorepMappings) {
    // Only process publicum (English) mappings - skip others
    if (m.repertory_type !== 'publicum') {
      continue; // Skip non-publicum mappings
    }
    
    const rubricId = rubricIdMap.get(m.rubric_id);
    const remedyId = remedyIdMap.get(m.remedy_id);

    if (!rubricId || !remedyId) {
      // Skip if IDs not found (shouldn't happen, but safety check)
      continue;
    }

    // Force to publicum (English repertory only)
    const repertoryType = 'publicum';
    
    // Ensure grade is between 1-4
    let grade = Math.max(1, Math.min(4, m.grade || 1));

    validMappings.push({
      rubricId,
      remedyId,
      grade,
      repertoryType: 'publicum', // English repertory only
    });
  }

  return validMappings;
}

/**
 * Seed rubrics to MongoDB
 */
async function seedRubrics(transformedRubrics: any[]): Promise<void> {
  console.log('\n📝 Seeding rubrics to MongoDB...');
  console.log('✅ Verifying: Only English (publicum) rubrics will be seeded');
  
  // Filter to only publicum rubrics (English only)
  const publicumRubrics = transformedRubrics.filter(r => r.repertoryType === 'publicum');
  console.log(`📊 Total English (publicum) rubrics to seed: ${publicumRubrics.length}`);
  
  // Verify no non-publicum rubrics
  const nonPublicum = transformedRubrics.filter(r => r.repertoryType !== 'publicum');
  if (nonPublicum.length > 0) {
    console.warn(`⚠️  Warning: Found ${nonPublicum.length} non-publicum rubrics - they will be skipped`);
  }
  
  const batchSize = 1000;
  let inserted = 0;
  let skipped = 0;
  
  for (let i = 0; i < publicumRubrics.length; i += batchSize) {
    const batch = publicumRubrics.slice(i, i + batchSize);
    
    for (const rubric of batch) {
      try {
        // Check if rubric already exists
        const existing = await Rubric.findOne({
          rubricText: rubric.rubricText,
          repertoryType: rubric.repertoryType,
        });

        if (existing) {
          rubricIdMap.set(rubric.oorepId, existing._id);
          skipped++;
          continue;
        }

        // Create new rubric
        const newRubric = new Rubric({
          repertoryType: rubric.repertoryType,
          chapter: rubric.chapter,
          rubricText: rubric.rubricText,
          linkedSymptoms: rubric.linkedSymptoms,
          modality: rubric.modality,
          isGlobal: rubric.isGlobal,
        });

        const saved = await newRubric.save();
        rubricIdMap.set(rubric.oorepId, saved._id);
        inserted++;
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key error
          const existing = await Rubric.findOne({
            rubricText: rubric.rubricText,
            repertoryType: rubric.repertoryType,
          });
          if (existing) {
            rubricIdMap.set(rubric.oorepId, existing._id);
            skipped++;
          }
        } else {
          console.error(`Error inserting rubric ${rubric.rubricText}:`, error.message);
        }
      }
    }

    if ((i + batchSize) % 5000 === 0) {
      console.log(`   Processed ${Math.min(i + batchSize, publicumRubrics.length)}/${publicumRubrics.length} English rubrics...`);
    }
  }

  console.log(`   ✅ English (publicum) rubrics: ${inserted} inserted, ${skipped} skipped`);
}

/**
 * Seed remedies to MongoDB
 */
async function seedRemedies(transformedRemedies: any[]): Promise<void> {
  console.log('\n💊 Seeding remedies to MongoDB...');
  
  let inserted = 0;
  let skipped = 0;

  for (const remedy of transformedRemedies) {
    try {
      // Check if remedy already exists
      const existing = await Remedy.findOne({
        name: remedy.name,
        modality: 'classical_homeopathy',
      });

      if (existing) {
        remedyIdMap.set(remedy.oorepId, existing._id);
        skipped++;
        continue;
      }

      // Create new remedy
      const newRemedy = new Remedy({
        name: remedy.name,
        category: remedy.category,
        modality: remedy.modality,
        constitutionTraits: remedy.constitutionTraits,
        modalities: remedy.modalities,
        clinicalIndications: remedy.clinicalIndications,
        incompatibilities: remedy.incompatibilities,
        materiaMedica: remedy.materiaMedica,
        supportedPotencies: remedy.supportedPotencies,
        isGlobal: remedy.isGlobal,
      });

      const saved = await newRemedy.save();
      remedyIdMap.set(remedy.oorepId, saved._id);
      inserted++;
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error
        const existing = await Remedy.findOne({
          name: remedy.name,
          modality: 'classical_homeopathy',
        });
        if (existing) {
          remedyIdMap.set(remedy.oorepId, existing._id);
          skipped++;
        }
      } else {
        console.error(`Error inserting remedy ${remedy.name}:`, error.message);
      }
    }
  }

  console.log(`   ✅ Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
}

/**
 * Seed rubric-remedy mappings to MongoDB
 */
async function seedMappings(transformedMappings: any[]): Promise<void> {
  console.log('\n🔗 Seeding rubric-remedy mappings to MongoDB...');
  console.log('✅ Verifying: Only English (publicum) mappings will be seeded');
  
  // Verify all mappings are publicum (English)
  const nonPublicum = transformedMappings.filter(m => m.repertoryType !== 'publicum');
  if (nonPublicum.length > 0) {
    console.warn(`⚠️  Warning: Found ${nonPublicum.length} non-publicum mappings - they will be skipped`);
  }
  
  // Filter to only publicum mappings
  const publicumMappings = transformedMappings.filter(m => m.repertoryType === 'publicum');
  console.log(`📊 Total English (publicum) mappings to seed: ${publicumMappings.length}`);
  
  const batchSize = 5000;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < publicumMappings.length; i += batchSize) {
    const batch = publicumMappings.slice(i, i + batchSize);
    
    const bulkOps = batch.map((m) => ({
      updateOne: {
        filter: {
          rubricId: m.rubricId,
          remedyId: m.remedyId,
          repertoryType: m.repertoryType,
        },
        update: {
          $set: {
            rubricId: m.rubricId,
            remedyId: m.remedyId,
            grade: m.grade,
            repertoryType: m.repertoryType,
          },
        },
        upsert: true,
      },
    }));

    try {
      const result = await RubricRemedy.bulkWrite(bulkOps, { ordered: false });
      inserted += result.upsertedCount + result.modifiedCount;
      skipped += result.matchedCount; // Already existed
    } catch (error: any) {
      console.error(`Error in bulk write (batch ${i / batchSize + 1}):`, error.message);
      // Fallback to individual inserts
      for (const m of batch) {
        try {
          await RubricRemedy.findOneAndUpdate(
            {
              rubricId: m.rubricId,
              remedyId: m.remedyId,
              repertoryType: m.repertoryType,
            },
            {
              rubricId: m.rubricId,
              remedyId: m.remedyId,
              grade: m.grade,
              repertoryType: m.repertoryType,
            },
            { upsert: true }
          );
          inserted++;
        } catch (err: any) {
          skipped++;
        }
      }
    }

    if ((i + batchSize) % 10000 === 0) {
      console.log(`   Processed ${Math.min(i + batchSize, transformedMappings.length)}/${transformedMappings.length} mappings...`);
    }
  }

  console.log(`   ✅ Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
}

/**
 * Main seeding function
 */
async function seedFromOorep() {
  try {
    console.log('🚀 Starting OOREP data seeding...\n');

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Check if SQL file path is provided
    const sqlFilePath = process.argv.find((arg) => arg.startsWith('--file='))?.split('=')[1];
    const useSQLFile = sqlFilePath || process.env.OOREP_SQL_FILE;

    let data: {
      rubrics: any[];
      remedies: any[];
      mappings: any[];
      chapters: Map<number, string>;
    };

    if (useSQLFile) {
      // Extract from SQL file
      let filePath: string;
      
      if (path.isAbsolute(useSQLFile)) {
        filePath = useSQLFile;
      } else {
        // Try relative to project root (one level up from backend)
        const projectRoot = path.join(process.cwd(), '..');
        filePath = path.join(projectRoot, useSQLFile);
        
        // If not found, try relative to current directory
        if (!fs.existsSync(filePath)) {
          filePath = path.join(process.cwd(), useSQLFile);
        }
      }
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`SQL file not found: ${filePath}\nPlease provide correct path to oorep.sql file`);
      }

      console.log(`📄 Using SQL file: ${filePath}\n`);
      data = await extractFromSQLFile(filePath);
    } else {
      // Extract from PostgreSQL
      data = await extractFromPostgreSQL();
    }

    const { rubrics, remedies, mappings } = data;

    // Transform data
    console.log('\n🔄 Transforming data to your schema...');
    const transformedRubrics = transformRubrics(rubrics);
    const transformedRemedies = transformRemedies(remedies);
    console.log(`   ✅ Transformed ${transformedRubrics.length} rubrics`);
    console.log(`   ✅ Transformed ${transformedRemedies.length} remedies`);

    // Seed in order: Rubrics → Remedies → Mappings
    await seedRubrics(transformedRubrics);
    await seedRemedies(transformedRemedies);

    // Transform mappings (needs ID maps)
    console.log('\n🔄 Transforming mappings...');
    const transformedMappings = transformMappings(mappings, rubricIdMap, remedyIdMap);
    console.log(`   ✅ Transformed ${transformedMappings.length} mappings`);

    await seedMappings(transformedMappings);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SEEDING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Rubrics: ${transformedRubrics.length}`);
    console.log(`Remedies: ${transformedRemedies.length}`);
    console.log(`Mappings: ${transformedMappings.length}`);
    console.log('='.repeat(60));
    console.log('\n✅ OOREP data seeding completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('seedFromOorep.ts') ||
                     process.argv[1]?.includes('seedFromOorep');

if (isMainModule || !process.env.JEST_WORKER_ID) {
  seedFromOorep()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

export default seedFromOorep;
