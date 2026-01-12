import mongoose from 'mongoose';
import MedicineRule from '../models/MedicineRule.model.js';
import Symptom from '../models/Symptom.model.js';
import Medicine from '../models/Medicine.model.js';
import dotenv from 'dotenv';

dotenv.config();

interface SymptomMapping {
  symptomNames: string[];
  medicineNames: string[];
  name: string;
  description: string;
  dosage: string;
  duration: string;
  priority: number;
}

// Electro Homeopathy Symptom-Medicine Mapping Rules
const ruleMappings: SymptomMapping[] = [
  // Respiratory System Rules
  {
    symptomNames: ['Cough', 'Dry Cough', 'Productive Cough', 'Shortness of Breath', 'Wheezing', 'Chest Pain', 'Chest Tightness'],
    medicineNames: ['S1 - Scilla Maritima', 'WE1 - White Essence', 'Spagyric Essence - Respiratory'],
    name: 'Respiratory Disorders - General',
    description: 'For common respiratory symptoms including cough, breathlessness, and chest discomfort',
    dosage: '10-15 drops, 3 times daily',
    duration: '7-14 days',
    priority: 10
  },
  {
    symptomNames: ['Asthma', 'Chronic Bronchitis', 'Wheezing', 'Shortness of Breath'],
    medicineNames: ['S2 - Scilla Maritima Compound', 'WE2 - White Essence Compound', 'S3 - Scilla Maritima Forte'],
    name: 'Chronic Respiratory Conditions',
    description: 'For chronic asthma and bronchitis with persistent symptoms',
    dosage: '15-20 drops, 3 times daily',
    duration: '14-30 days',
    priority: 9
  },
  {
    symptomNames: ['Runny Nose', 'Nasal Congestion', 'Sneezing', 'Sore Throat'],
    medicineNames: ['WE4 - White Essence Special', 'Spagyric Essence - Respiratory'],
    name: 'Common Cold and Nasal Symptoms',
    description: 'For cold symptoms including nasal congestion and sore throat',
    dosage: '10-15 drops, 3 times daily',
    duration: '5-7 days',
    priority: 8
  },
  {
    symptomNames: ['Fever', 'Cough', 'Body Aches', 'Fatigue'],
    medicineNames: ['WE1 - White Essence', 'Spagyric Essence - Respiratory', 'Spagyric Essence - Immune'],
    name: 'Fever with Respiratory Symptoms',
    description: 'For fever accompanied by respiratory symptoms and body aches',
    dosage: '10-15 drops, 3-4 times daily',
    duration: '5-10 days',
    priority: 9
  },

  // Digestive System Rules
  {
    symptomNames: ['Nausea', 'Vomiting', 'Abdominal Pain', 'Stomach Cramps'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'GE2 - Gastro-Enteric Compound', 'Spagyric Essence - Digestive'],
    name: 'Acute Digestive Disorders',
    description: 'For nausea, vomiting, and abdominal pain',
    dosage: '10-15 drops, 3 times daily before meals',
    duration: '5-7 days',
    priority: 10
  },
  {
    symptomNames: ['Diarrhea', 'Abdominal Pain', 'Stomach Cramps'],
    medicineNames: ['GE3 - Gastro-Enteric Forte', 'GE4 - Gastro-Enteric Special'],
    name: 'Diarrhea and Abdominal Cramps',
    description: 'For diarrhea with abdominal pain and cramps',
    dosage: '15 drops, 3 times daily',
    duration: '3-5 days',
    priority: 9
  },
  {
    symptomNames: ['Constipation', 'Bloating', 'Gas', 'Abdominal Pain'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'GE2 - Gastro-Enteric Compound'],
    name: 'Constipation and Bloating',
    description: 'For constipation, bloating, and gas',
    dosage: '10-15 drops, 3 times daily',
    duration: '7-14 days',
    priority: 8
  },
  {
    symptomNames: ['Acidity', 'Heartburn', 'Indigestion', 'Abdominal Pain'],
    medicineNames: ['GE4 - Gastro-Enteric Special', 'Spagyric Essence - Digestive'],
    name: 'Acidity and Indigestion',
    description: 'For acidity, heartburn, and indigestion',
    dosage: '10-15 drops, 3 times daily before meals',
    duration: '7-14 days',
    priority: 9
  },
  {
    symptomNames: ['Loss of Appetite', 'Nausea', 'Indigestion'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'Spagyric Essence - Digestive'],
    name: 'Loss of Appetite',
    description: 'For reduced appetite with digestive discomfort',
    dosage: '10-15 drops, 3 times daily before meals',
    duration: '7-14 days',
    priority: 7
  },

  // Liver and Gallbladder Rules
  {
    symptomNames: ['Abdominal Pain', 'Nausea', 'Loss of Appetite'],
    medicineNames: ['C1 - Carduus Benedictus', 'YE1 - Yellow Essence', 'C2 - Carduus Benedictus Compound'],
    name: 'Liver Disorders - General',
    description: 'For general liver and gallbladder disorders',
    dosage: '10-15 drops, 3 times daily before meals',
    duration: '14-30 days',
    priority: 10
  },
  {
    symptomNames: ['Jaundice', 'Abdominal Pain', 'Nausea', 'Loss of Appetite'],
    medicineNames: ['YE1 - Yellow Essence', 'YE4 - Yellow Essence Special', 'C1 - Carduus Benedictus'],
    name: 'Jaundice Treatment',
    description: 'For jaundice and liver inflammation',
    dosage: '15 drops, 3 times daily',
    duration: '21-30 days',
    priority: 9
  },
  {
    symptomNames: ['Bitter Taste in Mouth', 'Nausea', 'Abdominal Pain'],
    medicineNames: ['C2 - Carduus Benedictus Compound', 'YE2 - Yellow Essence Compound'],
    name: 'Liver and Gallbladder Inflammation',
    description: 'For liver and gallbladder inflammation with bitter taste',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-21 days',
    priority: 8
  },

  // Cardiovascular Rules
  {
    symptomNames: ['Palpitations', 'Chest Discomfort', 'Shortness of Breath'],
    medicineNames: ['RE1 - Red Essence', 'RE2 - Red Essence Compound', 'Spagyric Essence - Cardiovascular'],
    name: 'Cardiovascular Disorders',
    description: 'For heart palpitations, chest discomfort, and breathlessness',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 10
  },
  {
    symptomNames: ['High Blood Pressure', 'Headache', 'Dizziness'],
    medicineNames: ['RE3 - Red Essence Forte', 'RE4 - Red Essence Special'],
    name: 'High Blood Pressure',
    description: 'For high blood pressure with associated symptoms',
    dosage: '15 drops, 3 times daily',
    duration: '30-60 days',
    priority: 9
  },
  {
    symptomNames: ['Low Blood Pressure', 'Dizziness', 'Weakness', 'Fatigue'],
    medicineNames: ['RE1 - Red Essence', 'RE2 - Red Essence Compound'],
    name: 'Low Blood Pressure',
    description: 'For low blood pressure with weakness and fatigue',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 8
  },
  {
    symptomNames: ['Swelling in Legs', 'Shortness of Breath', 'Fatigue'],
    medicineNames: ['RE1 - Red Essence', 'S1 - Scilla Maritima', 'RE3 - Red Essence Forte'],
    name: 'Cardiac Edema',
    description: 'For cardiac-related swelling and breathlessness',
    dosage: '15 drops, 3 times daily',
    duration: '14-21 days',
    priority: 9
  },

  // Neurological Rules
  {
    symptomNames: ['Headache', 'Dizziness', 'Numbness', 'Tingling Sensation'],
    medicineNames: ['BE1 - Blue Essence', 'BE2 - Blue Essence Compound', 'Spagyric Essence - Nervous'],
    name: 'Neurological Disorders - General',
    description: 'For general neurological symptoms including headaches and numbness',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 9
  },
  {
    symptomNames: ['Anxiety', 'Stress', 'Restlessness', 'Irritability'],
    medicineNames: ['BE1 - Blue Essence', 'BE4 - Blue Essence Special', 'Spagyric Essence - Nervous'],
    name: 'Anxiety and Stress',
    description: 'For anxiety, stress, and restlessness',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 10
  },
  {
    symptomNames: ['Depression', 'Mood Changes', 'Lack of Concentration', 'Fatigue'],
    medicineNames: ['BE2 - Blue Essence Compound', 'BE3 - Blue Essence Forte'],
    name: 'Depression and Mood Disorders',
    description: 'For depression, mood changes, and lack of concentration',
    dosage: '15 drops, 3 times daily',
    duration: '30-60 days',
    priority: 9
  },
  {
    symptomNames: ['Insomnia', 'Anxiety', 'Restlessness'],
    medicineNames: ['BE4 - Blue Essence Special', 'BE1 - Blue Essence'],
    name: 'Insomnia and Sleep Disorders',
    description: 'For insomnia and sleep-related issues',
    dosage: '10-15 drops, 2 times daily (morning and before bed)',
    duration: '14-30 days',
    priority: 8
  },
  {
    symptomNames: ['Memory Loss', 'Confusion', 'Lack of Concentration'],
    medicineNames: ['BE3 - Blue Essence Forte', 'BE5 - Blue Essence Extra'],
    name: 'Memory and Cognitive Issues',
    description: 'For memory loss, confusion, and concentration problems',
    dosage: '15 drops, 3 times daily',
    duration: '30-60 days',
    priority: 8
  },
  {
    symptomNames: ['Tremors', 'Muscle Weakness', 'Balance Problems'],
    medicineNames: ['BE3 - Blue Essence Forte', 'BE6 - Blue Essence Ultra'],
    name: 'Movement Disorders',
    description: 'For tremors, muscle weakness, and balance problems',
    dosage: '15-20 drops, 3 times daily',
    duration: '30-60 days',
    priority: 7
  },

  // Musculoskeletal Rules
  {
    symptomNames: ['Joint Pain', 'Muscle Pain', 'Back Pain', 'Neck Pain'],
    medicineNames: ['External Application - Pain Relief', 'External Application - Anti-Inflammatory'],
    name: 'Musculoskeletal Pain',
    description: 'For joint pain, muscle pain, and back/neck pain',
    dosage: 'Apply externally 2-3 times daily',
    duration: '7-14 days',
    priority: 9
  },
  {
    symptomNames: ['Joint Pain', 'Swelling in Joints', 'Muscle Stiffness'],
    medicineNames: ['External Application - Anti-Inflammatory', 'External Application - Pain Relief'],
    name: 'Arthritis and Joint Inflammation',
    description: 'For arthritis with joint pain and swelling',
    dosage: 'Apply externally 2-3 times daily',
    duration: '14-30 days',
    priority: 8
  },
  {
    symptomNames: ['Back Pain', 'Muscle Stiffness', 'Limited Range of Motion'],
    medicineNames: ['External Application - Pain Relief'],
    name: 'Back Pain and Stiffness',
    description: 'For back pain with muscle stiffness',
    dosage: 'Apply externally 2-3 times daily',
    duration: '7-14 days',
    priority: 8
  },

  // Dermatological Rules
  {
    symptomNames: ['Rash', 'Itching', 'Skin Discoloration'],
    medicineNames: ['External Application - Skin Care', 'External Application - Anti-Inflammatory'],
    name: 'Skin Disorders - General',
    description: 'For rashes, itching, and skin discoloration',
    dosage: 'Apply externally 2-3 times daily',
    duration: '7-14 days',
    priority: 9
  },
  {
    symptomNames: ['Dry Skin', 'Itching', 'Hair Loss'],
    medicineNames: ['External Application - Skin Care'],
    name: 'Dry Skin and Hair Loss',
    description: 'For dry skin, itching, and hair loss',
    dosage: 'Apply externally 2-3 times daily',
    duration: '14-30 days',
    priority: 7
  },
  {
    symptomNames: ['Acne', 'Rash', 'Skin Discoloration'],
    medicineNames: ['External Application - Skin Care'],
    name: 'Acne and Skin Inflammation',
    description: 'For acne, rashes, and skin inflammation',
    dosage: 'Apply externally 2-3 times daily',
    duration: '14-30 days',
    priority: 8
  },
  {
    symptomNames: ['Eczema', 'Itching', 'Rash'],
    medicineNames: ['External Application - Skin Care', 'External Application - Anti-Inflammatory'],
    name: 'Eczema Treatment',
    description: 'For eczema with itching and rashes',
    dosage: 'Apply externally 2-3 times daily',
    duration: '14-30 days',
    priority: 9
  },
  {
    symptomNames: ['Bruising', 'Wound Healing'],
    medicineNames: ['External Application - Wound Healing'],
    name: 'Wounds and Bruises',
    description: 'For wound healing and bruising',
    dosage: 'Apply externally 2-3 times daily',
    duration: '5-10 days',
    priority: 8
  },

  // Urological Rules
  {
    symptomNames: ['Frequent Urination', 'Painful Urination', 'Lower Abdominal Pain'],
    medicineNames: ['Spagyric Essence - Immune', 'Complete System Tonic'],
    name: 'Urinary Tract Disorders',
    description: 'For frequent and painful urination',
    dosage: '10-15 drops, 3 times daily',
    duration: '7-14 days',
    priority: 9
  },
  {
    symptomNames: ['Blood in Urine', 'Painful Urination', 'Lower Abdominal Pain'],
    medicineNames: ['Complete System Tonic', 'Detoxification Combination'],
    name: 'Urinary Tract Infection',
    description: 'For UTI with blood in urine',
    dosage: '15 drops, 3 times daily',
    duration: '7-10 days',
    priority: 10
  },
  {
    symptomNames: ['Urinary Incontinence', 'Frequent Urination'],
    medicineNames: ['BE1 - Blue Essence', 'Complete System Tonic'],
    name: 'Urinary Incontinence',
    description: 'For urinary incontinence and frequent urination',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 7
  },

  // Gynecological Rules
  {
    symptomNames: ['Irregular Menstruation', 'Pelvic Pain', 'Mood Swings'],
    medicineNames: ['Complete System Tonic', 'RE1 - Red Essence'],
    name: 'Menstrual Disorders',
    description: 'For irregular menstruation with pelvic pain',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 8
  },
  {
    symptomNames: ['Painful Menstruation', 'Pelvic Pain', 'Abdominal Pain'],
    medicineNames: ['RE1 - Red Essence', 'GE1 - Gastro-Enteric Essence'],
    name: 'Dysmenorrhea',
    description: 'For painful menstruation and pelvic pain',
    dosage: '10-15 drops, 3 times daily',
    duration: '5-7 days (during menstruation)',
    priority: 9
  },
  {
    symptomNames: ['Heavy Menstrual Bleeding', 'Fatigue', 'Weakness'],
    medicineNames: ['RE2 - Red Essence Compound', 'RE3 - Red Essence Forte'],
    name: 'Menorrhagia',
    description: 'For heavy menstrual bleeding with fatigue',
    dosage: '15 drops, 3 times daily',
    duration: '7-14 days',
    priority: 8
  },
  {
    symptomNames: ['Hot Flashes', 'Mood Swings', 'Irritability'],
    medicineNames: ['BE1 - Blue Essence', 'BE2 - Blue Essence Compound'],
    name: 'Menopause Symptoms',
    description: 'For hot flashes and mood swings during menopause',
    dosage: '10-15 drops, 3 times daily',
    duration: '30-60 days',
    priority: 7
  },

  // General Health Rules
  {
    symptomNames: ['Fever', 'Fatigue', 'Weakness', 'Body Aches'],
    medicineNames: ['Spagyric Essence - Immune', 'Complete System Tonic', 'Electricity - Positive'],
    name: 'General Fever and Weakness',
    description: 'For fever with general weakness and body aches',
    dosage: '10-15 drops, 3-4 times daily',
    duration: '5-10 days',
    priority: 10
  },
  {
    symptomNames: ['Fatigue', 'Weakness', 'Loss of Appetite'],
    medicineNames: ['Electricity - Positive', 'Complete System Tonic', 'Spagyric Essence - Immune'],
    name: 'General Weakness and Fatigue',
    description: 'For general weakness, fatigue, and loss of appetite',
    dosage: '10-15 drops, 2-3 times daily',
    duration: '14-30 days',
    priority: 8
  },
  {
    symptomNames: ['Weight Loss', 'Loss of Appetite', 'Fatigue'],
    medicineNames: ['Complete System Tonic', 'GE1 - Gastro-Enteric Essence', 'Electricity - Positive'],
    name: 'Weight Loss and Appetite Issues',
    description: 'For unexplained weight loss with appetite and fatigue',
    dosage: '10-15 drops, 3 times daily',
    duration: '30-60 days',
    priority: 7
  },
  {
    symptomNames: ['Excessive Thirst', 'Frequent Urination', 'Fatigue'],
    medicineNames: ['YE1 - Yellow Essence', 'Complete System Tonic'],
    name: 'Metabolic Disorders',
    description: 'For excessive thirst and frequent urination',
    dosage: '10-15 drops, 3 times daily',
    duration: '30-60 days',
    priority: 8
  },
  {
    symptomNames: ['Night Sweats', 'Fever', 'Fatigue'],
    medicineNames: ['Spagyric Essence - Immune', 'Complete System Tonic'],
    name: 'Night Sweats and Fever',
    description: 'For night sweats with fever and fatigue',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-21 days',
    priority: 7
  },

  // Combination Rules
  {
    symptomNames: ['Cough', 'Indigestion', 'Abdominal Pain'],
    medicineNames: ['Respiratory-Digestive Combination', 'GE1 - Gastro-Enteric Essence', 'WE1 - White Essence'],
    name: 'Respiratory and Digestive Combination',
    description: 'For combined respiratory and digestive symptoms',
    dosage: '10-15 drops, 3 times daily',
    duration: '7-14 days',
    priority: 8
  },
  {
    symptomNames: ['Abdominal Pain', 'Palpitations', 'Shortness of Breath'],
    medicineNames: ['Liver-Heart Combination', 'C1 - Carduus Benedictus', 'RE1 - Red Essence'],
    name: 'Liver and Heart Combination',
    description: 'For combined liver and cardiovascular symptoms',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 7
  },
  {
    symptomNames: ['Anxiety', 'Indigestion', 'Abdominal Pain'],
    medicineNames: ['Nervous-Digestive Combination', 'BE1 - Blue Essence', 'GE1 - Gastro-Enteric Essence'],
    name: 'Nervous and Digestive Combination',
    description: 'For anxiety with digestive symptoms',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 8
  },
  {
    symptomNames: ['Fatigue', 'Weakness', 'Loss of Appetite', 'General Health'],
    medicineNames: ['Complete System Tonic', 'Electricity - Positive', 'Spagyric Essence - Immune'],
    name: 'General Health Tonic',
    description: 'For overall health improvement and vitality',
    dosage: '10-15 drops, 2 times daily',
    duration: '30-60 days',
    priority: 6
  },
  {
    symptomNames: ['Abdominal Pain', 'Nausea', 'Fatigue'],
    medicineNames: ['Detoxification Combination', 'C1 - Carduus Benedictus', 'YE1 - Yellow Essence'],
    name: 'Body Detoxification',
    description: 'For body detoxification and liver support',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 7
  },

  // Eye and Ear Rules
  {
    symptomNames: ['Eye Redness', 'Watery Eyes', 'Sensitivity to Light'],
    medicineNames: ['Spagyric Essence - Immune', 'Complete System Tonic'],
    name: 'Eye Disorders',
    description: 'For eye redness, watering, and light sensitivity',
    dosage: '10-15 drops, 3 times daily',
    duration: '7-14 days',
    priority: 8
  },
  {
    symptomNames: ['Hearing Loss', 'Ringing in Ears', 'Dizziness'],
    medicineNames: ['BE1 - Blue Essence', 'BE2 - Blue Essence Compound'],
    name: 'Ear Disorders',
    description: 'For hearing loss, tinnitus, and dizziness',
    dosage: '10-15 drops, 3 times daily',
    duration: '14-30 days',
    priority: 7
  },

  // Mouth and Throat Rules
  {
    symptomNames: ['Bad Breath', 'Mouth Ulcers', 'Sore Throat'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'WE4 - White Essence Special'],
    name: 'Oral and Throat Disorders',
    description: 'For bad breath, mouth ulcers, and sore throat',
    dosage: '10-15 drops, 3 times daily',
    duration: '7-14 days',
    priority: 8
  },
];

const seedMedicineRules = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if rules already exist
    const existingCount = await MedicineRule.countDocuments({ isGlobal: true });
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing global rules. Skipping seed.`);
      console.log('💡 To re-seed, delete existing global rules first.');
      await mongoose.disconnect();
      return;
    }

    // Fetch all global symptoms and medicines
    const symptoms = await Symptom.find({ isGlobal: true }).lean();
    const medicines = await Medicine.find({ isGlobal: true }).lean();

    console.log(`📋 Found ${symptoms.length} global symptoms`);
    console.log(`💊 Found ${medicines.length} global medicines`);

    // Create a map for quick lookup
    const symptomMap = new Map(symptoms.map(s => [s.name.toLowerCase(), s._id.toString()]));
    const medicineMap = new Map(medicines.map(m => [m.name.toLowerCase(), m._id.toString()]));

    // Create rules
    const rulesToInsert = [];
    let skippedCount = 0;

    for (const mapping of ruleMappings) {
      const symptomIds: string[] = [];
      const medicineIds: string[] = [];

      // Find symptom IDs
      for (const symptomName of mapping.symptomNames) {
        const symptomId = symptomMap.get(symptomName.toLowerCase());
        if (symptomId) {
          symptomIds.push(symptomId);
        }
      }

      // Find medicine IDs
      for (const medicineName of mapping.medicineNames) {
        const medicineId = medicineMap.get(medicineName.toLowerCase());
        if (medicineId) {
          medicineIds.push(medicineId);
        }
      }

      // Only create rule if we have at least one symptom and one medicine
      if (symptomIds.length > 0 && medicineIds.length > 0) {
        rulesToInsert.push({
          name: mapping.name,
          description: mapping.description,
          symptomIds,
          medicineIds,
          dosage: mapping.dosage,
          duration: mapping.duration,
          priority: mapping.priority,
          isGlobal: true,
          doctorId: undefined,
        });
      } else {
        skippedCount++;
        console.log(`⚠️  Skipped rule "${mapping.name}" - missing symptoms or medicines`);
      }
    }

    if (rulesToInsert.length === 0) {
      console.log('❌ No valid rules to insert. Please check symptom and medicine names.');
      await mongoose.disconnect();
      return;
    }

    // Insert rules
    const result = await MedicineRule.insertMany(rulesToInsert);
    console.log(`✅ Successfully seeded ${result.length} global medicine rules`);
    
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} rules due to missing symptoms or medicines`);
    }

    // Display summary
    console.log('\n📊 Rules Summary:');
    console.log(`   Total rules created: ${result.length}`);
    console.log(`   Average symptoms per rule: ${(rulesToInsert.reduce((sum, r) => sum + r.symptomIds.length, 0) / rulesToInsert.length).toFixed(1)}`);
    console.log(`   Average medicines per rule: ${(rulesToInsert.reduce((sum, r) => sum + r.medicineIds.length, 0) / rulesToInsert.length).toFixed(1)}`);

    await mongoose.disconnect();
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding medicine rules:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedMedicineRules();

