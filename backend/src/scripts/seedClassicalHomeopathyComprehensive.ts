/**
 * Comprehensive Seed Script: Classical Homeopathy Data
 * 
 * This script seeds comprehensive data for Classical Homeopathy:
 * - 100+ Remedies with full Materia Medica
 * - 200+ Symptoms with codes and synonyms
 * - 1000+ Rubrics from Kent Repertory
 * - 5000+ Rubric-Remedy mappings with grades
 * 
 * Run: tsx src/scripts/seedClassicalHomeopathyComprehensive.ts
 * 
 * Note: This script may take several minutes to complete
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import '../models/Remedy.model.js';
import '../models/Rubric.model.js';
import '../models/RubricRemedy.model.js';
import '../models/Symptom.model.js';
import Remedy from '../models/Remedy.model.js';
import Rubric from '../models/Rubric.model.js';
import RubricRemedy from '../models/RubricRemedy.model.js';
import Symptom from '../models/Symptom.model.js';

// Import data generators
import { generateRemediesData } from './data/generateRemediesData.js';
import { generateSymptomsData } from './data/generateSymptomsData.js';
import { generateRubricsData } from './data/generateRubricsData.js';
import { generateRubricRemedyMappings } from './data/generateRubricRemedyMappings.js';

async function seedComprehensiveData() {
  try {
    console.log('🌱 Seeding Comprehensive Classical Homeopathy Data...\n');
    console.log('⏱️  This may take several minutes...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Ask for confirmation
    const existingRemedies = await Remedy.countDocuments({ modality: 'classical_homeopathy' });
    const existingSymptoms = await Symptom.countDocuments({ modality: 'classical_homeopathy' });
    const existingRubrics = await Rubric.countDocuments({ modality: 'classical_homeopathy' });
    const existingMappings = await RubricRemedy.countDocuments({});

    if (existingRemedies > 0 || existingSymptoms > 0 || existingRubrics > 0 || existingMappings > 0) {
      console.log('⚠️  WARNING: Existing data found:');
      console.log(`   Remedies: ${existingRemedies}`);
      console.log(`   Symptoms: ${existingSymptoms}`);
      console.log(`   Rubrics: ${existingRubrics}`);
      console.log(`   Mappings: ${existingMappings}\n`);
      console.log('💡 This script will ADD to existing data (not replace).');
      console.log('💡 To replace, delete existing data first.\n');
    }

    // Step 1: Create Remedies (100+)
    console.log('💊 Step 1: Creating Remedies...');
    let remedyCount = 0;
    const remedyMap = new Map<string, mongoose.Types.ObjectId>();

    // Generate remedies data
    const POLYCHREST_REMEDIES = generateRemediesData();
    
    // Check existing remedies
    const existingRemedyNames = new Set(
      (await Remedy.find({ modality: 'classical_homeopathy' }).select('name').lean())
        .map((r: any) => r.name)
    );

    const remediesToInsert = POLYCHREST_REMEDIES.filter((r) => !existingRemedyNames.has(r.name));

    if (remediesToInsert.length > 0) {
      // Insert in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < remediesToInsert.length; i += batchSize) {
        const batch = remediesToInsert.slice(i, i + batchSize);
        const inserted = await Remedy.insertMany(batch);
        inserted.forEach((r) => remedyMap.set(r.name, r._id));
        remedyCount += inserted.length;
        console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted.length} remedies`);
      }
    } else {
      console.log('   ℹ️  All remedies already exist, fetching existing...');
      const existing = await Remedy.find({ modality: 'classical_homeopathy' }).lean();
      existing.forEach((r: any) => remedyMap.set(r.name, r._id));
      remedyCount = existing.length;
    }

    console.log(`   ✅ Total Remedies: ${remedyMap.size}\n`);

    // Step 2: Create Symptoms (200+)
    console.log('🩺 Step 2: Creating Symptoms...');
    let symptomCount = 0;
    const symptomMap = new Map<string, mongoose.Types.ObjectId>();

    // Generate symptoms data
    const CLASSICAL_SYMPTOMS = generateSymptomsData();
    
    // Check existing symptoms
    const existingSymptomCodes = new Set(
      (await Symptom.find({ modality: 'classical_homeopathy' }).select('code').lean())
        .map((s: any) => s.code)
    );

    const symptomsToInsert = CLASSICAL_SYMPTOMS.filter((s) => !existingSymptomCodes.has(s.code));

    if (symptomsToInsert.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < symptomsToInsert.length; i += batchSize) {
        const batch = symptomsToInsert.slice(i, i + batchSize);
        const inserted = await Symptom.insertMany(batch);
        inserted.forEach((s) => symptomMap.set(s.code, s._id));
        symptomCount += inserted.length;
        console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted.length} symptoms`);
      }
    } else {
      console.log('   ℹ️  All symptoms already exist, fetching existing...');
      const existing = await Symptom.find({ modality: 'classical_homeopathy' }).lean();
      existing.forEach((s: any) => symptomMap.set(s.code, s._id));
      symptomCount = existing.length;
    }

    console.log(`   ✅ Total Symptoms: ${symptomMap.size}\n`);

    // Step 3: Create Rubrics (1000+)
    console.log('📚 Step 3: Creating Rubrics...');
    let rubricCount = 0;
    const rubricMap = new Map<string, mongoose.Types.ObjectId>();

    // Generate rubrics data (using symptom codes from created symptoms)
    const symptomCodes = Array.from(symptomMap.keys());
    const KENT_RUBRICS = generateRubricsData(symptomCodes);
    
    // Check existing rubrics
    const existingRubricTexts = new Set(
      (await Rubric.find({ modality: 'classical_homeopathy' }).select('rubricText repertoryType').lean())
        .map((r: any) => `${r.repertoryType}:${r.rubricText}`)
    );

    const rubricsToInsert = KENT_RUBRICS.filter(
      (r) => !existingRubricTexts.has(`${r.repertoryType}:${r.rubricText}`)
    );

    if (rubricsToInsert.length > 0) {
      // Filter rubrics to only include those with valid symptom codes
      const validRubrics = rubricsToInsert.map((r) => ({
        ...r,
        linkedSymptoms: r.linkedSymptoms.filter((code) => symptomMap.has(code)), // Keep only valid codes
      }));

      const batchSize = 200;
      for (let i = 0; i < validRubrics.length; i += batchSize) {
        const batch = validRubrics.slice(i, i + batchSize);
        const inserted = await Rubric.insertMany(batch);
        inserted.forEach((r) => rubricMap.set(`${r.repertoryType}:${r.rubricText}`, r._id));
        rubricCount += inserted.length;
        console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted.length} rubrics`);
      }
    } else {
      console.log('   ℹ️  All rubrics already exist, fetching existing...');
      const existing = await Rubric.find({ modality: 'classical_homeopathy' }).lean();
      existing.forEach((r: any) => rubricMap.set(`${r.repertoryType}:${r.rubricText}`, r._id));
      rubricCount = existing.length;
    }

    console.log(`   ✅ Total Rubrics: ${rubricMap.size}\n`);

    // Step 4: Create Rubric-Remedy Mappings (5000+)
    console.log('🔗 Step 4: Creating Rubric-Remedy Mappings...');
    let mappingCount = 0;

    // Check existing mappings
    const existingMappingsSet = new Set(
      (await RubricRemedy.find({}).select('rubricId remedyId').lean())
        .map((m: any) => `${m.rubricId}:${m.remedyId}`)
    );

    // Generate rubric-remedy mappings
    const rubricKeys = Array.from(rubricMap.keys());
    const remedyNames = Array.from(remedyMap.keys());
    const RUBRIC_REMEDY_MAPPINGS = generateRubricRemedyMappings(rubricKeys, remedyNames);
    
    // Process mappings in batches and deduplicate
    const mappingsToInsert: any[] = [];
    const pendingMappingsSet = new Set<string>(); // Track mappings being inserted
    
    for (const mapping of RUBRIC_REMEDY_MAPPINGS) {
      const rubricKey = `${mapping.repertoryType}:${mapping.rubricText}`;
      const rubricId = rubricMap.get(rubricKey);
      const remedyId = remedyMap.get(mapping.remedyName);

      if (rubricId && remedyId) {
        const mappingKey = `${rubricId}:${remedyId}`;
        // Skip if already exists in DB or already in pending list
        if (!existingMappingsSet.has(mappingKey) && !pendingMappingsSet.has(mappingKey)) {
          mappingsToInsert.push({
            rubricId,
            remedyId,
            grade: mapping.grade,
            repertoryType: mapping.repertoryType,
          });
          pendingMappingsSet.add(mappingKey); // Track to avoid duplicates
        }
      }
    }

    if (mappingsToInsert.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < mappingsToInsert.length; i += batchSize) {
        const batch = mappingsToInsert.slice(i, i + batchSize);
        await RubricRemedy.insertMany(batch);
        mappingCount += batch.length;
        console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} mappings`);
      }
    } else {
      console.log('   ℹ️  All mappings already exist');
    }

    console.log(`   ✅ Total New Mappings: ${mappingCount}\n`);

    // Final Summary
    console.log('📊 Seeding Summary:');
    console.log(`   ✅ Remedies: ${remedyMap.size} (${remediesToInsert.length} new)`);
    console.log(`   ✅ Symptoms: ${symptomMap.size} (${symptomsToInsert.length} new)`);
    console.log(`   ✅ Rubrics: ${rubricMap.size} (${rubricsToInsert.length} new)`);
    console.log(`   ✅ Rubric-Remedy Mappings: ${mappingCount} new\n`);

    console.log('✨ Comprehensive data seeded successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Verify data: npm run check:classical-symptoms');
    console.log('   2. Test API: npm run test:classical-api');
    console.log('   3. Start server: npm run dev');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run seeding
seedComprehensiveData()
  .then(() => {
    console.log('\n✨ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seed script failed:', error);
    process.exit(1);
  });
