/**
 * Remedy enrichment data: category + short materia medica for remedies
 * used to fix "Unknown" category and empty descriptions in MongoDB.
 * Sources: project remediesData, Wikipedia list, standard kingdom classification.
 */

export type EnrichmentEntry = {
  category: string;
  materiaMedica: {
    keynotes: string[];
    pathogenesis: string;
    clinicalNotes: string;
  };
};

// Normalize remedy name for lookup: lowercase, trim, collapse spaces
export function normalizeRemedyName(name: string): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Full data (category + description) – from POLYCHREST and common remedies
const FULL_ENTRIES: Record<string, EnrichmentEntry> = {
  'aconitum napellus': {
    category: 'Plant Kingdom',
    materiaMedica: {
      keynotes: ['Sudden onset', 'High fever', 'Great fear', 'Restlessness', 'Dry heat'],
      pathogenesis: 'Acts on nervous system, circulation, and serous membranes. Produces sudden, violent symptoms.',
      clinicalNotes: 'First remedy in acute conditions. Fear of death. Dry, burning heat.',
    },
  },
  'arnica montana': {
    category: 'Plant Kingdom',
    materiaMedica: {
      keynotes: ['Bruised feeling', 'Soreness', 'Shock', 'Aversion to touch'],
      pathogenesis: 'Acts on muscles, blood vessels, and nervous system. Prevents hemorrhage.',
      clinicalNotes: 'First remedy for injuries and trauma. "Says he is well" when very ill.',
    },
  },
  belladonna: {
    category: 'Plant Kingdom',
    materiaMedica: {
      keynotes: ['Sudden violent symptoms', 'Red face', 'Throbbing', 'Pupils dilated', 'Dry mouth'],
      pathogenesis: 'Acts on nervous system and circulation. Produces violent, inflammatory symptoms.',
      clinicalNotes: 'For sudden, violent, inflammatory conditions. Right-sided symptoms.',
    },
  },
  chamomilla: {
    category: 'Plant Kingdom',
    materiaMedica: {
      keynotes: ['Extreme irritability', 'Sensitive to pain', 'One cheek red', 'Anger'],
      pathogenesis: 'Acts on nervous system and digestive organs. Produces extreme irritability.',
      clinicalNotes: 'For irritable, sensitive patients. Cannot bear to be touched or looked at.',
    },
  },
  pulsatilla: {
    category: 'Plant Kingdom',
    materiaMedica: {
      keynotes: ['Changeable', 'Mild', 'Weepy', 'No thirst', 'Yellow discharge'],
      pathogenesis: 'Acts on mucous membranes and nervous system. Produces changeable symptoms.',
      clinicalNotes: 'For mild, changeable, weepy patients. Better with consolation.',
    },
  },
  'nux vomica': {
    category: 'Plant Kingdom',
    materiaMedica: {
      keynotes: ['Irritability', 'Impatient', 'Overwork', 'Constipation', 'Morning aggravation'],
      pathogenesis: 'Acts on digestive and nervous systems. Suits overworked, ambitious individuals.',
      clinicalNotes: 'For stress, digestive upsets, and sensitivity to stimulants.',
    },
  },
  'arsenicum album': {
    category: 'Mineral Kingdom',
    materiaMedica: {
      keynotes: ['Anxiety', 'Restlessness', 'Burning pains', 'Thirst for sips', 'Fastidious'],
      pathogenesis: 'Acts on digestive tract, circulation, and nervous system. Great exhaustion with restlessness.',
      clinicalNotes: 'For anxious, perfectionist patients. Burning pains relieved by heat.',
    },
  },
  'lycopodium clavatum': {
    category: 'Plant Kingdom',
    materiaMedica: {
      keynotes: ['Lack of confidence', 'Right-sided', 'Bloating', 'Worse 4–8 pm', 'Anticipatory anxiety'],
      pathogenesis: 'Acts on digestive organs, urinary system, and mind. Suits intellectual types.',
      clinicalNotes: 'For digestive and urinary complaints. Fear of failure, bossy at home.',
    },
  },
  'phosphorus': {
    category: 'Mineral Kingdom',
    materiaMedica: {
      keynotes: ['Fear of being alone', 'Sympathetic', 'Bleeding', 'Burning between shoulder blades'],
      pathogenesis: 'Acts on nerves, blood, and bones. Tall, open, sympathetic personality.',
      clinicalNotes: 'For bleeding tendencies, respiratory and digestive symptoms. Desires company.',
    },
  },
  'sulphur': {
    category: 'Mineral Kingdom',
    materiaMedica: {
      keynotes: ['Philosophical', 'Untidy', 'Burning feet', 'Hot', 'Skin complaints'],
      pathogenesis: 'Acts on skin, digestion, and circulation. The "ragged philosopher" type.',
      clinicalNotes: 'For chronic skin and digestive disorders. Worse from bathing and warmth.',
    },
  },
  'calcarea carbonica': {
    category: 'Mineral Kingdom',
    materiaMedica: {
      keynotes: ['Fatigue', 'Sweaty head', 'Fear of heights', 'Chilly', 'Desires eggs'],
      pathogenesis: 'From oyster shell. Suits slow, steady, security-seeking constitution.',
      clinicalNotes: 'For anxiety, fatigue, and growth issues. Worse from exertion and cold.',
    },
  },
  'lachesis muta': {
    category: 'Animal Kingdom',
    materiaMedica: {
      keynotes: ['Jealousy', 'Left-sided', 'Worse after sleep', 'Loquacious', 'Menopausal'],
      pathogenesis: 'From bushmaster snake venom. Acts on circulation and mind.',
      clinicalNotes: 'For circulatory and hormonal symptoms. Cannot tolerate tight clothing.',
    },
  },
  'apis mellifica': {
    category: 'Animal Kingdom',
    materiaMedica: {
      keynotes: ['Swelling', 'Stinging pain', 'Better cold', 'Jealousy', 'Restlessness'],
      pathogenesis: 'From honeybee. Acts on skin, kidneys, and mucous membranes.',
      clinicalNotes: 'For allergic swelling, urinary and skin conditions. Better from cold applications.',
    },
  },
  'sepia': {
    category: 'Animal Kingdom',
    materiaMedica: {
      keynotes: ['Indifferent', 'Worse morning', 'Bearing-down', 'Yellow saddle', 'Irritability'],
      pathogenesis: 'From cuttlefish ink. Acts on circulation, skin, and female organs.',
      clinicalNotes: 'For hormonal and venous symptoms. Feeling of dragging down.',
    },
  },
  'natrum muriaticum': {
    category: 'Mineral Kingdom',
    materiaMedica: {
      keynotes: ['Reserved', 'Grief', 'Desires salt', 'Worse sun', 'Dry skin'],
      pathogenesis: 'Common salt. Suits reserved, responsible individuals who hold grief.',
      clinicalNotes: 'For emotional suppression, headaches, and skin conditions. Worse 10–11 am.',
    },
  },
  'silicea': {
    category: 'Mineral Kingdom',
    materiaMedica: {
      keynotes: ['Lack of confidence', 'Chilly', 'Stubborn', 'Sweaty feet', 'Slow healing'],
      pathogenesis: 'Silica. Suits refined, chilly, stubborn constitution.',
      clinicalNotes: 'For recurrent infections and slow-healing wounds. Aids expulsion of foreign bodies.',
    },
  },
};

// Category-only mapping (name -> kingdom) for many more remedies – at least fix "Unknown"
// Names normalized to lowercase; add variants as needed
const CATEGORY_ONLY: Record<string, string> = {
  // Plant
  aconite: 'Plant Kingdom',
  aconitum: 'Plant Kingdom',
  aesculus: 'Plant Kingdom',
  'allium cepa': 'Plant Kingdom',
  aloe: 'Plant Kingdom',
  apocynum: 'Plant Kingdom',
  argentinum: 'Plant Kingdom',
  baptisia: 'Plant Kingdom',
  'bellis perennis': 'Plant Kingdom',
  bryonia: 'Plant Kingdom',
  calendula: 'Plant Kingdom',
  cantharis: 'Plant Kingdom',
  'carbo vegetabilis': 'Plant Kingdom',
  caulophyllum: 'Plant Kingdom',
  cimicifuga: 'Plant Kingdom',
  colocynthis: 'Plant Kingdom',
  digitalis: 'Plant Kingdom',
  drosera: 'Plant Kingdom',
  dulcamara: 'Plant Kingdom',
  eupatorium: 'Plant Kingdom',
  gelsemium: 'Plant Kingdom',
  hamamelis: 'Plant Kingdom',
  'hepar sulph': 'Mineral Kingdom',
  'hepar sulphuris': 'Mineral Kingdom',
  ignatia: 'Plant Kingdom',
  ipecacuanha: 'Plant Kingdom',
  ledum: 'Plant Kingdom',
  lycopodium: 'Plant Kingdom',
  'merc sol': 'Mineral Kingdom',
  mercurius: 'Mineral Kingdom',
  'nux vomica': 'Plant Kingdom',
  phytolacca: 'Plant Kingdom',
  'rhus tox': 'Plant Kingdom',
  'rhus toxicodendron': 'Plant Kingdom',
  rumex: 'Plant Kingdom',
  staphysagria: 'Plant Kingdom',
  thuja: 'Plant Kingdom',
  'urtica urens': 'Plant Kingdom',
  veratrum: 'Plant Kingdom',
  // Mineral
  alumina: 'Mineral Kingdom',
  antimonium: 'Mineral Kingdom',
  argentum: 'Mineral Kingdom',
  arsenicum: 'Mineral Kingdom',
  aurum: 'Mineral Kingdom',
  baryta: 'Mineral Kingdom',
  calcarea: 'Mineral Kingdom',
  'carbo animalis': 'Animal Kingdom',
  causticum: 'Mineral Kingdom',
  conium: 'Plant Kingdom',
  cuprum: 'Mineral Kingdom',
  ferrum: 'Mineral Kingdom',
  graphites: 'Mineral Kingdom',
  kali: 'Mineral Kingdom',
  'lac caninum': 'Animal Kingdom',
  lachesis: 'Animal Kingdom',
  magnesium: 'Mineral Kingdom',
  mangum: 'Mineral Kingdom',
  natrum: 'Mineral Kingdom',
  nitricum: 'Mineral Kingdom',
  phosphoricum: 'Mineral Kingdom',
  phosphorus: 'Mineral Kingdom',
  platina: 'Mineral Kingdom',
  plumbum: 'Mineral Kingdom',
  sabadilla: 'Plant Kingdom',
  secale: 'Plant Kingdom',
  silicea: 'Mineral Kingdom',
  stannum: 'Mineral Kingdom',
  stramonium: 'Plant Kingdom',
  sulphur: 'Mineral Kingdom',
  sulphuricum: 'Mineral Kingdom',
  zincum: 'Mineral Kingdom',
  // Animal
  apis: 'Animal Kingdom',
  bufo: 'Animal Kingdom',
  crotalus: 'Animal Kingdom',
  formica: 'Animal Kingdom',
  'lac humanum': 'Animal Kingdom',
  naja: 'Animal Kingdom',
  sepia: 'Animal Kingdom',
  tarentula: 'Animal Kingdom',
  vipera: 'Animal Kingdom',
};

const DEFAULT_DESCRIPTION = (category: string) =>
  `Classical homeopathic remedy from the ${category}. Keynotes and clinical use are found in standard Materia Medica.`;

/**
 * Get enrichment for a remedy by name. Tries exact normalized match first, then prefix match.
 */
export function getEnrichmentForRemedy(name: string): EnrichmentEntry | null {
  const norm = normalizeRemedyName(name);
  if (!norm) return null;

  // Exact match in full entries
  if (FULL_ENTRIES[norm]) return FULL_ENTRIES[norm];

  // Exact match in category-only
  if (CATEGORY_ONLY[norm]) {
    const category = CATEGORY_ONLY[norm];
    return {
      category,
      materiaMedica: {
        keynotes: [],
        pathogenesis: DEFAULT_DESCRIPTION(category),
        clinicalNotes: 'Consider consulting a full Materia Medica for keynotes and indications.',
      },
    };
  }

  // Prefix / contains match for compound names (e.g. "Arsenicum album" -> arsenicum)
  for (const key of Object.keys(FULL_ENTRIES)) {
    if (norm.startsWith(key) || norm.includes(key)) return FULL_ENTRIES[key];
  }
  for (const key of Object.keys(CATEGORY_ONLY)) {
    if (norm.startsWith(key) || norm.includes(key)) {
      const category = CATEGORY_ONLY[key];
      return {
        category,
        materiaMedica: {
          keynotes: [],
          pathogenesis: DEFAULT_DESCRIPTION(category),
          clinicalNotes: 'Consider consulting a full Materia Medica for keynotes and indications.',
        },
      };
    }
  }

  // Heuristics by name pattern (common Latin roots)
  if (/\b(arsenicum|natrum|kali|phosphor|calcarea|silicea|ferrum|argentum|aurum|plumbum|cuprum|zincum|alumina|baryta|magnes|graphites|nitricum)\b/.test(norm)) {
    return {
      category: 'Mineral Kingdom',
      materiaMedica: {
        keynotes: [],
        pathogenesis: DEFAULT_DESCRIPTION('Mineral Kingdom'),
        clinicalNotes: 'Consider consulting a full Materia Medica for keynotes and indications.',
      },
    };
  }
  if (/\b(lachesis|apis|naja|crotalus|vipera|sepia|tarentula|formica|bufo|lac\s)/.test(norm)) {
    return {
      category: 'Animal Kingdom',
      materiaMedica: {
        keynotes: [],
        pathogenesis: DEFAULT_DESCRIPTION('Animal Kingdom'),
        clinicalNotes: 'Consider consulting a full Materia Medica for keynotes and indications.',
      },
    };
  }
  if (/\b(aconitum|belladonna|arnica|pulsatilla|nux\s*vomica|bryonia|rhus|gelsemium|lycopodium|chamomilla|thuja|ignatia)\b/.test(norm)) {
    return {
      category: 'Plant Kingdom',
      materiaMedica: {
        keynotes: [],
        pathogenesis: DEFAULT_DESCRIPTION('Plant Kingdom'),
        clinicalNotes: 'Consider consulting a full Materia Medica for keynotes and indications.',
      },
    };
  }

  return null;
}
