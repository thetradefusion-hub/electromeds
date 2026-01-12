import mongoose from 'mongoose';
import Symptom from '../models/Symptom.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Electro Homeopathy Common Symptoms Data
const electroHomeopathySymptoms = [
  // General Symptoms
  { name: 'Fever', category: 'General', description: 'Elevated body temperature, often with chills and sweating' },
  { name: 'Headache', category: 'General', description: 'Pain in the head or upper neck, can be tension, migraine, or cluster type' },
  { name: 'Fatigue', category: 'General', description: 'Persistent tiredness and lack of energy' },
  { name: 'Weakness', category: 'General', description: 'General body weakness and lack of strength' },
  { name: 'Loss of Appetite', category: 'General', description: 'Reduced desire to eat or lack of hunger' },
  { name: 'Weight Loss', category: 'General', description: 'Unintentional reduction in body weight' },
  { name: 'Weight Gain', category: 'General', description: 'Unintentional increase in body weight' },
  { name: 'Dizziness', category: 'General', description: 'Feeling of unsteadiness or lightheadedness' },
  { name: 'Insomnia', category: 'General', description: 'Difficulty falling asleep or staying asleep' },
  { name: 'Excessive Thirst', category: 'General', description: 'Abnormally increased desire to drink fluids' },
  { name: 'Excessive Sweating', category: 'General', description: 'Abnormal or excessive perspiration' },
  { name: 'Chills', category: 'General', description: 'Feeling of coldness with shivering' },

  // Respiratory Symptoms
  { name: 'Cough', category: 'Respiratory', description: 'Reflex action to clear airways, can be dry or productive' },
  { name: 'Dry Cough', category: 'Respiratory', description: 'Non-productive cough without phlegm' },
  { name: 'Productive Cough', category: 'Respiratory', description: 'Cough with phlegm or mucus production' },
  { name: 'Shortness of Breath', category: 'Respiratory', description: 'Difficulty breathing or feeling breathless' },
  { name: 'Wheezing', category: 'Respiratory', description: 'High-pitched whistling sound while breathing' },
  { name: 'Chest Pain', category: 'Respiratory', description: 'Pain or discomfort in the chest area' },
  { name: 'Chest Tightness', category: 'Respiratory', description: 'Feeling of pressure or constriction in chest' },
  { name: 'Runny Nose', category: 'Respiratory', description: 'Excessive nasal discharge or rhinorrhea' },
  { name: 'Nasal Congestion', category: 'Respiratory', description: 'Blocked or stuffy nose' },
  { name: 'Sneezing', category: 'Respiratory', description: 'Involuntary expulsion of air through nose and mouth' },
  { name: 'Sore Throat', category: 'Respiratory', description: 'Pain, scratchiness, or irritation in throat' },
  { name: 'Hoarseness', category: 'Respiratory', description: 'Abnormal voice change, rough or harsh voice' },

  // Digestive Symptoms
  { name: 'Nausea', category: 'Digestive', description: 'Feeling of wanting to vomit' },
  { name: 'Vomiting', category: 'Digestive', description: 'Forceful expulsion of stomach contents' },
  { name: 'Abdominal Pain', category: 'Digestive', description: 'Pain in the stomach or belly area' },
  { name: 'Stomach Cramps', category: 'Digestive', description: 'Sharp, intermittent pain in stomach' },
  { name: 'Diarrhea', category: 'Digestive', description: 'Loose, watery stools occurring frequently' },
  { name: 'Constipation', category: 'Digestive', description: 'Difficulty passing stools or infrequent bowel movements' },
  { name: 'Bloating', category: 'Digestive', description: 'Feeling of fullness or swelling in abdomen' },
  { name: 'Gas', category: 'Digestive', description: 'Excessive flatulence or belching' },
  { name: 'Acidity', category: 'Digestive', description: 'Burning sensation in stomach or chest due to acid reflux' },
  { name: 'Heartburn', category: 'Digestive', description: 'Burning pain in chest due to acid reflux' },
  { name: 'Indigestion', category: 'Digestive', description: 'Difficulty digesting food, discomfort after eating' },
  { name: 'Loss of Taste', category: 'Digestive', description: 'Reduced or absent ability to taste' },
  { name: 'Bitter Taste in Mouth', category: 'Digestive', description: 'Unpleasant bitter taste sensation' },
  { name: 'Excessive Salivation', category: 'Digestive', description: 'Overproduction of saliva' },

  // Cardiovascular Symptoms
  { name: 'Palpitations', category: 'Cardiovascular', description: 'Awareness of rapid or irregular heartbeat' },
  { name: 'Chest Discomfort', category: 'Cardiovascular', description: 'Uncomfortable feeling in chest area' },
  { name: 'High Blood Pressure', category: 'Cardiovascular', description: 'Elevated arterial blood pressure' },
  { name: 'Low Blood Pressure', category: 'Cardiovascular', description: 'Reduced arterial blood pressure' },
  { name: 'Irregular Heartbeat', category: 'Cardiovascular', description: 'Abnormal heart rhythm or arrhythmia' },
  { name: 'Swelling in Legs', category: 'Cardiovascular', description: 'Fluid accumulation causing leg swelling' },
  { name: 'Shortness of Breath on Exertion', category: 'Cardiovascular', description: 'Breathlessness during physical activity' },

  // Neurological Symptoms
  { name: 'Memory Loss', category: 'Neurological', description: 'Difficulty remembering or forgetfulness' },
  { name: 'Confusion', category: 'Neurological', description: 'Mental disorientation or unclear thinking' },
  { name: 'Tremors', category: 'Neurological', description: 'Involuntary shaking or trembling' },
  { name: 'Seizures', category: 'Neurological', description: 'Uncontrolled electrical activity in brain' },
  { name: 'Numbness', category: 'Neurological', description: 'Loss of sensation or feeling' },
  { name: 'Tingling Sensation', category: 'Neurological', description: 'Prickling or pins and needles feeling' },
  { name: 'Muscle Weakness', category: 'Neurological', description: 'Reduced muscle strength' },
  { name: 'Balance Problems', category: 'Neurological', description: 'Difficulty maintaining balance' },
  { name: 'Vision Problems', category: 'Neurological', description: 'Blurred vision or visual disturbances' },
  { name: 'Hearing Loss', category: 'Neurological', description: 'Reduced ability to hear' },
  { name: 'Ringing in Ears', category: 'Neurological', description: 'Tinnitus or persistent ear ringing' },

  // Musculoskeletal Symptoms
  { name: 'Joint Pain', category: 'Musculoskeletal', description: 'Pain in joints, can be arthritis or injury related' },
  { name: 'Back Pain', category: 'Musculoskeletal', description: 'Pain in upper, middle, or lower back' },
  { name: 'Neck Pain', category: 'Musculoskeletal', description: 'Pain or stiffness in neck area' },
  { name: 'Shoulder Pain', category: 'Musculoskeletal', description: 'Pain in shoulder joint or surrounding area' },
  { name: 'Knee Pain', category: 'Musculoskeletal', description: 'Pain in knee joint' },
  { name: 'Muscle Pain', category: 'Musculoskeletal', description: 'Pain or soreness in muscles' },
  { name: 'Muscle Stiffness', category: 'Musculoskeletal', description: 'Reduced flexibility or tightness in muscles' },
  { name: 'Swelling in Joints', category: 'Musculoskeletal', description: 'Fluid accumulation in joints' },
  { name: 'Limited Range of Motion', category: 'Musculoskeletal', description: 'Reduced ability to move joints normally' },

  // Dermatological Symptoms
  { name: 'Rash', category: 'Dermatological', description: 'Red, irritated, or bumpy skin' },
  { name: 'Itching', category: 'Dermatological', description: 'Uncomfortable sensation causing desire to scratch' },
  { name: 'Dry Skin', category: 'Dermatological', description: 'Lack of moisture in skin' },
  { name: 'Skin Discoloration', category: 'Dermatological', description: 'Abnormal changes in skin color' },
  { name: 'Hair Loss', category: 'Dermatological', description: 'Excessive hair fall or baldness' },
  { name: 'Acne', category: 'Dermatological', description: 'Pimples, blackheads, or whiteheads on skin' },
  { name: 'Eczema', category: 'Dermatological', description: 'Inflammatory skin condition with itching and redness' },
  { name: 'Psoriasis', category: 'Dermatological', description: 'Chronic skin condition with scaly patches' },
  { name: 'Hives', category: 'Dermatological', description: 'Raised, itchy welts on skin' },
  { name: 'Bruising', category: 'Dermatological', description: 'Discoloration of skin due to bleeding under skin' },

  // Urological Symptoms
  { name: 'Frequent Urination', category: 'Urological', description: 'Need to urinate more often than normal' },
  { name: 'Painful Urination', category: 'Urological', description: 'Burning or pain while urinating' },
  { name: 'Blood in Urine', category: 'Urological', description: 'Hematuria or red blood cells in urine' },
  { name: 'Urinary Incontinence', category: 'Urological', description: 'Inability to control urination' },
  { name: 'Difficulty Urinating', category: 'Urological', description: 'Straining or trouble starting urination' },
  { name: 'Cloudy Urine', category: 'Urological', description: 'Urine that appears milky or opaque' },
  { name: 'Strong Urine Odor', category: 'Urological', description: 'Unusually strong or foul-smelling urine' },
  { name: 'Lower Abdominal Pain', category: 'Urological', description: 'Pain in lower belly, often related to urinary system' },

  // Gynecological Symptoms
  { name: 'Irregular Menstruation', category: 'Gynecological', description: 'Abnormal menstrual cycle patterns' },
  { name: 'Heavy Menstrual Bleeding', category: 'Gynecological', description: 'Excessive blood loss during periods' },
  { name: 'Painful Menstruation', category: 'Gynecological', description: 'Severe cramps or pain during periods' },
  { name: 'Missed Periods', category: 'Gynecological', description: 'Absence of menstrual periods' },
  { name: 'Vaginal Discharge', category: 'Gynecological', description: 'Abnormal discharge from vagina' },
  { name: 'Vaginal Itching', category: 'Gynecological', description: 'Itching or irritation in vaginal area' },
  { name: 'Pelvic Pain', category: 'Gynecological', description: 'Pain in lower abdomen or pelvic region' },
  { name: 'Hot Flashes', category: 'Gynecological', description: 'Sudden feeling of warmth, often during menopause' },
  { name: 'Mood Swings', category: 'Gynecological', description: 'Rapid changes in emotional state' },

  // Psychological Symptoms
  { name: 'Anxiety', category: 'Psychological', description: 'Excessive worry, fear, or nervousness' },
  { name: 'Depression', category: 'Psychological', description: 'Persistent sadness, loss of interest, low mood' },
  { name: 'Stress', category: 'Psychological', description: 'Mental or emotional strain or tension' },
  { name: 'Irritability', category: 'Psychological', description: 'Easily annoyed or angered' },
  { name: 'Mood Changes', category: 'Psychological', description: 'Fluctuations in emotional state' },
  { name: 'Lack of Concentration', category: 'Psychological', description: 'Difficulty focusing or paying attention' },
  { name: 'Restlessness', category: 'Psychological', description: 'Inability to relax or sit still' },
  { name: 'Panic Attacks', category: 'Psychological', description: 'Sudden episodes of intense fear or anxiety' },

  // Other Common Symptoms
  { name: 'Eye Redness', category: 'Other', description: 'Red or bloodshot eyes' },
  { name: 'Watery Eyes', category: 'Other', description: 'Excessive tearing or eye watering' },
  { name: 'Dry Eyes', category: 'Other', description: 'Insufficient tear production causing eye discomfort' },
  { name: 'Sensitivity to Light', category: 'Other', description: 'Photophobia or discomfort in bright light' },
  { name: 'Bad Breath', category: 'Other', description: 'Halitosis or unpleasant odor from mouth' },
  { name: 'Mouth Ulcers', category: 'Other', description: 'Painful sores or lesions in mouth' },
  { name: 'Swollen Glands', category: 'Other', description: 'Enlarged lymph nodes' },
  { name: 'Body Aches', category: 'Other', description: 'Generalized pain throughout body' },
  { name: 'Night Sweats', category: 'Other', description: 'Excessive sweating during sleep' },
  { name: 'Cold Hands and Feet', category: 'Other', description: 'Persistent coldness in extremities' },
];

const seedSymptoms = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if symptoms already exist
    const existingCount = await Symptom.countDocuments({ isGlobal: true });
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing global symptoms. Skipping seed.`);
      console.log('💡 To re-seed, delete existing global symptoms first.');
      await mongoose.disconnect();
      return;
    }

    // Insert symptoms
    const symptoms = electroHomeopathySymptoms.map(symptom => ({
      ...symptom,
      isGlobal: true,
      doctorId: undefined,
    }));

    const result = await Symptom.insertMany(symptoms);
    console.log(`✅ Successfully seeded ${result.length} global symptoms`);

    // Display summary by category
    const categoryCounts = electroHomeopathySymptoms.reduce((acc, symptom) => {
      acc[symptom.category] = (acc[symptom.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Symptoms by Category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding symptoms:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedSymptoms();

