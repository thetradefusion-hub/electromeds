/**
 * Test Classical Homeopathy Remedy Suggestion Flow
 * 
 * Complete end-to-end test of the remedy suggestion flow
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import Symptom from '../models/Symptom.model.js';
import Rubric from '../models/Rubric.model.js';
import RubricRemedy from '../models/RubricRemedy.model.js';
import Remedy from '../models/Remedy.model.js';
import CaseEngine from '../services/caseEngine.service.js';
import RubricMappingEngine from '../services/rubricMapping.service.js';
import RepertoryEngine from '../services/repertoryEngine.service.js';
import ScoringEngine from '../services/scoringEngine.service.js';
import ClassicalHomeopathyRuleEngine from '../services/classicalHomeopathyRuleEngine.service.js';
import Doctor from '../models/Doctor.model.js';
import Patient from '../models/Patient.model.js';

async function testFlow() {
  try {
    console.log('🔍 Testing Classical Homeopathy Remedy Suggestion Flow...\n');

    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Check Data Availability
    console.log('='.repeat(70));
    console.log('1️⃣ DATA AVAILABILITY CHECK');
    console.log('='.repeat(70));
    
    const symptomsCount = await Symptom.countDocuments({ modality: 'classical_homeopathy' });
    const rubricsCount = await Rubric.countDocuments({ modality: 'classical_homeopathy' });
    const remediesCount = await Remedy.countDocuments({ modality: 'classical_homeopathy' });
    const mappingsCount = await RubricRemedy.countDocuments({});

    console.log(`   Symptoms: ${symptomsCount}`);
    console.log(`   Rubrics: ${rubricsCount}`);
    console.log(`   Remedies: ${remediesCount}`);
    console.log(`   Rubric-Remedy Mappings: ${mappingsCount}\n`);

    if (symptomsCount === 0) {
      console.log('❌ No symptoms found! Please add Classical Homeopathy symptoms.');
      await mongoose.disconnect();
      return;
    }

    if (rubricsCount === 0) {
      console.log('❌ No rubrics found! Please run OOREP seeding.');
      await mongoose.disconnect();
      return;
    }

    if (remediesCount === 0) {
      console.log('❌ No remedies found! Please run OOREP seeding.');
      await mongoose.disconnect();
      return;
    }

    if (mappingsCount === 0) {
      console.log('❌ No rubric-remedy mappings found! Please run OOREP seeding.');
      await mongoose.disconnect();
      return;
    }

    // Step 2: Get Sample Data
    console.log('='.repeat(70));
    console.log('2️⃣ SAMPLE DATA');
    console.log('='.repeat(70));
    
    const sampleSymptoms = await Symptom.find({ modality: 'classical_homeopathy' }).limit(5).lean();
    console.log('\n   Sample Symptoms:');
    sampleSymptoms.forEach((s, i) => {
      console.log(`     ${i + 1}. ${s.name} (${s.category}) - Code: ${s.code}`);
    });

    const sampleRubrics = await Rubric.find({ modality: 'classical_homeopathy' }).limit(3).lean();
    console.log('\n   Sample Rubrics:');
    sampleRubrics.forEach((r, i) => {
      console.log(`     ${i + 1}. "${r.rubricText?.substring(0, 50)}..."`);
      console.log(`        Linked Symptoms: ${(r.linkedSymptoms || []).length}`);
    });

    // Step 3: Test Case Engine
    console.log('\n' + '='.repeat(70));
    console.log('3️⃣ TESTING CASE ENGINE');
    console.log('='.repeat(70));
    
    const caseEngine = new CaseEngine();
    const testCase = {
      mental: [{ symptomText: sampleSymptoms[0]?.name || 'Anxiety', weight: 3 }],
      generals: [{ symptomText: sampleSymptoms[1]?.name || 'Fever', weight: 2 }],
      particulars: [],
      modalities: [],
      pathologyTags: ['Acute'],
    };

    console.log('\n   Input Case:');
    console.log(`     Mental: ${testCase.mental.map(s => s.symptomText).join(', ')}`);
    console.log(`     Generals: ${testCase.generals.map(s => s.symptomText).join(', ')}`);

    const normalizedCase = await caseEngine.normalizeCase(testCase);
    console.log('\n   Normalized Case:');
    console.log(`     Mental: ${normalizedCase.mental.length} symptoms`);
    normalizedCase.mental.forEach(s => {
      console.log(`       - ${s.symptomName} (Code: ${s.symptomCode})`);
    });
    console.log(`     Generals: ${normalizedCase.generals.length} symptoms`);
    normalizedCase.generals.forEach(s => {
      console.log(`       - ${s.symptomName} (Code: ${s.symptomCode})`);
    });

    if (normalizedCase.mental.length === 0 && normalizedCase.generals.length === 0) {
      console.log('\n   ⚠️  WARNING: No symptoms normalized! Symptom matching might be failing.');
    }

    // Step 4: Test Rubric Mapping
    console.log('\n' + '='.repeat(70));
    console.log('4️⃣ TESTING RUBRIC MAPPING');
    console.log('='.repeat(70));
    
    const rubricMapping = new RubricMappingEngine();
    const rubricMappings = await rubricMapping.mapSymptomsToRubrics(normalizedCase);
    const selectedRubrics = rubricMappings.filter(r => r.autoSelected);

    console.log(`\n   Total Rubric Mappings: ${rubricMappings.length}`);
    console.log(`   Auto-Selected Rubrics: ${selectedRubrics.length}`);
    
    if (selectedRubrics.length > 0) {
      console.log('\n   Sample Selected Rubrics:');
      selectedRubrics.slice(0, 3).forEach((r, i) => {
        console.log(`     ${i + 1}. "${r.rubricText?.substring(0, 50)}..."`);
        console.log(`        Confidence: ${r.confidence.toFixed(1)}%, Matched Symptoms: ${r.matchedSymptoms.length}`);
      });
    } else {
      console.log('\n   ❌ NO RUBRICS SELECTED! This is the problem.');
      console.log('   💡 Possible causes:');
      console.log('      - Symptom names don\'t match rubric text');
      console.log('      - linkedSymptoms array is empty in rubrics');
      console.log('      - Text matching threshold too high');
    }

    if (selectedRubrics.length === 0) {
      console.log('\n   🔍 Debugging Rubric Matching...');
      const allSymptomNames = [
        ...normalizedCase.mental.map(s => s.symptomName),
        ...normalizedCase.generals.map(s => s.symptomName),
      ];
      console.log(`   Searching for rubrics containing: ${allSymptomNames.join(', ')}`);
      
      // Try direct text search
      for (const symptomName of allSymptomNames.slice(0, 2)) {
        const matchingRubrics = await Rubric.find({
          modality: 'classical_homeopathy',
          rubricText: { $regex: symptomName, $options: 'i' }
        }).limit(3).lean();
        
        console.log(`\n   Rubrics matching "${symptomName}": ${matchingRubrics.length}`);
        matchingRubrics.forEach((r, i) => {
          console.log(`     ${i + 1}. "${r.rubricText?.substring(0, 60)}..."`);
        });
      }
    }

    // Step 5: Test Repertory Engine
    console.log('\n' + '='.repeat(70));
    console.log('5️⃣ TESTING REPERTORY ENGINE');
    console.log('='.repeat(70));
    
    if (selectedRubrics.length > 0) {
      const repertoryEngine = new RepertoryEngine();
      const remedyPool = await repertoryEngine.buildRemedyPool(
        selectedRubrics.map(r => r.rubricId)
      );

      console.log(`\n   Remedy Pool Size: ${remedyPool.size}`);
      
      if (remedyPool.size > 0) {
        console.log('\n   Sample Remedies in Pool:');
        let count = 0;
        for (const [remedyId, remedyScore] of remedyPool.entries()) {
          if (count >= 3) break;
          const remedy = await Remedy.findById(remedyId).lean();
          console.log(`     ${count + 1}. ${remedy?.name || 'Unknown'}`);
          console.log(`        Rubric Grades: ${remedyScore.rubricGrades.length}, Total Score: ${remedyScore.totalBaseScore}`);
          count++;
        }
      } else {
        console.log('\n   ❌ NO REMEDIES IN POOL!');
        console.log('   💡 This means rubric-remedy mappings are missing.');
        
        // Check mappings for selected rubrics
        const rubricIds = selectedRubrics.map(r => r.rubricId);
        const mappingsForRubrics = await RubricRemedy.countDocuments({
          rubricId: { $in: rubricIds }
        });
        console.log(`   Mappings for selected rubrics: ${mappingsForRubrics}`);
      }
    } else {
      console.log('\n   ⏭️  Skipping - No rubrics selected');
    }

    // Step 6: Test Complete Flow
    console.log('\n' + '='.repeat(70));
    console.log('6️⃣ TESTING COMPLETE FLOW');
    console.log('='.repeat(70));
    
    // Get a doctor and patient
    const doctor = await Doctor.findOne().lean();
    const patient = await Patient.findOne().lean();

    if (!doctor || !patient) {
      console.log('\n   ⚠️  No doctor or patient found. Skipping complete flow test.');
    } else {
      console.log(`\n   Using Doctor: ${doctor.name || doctor._id}`);
      console.log(`   Using Patient: ${patient.name || patient._id}`);
      
      const ruleEngine = new ClassicalHomeopathyRuleEngine();
      
      try {
        const result = await ruleEngine.processCase(
          doctor._id,
          patient._id,
          testCase,
          []
        );

        console.log(`\n   ✅ Flow completed successfully!`);
        console.log(`   Case Record ID: ${result.caseRecordId}`);
        console.log(`   Top Remedies: ${result.suggestions.topRemedies.length}`);
        
        if (result.suggestions.topRemedies.length > 0) {
          console.log('\n   Top 5 Remedy Suggestions:');
          result.suggestions.topRemedies.slice(0, 5).forEach((r, i) => {
            console.log(`     ${i + 1}. ${r.remedy.name} - Score: ${r.finalScore.toFixed(2)}`);
            console.log(`        Confidence: ${r.confidence}, Potency: ${r.suggestedPotency}`);
          });
        } else {
          console.log('\n   ❌ NO REMEDY SUGGESTIONS GENERATED!');
        }
      } catch (error: any) {
        console.log(`\n   ❌ Error in complete flow: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    
    const issues: string[] = [];
    if (symptomsCount === 0) issues.push('No symptoms');
    if (rubricsCount === 0) issues.push('No rubrics');
    if (remediesCount === 0) issues.push('No remedies');
    if (mappingsCount === 0) issues.push('No mappings');
    if (normalizedCase.mental.length === 0 && normalizedCase.generals.length === 0) {
      issues.push('Symptom normalization failing');
    }
    if (selectedRubrics.length === 0) issues.push('No rubrics selected');
    
    if (issues.length > 0) {
      console.log('\n   ❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('\n   ✅ All checks passed!');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testFlow();
