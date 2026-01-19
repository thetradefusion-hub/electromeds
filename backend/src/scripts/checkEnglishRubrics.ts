import mongoose from 'mongoose';
import config from '../config/env.js';
import Rubric from '../models/Rubric.model.js';

async function checkRubrics() {
  await mongoose.connect(config.mongodbUri);
  
  // Check for English rubrics
  const englishKeywords = ['ANXIETY', 'FEAR', 'FEVER', 'PAIN', 'THIRST', 'COLD', 'HEADACHE', 'SLEEP', 'APPETITE'];
  
  for (const keyword of englishKeywords) {
    const rubrics = await Rubric.find({
      modality: 'classical_homeopathy',
      rubricText: { $regex: keyword, $options: 'i' }
    }).limit(3).select('rubricText chapter').lean();
    
    console.log(`\n${keyword}: ${rubrics.length} rubrics`);
    rubrics.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.rubricText?.substring(0, 70)}`);
    });
  }
  
  // Check sample rubrics
  const sample = await Rubric.find({ modality: 'classical_homeopathy' })
    .limit(20)
    .select('rubricText')
    .lean();
  
  console.log('\n\nSample Rubrics (first 20):');
  sample.forEach((r, i) => {
    console.log(`${i+1}. ${r.rubricText?.substring(0, 60)}`);
  });
  
  await mongoose.disconnect();
}

checkRubrics();
