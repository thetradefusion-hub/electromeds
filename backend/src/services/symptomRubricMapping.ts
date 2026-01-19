/**
 * Symptom to Rubric Text Mapping
 * 
 * Maps common English symptoms to German rubric text patterns
 * This is a workaround for OOREP data which has German rubrics
 */

/**
 * English to German Symptom-Rubric Mapping
 * 
 * OOREP SQL file me sirf German rubrics (kent-de) hain, English (kent) nahi.
 * Isliye English symptoms ko German rubric text se match karne ke liye mapping chahiye.
 */
export const symptomRubricMapping: Record<string, string[]> = {
  // Thirst related
  'thirst': ['Durst', 'durst'],
  'no thirst': ['Durst', 'kein', 'durstlos'],
  'no': ['kein'],
  'excessive thirst': ['Durst', 'groß', 'viel'],
  
  // Cold related
  'cold': ['Kälte', 'kalt', 'Kältegefühl'],
  'cold intolerance': ['Kälte', 'kalt', 'empfindlich'],
  'cold sensation': ['Kälte', 'Kältegefühl'],
  'intolerance': ['empfindlich'],
  
  // Heat related
  'heat': ['Hitze', 'heiß', 'Wärme'],
  'heat intolerance': ['Hitze', 'heiß', 'empfindlich'],
  'warm': ['warm', 'Wärme'],
  
  // Pain related
  'pain': ['Schmerz', 'schmerz'],
  'headache': ['Kopf', 'Kopfschmerz'],
  'back pain': ['Rücken', 'Rückenschmerz'],
  'throat pain': ['Hals', 'Halsschmerz'],
  'chest pain': ['Brust', 'Brustschmerz'],
  'stomach pain': ['Bauch', 'Magen'],
  'joint pain': ['Gelenk', 'Gelenkschmerz'],
  
  // Mental symptoms
  'anxiety': ['Angst', 'Besorgnis', 'Bangigkeit'],
  'fear': ['Furcht', 'Angst'],
  'irritability': ['Reizbarkeit', 'Reizbar'],
  'restlessness': ['Unruhe', 'ruhelos'],
  'depression': ['Depression', 'Traurigkeit'],
  'anger': ['Wut', 'Zorn'],
  'confusion': ['Verwirrung', 'verwirrt'],
  'memory loss': ['Gedächtnis', 'vergesslich'],
  
  // General symptoms
  'fever': ['Fieber'],
  'weakness': ['Schwäche', 'schwach'],
  'fatigue': ['Müdigkeit', 'müde'],
  'sweating': ['Schweiß', 'schwitzen'],
  'sleep': ['Schlaf', 'schlafen'],
  'appetite': ['Appetit'],
  'nausea': ['Übelkeit'],
  'vomiting': ['Erbrechen'],
  'diarrhea': ['Durchfall', 'Diarrhoe'],
  'constipation': ['Verstopfung'],
  
  // Modalities
  'motion': ['Bewegung', 'bewegt'],
  'worse from motion': ['Bewegung', 'bewegt', 'schlechter'],
  'better from rest': ['Ruhe', 'ruhend', 'besser'],
  'rest': ['Ruhe', 'ruhend'],
  'night': ['Nacht', 'nachts'],
  'morning': ['Morgen', 'morgens'],
  'evening': ['Abend', 'abends'],
  'worse': ['schlechter', 'verschlimmert'],
  'better': ['besser'],
  
  // Body parts
  'head': ['Kopf'],
  'chest': ['Brust'],
  'stomach': ['Bauch', 'Magen'],
  'throat': ['Hals'],
  'back': ['Rücken'],
  'abdomen': ['Bauch'],
};

/**
 * Get German rubric search terms for an English symptom
 */
export function getRubricSearchTerms(symptomText: string): string[] {
  const lowerText = symptomText.toLowerCase();
  const searchTerms: string[] = [];
  
  // Check direct mapping
  if (symptomRubricMapping[lowerText]) {
    searchTerms.push(...symptomRubricMapping[lowerText]);
  }
  
  // Check word-by-word mapping
  const words = lowerText.split(/\s+/);
  words.forEach(word => {
    if (symptomRubricMapping[word]) {
      searchTerms.push(...symptomRubricMapping[word]);
    }
  });
  
  // Also include original symptom text (in case there are English rubrics)
  searchTerms.push(lowerText);
  
  return [...new Set(searchTerms)]; // Remove duplicates
}
