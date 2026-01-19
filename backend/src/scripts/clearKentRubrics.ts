/**
 * Clear Kent (German) Rubrics Only
 * 
 * Yeh script sirf kent (German) rubrics aur unke mappings delete karta hai
 * Publicum (English) rubrics aur mappings ko preserve rakhta hai
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import Rubric from '../models/Rubric.model.js';
import RubricRemedy from '../models/RubricRemedy.model.js';

async function clearKentRubrics() {
  try {
    console.log('🗑️  Clearing Kent (German) rubrics and mappings...\n');

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Count before clearing
    console.log('📊 Before Clearing:');
    const kentRubricsBefore = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      repertoryType: 'kent',
    });
    const publicumRubricsBefore = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      repertoryType: 'publicum',
    });
    const kentMappingsBefore = await RubricRemedy.countDocuments({
      repertoryType: 'kent',
    });
    const publicumMappingsBefore = await RubricRemedy.countDocuments({
      repertoryType: 'publicum',
    });

    console.log(`   Kent (German) Rubrics: ${kentRubricsBefore}`);
    console.log(`   Publicum (English) Rubrics: ${publicumRubricsBefore}`);
    console.log(`   Kent (German) Mappings: ${kentMappingsBefore}`);
    console.log(`   Publicum (English) Mappings: ${publicumMappingsBefore}\n`);

    // Delete Kent (German) rubrics
    console.log('🗑️  Deleting Kent (German) rubrics...');
    const kentRubricsResult = await Rubric.deleteMany({
      modality: 'classical_homeopathy',
      repertoryType: 'kent',
    });
    console.log(`   ✅ Deleted ${kentRubricsResult.deletedCount} Kent (German) rubrics`);

    // Delete Kent (German) mappings
    console.log('🗑️  Deleting Kent (German) mappings...');
    const kentMappingsResult = await RubricRemedy.deleteMany({
      repertoryType: 'kent',
    });
    console.log(`   ✅ Deleted ${kentMappingsResult.deletedCount} Kent (German) mappings\n`);

    // Count after clearing
    console.log('📊 After Clearing:');
    const kentRubricsAfter = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      repertoryType: 'kent',
    });
    const publicumRubricsAfter = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      repertoryType: 'publicum',
    });
    const kentMappingsAfter = await RubricRemedy.countDocuments({
      repertoryType: 'kent',
    });
    const publicumMappingsAfter = await RubricRemedy.countDocuments({
      repertoryType: 'publicum',
    });

    console.log(`   Kent (German) Rubrics: ${kentRubricsAfter} (should be 0)`);
    console.log(`   Publicum (English) Rubrics: ${publicumRubricsAfter} (preserved)`);
    console.log(`   Kent (German) Mappings: ${kentMappingsAfter} (should be 0)`);
    console.log(`   Publicum (English) Mappings: ${publicumMappingsAfter} (preserved)\n`);

    console.log('✅ Kent (German) rubrics and mappings cleared successfully!');
    console.log('✅ Publicum (English) rubrics and mappings preserved!');

  } catch (error) {
    console.error('\n❌ Error during clearing:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
clearKentRubrics()
  .then(() => {
    console.log('\n✅ Clearing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Clearing failed:', error);
    process.exit(1);
  });

export default clearKentRubrics;
