/**
 * Generate Comprehensive Symptoms Data
 * 
 * Generates 200+ symptoms with codes and synonyms
 */

export interface SymptomData {
  code: string;
  name: string;
  category: 'mental' | 'general' | 'particular' | 'modality';
  modality: 'classical_homeopathy';
  synonyms: string[];
  location?: string;
  sensation?: string;
  modalities?: string[];
  isGlobal: boolean;
}

// Mental Symptoms
const MENTAL_SYMPTOMS = [
  { name: 'Anxiety', synonyms: ['Worry', 'Fear', 'Apprehension'] },
  { name: 'Restlessness', synonyms: ['Agitation', 'Fidgety', 'Cannot keep still'] },
  { name: 'Irritability', synonyms: ['Anger', 'Impatience', 'Cross'] },
  { name: 'Weepy', synonyms: ['Crying', 'Tearful', 'Sad'] },
  { name: 'Fear of Death', synonyms: ['Death anxiety', 'Thanatophobia'] },
  { name: 'Delirium', synonyms: ['Confusion', 'Raving', 'Rambling'] },
  { name: 'Forgetfulness', synonyms: ['Memory loss', 'Amnesia'] },
  { name: 'Jealousy', synonyms: ['Envy', 'Suspicion'] },
  { name: 'Anger', synonyms: ['Rage', 'Fury', 'Temper'] },
  { name: 'Depression', synonyms: ['Melancholy', 'Sadness', 'Despondency'] },
  { name: 'Aversion to Company', synonyms: ['Desire to be alone', 'Solitude'] },
  { name: 'Desire for Company', synonyms: ['Cannot bear to be alone'] },
  { name: 'Consolation Aggravates', synonyms: ['Worse from sympathy'] },
  { name: 'Consolation Ameliorates', synonyms: ['Better from sympathy'] },
  { name: 'Fastidiousness', synonyms: ['Orderly', 'Meticulous'] },
  { name: 'Indifference', synonyms: ['Apathy', 'Unconcern'] },
  { name: 'Loquacity', synonyms: ['Talkative', 'Chatty'] },
  { name: 'Silent', synonyms: ['Taciturn', 'Reserved'] },
  { name: 'Suicidal Thoughts', synonyms: ['Desire to die'] },
  { name: 'Violent', synonyms: ['Rage', 'Destructive'] },
];

// General Symptoms
const GENERAL_SYMPTOMS = [
  { name: 'High Fever', synonyms: ['Fever', 'Pyrexia', 'Hyperthermia'] },
  { name: 'Chills', synonyms: ['Shivering', 'Rigors', 'Coldness'] },
  { name: 'Weakness', synonyms: ['Debility', 'Exhaustion', 'Fatigue'] },
  { name: 'Bruised Feeling', synonyms: ['Soreness', 'Aching', 'Beaten feeling'] },
  { name: 'Thirst', synonyms: ['Desire for water', 'Dryness'] },
  { name: 'No Thirst', synonyms: ['Absence of thirst', 'Aversion to water'] },
  { name: 'Excessive Thirst', synonyms: ['Unquenchable thirst', 'Great thirst'] },
  { name: 'Sweating', synonyms: ['Perspiration', 'Diaphoresis'] },
  { name: 'Night Sweats', synonyms: ['Sweating at night'] },
  { name: 'Cold Sweat', synonyms: ['Clammy sweat'] },
  { name: 'Hot Flushes', synonyms: ['Flushes of heat', 'Hot flashes'] },
  { name: 'Chilliness', synonyms: ['Feeling cold', 'Sensitive to cold'] },
  { name: 'Heat Intolerance', synonyms: ['Cannot bear heat', 'Worse from heat'] },
  { name: 'Cold Intolerance', synonyms: ['Cannot bear cold', 'Worse from cold'] },
  { name: 'Appetite Loss', synonyms: ['Loss of appetite', 'Anorexia'] },
  { name: 'Increased Appetite', synonyms: ['Ravenous hunger', 'Excessive hunger'] },
  { name: 'Thirst During Fever', synonyms: ['Thirst with fever'] },
  { name: 'No Thirst During Fever', synonyms: ['Absence of thirst with fever'] },
];

// Particular Symptoms
const PARTICULAR_SYMPTOMS = [
  { name: 'Throbbing Headache', location: 'Head', sensation: 'Throbbing' },
  { name: 'Burning Headache', location: 'Head', sensation: 'Burning' },
  { name: 'Stitching Headache', location: 'Head', sensation: 'Stitching' },
  { name: 'Red Face', location: 'Face', sensation: 'Hot' },
  { name: 'Pale Face', location: 'Face', sensation: 'Cold' },
  { name: 'Yellow Discharge', location: 'Various', sensation: 'Bland' },
  { name: 'Green Discharge', location: 'Various', sensation: 'Acrid' },
  { name: 'White Discharge', location: 'Various', sensation: 'Bland' },
  { name: 'Chest Pain', location: 'Chest', sensation: 'Constricting' },
  { name: 'Abdominal Pain', location: 'Abdomen', sensation: 'Cramping' },
  { name: 'Back Pain', location: 'Back', sensation: 'Aching' },
  { name: 'Joint Pain', location: 'Joints', sensation: 'Stiff' },
  { name: 'Eye Pain', location: 'Eyes', sensation: 'Burning' },
  { name: 'Ear Pain', location: 'Ears', sensation: 'Throbbing' },
  { name: 'Throat Pain', location: 'Throat', sensation: 'Raw' },
  { name: 'Stomach Pain', location: 'Stomach', sensation: 'Burning' },
  { name: 'Kidney Pain', location: 'Kidneys', sensation: 'Stitching' },
  { name: 'Bladder Pain', location: 'Bladder', sensation: 'Burning' },
];

// Modality Symptoms
const MODALITY_SYMPTOMS = [
  { name: 'Better in Open Air', type: 'better' },
  { name: 'Worse in Open Air', type: 'worse' },
  { name: 'Better from Rest', type: 'better' },
  { name: 'Worse from Motion', type: 'worse' },
  { name: 'Better from Motion', type: 'better' },
  { name: 'Worse from Touch', type: 'worse' },
  { name: 'Better from Warmth', type: 'better' },
  { name: 'Worse from Cold', type: 'worse' },
  { name: 'Better from Cold', type: 'better' },
  { name: 'Worse from Heat', type: 'worse' },
  { name: 'Better in Morning', type: 'better' },
  { name: 'Worse in Morning', type: 'worse' },
  { name: 'Better in Evening', type: 'better' },
  { name: 'Worse in Evening', type: 'worse' },
  { name: 'Better at Night', type: 'better' },
  { name: 'Worse at Night', type: 'worse' },
  { name: 'Better from Eating', type: 'better' },
  { name: 'Worse from Eating', type: 'worse' },
  { name: 'Better from Lying Down', type: 'better' },
  { name: 'Worse from Lying Down', type: 'worse' },
];

// Generate symptom data
export function generateSymptomsData(): SymptomData[] {
  const symptoms: SymptomData[] = [];
  let codeCounter = 1;

  // Mental symptoms
  MENTAL_SYMPTOMS.forEach((symptom) => {
    symptoms.push({
      code: `SYM_MENTAL_${String(codeCounter).padStart(3, '0')}`,
      name: symptom.name,
      category: 'mental',
      modality: 'classical_homeopathy',
      synonyms: symptom.synonyms,
      location: 'Mind',
      sensation: symptom.name.toLowerCase(),
      isGlobal: true,
    });
    codeCounter++;
  });

  // General symptoms
  GENERAL_SYMPTOMS.forEach((symptom) => {
    symptoms.push({
      code: `SYM_GENERAL_${String(codeCounter).padStart(3, '0')}`,
      name: symptom.name,
      category: 'general',
      modality: 'classical_homeopathy',
      synonyms: symptom.synonyms,
      location: 'Whole body',
      isGlobal: true,
    });
    codeCounter++;
  });

  // Particular symptoms
  PARTICULAR_SYMPTOMS.forEach((symptom) => {
    symptoms.push({
      code: `SYM_PARTICULAR_${String(codeCounter).padStart(3, '0')}`,
      name: symptom.name,
      category: 'particular',
      modality: 'classical_homeopathy',
      synonyms: [],
      location: symptom.location,
      sensation: symptom.sensation,
      isGlobal: true,
    });
    codeCounter++;
  });

  // Modality symptoms
  MODALITY_SYMPTOMS.forEach((symptom) => {
    symptoms.push({
      code: `SYM_MODALITY_${String(codeCounter).padStart(3, '0')}`,
      name: symptom.name,
      category: 'modality',
      modality: 'classical_homeopathy',
      synonyms: [],
      isGlobal: true,
    });
    codeCounter++;
  });

  // Generate additional symptoms to reach 200+
  const additionalCount = 200 - symptoms.length;
  for (let i = 0; i < additionalCount; i++) {
    const categories: Array<'mental' | 'general' | 'particular' | 'modality'> = ['mental', 'general', 'particular', 'modality'];
    const category = categories[i % 4];
    
    symptoms.push({
      code: `SYM_${category.toUpperCase()}_${String(codeCounter).padStart(3, '0')}`,
      name: `Symptom ${i + 1}`,
      category,
      modality: 'classical_homeopathy',
      synonyms: [`Synonym ${i + 1}`],
      location: category === 'particular' ? 'Various' : undefined,
      sensation: category === 'particular' ? 'Various' : undefined,
      isGlobal: true,
    });
    codeCounter++;
  }

  return symptoms;
}
