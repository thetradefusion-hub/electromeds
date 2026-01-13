/**
 * Recreate Rules with Current Symptom IDs
 * 
 * This script will:
 * 1. Delete all existing Electro Homeopathy rules
 * 2. Create new rules with current symptom IDs
 * 
 * WARNING: This will delete all existing rules!
 */

import mongoose from 'mongoose';
import config from '../config/env.js';
import MedicineRule from '../models/MedicineRule.model.js';
import Symptom from '../models/Symptom.model.js';
import Medicine from '../models/Medicine.model.js';

// Comprehensive Electro Homeopathy Rules
// Based on Electro Homeopathy principles and common symptom-medicine mappings
const ruleDefinitions = [
  // ========== FEVER & GENERAL CONDITIONS ==========
  {
    name: 'General Fever and Weakness',
    description: 'For general fever with body weakness and chills',
    symptomNames: ['Fever', 'Weakness', 'Body Aches', 'Chills'],
    medicineNames: ['Complete System Tonic', 'Electricity - Positive', 'GE1 - Gastro-Enteric Essence'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 10,
  },
  {
    name: 'Fever with Respiratory Symptoms',
    description: 'Fever accompanied by cough, cold, or breathing issues',
    symptomNames: ['Fever', 'Cough', 'Runny Nose', 'Chest Discomfort'],
    medicineNames: ['Spagyric Essence - Respiratory', 'Complete System Tonic', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 9,
  },
  {
    name: 'High Fever with Fatigue',
    description: 'High fever with extreme fatigue and body weakness',
    symptomNames: ['Fever', 'Fatigue', 'Weakness', 'Body Aches'],
    medicineNames: ['Complete System Tonic', 'Electricity - Positive', 'C1 - Carduus Benedictus'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 9,
  },

  // ========== RESPIRATORY CONDITIONS ==========
  {
    name: 'Cough and Cold',
    description: 'For common cold with cough and nasal congestion',
    symptomNames: ['Cough', 'Runny Nose', 'Nasal Congestion', 'Sneezing'],
    medicineNames: ['Spagyric Essence - Respiratory', 'RE1 - Red Essence', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 9,
  },
  {
    name: 'Dry Cough',
    description: 'For persistent dry cough without phlegm',
    symptomNames: ['Dry Cough', 'Chest Discomfort', 'Sore Throat'],
    medicineNames: ['Spagyric Essence - Respiratory', 'RE2 - Red Essence Compound', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Productive Cough',
    description: 'For cough with phlegm and chest congestion',
    symptomNames: ['Productive Cough', 'Chest Discomfort', 'Shortness of Breath'],
    medicineNames: ['Spagyric Essence - Respiratory', 'S1 - Scilla Maritima', 'Respiratory-Digestive Combination'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Asthma and Breathing Difficulty',
    description: 'For asthma, wheezing, and breathing difficulties',
    symptomNames: ['Shortness of Breath', 'Wheezing', 'Chest Tightness'],
    medicineNames: ['Spagyric Essence - Respiratory', 'RE3 - Red Essence Forte', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 9,
  },
  {
    name: 'Sore Throat and Hoarseness',
    description: 'For sore throat, hoarseness, and throat irritation',
    symptomNames: ['Sore Throat', 'Hoarseness', 'Cough'],
    medicineNames: ['Spagyric Essence - Respiratory', 'RE1 - Red Essence', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '5 days',
    priority: 8,
  },

  // ========== DIGESTIVE CONDITIONS ==========
  {
    name: 'Diarrhea and Abdominal Cramps',
    description: 'For diarrhea with abdominal pain and cramps',
    symptomNames: ['Diarrhea', 'Abdominal Pain', 'Stomach Cramps'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'GE2 - Gastro-Enteric Compound', 'C1 - Carduus Benedictus'],
    dosage: '10 drops twice daily',
    duration: '5 days',
    priority: 9,
  },
  {
    name: 'Acidity and Heartburn',
    description: 'For acidity, heartburn, and gastric discomfort',
    symptomNames: ['Acidity', 'Heartburn', 'Chest Discomfort'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'Spagyric Essence - Digestive', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Loss of Appetite',
    description: 'For reduced appetite and digestive issues',
    symptomNames: ['Loss of Appetite', 'Indigestion', 'Nausea'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'Spagyric Essence - Digestive', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 7,
  },
  {
    name: 'Constipation',
    description: 'For constipation and irregular bowel movements',
    symptomNames: ['Constipation', 'Abdominal Pain', 'Bloating'],
    medicineNames: ['GE3 - Gastro-Enteric Forte', 'Spagyric Essence - Digestive', 'C2 - Carduus Benedictus Compound'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Indigestion and Bloating',
    description: 'For indigestion, bloating, and gas',
    symptomNames: ['Indigestion', 'Bloating', 'Gas', 'Abdominal Pain'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'Spagyric Essence - Digestive', 'Nervous-Digestive Combination'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Nausea and Vomiting',
    description: 'For nausea, vomiting, and gastric upset',
    symptomNames: ['Nausea', 'Vomiting', 'Indigestion'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'C1 - Carduus Benedictus', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '5 days',
    priority: 9,
  },
  {
    name: 'Weight Loss and Appetite Issues',
    description: 'For weight loss due to poor appetite and weakness',
    symptomNames: ['Weight Loss', 'Loss of Appetite', 'Weakness'],
    medicineNames: ['Complete System Tonic', 'GE1 - Gastro-Enteric Essence', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 7,
  },
  {
    name: 'Liver and Digestive Issues',
    description: 'For liver problems and digestive disorders',
    symptomNames: ['Abdominal Pain', 'Indigestion', 'Fatigue'],
    medicineNames: ['Spagyric Essence - Liver', 'Liver-Heart Combination', 'GE1 - Gastro-Enteric Essence'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 8,
  },

  // ========== PAIN & MUSCULOSKELETAL ==========
  {
    name: 'Musculoskeletal Pain',
    description: 'For general muscle and bone pain',
    symptomNames: ['Muscle Pain', 'Back Pain', 'Body Aches', 'Joint Pain'],
    medicineNames: ['External Application - Pain Relief', 'BE1 - Blue Essence', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 9,
  },
  {
    name: 'Arthritis and Joint Inflammation',
    description: 'For joint pain, inflammation, and stiffness',
    symptomNames: ['Joint Pain', 'Muscle Stiffness', 'Swelling in Joints'],
    medicineNames: ['External Application - Anti-Inflammatory', 'BE2 - Blue Essence Compound', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 8,
  },
  {
    name: 'Back Pain',
    description: 'For lower back pain and spinal discomfort',
    symptomNames: ['Back Pain', 'Muscle Pain', 'Limited Range of Motion'],
    medicineNames: ['External Application - Pain Relief', 'BE3 - Blue Essence Forte', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 8,
  },
  {
    name: 'Neck and Shoulder Pain',
    description: 'For neck pain, shoulder pain, and stiffness',
    symptomNames: ['Neck Pain', 'Shoulder Pain', 'Muscle Stiffness'],
    medicineNames: ['External Application - Pain Relief', 'BE1 - Blue Essence', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Knee Pain',
    description: 'For knee pain and joint problems',
    symptomNames: ['Knee Pain', 'Joint Pain', 'Swelling in Joints'],
    medicineNames: ['External Application - Anti-Inflammatory', 'BE2 - Blue Essence Compound', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 8,
  },

  // ========== SKIN CONDITIONS ==========
  {
    name: 'Acne and Skin Problems',
    description: 'For acne, pimples, and skin inflammation',
    symptomNames: ['Acne', 'Rash', 'Itching'],
    medicineNames: ['External Application - Skin Care', 'YE1 - Yellow Essence', 'Detoxification Combination'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 8,
  },
  {
    name: 'Eczema and Skin Irritation',
    description: 'For eczema, skin rashes, and irritation',
    symptomNames: ['Eczema', 'Rash', 'Itching', 'Dry Skin'],
    medicineNames: ['External Application - Skin Care', 'YE2 - Yellow Essence Compound', 'Spagyric Essence - Immune'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 8,
  },
  {
    name: 'Psoriasis',
    description: 'For psoriasis and chronic skin conditions',
    symptomNames: ['Psoriasis', 'Rash', 'Itching', 'Skin Discoloration'],
    medicineNames: ['External Application - Skin Care', 'YE3 - Yellow Essence Forte', 'Detoxification Combination'],
    dosage: '10 drops twice daily',
    duration: '21 days',
    priority: 7,
  },
  {
    name: 'Hives and Allergic Reactions',
    description: 'For hives, allergic skin reactions, and itching',
    symptomNames: ['Hives', 'Rash', 'Itching'],
    medicineNames: ['YE1 - Yellow Essence', 'Spagyric Essence - Immune', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Wounds and Bruises',
    description: 'For healing wounds, cuts, and reducing bruising',
    symptomNames: ['Bruising', 'Wounds'],
    medicineNames: ['External Application - Wound Healing', 'WE1 - White Essence', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },

  // ========== NEUROLOGICAL CONDITIONS ==========
  {
    name: 'Headache',
    description: 'For headaches and migraines',
    symptomNames: ['Headache', 'Dizziness'],
    medicineNames: ['BE1 - Blue Essence', 'Electricity - Negative', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '5 days',
    priority: 9,
  },
  {
    name: 'Memory and Cognitive Issues',
    description: 'For memory problems and cognitive decline',
    symptomNames: ['Memory Loss', 'Confusion', 'Lack of Concentration'],
    medicineNames: ['Spagyric Essence - Nervous', 'BE4 - Blue Essence Special', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 8,
  },
  {
    name: 'Insomnia and Sleep Disorders',
    description: 'For insomnia, sleep problems, and restlessness',
    symptomNames: ['Insomnia', 'Restlessness', 'Anxiety'],
    medicineNames: ['Spagyric Essence - Nervous', 'BE1 - Blue Essence', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 8,
  },
  {
    name: 'Anxiety and Stress',
    description: 'For anxiety, stress, and nervous tension',
    symptomNames: ['Anxiety', 'Stress', 'Restlessness', 'Irritability'],
    medicineNames: ['Spagyric Essence - Nervous', 'BE2 - Blue Essence Compound', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 8,
  },
  {
    name: 'Depression and Mood Changes',
    description: 'For depression, mood swings, and emotional imbalance',
    symptomNames: ['Depression', 'Mood Changes', 'Mood Swings', 'Irritability'],
    medicineNames: ['Spagyric Essence - Nervous', 'BE3 - Blue Essence Forte', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 7,
  },
  {
    name: 'Dizziness and Balance Problems',
    description: 'For dizziness, vertigo, and balance issues',
    symptomNames: ['Dizziness', 'Balance Problems', 'Nausea'],
    medicineNames: ['BE1 - Blue Essence', 'Electricity - Negative', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Numbness and Tingling',
    description: 'For numbness, tingling sensation, and nerve issues',
    symptomNames: ['Numbness', 'Tingling Sensation'],
    medicineNames: ['Spagyric Essence - Nervous', 'BE2 - Blue Essence Compound', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 7,
  },
  {
    name: 'Tremors and Seizures',
    description: 'For tremors, seizures, and neurological disorders',
    symptomNames: ['Tremors', 'Seizures'],
    medicineNames: ['Spagyric Essence - Nervous', 'BE4 - Blue Essence Special', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 9,
  },

  // ========== URINARY CONDITIONS ==========
  {
    name: 'Frequent Urination',
    description: 'For frequent urination and urinary urgency',
    symptomNames: ['Frequent Urination', 'Difficulty Urinating'],
    medicineNames: ['WE1 - White Essence', 'Spagyric Essence - Liver', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Painful Urination',
    description: 'For painful urination and urinary tract discomfort',
    symptomNames: ['Painful Urination', 'Frequent Urination'],
    medicineNames: ['WE2 - White Essence Compound', 'Spagyric Essence - Immune', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 9,
  },
  {
    name: 'Urinary Incontinence',
    description: 'For urinary incontinence and bladder control issues',
    symptomNames: ['Urinary Incontinence', 'Frequent Urination'],
    medicineNames: ['WE1 - White Essence', 'Spagyric Essence - Nervous', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 7,
  },
  {
    name: 'Blood in Urine',
    description: 'For blood in urine and urinary tract issues',
    symptomNames: ['Blood in Urine', 'Painful Urination'],
    medicineNames: ['WE3 - White Essence Forte', 'Spagyric Essence - Immune', 'C1 - Carduus Benedictus'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 9,
  },
  {
    name: 'Cloudy Urine',
    description: 'For cloudy urine and urinary tract infections',
    symptomNames: ['Cloudy Urine', 'Strong Urine Odor', 'Frequent Urination'],
    medicineNames: ['WE2 - White Essence Compound', 'Spagyric Essence - Immune', 'Detoxification Combination'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },

  // ========== WOMEN HEALTH ==========
  {
    name: 'Irregular Menstruation',
    description: 'For irregular menstrual cycles and period problems',
    symptomNames: ['Irregular Menstruation', 'Missed Periods'],
    medicineNames: ['RE1 - Red Essence', 'Spagyric Essence - Liver', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 7,
  },
  {
    name: 'Painful Menstruation',
    description: 'For painful periods and menstrual cramps',
    symptomNames: ['Painful Menstruation', 'Lower Abdominal Pain', 'Pelvic Pain'],
    medicineNames: ['RE2 - Red Essence Compound', 'GE1 - Gastro-Enteric Essence', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Heavy Menstrual Bleeding',
    description: 'For heavy menstrual bleeding and excessive flow',
    symptomNames: ['Heavy Menstrual Bleeding', 'Irregular Menstruation'],
    medicineNames: ['RE3 - Red Essence Forte', 'C1 - Carduus Benedictus', 'Spagyric Essence - Liver'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Vaginal Discharge and Itching',
    description: 'For vaginal discharge, itching, and infections',
    symptomNames: ['Vaginal Discharge', 'Vaginal Itching'],
    medicineNames: ['WE2 - White Essence Compound', 'Spagyric Essence - Immune', 'YE1 - Yellow Essence'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Hot Flashes and Menopause',
    description: 'For hot flashes, night sweats, and menopausal symptoms',
    symptomNames: ['Hot Flashes', 'Night Sweats', 'Mood Swings'],
    medicineNames: ['RE1 - Red Essence', 'Spagyric Essence - Nervous', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 7,
  },

  // ========== CARDIOVASCULAR ==========
  {
    name: 'High Blood Pressure',
    description: 'For high blood pressure and hypertension',
    symptomNames: ['High Blood Pressure', 'Headache', 'Dizziness'],
    medicineNames: ['Spagyric Essence - Cardiovascular', 'BE1 - Blue Essence', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 9,
  },
  {
    name: 'Low Blood Pressure',
    description: 'For low blood pressure and hypotension',
    symptomNames: ['Low Blood Pressure', 'Dizziness', 'Weakness'],
    medicineNames: ['Spagyric Essence - Cardiovascular', 'Electricity - Positive', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 8,
  },
  {
    name: 'Irregular Heartbeat',
    description: 'For irregular heartbeat and palpitations',
    symptomNames: ['Irregular Heartbeat', 'Palpitations', 'Chest Discomfort'],
    medicineNames: ['Spagyric Essence - Cardiovascular', 'Liver-Heart Combination', 'Electricity - Neutral'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 9,
  },
  {
    name: 'Chest Pain',
    description: 'For chest pain and cardiac discomfort',
    symptomNames: ['Chest Pain', 'Chest Discomfort', 'Shortness of Breath'],
    medicineNames: ['Spagyric Essence - Cardiovascular', 'C1 - Carduus Benedictus', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 10,
  },
  {
    name: 'Panic Attacks',
    description: 'For panic attacks, anxiety, and heart palpitations',
    symptomNames: ['Panic Attacks', 'Palpitations', 'Anxiety', 'Shortness of Breath'],
    medicineNames: ['Spagyric Essence - Nervous', 'BE2 - Blue Essence Compound', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 9,
  },

  // ========== EYE & EAR CONDITIONS ==========
  {
    name: 'Eye Problems',
    description: 'For eye redness, dryness, and vision problems',
    symptomNames: ['Eye Redness', 'Dry Eyes', 'Vision Problems', 'Watery Eyes'],
    medicineNames: ['YE1 - Yellow Essence', 'Spagyric Essence - Immune', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Hearing Loss',
    description: 'For hearing loss and ear problems',
    symptomNames: ['Hearing Loss', 'Ringing in Ears'],
    medicineNames: ['BE1 - Blue Essence', 'Spagyric Essence - Nervous', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 7,
  },
  {
    name: 'Ringing in Ears',
    description: 'For tinnitus and ringing in ears',
    symptomNames: ['Ringing in Ears', 'Hearing Loss'],
    medicineNames: ['BE2 - Blue Essence Compound', 'Spagyric Essence - Nervous', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 7,
  },

  // ========== GENERAL CONDITIONS ==========
  {
    name: 'Body Detoxification',
    description: 'For general body detox and cleansing',
    symptomNames: ['Diarrhea', 'Indigestion', 'Weakness'],
    medicineNames: ['Detoxification Combination', 'GE1 - Gastro-Enteric Essence', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 7,
  },
  {
    name: 'Fatigue and Weakness',
    description: 'For chronic fatigue and general weakness',
    symptomNames: ['Fatigue', 'Weakness', 'Lack of Concentration'],
    medicineNames: ['Complete System Tonic', 'Electricity - Positive', 'Spagyric Essence - Immune'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 8,
  },
  {
    name: 'Hair Loss',
    description: 'For hair loss and scalp problems',
    symptomNames: ['Hair Loss'],
    medicineNames: ['YE1 - Yellow Essence', 'Spagyric Essence - Immune', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '21 days',
    priority: 6,
  },
  {
    name: 'Loss of Taste',
    description: 'For loss of taste and smell',
    symptomNames: ['Loss of Taste'],
    medicineNames: ['Spagyric Essence - Nervous', 'BE1 - Blue Essence', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 7,
  },
  {
    name: 'Excessive Sweating',
    description: 'For excessive sweating and perspiration',
    symptomNames: ['Excessive Sweating', 'Night Sweats'],
    medicineNames: ['YE1 - Yellow Essence', 'Spagyric Essence - Immune', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 7,
  },
  {
    name: 'Excessive Thirst',
    description: 'For excessive thirst and dehydration',
    symptomNames: ['Excessive Thirst', 'Frequent Urination'],
    medicineNames: ['WE1 - White Essence', 'Complete System Tonic', 'Electricity - Positive'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 7,
  },
  {
    name: 'Cold Hands and Feet',
    description: 'For poor circulation and cold extremities',
    symptomNames: ['Cold Hands and Feet', 'Numbness'],
    medicineNames: ['Spagyric Essence - Cardiovascular', 'Electricity - Positive', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '10 days',
    priority: 7,
  },
  {
    name: 'Sensitivity to Light',
    description: 'For light sensitivity and eye discomfort',
    symptomNames: ['Sensitivity to Light', 'Headache', 'Eye Redness'],
    medicineNames: ['YE1 - Yellow Essence', 'BE1 - Blue Essence', 'Spagyric Essence - Nervous'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 7,
  },
  {
    name: 'Swollen Glands',
    description: 'For swollen glands and lymph node issues',
    symptomNames: ['Swollen Glands'],
    medicineNames: ['YE2 - Yellow Essence Compound', 'Spagyric Essence - Immune', 'Detoxification Combination'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 8,
  },
  {
    name: 'Mouth Ulcers',
    description: 'For mouth ulcers and oral problems',
    symptomNames: ['Mouth Ulcers', 'Bad Breath'],
    medicineNames: ['YE1 - Yellow Essence', 'Spagyric Essence - Immune', 'GE1 - Gastro-Enteric Essence'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 7,
  },
  {
    name: 'Bitter Taste in Mouth',
    description: 'For bitter taste and taste disorders',
    symptomNames: ['Bitter Taste in Mouth', 'Loss of Taste'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'Spagyric Essence - Digestive', 'Complete System Tonic'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 6,
  },
  {
    name: 'Excessive Salivation',
    description: 'For excessive salivation and drooling',
    symptomNames: ['Excessive Salivation'],
    medicineNames: ['GE1 - Gastro-Enteric Essence', 'Spagyric Essence - Digestive', 'Electricity - Negative'],
    dosage: '10 drops twice daily',
    duration: '7 days',
    priority: 6,
  },
  {
    name: 'Weight Gain',
    description: 'For weight gain and metabolic issues',
    symptomNames: ['Weight Gain', 'Fatigue'],
    medicineNames: ['Spagyric Essence - Digestive', 'GE1 - Gastro-Enteric Essence', 'Detoxification Combination'],
    dosage: '10 drops twice daily',
    duration: '14 days',
    priority: 6,
  },
];

async function recreateRulesWithCurrentSymptoms() {
  try {
    console.log('🔄 Connecting to MongoDB...\n');
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('⚠️  WARNING: This will delete all existing Electro Homeopathy rules!\n');
    console.log('📋 Step 1: Loading current symptoms and medicines...\n');

    // Load all Electro Homeopathy symptoms
    const symptoms = await Symptom.find({ modality: 'electro_homeopathy', isGlobal: true })
      .select('_id name')
      .lean();

    const symptomNameToId = new Map<string, string>();
    symptoms.forEach((s: any) => {
      const name = s.name.toLowerCase().trim();
      symptomNameToId.set(name, s._id.toString());
    });

    console.log(`✅ Loaded ${symptoms.length} symptoms\n`);

    // Load all Electro Homeopathy medicines
    const medicines = await Medicine.find({ modality: 'electro_homeopathy', isGlobal: true })
      .select('_id name')
      .lean();

    const medicineNameToId = new Map<string, string>();
    medicines.forEach((m: any) => {
      const name = m.name.toLowerCase().trim();
      medicineNameToId.set(name, m._id.toString());
    });

    console.log(`✅ Loaded ${medicines.length} medicines\n`);

    console.log('📋 Step 2: Deleting old rules...\n');
    const deleteResult = await MedicineRule.deleteMany({ modality: 'electro_homeopathy' });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old rules\n`);

    console.log('📋 Step 3: Creating new rules with current symptom IDs...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const ruleDef of ruleDefinitions) {
      // Find symptom IDs by name
      const symptomIds: string[] = [];
      for (const symptomName of ruleDef.symptomNames) {
        const symptomId = symptomNameToId.get(symptomName.toLowerCase().trim());
        if (symptomId) {
          symptomIds.push(symptomId);
        } else {
          console.log(`⚠️  Symptom not found: "${symptomName}"`);
        }
      }

      // Find medicine IDs by name
      const medicineIds: string[] = [];
      for (const medicineName of ruleDef.medicineNames) {
        const medicineId = medicineNameToId.get(medicineName.toLowerCase().trim());
        if (medicineId) {
          medicineIds.push(medicineId);
        } else {
          console.log(`⚠️  Medicine not found: "${medicineName}"`);
        }
      }

      if (symptomIds.length === 0 || medicineIds.length === 0) {
        console.log(`❌ Skipping rule "${ruleDef.name}" - missing symptoms or medicines`);
        skippedCount++;
        continue;
      }

      // Create the rule
      await MedicineRule.create({
        name: ruleDef.name,
        description: ruleDef.description,
        modality: 'electro_homeopathy',
        symptomIds,
        medicineIds,
        dosage: ruleDef.dosage,
        duration: ruleDef.duration,
        priority: ruleDef.priority,
        isGlobal: true,
      });

      console.log(`✅ Created rule: "${ruleDef.name}" (${symptomIds.length} symptoms, ${medicineIds.length} medicines)`);
      createdCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Rules Created: ${createdCount}`);
    console.log(`   Rules Skipped: ${skippedCount}`);
    console.log(`   Total Rules: ${await MedicineRule.countDocuments({ modality: 'electro_homeopathy' })}\n`);

    console.log('✅ Rules recreated successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

recreateRulesWithCurrentSymptoms()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
