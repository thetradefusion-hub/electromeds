import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MedicineRule {
  id: string;
  name: string;
  description: string | null;
  symptom_ids: string[];
  medicine_ids: string[];
  dosage: string;
  duration: string;
  priority: number;
}

interface Medicine {
  id: string;
  name: string;
  category: string;
  indications: string | null;
  default_dosage: string | null;
}

interface SuggestedMedicine {
  medicine: Medicine;
  dosage: string;
  duration: string;
  matchedRule: MedicineRule;
  matchScore: number;
}

export const useMedicineSuggestions = (selectedSymptomIds: string[]) => {
  const { data: rules } = useQuery({
    queryKey: ['medicine-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicine_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as MedicineRule[];
    },
  });

  const { data: medicines } = useQuery({
    queryKey: ['all-medicines-for-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medicines')
        .select('id, name, category, indications, default_dosage');

      if (error) throw error;
      return data as Medicine[];
    },
  });

  const getSuggestions = (): SuggestedMedicine[] => {
    if (!rules || !medicines || selectedSymptomIds.length === 0) {
      return [];
    }

    const suggestions: SuggestedMedicine[] = [];
    const addedMedicineIds = new Set<string>();

    // Sort rules by priority (highest first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      // Calculate how many of the rule's symptoms match
      const matchingSymptoms = rule.symptom_ids.filter((id) =>
        selectedSymptomIds.includes(id)
      );

      // Rule triggers if at least one symptom matches
      if (matchingSymptoms.length > 0) {
        const matchScore = matchingSymptoms.length / rule.symptom_ids.length;

        for (const medicineId of rule.medicine_ids) {
          // Don't add duplicate medicines
          if (addedMedicineIds.has(medicineId)) continue;

          const medicine = medicines.find((m) => m.id === medicineId);
          if (medicine) {
            suggestions.push({
              medicine,
              dosage: rule.dosage,
              duration: rule.duration,
              matchedRule: rule,
              matchScore,
            });
            addedMedicineIds.add(medicineId);
          }
        }
      }
    }

    // Sort by match score and priority
    return suggestions.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return b.matchedRule.priority - a.matchedRule.priority;
    });
  };

  return {
    suggestions: getSuggestions(),
    isLoading: !rules || !medicines,
  };
};
