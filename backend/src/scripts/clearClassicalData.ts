/**
 * Clear Classical Homeopathy Data
 * 
 * Yeh script Classical Homeopathy data ko clear karta hai before re-seeding.
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import Remedy from '../models/Remedy.model.js';
import Rubric from '../models/Rubric.model.js';
import RubricRemedy from '../models/RubricRemedy.model.js';

async function clearClassicalData() {
  try {
    console.log('🗑️  Clearing Classical Homeopathy data...\n');

    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Count before clearing
    const rubricsBefore = await Rubric.countDocuments({ modality: 'classical_homeopathy' });
    const remediesBefore = await Remedy.countDocuments({ modality: 'classical_homeopathy' });
    const mappingsBefore = await RubricRemedy.countDocuments({});

    console.log('📊 Before Clearing:');
    console.log(`   Rubrics: ${rubricsBefore}`);
    console.log(`   Remedies: ${remediesBefore}`);
    console.log(`   Mappings: ${mappingsBefore}\n`);

    // Clear data
    console.log('🗑️  Deleting data...');
    
    const rubricsResult = await Rubric.deleteMany({ modality: 'classical_homeopathy' });
    const remediesResult = await Remedy.deleteMany({ modality: 'classical_homeopathy' });
    const mappingsResult = await RubricRemedy.deleteMany({});

    console.log(`   ✅ Deleted ${rubricsResult.deletedCount} rubrics`);
    console.log(`   ✅ Deleted ${remediesResult.deletedCount} remedies`);
    console.log(`   ✅ Deleted ${mappingsResult.deletedCount} mappings\n`);

    // Verify
    const rubricsAfter = await Rubric.countDocuments({ modality: 'classical_homeopathy' });
    const remediesAfter = await Remedy.countDocuments({ modality: 'classical_homeopathy' });
    const mappingsAfter = await RubricRemedy.countDocuments({});

    console.log('📊 After Clearing:');
    console.log(`   Rubrics: ${rubricsAfter}`);
    console.log(`   Remedies: ${remediesAfter}`);
    console.log(`   Mappings: ${mappingsAfter}\n`);

    if (rubricsAfter === 0 && remediesAfter === 0 && mappingsAfter === 0) {
      console.log('✅ All Classical Homeopathy data cleared successfully!');
      console.log('💡 Now you can run: npm run seed:oorep:file');
    } else {
      console.log('⚠️  Some data still exists. Please check manually.');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

clearClassicalData();
