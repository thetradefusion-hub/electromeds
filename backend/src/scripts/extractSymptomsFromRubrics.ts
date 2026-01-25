/**
 * Extract Symptoms from Rubrics Script
 * 
 * Purpose: Extract unique symptoms from rubric texts and add them to the symptom database
 * 
 * This script:
 * 1. Reads all rubrics from the database (publicum repertory)
 * 2. Parses rubric text to extract symptom keywords
 * 3. Creates new symptoms in the database
 * 4. Links rubrics back to these symptoms
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../../.env') });

import Rubric from '../models/Rubric.model.js';
import Symptom from '../models/Symptom.model.js';

interface ExtractedSymptom {
  name: string;
  category: 'mental' | 'general' | 'particular' | 'modality';
  synonyms: string[];
  chapter: string;
  rubricText: string;
}

/**
 * Parse rubric text to extract symptom name
 * Examples:
 * - "FEAR - death, of" → "Fear of death"
 * - "FEVER - high" → "High fever"
 * - "HEADACHE - throbbing" → "Throbbing headache"
 * - "ANXIETY" → "Anxiety"
 */
function parseRubricText(rubricText: string): { mainSymptom: string; modifiers: string[] } {
  if (!rubricText || rubricText.trim().length === 0) {
    return { mainSymptom: '', modifiers: [] };
  }

  // Remove extra spaces and normalize
  let text = rubricText.trim();
  
  // Handle format: "MAIN - modifier1, modifier2"
  if (text.includes(' - ')) {
    const [main, modifiers] = text.split(' - ');
    const mainSymptom = main.trim();
    const modifierList = modifiers
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);
    
    return { mainSymptom, modifiers: modifierList };
  }
  
  // Handle format: "MAIN, modifier1, modifier2"
  if (text.includes(',')) {
    const parts = text.split(',').map(p => p.trim());
    return { mainSymptom: parts[0], modifiers: parts.slice(1) };
  }
  
  // Simple format: "MAIN"
  return { mainSymptom: text, modifiers: [] };
}

/**
 * Convert rubric text to readable symptom name
 */
function formatSymptomName(mainSymptom: string, modifiers: string[]): string {
  // Convert "FEAR" to "Fear"
  const formattedMain = mainSymptom
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  if (modifiers.length === 0) {
    return formattedMain;
  }
  
  // Format: "Fear of death" or "High fever"
  const formattedModifiers = modifiers
    .map(m => m.toLowerCase())
    .join(', ');
  
  // Check if modifiers should come before or after
  if (modifiers.some(m => ['of', 'in', 'on', 'at', 'with'].includes(m.toLowerCase()))) {
    return `${formattedMain} ${formattedModifiers}`;
  }
  
  return `${formattedModifiers} ${formattedMain}`;
}

/**
 * Determine symptom category based on chapter
 */
function getCategoryFromChapter(chapter: string): 'mental' | 'general' | 'particular' | 'modality' {
  const chapterLower = chapter.toLowerCase();
  
  if (chapterLower.includes('mind') || chapterLower.includes('mental')) {
    return 'mental';
  }
  
  if (chapterLower.includes('general') || chapterLower.includes('constitution')) {
    return 'general';
  }
  
  if (chapterLower.includes('modality') || chapterLower.includes('aggravation') || chapterLower.includes('amelioration')) {
    return 'modality';
  }
  
  // Default to particular for body parts
  return 'particular';
}

/**
 * Generate unique symptom code
 */
function generateSymptomCode(name: string, category: string): string {
  const prefix = `SYM_${category.toUpperCase().substring(0, 3)}`;
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .substring(0, 20);
  
  return `${prefix}_${base}`;
}

/**
 * Extract symptoms from all rubrics
 */
async function extractSymptomsFromRubrics(): Promise<void> {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB\n');

    // Get all publicum rubrics
    console.log('📚 Fetching all publicum rubrics...');
    const rubrics = await Rubric.find({
      repertoryType: 'publicum',
      modality: 'classical_homeopathy',
    })
      .select('rubricText chapter linkedSymptoms')
      .lean();
    
    console.log(`✅ Found ${rubrics.length} rubrics\n`);

    // Extract unique symptoms
    const symptomMap = new Map<string, ExtractedSymptom>();

    console.log('🔍 Extracting symptoms from rubrics...');
    let processed = 0;
    
    for (const rubric of rubrics) {
      processed++;
      if (processed % 1000 === 0) {
        console.log(`   Processed ${processed}/${rubrics.length} rubrics...`);
      }

      const { mainSymptom, modifiers } = parseRubricText(rubric.rubricText);
      
      if (!mainSymptom || mainSymptom.length < 2) {
        continue;
      }

      // Create main symptom
      const symptomName = formatSymptomName(mainSymptom, modifiers);
      const category = getCategoryFromChapter(rubric.chapter);
      
      // Use rubric text as key to avoid duplicates
      const key = `${category}:${symptomName.toLowerCase()}`;
      
      if (!symptomMap.has(key)) {
        symptomMap.set(key, {
          name: symptomName,
          category,
          synonyms: [mainSymptom, ...modifiers].filter(s => s && s.length > 0),
          chapter: rubric.chapter,
          rubricText: rubric.rubricText,
        });
      } else {
        // Add synonyms if not already present
        const existing = symptomMap.get(key)!;
        const newSynonyms = [mainSymptom, ...modifiers].filter(
          s => s && s.length > 0 && !existing.synonyms.includes(s)
        );
        existing.synonyms.push(...newSynonyms);
      }
    }

    console.log(`✅ Extracted ${symptomMap.size} unique symptoms\n`);

    // Get existing symptoms to avoid duplicates
    console.log('🔍 Checking existing symptoms...');
    const existingSymptoms = await Symptom.find({
      modality: 'classical_homeopathy',
      isGlobal: true,
    }).select('code name').lean();
    
    const existingNames = new Set(
      existingSymptoms.map(s => s.name.toLowerCase())
    );
    const existingCodes = new Set(
      existingSymptoms.map(s => s.code)
    );

    console.log(`✅ Found ${existingSymptoms.length} existing symptoms\n`);

    // Create new symptoms
    console.log('📝 Creating new symptoms...');
    const symptomsToCreate: any[] = [];
    let newCount = 0;
    let duplicateCount = 0;

    for (const [, symptom] of symptomMap.entries()) {
      // Skip if already exists
      if (existingNames.has(symptom.name.toLowerCase())) {
        duplicateCount++;
        continue;
      }

      // Generate unique code
      let code = generateSymptomCode(symptom.name, symptom.category);
      let counter = 1;
      while (existingCodes.has(code)) {
        code = `${generateSymptomCode(symptom.name, symptom.category)}_${counter}`;
        counter++;
      }
      existingCodes.add(code);

      symptomsToCreate.push({
        code,
        name: symptom.name,
        category: symptom.category,
        modality: 'classical_homeopathy',
        synonyms: [...new Set(symptom.synonyms)], // Remove duplicates
        description: `Extracted from rubric: ${symptom.rubricText}`,
        isGlobal: true,
      });

      newCount++;
    }

    console.log(`✅ Prepared ${newCount} new symptoms (${duplicateCount} duplicates skipped)\n`);

    // Insert in batches
    if (symptomsToCreate.length > 0) {
      console.log('💾 Inserting new symptoms...');
      const batchSize = 100;
      for (let i = 0; i < symptomsToCreate.length; i += batchSize) {
        const batch = symptomsToCreate.slice(i, i + batchSize);
        await Symptom.insertMany(batch, { ordered: false });
        console.log(`   Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(symptomsToCreate.length / batchSize)}`);
      }
      console.log(`✅ Inserted ${symptomsToCreate.length} new symptoms\n`);
    } else {
      console.log('ℹ️  No new symptoms to insert\n');
    }

    // Update rubrics with linkedSymptoms
    console.log('🔗 Linking rubrics to symptoms...');
    const allSymptoms = await Symptom.find({
      modality: 'classical_homeopathy',
      isGlobal: true,
    }).select('code name synonyms').lean();

    const symptomCodeMap = new Map<string, string>(); // symptomName -> code
    for (const symptom of allSymptoms) {
      symptomCodeMap.set(symptom.name.toLowerCase(), symptom.code);
      for (const synonym of symptom.synonyms || []) {
        symptomCodeMap.set(synonym.toLowerCase(), symptom.code);
      }
    }

    let linkedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < rubrics.length; i += batchSize) {
      const batch = rubrics.slice(i, i + batchSize);
      const updates: any[] = [];

      for (const rubric of batch) {
        const { mainSymptom, modifiers } = parseRubricText(rubric.rubricText);
        const symptomName = formatSymptomName(mainSymptom, modifiers);
        const symptomCode = symptomCodeMap.get(symptomName.toLowerCase());

        if (symptomCode) {
          updates.push({
            updateOne: {
              filter: { _id: rubric._id },
              update: {
                $addToSet: { linkedSymptoms: symptomCode },
              },
            },
          });
          linkedCount++;
        }
      }

      if (updates.length > 0) {
        await Rubric.bulkWrite(updates);
      }
    }

    console.log(`✅ Linked ${linkedCount} rubrics to symptoms\n`);

    // Summary
    console.log('\n📊 Summary:');
    console.log('─'.repeat(50));
    console.log(`Total rubrics processed: ${rubrics.length}`);
    console.log(`Unique symptoms extracted: ${symptomMap.size}`);
    console.log(`New symptoms created: ${newCount}`);
    console.log(`Duplicate symptoms skipped: ${duplicateCount}`);
    console.log(`Rubrics linked to symptoms: ${linkedCount}`);
    
    const finalSymptomCount = await Symptom.countDocuments({
      modality: 'classical_homeopathy',
      isGlobal: true,
    });
    console.log(`Total symptoms in database: ${finalSymptomCount}`);
    console.log('─'.repeat(50));

    console.log('\n✅ Symptom extraction completed successfully!');

  } catch (error: any) {
    console.error('❌ Error extracting symptoms:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
extractSymptomsFromRubrics()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
