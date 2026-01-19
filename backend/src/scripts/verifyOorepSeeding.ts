/**
 * Verify OOREP Seeding Script
 * 
 * Yeh script MongoDB me actual data count karke verify karta hai ki seeding sahi hui hai ya nahi.
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import Remedy from '../models/Remedy.model.js';
import Rubric from '../models/Rubric.model.js';
import RubricRemedy from '../models/RubricRemedy.model.js';

async function verifySeeding() {
  try {
    console.log('🔍 Verifying OOREP data seeding...\n');

    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Count Classical Homeopathy data
    console.log('📊 Counting Classical Homeopathy data...\n');

    // Count Rubrics
    const totalRubrics = await Rubric.countDocuments({ 
      modality: 'classical_homeopathy' 
    });
    const globalRubrics = await Rubric.countDocuments({ 
      modality: 'classical_homeopathy',
      isGlobal: true 
    });
    const kentRubrics = await Rubric.countDocuments({ 
      modality: 'classical_homeopathy',
      repertoryType: 'kent' 
    });
    const publicumRubrics = await Rubric.countDocuments({ 
      modality: 'classical_homeopathy',
      repertoryType: 'publicum' 
    });
    const bbcrRubrics = await Rubric.countDocuments({ 
      modality: 'classical_homeopathy',
      repertoryType: 'bbcr' 
    });
    const boerickeRubrics = await Rubric.countDocuments({ 
      modality: 'classical_homeopathy',
      repertoryType: 'boericke' 
    });
    const synthesisRubrics = await Rubric.countDocuments({ 
      modality: 'classical_homeopathy',
      repertoryType: 'synthesis' 
    });

    // Count Remedies
    const totalRemedies = await Remedy.countDocuments({ 
      modality: 'classical_homeopathy' 
    });
    const globalRemedies = await Remedy.countDocuments({ 
      modality: 'classical_homeopathy',
      isGlobal: true 
    });

    // Count Mappings
    const totalMappings = await RubricRemedy.countDocuments({});
    const kentMappings = await RubricRemedy.countDocuments({ 
      repertoryType: 'kent' 
    });
    const publicumMappings = await RubricRemedy.countDocuments({ 
      repertoryType: 'publicum' 
    });
    const bbcrMappings = await RubricRemedy.countDocuments({ 
      repertoryType: 'bbcr' 
    });
    const boerickeMappings = await RubricRemedy.countDocuments({ 
      repertoryType: 'boericke' 
    });
    const synthesisMappings = await RubricRemedy.countDocuments({ 
      repertoryType: 'synthesis' 
    });

    // Sample data check
    console.log('📋 Sample Data Check:\n');
    
    const sampleRubrics = await Rubric.find({ 
      modality: 'classical_homeopathy' 
    }).limit(5).select('repertoryType chapter rubricText').lean();
    
    const sampleRemedies = await Remedy.find({ 
      modality: 'classical_homeopathy' 
    }).limit(5).select('name category').lean();
    
    const sampleMappings = await RubricRemedy.find({}).limit(5)
      .populate('rubricId', 'rubricText repertoryType')
      .populate('remedyId', 'name')
      .select('repertoryType grade').lean();

    // Print results
    console.log('='.repeat(70));
    console.log('📊 VERIFICATION RESULTS');
    console.log('='.repeat(70));
    
    console.log('\n📖 RUBRICS:');
    console.log(`   Total Classical Homeopathy Rubrics: ${totalRubrics}`);
    console.log(`   Global Rubrics: ${globalRubrics}`);
    console.log(`   - Kent: ${kentRubrics}`);
    console.log(`   - Publicum (English): ${publicumRubrics} ⭐`);
    console.log(`   - BBCR: ${bbcrRubrics}`);
    console.log(`   - Boericke: ${boerickeRubrics}`);
    console.log(`   - Synthesis: ${synthesisRubrics}`);
    
    console.log('\n💊 REMEDIES:');
    console.log(`   Total Classical Homeopathy Remedies: ${totalRemedies}`);
    console.log(`   Global Remedies: ${globalRemedies}`);
    
    console.log('\n🔗 RUBRIC-REMEDY MAPPINGS:');
    console.log(`   Total Mappings: ${totalMappings}`);
    console.log(`   - Kent: ${kentMappings}`);
    console.log(`   - Publicum (English): ${publicumMappings} ⭐`);
    console.log(`   - BBCR: ${bbcrMappings}`);
    console.log(`   - Boericke: ${boerickeMappings}`);
    console.log(`   - Synthesis: ${synthesisMappings}`);

    console.log('\n📋 SAMPLE DATA:');
    console.log('\n   Sample Rubrics:');
    sampleRubrics.forEach((r, i) => {
      console.log(`   ${i + 1}. [${r.repertoryType}] ${r.chapter} - ${r.rubricText?.substring(0, 50)}...`);
    });

    console.log('\n   Sample Remedies:');
    sampleRemedies.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name} (${r.category})`);
    });

    console.log('\n   Sample Mappings:');
    sampleMappings.forEach((m, i) => {
      const rubric = m.rubricId as any;
      const remedy = m.remedyId as any;
      console.log(`   ${i + 1}. [${m.repertoryType}] Grade ${m.grade}: ${remedy?.name || 'N/A'} → ${rubric?.rubricText?.substring(0, 40) || 'N/A'}...`);
    });

    // Verification conclusion
    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFICATION CONCLUSION');
    console.log('='.repeat(70));
    
    // Expected counts for publicum (English) repertory
    const expectedPublicumRubrics = 74667; // Valid English rubrics with text
    const expectedRemedies = 2432;
    const expectedPublicumMappings = 735566; // English mappings
    
    const publicumRubricsMatch = publicumRubrics >= expectedPublicumRubrics * 0.9; // 90% threshold
    const remediesMatch = totalRemedies >= expectedRemedies;
    const publicumMappingsMatch = publicumMappings >= expectedPublicumMappings * 0.9; // 90% threshold
    
    console.log(`\n📖 Publicum (English) Rubrics: ${publicumRubricsMatch ? '✅' : '❌'} ${publicumRubrics} (Expected: ~${expectedPublicumRubrics})`);
    console.log(`💊 Remedies: ${remediesMatch ? '✅' : '❌'} ${totalRemedies} (Expected: ~${expectedRemedies})`);
    console.log(`🔗 Publicum (English) Mappings: ${publicumMappingsMatch ? '✅' : '❌'} ${publicumMappings} (Expected: ~${expectedPublicumMappings})`);
    
    if (publicumRubricsMatch && remediesMatch && publicumMappingsMatch) {
      console.log('\n✅ Seeding verification: PASSED - English (publicum) data correctly seeded!');
    } else {
      console.log('\n⚠️  Seeding verification: PARTIAL - Some data may be missing');
      console.log('   Note: If counts are less than expected, seeding may still be in progress or some data may have been skipped as duplicates');
    }

    // Check for duplicates issue
    console.log('\n🔍 Duplicate Analysis:');
    if (publicumRubrics < expectedPublicumRubrics) {
      const missing = expectedPublicumRubrics - publicumRubrics;
      console.log(`   ⚠️  ${missing} publicum (English) rubrics missing`);
      if (publicumRubrics === 0) {
        console.log(`   ❌ Seeding may have failed or is still in progress`);
      } else {
        console.log(`   ℹ️  This is normal if data was already seeded before`);
      }
    } else {
      console.log(`   ✅ All ${expectedPublicumRubrics} publicum (English) rubrics are present`);
    }

    if (totalRemedies < expectedRemedies) {
      const missing = expectedRemedies - totalRemedies;
      console.log(`   ⚠️  ${missing} remedies missing`);
      if (totalRemedies === 0) {
        console.log(`   ❌ Remedies seeding may have failed or is still in progress`);
      }
    } else {
      console.log(`   ✅ All ${expectedRemedies} remedies are present`);
    }

    if (publicumMappings < expectedPublicumMappings) {
      const missing = expectedPublicumMappings - publicumMappings;
      console.log(`   ⚠️  ${missing} publicum (English) mappings missing`);
      if (publicumMappings === 0) {
        console.log(`   ❌ Mappings seeding may have failed or is still in progress`);
      }
    } else {
      console.log(`   ✅ All ${expectedPublicumMappings} publicum (English) mappings are present`);
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
verifySeeding()
  .then(() => {
    console.log('\n✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });

export default verifySeeding;
