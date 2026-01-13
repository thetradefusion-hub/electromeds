/**
 * Test Helpers and Utilities
 * 
 * Common utilities for testing Classical Homeopathy services
 */

import mongoose from 'mongoose';
import User from '../../models/User.model.js';
import Doctor from '../../models/Doctor.model.js';
import Patient from '../../models/Patient.model.js';
import Symptom from '../../models/Symptom.model.js';
import Remedy from '../../models/Remedy.model.js';
import Rubric from '../../models/Rubric.model.js';
import RubricRemedy from '../../models/RubricRemedy.model.js';
import type { StructuredCase } from '../../services/caseEngine.service.js';

/**
 * Create a test doctor
 */
export async function createTestDoctor() {
  const user = await User.create({
    name: 'Test Doctor',
    email: `test-doctor-${Date.now()}@example.com`,
    password: 'Test@123456',
    role: 'doctor',
    phone: '1234567890',
  });

  const doctor = await Doctor.create({
    userId: user._id,
    registrationNo: `REG-${Date.now()}`,
    qualification: 'MD Homeopathy',
    specialization: 'Classical Homeopathy',
    modality: 'classical_homeopathy',
    clinicName: 'Test Clinic',
  });

  return { user, doctor };
}

/**
 * Create a test patient
 */
export async function createTestPatient(doctorId: mongoose.Types.ObjectId) {
  const patient = await Patient.create({
    doctorId,
    name: 'Test Patient',
    patientId: `PT-${Date.now()}`,
    age: 35,
    gender: 'male',
    mobile: '9876543210',
    address: 'Test Address',
  });

  return patient;
}

/**
 * Create test symptoms
 */
export async function createTestSymptoms() {
  // Delete existing test symptoms first
  await Symptom.deleteMany({
    code: { $in: ['SYM_FEVER_001', 'SYM_ANXIETY_001', 'SYM_HEADACHE_001', 'SYM_THIRST_001'] },
  });

  const symptoms = [
    {
      code: 'SYM_FEVER_001',
      name: 'High Fever',
      category: 'general',
      modality: 'classical_homeopathy',
      synonyms: ['Fever', 'Pyrexia'],
      isGlobal: true,
    },
    {
      code: 'SYM_ANXIETY_001',
      name: 'Anxiety',
      category: 'mental',
      modality: 'classical_homeopathy',
      synonyms: ['Worry', 'Fear'],
      isGlobal: true,
    },
    {
      code: 'SYM_HEADACHE_001',
      name: 'Throbbing Headache',
      category: 'particular',
      modality: 'classical_homeopathy',
      synonyms: ['Head Pain', 'Cephalgia'],
      isGlobal: true,
    },
    {
      code: 'SYM_THIRST_001',
      name: 'No Thirst',
      category: 'modality',
      modality: 'classical_homeopathy',
      synonyms: ['Absence of Thirst'],
      isGlobal: true,
    },
  ];

  const createdSymptoms = await Symptom.insertMany(symptoms);
  return createdSymptoms;
}

/**
 * Create test remedies
 */
export async function createTestRemedies() {
  // Delete existing test remedies first
  await Remedy.deleteMany({
    name: { $in: ['Aconitum Napellus', 'Arnica Montana'] },
  });

  const remedies = [
    {
      name: 'Aconitum Napellus',
      category: 'Plant Kingdom',
      modality: 'classical_homeopathy',
      constitutionTraits: ['Fearful', 'Restless'],
      modalities: {
        better: ['Open Air', 'Warmth'],
        worse: ['Evening', 'Cold', 'Touch'],
      },
      clinicalIndications: ['Acute Fever', 'Anxiety', 'Sudden Onset'],
      incompatibilities: [],
      materiaMedica: {
        keynotes: ['Sudden onset', 'Great fear', 'Restlessness', 'Dry heat'],
        pathogenesis: 'Acts on nervous system, producing restlessness and fear',
        clinicalNotes: 'First remedy in acute cases',
      },
      supportedPotencies: ['6C', '30C', '200C', '1M'],
      isGlobal: true,
    },
    {
      name: 'Arnica Montana',
      category: 'Plant Kingdom',
      modality: 'classical_homeopathy',
      constitutionTraits: ['Bruised Feeling'],
      modalities: {
        better: ['Rest', 'Lying Down'],
        worse: ['Touch', 'Motion'],
      },
      clinicalIndications: ['Injuries', 'Bruises', 'Soreness'],
      incompatibilities: [],
      materiaMedica: {
        keynotes: ['Bruised feeling', 'Soreness', 'Aversion to touch'],
        pathogenesis: 'Acts on capillaries, preventing hemorrhage',
        clinicalNotes: 'First remedy after injury',
      },
      supportedPotencies: ['6C', '30C', '200C'],
      isGlobal: true,
    },
  ];

  const createdRemedies = await Remedy.insertMany(remedies);
  return createdRemedies;
}

/**
 * Create test rubrics
 */
export async function createTestRubrics(symptomCodes: string[]) {
  // Delete existing test rubrics first
  await Rubric.deleteMany({
    rubricText: { $in: ['FEAR - death, of', 'FEVER - high', 'HEADACHE - throbbing'] },
  });

  const rubrics = [
    {
      repertoryType: 'kent',
      chapter: 'Mind',
      rubricText: 'FEAR - death, of',
      linkedSymptoms: symptomCodes.filter((code) => code.includes('ANXIETY')),
      modality: 'classical_homeopathy',
      isGlobal: true,
    },
    {
      repertoryType: 'kent',
      chapter: 'Generals',
      rubricText: 'FEVER - high',
      linkedSymptoms: symptomCodes.filter((code) => code.includes('FEVER')),
      modality: 'classical_homeopathy',
      isGlobal: true,
    },
    {
      repertoryType: 'kent',
      chapter: 'Head',
      rubricText: 'HEADACHE - throbbing',
      linkedSymptoms: symptomCodes.filter((code) => code.includes('HEADACHE')),
      modality: 'classical_homeopathy',
      isGlobal: true,
    },
  ];

  const createdRubrics = await Rubric.insertMany(rubrics);
  return createdRubrics;
}

/**
 * Create test rubric-remedy mappings
 */
export async function createTestRubricRemedies(
  rubrics: any[],
  remedies: any[]
) {
  const mappings = [];

  // Aconitum for Fever rubric
  if (rubrics[1] && remedies[0]) {
    mappings.push({
      rubricId: rubrics[1]._id,
      remedyId: remedies[0]._id,
      grade: 4, // Highest grade
      repertoryType: 'kent',
    });
  }

  // Aconitum for Anxiety rubric
  if (rubrics[0] && remedies[0]) {
    mappings.push({
      rubricId: rubrics[0]._id,
      remedyId: remedies[0]._id,
      grade: 3,
      repertoryType: 'kent',
    });
  }

  // Arnica for Headache rubric
  if (rubrics[2] && remedies[1]) {
    mappings.push({
      rubricId: rubrics[2]._id,
      remedyId: remedies[1]._id,
      grade: 2,
      repertoryType: 'kent',
    });
  }

  if (mappings.length > 0) {
    const createdMappings = await RubricRemedy.insertMany(mappings);
    return createdMappings;
  }

  return [];
}

/**
 * Create a test structured case
 */
export function createTestStructuredCase(): StructuredCase {
  return {
    mental: [
      {
        symptomText: 'Anxiety',
        weight: 3,
      },
    ],
    generals: [
      {
        symptomText: 'High Fever',
        weight: 2,
      },
    ],
    particulars: [
      {
        symptomText: 'Throbbing Headache',
        location: 'Head',
        sensation: 'Throbbing',
        weight: 1,
      },
    ],
    modalities: [
      {
        symptomText: 'No Thirst',
        type: 'worse',
        weight: 1.5,
      },
    ],
    pathologyTags: ['Acute', 'Fever'],
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  await RubricRemedy.deleteMany({});
  await Rubric.deleteMany({});
  await Remedy.deleteMany({});
  await Symptom.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await User.deleteMany({});
}
