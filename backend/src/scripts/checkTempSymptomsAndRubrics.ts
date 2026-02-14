/**
 * Check Temp Symptoms and Rubrics
 *
 * Database me TEMP_ wale symptoms/rubrics count karta hai aur
 * "no rubric found" ki wajah samajhne ke liye linked vs text-only rubrics dikhata hai.
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import Symptom from '../models/Symptom.model.js';
import Rubric from '../models/Rubric.model.js';

async function checkTempSymptomsAndRubrics() {
  try {
    console.log('🔍 Checking temp symptoms and rubrics in database...\n');

    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // --- Symptoms ---
    const totalSymptoms = await Symptom.countDocuments({});
    const classicalSymptoms = await Symptom.countDocuments({
      modality: 'classical_homeopathy',
    });
    const tempSymptomsByCode = await Symptom.countDocuments({
      code: { $regex: /^TEMP_/i },
    });
    const symptomsWithTempInCode = await Symptom.find(
      { code: { $regex: /^TEMP_/i } },
      { code: 1, name: 1, category: 1 }
    )
      .limit(20)
      .lean();

    // --- Rubrics ---
    const totalRubrics = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
    });
    const publicumRubrics = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      repertoryType: 'publicum',
    });
    const rubricsWithEmptyLinkedSymptoms = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      $or: [
        { linkedSymptoms: { $exists: false } },
        { linkedSymptoms: { $size: 0 } },
      ],
    });
    const publicumWithEmptyLinked = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      repertoryType: 'publicum',
      $or: [
        { linkedSymptoms: { $exists: false } },
        { linkedSymptoms: { $size: 0 } },
      ],
    });
    const rubricsWithTempInLinked = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      linkedSymptoms: /^TEMP_/i,
    });

    // --- Report ---
    console.log('═══════════════════════════════════════════════════════');
    console.log('  SYMPTOMS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Total symptoms:                    ${totalSymptoms}`);
    console.log(`  Classical homeopathy symptoms:     ${classicalSymptoms}`);
    console.log(`  Symptoms with code like TEMP_*:   ${tempSymptomsByCode}`);
    if (symptomsWithTempInCode.length > 0) {
      console.log('\n  Sample TEMP_ symptoms (first 20):');
      symptomsWithTempInCode.forEach((s: any) =>
        console.log(`    - ${s.code}  →  ${s.name} (${s.category})`)
      );
    } else {
      console.log('\n  ℹ️  No symptoms with TEMP_ code in DB (TEMP_ is generated at runtime when symptom text is not found).');
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  RUBRICS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Total rubrics (classical):         ${totalRubrics}`);
    console.log(`  Publicum (English) rubrics:       ${publicumRubrics}`);
    console.log(`  Rubrics with empty linkedSymptoms: ${rubricsWithEmptyLinkedSymptoms}`);
    console.log(`  Publicum with empty linkedSymptoms: ${publicumWithEmptyLinked}`);
    console.log(`  Rubrics with TEMP_ in linkedSymptoms: ${rubricsWithTempInLinked}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  WHY "NO RUBRIC FOUND" HAPPENS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  1. User enters symptom text that is NOT in Symptom DB.');
    console.log('     → CaseEngine returns TEMP_<timestamp> for that symptom.');
    console.log('  2. Rubric lookup first uses symptom CODES (linkedSymptoms).');
    console.log('     → No rubric has TEMP_ in linkedSymptoms, so that step finds 0.');
    console.log('  3. Fallback: rubric search by symptom NAME (text) on rubricText.');
    console.log('     → Only works if repertory has matching English text (publicum).');
    console.log('  4. If symptom name is Hindi, typo, or does not match any rubricText → 0 rubrics.');
    console.log('');
    console.log('  Fix: Add more Classical Homeopathy symptoms (and synonyms) in DB,');
    console.log('       or enter symptoms in English that match repertory wording.');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTempSymptomsAndRubrics();
