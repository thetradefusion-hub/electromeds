import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { symptomApi, Symptom, SymptomFormData } from '@/lib/api/symptom.api';

// Map backend Symptom to frontend format
const mapSymptom = (sym: Symptom) => ({
  id: sym._id,
  name: sym.name,
  category: sym.category,
  description: sym.description || null,
  is_global: sym.isGlobal,
  doctor_id: sym.doctorId || null,
  created_at: sym.createdAt,
});

export type { SymptomFormData };

export interface Symptom {
  id: string;
  name: string;
  category: string;
  description: string | null;
  is_global: boolean;
  doctor_id: string | null;
  created_at: string;
}

export const useSymptoms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch symptoms
  const { data: symptoms = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['symptoms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const response = await symptomApi.getSymptoms();
        if (response.success && response.data) {
          return response.data.map(mapSymptom);
        }
        return [];
      } catch (error) {
        console.error('Error fetching symptoms:', error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Create symptom
  const createMutation = useMutation({
    mutationFn: async (formData: SymptomFormData) => {
      const response = await symptomApi.createSymptom({
        ...formData,
        isGlobal: false,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to create symptom');
      }
      return mapSymptom(response.data!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast.success('Symptom added successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to add symptom: ' + (error.response?.data?.message || error.message));
    },
  });

  // Update symptom
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: SymptomFormData & { id: string }) => {
      const response = await symptomApi.updateSymptom(id, formData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update symptom');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast.success('Symptom updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update symptom: ' + (error.response?.data?.message || error.message));
    },
  });

  // Delete symptom
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await symptomApi.deleteSymptom(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete symptom');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast.success('Symptom deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete symptom: ' + (error.response?.data?.message || error.message));
    },
  });

  // Get unique categories
  const categories = [...new Set(symptoms.map((s) => s.category))].sort();

  return {
    symptoms,
    loading,
    categories,
    createSymptom: createMutation.mutate,
    updateSymptom: updateMutation.mutate,
    deleteSymptom: deleteMutation.mutate,
    refetch,
  };
};