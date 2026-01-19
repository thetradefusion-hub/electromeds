/**
 * Check Duplicate Logic
 * 
 * Yeh script duplicate detection logic ko verify karta hai.
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import Rubric from '../models/Rubric.model.js';
import Remedy from '../models/Remedy.model.js';
import RubricRemedy from '../models/RubricRemedy.model.js';

async function checkDuplicateLogic() {
  try {
    console.log('🔍 Checking duplicate detection logic...\n');

    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Check a few sample rubrics from OOREP data
    const testRubrics = [
      { repertoryType: 'kent', rubricText: 'FEAR - death, of', chapter: 'Mind' },
      { repertoryType: 'kent', rubricText: 'ANXIETY', chapter: 'Mind' },
      { repertoryType: 'kent', rubricText: 'FEVER - sudden', chapter: 'Generals' },
    ];

    console.log('📋 Testing Duplicate Detection:\n');
    
    for (const testRubric of testRubrics) {
      const existing = await Rubric.findOne({
        rubricText: testRubric.rubricText,
        repertoryType: testRubric.repertoryType,
      });

      console.log(`   Rubric: "${testRubric.rubricText}"`);
      console.log(`   Repertory: ${testRubric.repertoryType}`);
      console.log(`   Found: ${existing ? 'YES (would skip)' : 'NO (would insert)'}`);
      if (existing) {
        console.log(`   Existing ID: ${existing._id}`);
        console.log(`   Existing Chapter: ${existing.chapter}`);
      }
      console.log('');
    }

    // Check actual count vs what should exist
    console.log('📊 Current Database State:\n');
    const currentRubrics = await Rubric.countDocuments({ modality: 'classical_homeopathy' });
    const currentRemedies = await Remedy.countDocuments({ modality: 'classical_homeopathy' });
    const currentMappings = await RubricRemedy.countDocuments({});

    console.log(`   Current Rubrics: ${currentRubrics}`);
    console.log(`   Current Remedies: ${currentRemedies}`);
    console.log(`   Current Mappings: ${currentMappings}`);

    // Check if there are any rubrics with same text but different repertory
    console.log('\n🔍 Checking for potential duplicate issues:\n');
    
    const sampleRubric = await Rubric.findOne({ modality: 'classical_homeopathy' });
    if (sampleRubric) {
      console.log(`   Sample Rubric Text: "${sampleRubric.rubricText}"`);
      console.log(`   Sample Repertory Type: ${sampleRubric.repertoryType}`);
      
      // Check if there are other rubrics with same text
      const sameTextRubrics = await Rubric.find({
        rubricText: sampleRubric.rubricText,
        modality: 'classical_homeopathy'
      }).select('repertoryType rubricText').lean();
      
      console.log(`   Rubrics with same text: ${sameTextRubrics.length}`);
      sameTextRubrics.forEach((r, i) => {
        console.log(`     ${i + 1}. [${r.repertoryType}] ${r.rubricText?.substring(0, 50)}`);
      });
    }

    // Check what was actually inserted vs what should be
    console.log('\n📈 Analysis:\n');
    console.log('   Expected from OOREP:');
    console.log('     - Rubrics: 68,740');
    console.log('     - Remedies: 2,432');
    console.log('     - Mappings: 623,613');
    console.log('\n   Actually in Database:');
    console.log(`     - Rubrics: ${currentRubrics} (Missing: ${68740 - currentRubrics})`);
    console.log(`     - Remedies: ${currentRemedies} (Extra: ${currentRemedies - 2432})`);
    console.log(`     - Mappings: ${currentMappings} (Missing: ${623613 - currentMappings})`);

    console.log('\n💡 Conclusion:');
    if (currentRubrics < 1000) {
      console.log('   ⚠️  Very few rubrics found - duplicate detection might be too aggressive');
      console.log('   💡 Suggestion: Check if rubricText matching is case-sensitive or has whitespace issues');
    } else if (currentRubrics < 68740) {
      console.log('   ⚠️  Some rubrics missing - may have been skipped as duplicates');
      console.log('   💡 This could be normal if data was seeded before');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkDuplicateLogic();
