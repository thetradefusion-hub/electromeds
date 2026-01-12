import mongoose from 'mongoose';
import Medicine from '../models/Medicine.model.js';
import dotenv from 'dotenv';

dotenv.config();

// Electro Homeopathy Medicines Data
const electroHomeopathyMedicines = [
  // S1-S10 Series (Spagyric Essences)
  { 
    name: 'S1 - Scilla Maritima', 
    category: 'S1-S10 Series', 
    indications: 'Respiratory disorders, asthma, bronchitis, cardiac dropsy, kidney inflammation',
    defaultDosage: '10-15 drops in water, 3 times daily',
    contraIndications: 'Avoid in acute kidney failure',
    notes: 'Acts on respiratory and urinary systems'
  },
  { 
    name: 'S2 - Scilla Maritima Compound', 
    category: 'S1-S10 Series', 
    indications: 'Chronic bronchitis, asthma, cardiac weakness, edema',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Enhanced formula for chronic conditions'
  },
  { 
    name: 'S3 - Scilla Maritima Forte', 
    category: 'S1-S10 Series', 
    indications: 'Severe respiratory conditions, chronic asthma, cardiac edema',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Use with caution in pregnancy',
    notes: 'Stronger preparation for resistant cases'
  },
  { 
    name: 'S4 - Scilla Maritima Special', 
    category: 'S1-S10 Series', 
    indications: 'Pulmonary congestion, chronic cough, heart weakness',
    defaultDosage: '10-15 drops, 3-4 times daily',
    contraIndications: 'None known',
    notes: 'Special preparation for pulmonary conditions'
  },
  { 
    name: 'S5 - Scilla Maritima Extra', 
    category: 'S1-S10 Series', 
    indications: 'Advanced respiratory diseases, chronic bronchitis',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Avoid in acute kidney disease',
    notes: 'Extra strength formula'
  },
  { 
    name: 'S6 - Scilla Maritima Ultra', 
    category: 'S1-S10 Series', 
    indications: 'Severe chronic respiratory conditions',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use under medical supervision',
    notes: 'Ultra strength preparation'
  },
  { 
    name: 'S7 - Scilla Maritima Maximum', 
    category: 'S1-S10 Series', 
    indications: 'Maximum strength respiratory support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Not for children under 12',
    notes: 'Maximum strength formula'
  },
  { 
    name: 'S8 - Scilla Maritima Plus', 
    category: 'S1-S10 Series', 
    indications: 'Chronic respiratory ailments with cardiac involvement',
    defaultDosage: '15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Plus formula with enhanced cardiac support'
  },
  { 
    name: 'S9 - Scilla Maritima Super', 
    category: 'S1-S10 Series', 
    indications: 'Super strength respiratory and cardiac support',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use with caution in elderly',
    notes: 'Super strength preparation'
  },
  { 
    name: 'S10 - Scilla Maritima Supreme', 
    category: 'S1-S10 Series', 
    indications: 'Supreme strength for chronic respiratory diseases',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Medical supervision recommended',
    notes: 'Supreme strength formula'
  },

  // C1-C17 Series (Cohobations)
  { 
    name: 'C1 - Carduus Benedictus', 
    category: 'C1-C17 Series', 
    indications: 'Liver disorders, jaundice, digestive problems, gallbladder issues',
    defaultDosage: '10-15 drops, 3 times daily before meals',
    contraIndications: 'Avoid in acute liver failure',
    notes: 'Primary liver and digestive remedy'
  },
  { 
    name: 'C2 - Carduus Benedictus Compound', 
    category: 'C1-C17 Series', 
    indications: 'Chronic liver diseases, hepatitis, digestive disorders',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Compound formula for liver health'
  },
  { 
    name: 'C3 - Carduus Benedictus Forte', 
    category: 'C1-C17 Series', 
    indications: 'Severe liver conditions, chronic hepatitis, cirrhosis',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Use with caution in advanced liver disease',
    notes: 'Forte strength for liver support'
  },
  { 
    name: 'C4 - Carduus Benedictus Special', 
    category: 'C1-C17 Series', 
    indications: 'Liver detoxification, gallbladder disorders',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Special preparation for liver detox'
  },
  { 
    name: 'C5 - Carduus Benedictus Extra', 
    category: 'C1-C17 Series', 
    indications: 'Advanced liver diseases, chronic digestive issues',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Avoid in acute liver failure',
    notes: 'Extra strength liver remedy'
  },
  { 
    name: 'C6 - Carduus Benedictus Ultra', 
    category: 'C1-C17 Series', 
    indications: 'Severe chronic liver conditions',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Medical supervision required',
    notes: 'Ultra strength liver support'
  },
  { 
    name: 'C7 - Carduus Benedictus Maximum', 
    category: 'C1-C17 Series', 
    indications: 'Maximum strength liver support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Not for children under 12',
    notes: 'Maximum strength formula'
  },
  { 
    name: 'C8 - Carduus Benedictus Plus', 
    category: 'C1-C17 Series', 
    indications: 'Liver and digestive system support',
    defaultDosage: '15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Plus formula with enhanced digestive support'
  },
  { 
    name: 'C9 - Carduus Benedictus Super', 
    category: 'C1-C17 Series', 
    indications: 'Super strength liver and gallbladder support',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use with caution in elderly',
    notes: 'Super strength preparation'
  },
  { 
    name: 'C10 - Carduus Benedictus Supreme', 
    category: 'C1-C17 Series', 
    indications: 'Supreme strength for chronic liver diseases',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Medical supervision recommended',
    notes: 'Supreme strength liver remedy'
  },
  { 
    name: 'C11 - Carduus Benedictus Special Plus', 
    category: 'C1-C17 Series', 
    indications: 'Special liver and digestive combination',
    defaultDosage: '15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Special plus formula'
  },
  { 
    name: 'C12 - Carduus Benedictus Extra Plus', 
    category: 'C1-C17 Series', 
    indications: 'Extra plus liver support',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Avoid in acute conditions',
    notes: 'Extra plus preparation'
  },
  { 
    name: 'C13 - Carduus Benedictus Ultra Plus', 
    category: 'C1-C17 Series', 
    indications: 'Ultra plus strength liver remedy',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Medical supervision required',
    notes: 'Ultra plus formula'
  },
  { 
    name: 'C14 - Carduus Benedictus Maximum Plus', 
    category: 'C1-C17 Series', 
    indications: 'Maximum plus liver support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Not for children',
    notes: 'Maximum plus strength'
  },
  { 
    name: 'C15 - Carduus Benedictus Super Plus', 
    category: 'C1-C17 Series', 
    indications: 'Super plus liver remedy',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use with caution',
    notes: 'Super plus preparation'
  },
  { 
    name: 'C16 - Carduus Benedictus Supreme Plus', 
    category: 'C1-C17 Series', 
    indications: 'Supreme plus liver support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Medical supervision recommended',
    notes: 'Supreme plus formula'
  },
  { 
    name: 'C17 - Carduus Benedictus Ultimate', 
    category: 'C1-C17 Series', 
    indications: 'Ultimate strength liver remedy',
    defaultDosage: '25 drops, 3 times daily',
    contraIndications: 'Requires medical supervision',
    notes: 'Ultimate strength preparation'
  },

  // GE Series (Gastro-Enteric)
  { 
    name: 'GE1 - Gastro-Enteric Essence', 
    category: 'GE Series', 
    indications: 'Stomach disorders, gastritis, indigestion, acidity',
    defaultDosage: '10-15 drops, 3 times daily before meals',
    contraIndications: 'Avoid in acute gastric ulcers',
    notes: 'Primary digestive system remedy'
  },
  { 
    name: 'GE2 - Gastro-Enteric Compound', 
    category: 'GE Series', 
    indications: 'Chronic gastritis, stomach pain, digestive disorders',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Compound formula for digestive health'
  },
  { 
    name: 'GE3 - Gastro-Enteric Forte', 
    category: 'GE Series', 
    indications: 'Severe digestive conditions, chronic gastritis',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Use with caution in gastric ulcers',
    notes: 'Forte strength digestive support'
  },
  { 
    name: 'GE4 - Gastro-Enteric Special', 
    category: 'GE Series', 
    indications: 'Stomach inflammation, acid reflux, heartburn',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Special preparation for stomach issues'
  },
  { 
    name: 'GE5 - Gastro-Enteric Extra', 
    category: 'GE Series', 
    indications: 'Advanced digestive diseases, chronic indigestion',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Avoid in acute conditions',
    notes: 'Extra strength digestive remedy'
  },
  { 
    name: 'GE6 - Gastro-Enteric Ultra', 
    category: 'GE Series', 
    indications: 'Severe chronic digestive conditions',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Medical supervision required',
    notes: 'Ultra strength digestive support'
  },
  { 
    name: 'GE7 - Gastro-Enteric Maximum', 
    category: 'GE Series', 
    indications: 'Maximum strength digestive support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Not for children under 12',
    notes: 'Maximum strength formula'
  },
  { 
    name: 'GE8 - Gastro-Enteric Plus', 
    category: 'GE Series', 
    indications: 'Digestive system support with enhanced action',
    defaultDosage: '15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Plus formula with enhanced digestive support'
  },
  { 
    name: 'GE9 - Gastro-Enteric Super', 
    category: 'GE Series', 
    indications: 'Super strength digestive remedy',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use with caution in elderly',
    notes: 'Super strength preparation'
  },
  { 
    name: 'GE10 - Gastro-Enteric Supreme', 
    category: 'GE Series', 
    indications: 'Supreme strength for chronic digestive diseases',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Medical supervision recommended',
    notes: 'Supreme strength digestive remedy'
  },

  // YE Series (Yellow Essence)
  { 
    name: 'YE1 - Yellow Essence', 
    category: 'YE Series', 
    indications: 'Liver and gallbladder disorders, jaundice, hepatitis',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'Avoid in acute liver failure',
    notes: 'Primary liver and gallbladder remedy'
  },
  { 
    name: 'YE2 - Yellow Essence Compound', 
    category: 'YE Series', 
    indications: 'Chronic liver diseases, gallbladder inflammation',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Compound formula for liver health'
  },
  { 
    name: 'YE3 - Yellow Essence Forte', 
    category: 'YE Series', 
    indications: 'Severe liver conditions, chronic hepatitis',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Use with caution in advanced liver disease',
    notes: 'Forte strength liver support'
  },
  { 
    name: 'YE4 - Yellow Essence Special', 
    category: 'YE Series', 
    indications: 'Liver detoxification, jaundice treatment',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Special preparation for liver detox'
  },
  { 
    name: 'YE5 - Yellow Essence Extra', 
    category: 'YE Series', 
    indications: 'Advanced liver diseases, chronic jaundice',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Avoid in acute liver failure',
    notes: 'Extra strength liver remedy'
  },
  { 
    name: 'YE6 - Yellow Essence Ultra', 
    category: 'YE Series', 
    indications: 'Severe chronic liver conditions',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Medical supervision required',
    notes: 'Ultra strength liver support'
  },
  { 
    name: 'YE7 - Yellow Essence Maximum', 
    category: 'YE Series', 
    indications: 'Maximum strength liver support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Not for children under 12',
    notes: 'Maximum strength formula'
  },
  { 
    name: 'YE8 - Yellow Essence Plus', 
    category: 'YE Series', 
    indications: 'Liver and gallbladder system support',
    defaultDosage: '15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Plus formula with enhanced gallbladder support'
  },
  { 
    name: 'YE9 - Yellow Essence Super', 
    category: 'YE Series', 
    indications: 'Super strength liver and gallbladder support',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use with caution in elderly',
    notes: 'Super strength preparation'
  },
  { 
    name: 'YE10 - Yellow Essence Supreme', 
    category: 'YE Series', 
    indications: 'Supreme strength for chronic liver diseases',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Medical supervision recommended',
    notes: 'Supreme strength liver remedy'
  },

  // WE Series (White Essence)
  { 
    name: 'WE1 - White Essence', 
    category: 'WE Series', 
    indications: 'Respiratory disorders, cough, bronchitis, asthma',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'Avoid in acute respiratory failure',
    notes: 'Primary respiratory system remedy'
  },
  { 
    name: 'WE2 - White Essence Compound', 
    category: 'WE Series', 
    indications: 'Chronic bronchitis, asthma, respiratory inflammation',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Compound formula for respiratory health'
  },
  { 
    name: 'WE3 - White Essence Forte', 
    category: 'WE Series', 
    indications: 'Severe respiratory conditions, chronic asthma',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Use with caution in severe asthma',
    notes: 'Forte strength respiratory support'
  },
  { 
    name: 'WE4 - White Essence Special', 
    category: 'WE Series', 
    indications: 'Cough, cold, respiratory congestion',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Special preparation for respiratory issues'
  },
  { 
    name: 'WE5 - White Essence Extra', 
    category: 'WE Series', 
    indications: 'Advanced respiratory diseases, chronic cough',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Avoid in acute respiratory failure',
    notes: 'Extra strength respiratory remedy'
  },
  { 
    name: 'WE6 - White Essence Ultra', 
    category: 'WE Series', 
    indications: 'Severe chronic respiratory conditions',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Medical supervision required',
    notes: 'Ultra strength respiratory support'
  },
  { 
    name: 'WE7 - White Essence Maximum', 
    category: 'WE Series', 
    indications: 'Maximum strength respiratory support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Not for children under 12',
    notes: 'Maximum strength formula'
  },
  { 
    name: 'WE8 - White Essence Plus', 
    category: 'WE Series', 
    indications: 'Respiratory system support with enhanced action',
    defaultDosage: '15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Plus formula with enhanced respiratory support'
  },
  { 
    name: 'WE9 - White Essence Super', 
    category: 'WE Series', 
    indications: 'Super strength respiratory remedy',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use with caution in elderly',
    notes: 'Super strength preparation'
  },
  { 
    name: 'WE10 - White Essence Supreme', 
    category: 'WE Series', 
    indications: 'Supreme strength for chronic respiratory diseases',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Medical supervision recommended',
    notes: 'Supreme strength respiratory remedy'
  },

  // RE Series (Red Essence)
  { 
    name: 'RE1 - Red Essence', 
    category: 'RE Series', 
    indications: 'Blood disorders, anemia, circulation problems, heart conditions',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'Avoid in acute cardiac conditions',
    notes: 'Primary cardiovascular and blood remedy'
  },
  { 
    name: 'RE2 - Red Essence Compound', 
    category: 'RE Series', 
    indications: 'Chronic anemia, poor circulation, heart weakness',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Compound formula for cardiovascular health'
  },
  { 
    name: 'RE3 - Red Essence Forte', 
    category: 'RE Series', 
    indications: 'Severe cardiovascular conditions, chronic anemia',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Use with caution in heart disease',
    notes: 'Forte strength cardiovascular support'
  },
  { 
    name: 'RE4 - Red Essence Special', 
    category: 'RE Series', 
    indications: 'Blood purification, circulation improvement',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Special preparation for blood health'
  },
  { 
    name: 'RE5 - Red Essence Extra', 
    category: 'RE Series', 
    indications: 'Advanced cardiovascular diseases, chronic anemia',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Avoid in acute cardiac conditions',
    notes: 'Extra strength cardiovascular remedy'
  },
  { 
    name: 'RE6 - Red Essence Ultra', 
    category: 'RE Series', 
    indications: 'Severe chronic cardiovascular conditions',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Medical supervision required',
    notes: 'Ultra strength cardiovascular support'
  },
  { 
    name: 'RE7 - Red Essence Maximum', 
    category: 'RE Series', 
    indications: 'Maximum strength cardiovascular support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Not for children under 12',
    notes: 'Maximum strength formula'
  },
  { 
    name: 'RE8 - Red Essence Plus', 
    category: 'RE Series', 
    indications: 'Cardiovascular system support with enhanced action',
    defaultDosage: '15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Plus formula with enhanced cardiovascular support'
  },
  { 
    name: 'RE9 - Red Essence Super', 
    category: 'RE Series', 
    indications: 'Super strength cardiovascular remedy',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use with caution in elderly',
    notes: 'Super strength preparation'
  },
  { 
    name: 'RE10 - Red Essence Supreme', 
    category: 'RE Series', 
    indications: 'Supreme strength for chronic cardiovascular diseases',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Medical supervision recommended',
    notes: 'Supreme strength cardiovascular remedy'
  },

  // BE Series (Blue Essence)
  { 
    name: 'BE1 - Blue Essence', 
    category: 'BE Series', 
    indications: 'Nervous system disorders, anxiety, stress, neurological conditions',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'Avoid in acute neurological conditions',
    notes: 'Primary nervous system remedy'
  },
  { 
    name: 'BE2 - Blue Essence Compound', 
    category: 'BE Series', 
    indications: 'Chronic anxiety, stress, nervous disorders',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Compound formula for nervous system health'
  },
  { 
    name: 'BE3 - Blue Essence Forte', 
    category: 'BE Series', 
    indications: 'Severe nervous conditions, chronic anxiety',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Use with caution in severe neurological conditions',
    notes: 'Forte strength nervous system support'
  },
  { 
    name: 'BE4 - Blue Essence Special', 
    category: 'BE Series', 
    indications: 'Nervous tension, stress relief, anxiety',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Special preparation for nervous system issues'
  },
  { 
    name: 'BE5 - Blue Essence Extra', 
    category: 'BE Series', 
    indications: 'Advanced nervous system diseases, chronic stress',
    defaultDosage: '15-20 drops, 3 times daily',
    contraIndications: 'Avoid in acute neurological conditions',
    notes: 'Extra strength nervous system remedy'
  },
  { 
    name: 'BE6 - Blue Essence Ultra', 
    category: 'BE Series', 
    indications: 'Severe chronic nervous system conditions',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Medical supervision required',
    notes: 'Ultra strength nervous system support'
  },
  { 
    name: 'BE7 - Blue Essence Maximum', 
    category: 'BE Series', 
    indications: 'Maximum strength nervous system support',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Not for children under 12',
    notes: 'Maximum strength formula'
  },
  { 
    name: 'BE8 - Blue Essence Plus', 
    category: 'BE Series', 
    indications: 'Nervous system support with enhanced action',
    defaultDosage: '15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Plus formula with enhanced nervous system support'
  },
  { 
    name: 'BE9 - Blue Essence Super', 
    category: 'BE Series', 
    indications: 'Super strength nervous system remedy',
    defaultDosage: '20 drops, 3 times daily',
    contraIndications: 'Use with caution in elderly',
    notes: 'Super strength preparation'
  },
  { 
    name: 'BE10 - Blue Essence Supreme', 
    category: 'BE Series', 
    indications: 'Supreme strength for chronic nervous system diseases',
    defaultDosage: '20-25 drops, 3 times daily',
    contraIndications: 'Medical supervision recommended',
    notes: 'Supreme strength nervous system remedy'
  },

  // Spagyric Essence
  { 
    name: 'Spagyric Essence - Respiratory', 
    category: 'Spagyric Essence', 
    indications: 'Respiratory system disorders, cough, cold, bronchitis',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Spagyric preparation for respiratory health'
  },
  { 
    name: 'Spagyric Essence - Digestive', 
    category: 'Spagyric Essence', 
    indications: 'Digestive system disorders, indigestion, gastritis',
    defaultDosage: '10-15 drops, 3 times daily before meals',
    contraIndications: 'Avoid in acute gastric ulcers',
    notes: 'Spagyric preparation for digestive health'
  },
  { 
    name: 'Spagyric Essence - Liver', 
    category: 'Spagyric Essence', 
    indications: 'Liver disorders, jaundice, hepatitis, gallbladder issues',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'Avoid in acute liver failure',
    notes: 'Spagyric preparation for liver health'
  },
  { 
    name: 'Spagyric Essence - Cardiovascular', 
    category: 'Spagyric Essence', 
    indications: 'Heart conditions, circulation problems, blood disorders',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'Avoid in acute cardiac conditions',
    notes: 'Spagyric preparation for cardiovascular health'
  },
  { 
    name: 'Spagyric Essence - Nervous', 
    category: 'Spagyric Essence', 
    indications: 'Nervous system disorders, anxiety, stress, neurological conditions',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Spagyric preparation for nervous system health'
  },
  { 
    name: 'Spagyric Essence - Immune', 
    category: 'Spagyric Essence', 
    indications: 'Immune system support, infections, general weakness',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Spagyric preparation for immune system support'
  },

  // Electricities
  { 
    name: 'Electricity - Positive', 
    category: 'Electricities', 
    indications: 'Energy boost, vitality, general weakness, fatigue',
    defaultDosage: '10-15 drops, 2 times daily',
    contraIndications: 'None known',
    notes: 'Positive electrical energy for vitality'
  },
  { 
    name: 'Electricity - Negative', 
    category: 'Electricities', 
    indications: 'Inflammation reduction, pain relief, calming effect',
    defaultDosage: '10-15 drops, 2 times daily',
    contraIndications: 'None known',
    notes: 'Negative electrical energy for inflammation'
  },
  { 
    name: 'Electricity - Neutral', 
    category: 'Electricities', 
    indications: 'Balance restoration, homeostasis, general health',
    defaultDosage: '10-15 drops, 2 times daily',
    contraIndications: 'None known',
    notes: 'Neutral electrical energy for balance'
  },
  { 
    name: 'Electricity - Combined', 
    category: 'Electricities', 
    indications: 'Comprehensive energy support, overall health',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Combined electrical energy formula'
  },

  // Combination Remedies
  { 
    name: 'Respiratory-Digestive Combination', 
    category: 'Combination Remedies', 
    indications: 'Combined respiratory and digestive disorders',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Combination remedy for respiratory and digestive systems'
  },
  { 
    name: 'Liver-Heart Combination', 
    category: 'Combination Remedies', 
    indications: 'Combined liver and cardiovascular disorders',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'Avoid in acute cardiac or liver conditions',
    notes: 'Combination remedy for liver and heart health'
  },
  { 
    name: 'Nervous-Digestive Combination', 
    category: 'Combination Remedies', 
    indications: 'Combined nervous and digestive system disorders',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'None known',
    notes: 'Combination remedy for nervous and digestive systems'
  },
  { 
    name: 'Complete System Tonic', 
    category: 'Combination Remedies', 
    indications: 'General health, overall system support, vitality',
    defaultDosage: '10-15 drops, 2 times daily',
    contraIndications: 'None known',
    notes: 'Complete system tonic for overall health'
  },
  { 
    name: 'Detoxification Combination', 
    category: 'Combination Remedies', 
    indications: 'Body detoxification, liver and kidney support',
    defaultDosage: '10-15 drops, 3 times daily',
    contraIndications: 'Avoid in acute kidney or liver failure',
    notes: 'Combination remedy for detoxification'
  },

  // External Applications
  { 
    name: 'External Application - Pain Relief', 
    category: 'External Applications', 
    indications: 'Muscle pain, joint pain, inflammation, external application',
    defaultDosage: 'Apply externally 2-3 times daily',
    contraIndications: 'Avoid on broken skin',
    notes: 'External application for pain relief'
  },
  { 
    name: 'External Application - Skin Care', 
    category: 'External Applications', 
    indications: 'Skin disorders, rashes, eczema, external application',
    defaultDosage: 'Apply externally 2-3 times daily',
    contraIndications: 'Avoid on open wounds',
    notes: 'External application for skin health'
  },
  { 
    name: 'External Application - Wound Healing', 
    category: 'External Applications', 
    indications: 'Wound healing, cuts, bruises, external application',
    defaultDosage: 'Apply externally 2-3 times daily',
    contraIndications: 'None known',
    notes: 'External application for wound healing'
  },
  { 
    name: 'External Application - Anti-Inflammatory', 
    category: 'External Applications', 
    indications: 'Inflammation, swelling, redness, external application',
    defaultDosage: 'Apply externally 2-3 times daily',
    contraIndications: 'Avoid on broken skin',
    notes: 'External application for anti-inflammatory action'
  },
];

const seedMedicines = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/electromed';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if medicines already exist
    const existingCount = await Medicine.countDocuments({ isGlobal: true });
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing global medicines. Skipping seed.`);
      console.log('💡 To re-seed, delete existing global medicines first.');
      await mongoose.disconnect();
      return;
    }

    // Insert medicines
    const medicines = electroHomeopathyMedicines.map(medicine => ({
      ...medicine,
      isGlobal: true,
      doctorId: undefined,
    }));

    const result = await Medicine.insertMany(medicines);
    console.log(`✅ Successfully seeded ${result.length} global medicines`);

    // Display summary by category
    const categoryCounts = electroHomeopathyMedicines.reduce((acc, medicine) => {
      acc[medicine.category] = (acc[medicine.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Medicines by Category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding medicines:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedMedicines();

