/**
 * Test Classical Homeopathy Flow
 * 
 * Yeh script test karta hai ki Classical Homeopathy rule engine properly kaam kar raha hai ya nahi.
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import Symptom from '../models/Symptom.model.js';
import Rubric from '../models/Rubric.model.js';
import RubricRemedy from '../models/RubricRemedy.model.js';
import Remedy from '../models/Remedy.model.js';

async function testFlow() {
  try {
    console.log('🔍 Testing Classical Homeopathy Flow...\n');

    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check Symptoms
    console.log('1️⃣ Checking Symptoms:');
    const classicalSymptoms = await Symptom.find({ 
      modality: 'classical_homeopathy' 
    }).limit(10).select('name category modality').lean();
    
    console.log(`   Total Classical Symptoms: ${classicalSymptoms.length}`);
    console.log(`   Sample symptoms:`);
    classicalSymptoms.slice(0, 5).forEach((s, i) => {
      console.log(`     ${i + 1}. ${s.name} (${s.category}) - Modality: ${s.modality || 'N/A'}`);
    });

    // 2. Check Rubrics
    console.log('\n2️⃣ Checking Rubrics:');
    const rubrics = await Rubric.find({ 
      modality: 'classical_homeopathy' 
    }).limit(10).select('rubricText chapter linkedSymptoms').lean();
    
    console.log(`   Total Rubrics: ${rubrics.length}`);
    console.log(`   Sample rubrics:`);
    rubrics.slice(0, 5).forEach((r, i) => {
      const linkedCount = (r.linkedSymptoms || []).length;
      console.log(`     ${i + 1}. "${r.rubricText?.substring(0, 50)}..."`);
      console.log(`        Chapter: ${r.chapter}, Linked Symptoms: ${linkedCount}`);
    });

    // 3. Check if rubrics have linkedSymptoms
    console.log('\n3️⃣ Checking Rubric-Symptom Linking:');
    const rubricsWithLinks = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      linkedSymptoms: { $exists: true, $ne: [], $size: { $gt: 0 } }
    });
    const rubricsWithoutLinks = await Rubric.countDocuments({
      modality: 'classical_homeopathy',
      $or: [
        { linkedSymptoms: { $exists: false } },
        { linkedSymptoms: { $size: 0 } },
        { linkedSymptoms: [] }
      ]
    });
    
    console.log(`   Rubrics WITH linkedSymptoms: ${rubricsWithLinks}`);
    console.log(`   Rubrics WITHOUT linkedSymptoms: ${rubricsWithoutLinks}`);

    // 4. Check sample symptom -> rubric mapping
    if (classicalSymptoms.length > 0) {
      const testSymptom = classicalSymptoms[0];
      const symptomCode = testSymptom._id.toString();
      
      console.log(`\n4️⃣ Testing Symptom → Rubric Mapping:`);
      console.log(`   Test Symptom: "${testSymptom.name}" (ID: ${symptomCode})`);
      
      const matchingRubrics = await Rubric.find({
        modality: 'classical_homeopathy',
        linkedSymptoms: symptomCode
      }).limit(5).select('rubricText linkedSymptoms').lean();
      
      console.log(`   Matching Rubrics: ${matchingRubrics.length}`);
      if (matchingRubrics.length > 0) {
        matchingRubrics.forEach((r, i) => {
          console.log(`     ${i + 1}. "${r.rubricText?.substring(0, 50)}..." (${(r.linkedSymptoms || []).length} links)`);
        });
      } else {
        console.log(`   ⚠️  No rubrics found for symptom "${testSymptom.name}"`);
        console.log(`   💡 This means symptom-rubric linking is missing!`);
      }
    }

    // 5. Check Rubric-Remedy Mappings
    console.log('\n5️⃣ Checking Rubric-Remedy Mappings:');
    const totalMappings = await RubricRemedy.countDocuments({});
    const sampleRubric = rubrics[0];
    if (sampleRubric) {
      const mappingsForSample = await RubricRemedy.countDocuments({
        rubricId: sampleRubric._id
      });
      console.log(`   Total Mappings: ${totalMappings}`);
      console.log(`   Mappings for sample rubric: ${mappingsForSample}`);
    }

    // 6. Conclusion
    console.log('\n' + '='.repeat(70));
    console.log('📊 DIAGNOSIS:');
    console.log('='.repeat(70));
    
    if (rubricsWithoutLinks > 0 || rubricsWithLinks === 0) {
      console.log('\n❌ ISSUE FOUND:');
      console.log(`   Rubrics me linkedSymptoms properly set nahi hain!`);
      console.log(`   ${rubricsWithoutLinks} rubrics me linkedSymptoms missing/empty hain`);
      console.log(`   💡 Solution: Rubrics ko symptoms se link karna hoga`);
    } else {
      console.log('\n✅ Rubric-Symptom Linking: OK');
    }

    if (totalMappings === 0) {
      console.log('\n❌ ISSUE FOUND:');
      console.log(`   Rubric-Remedy mappings missing hain!`);
      console.log(`   💡 Solution: OOREP seeding complete karni hogi`);
    } else {
      console.log('\n✅ Rubric-Remedy Mappings: OK');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testFlow();
