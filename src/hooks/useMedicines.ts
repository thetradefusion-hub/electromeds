import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicineApi, Medicine, MedicineFormData } from '@/lib/api/medicine.api';

// Map backend Medicine to frontend format
const mapMedicine = (med: Medicine) => ({
  id: med._id,
  name: med.name,
  category: med.category,
  indications: med.indications || null,
  default_dosage: med.defaultDosage || null,
  contra_indications: med.contraIndications || null,
  notes: med.notes || null,
  is_global: med.isGlobal,
  doctor_id: med.doctorId || null,
  created_at: med.createdAt,
});

export type { MedicineFormData };

export interface Medicine {
  id: string;
  name: string;
  category: string;
  indications: string | null;
  default_dosage: string | null;
  contra_indications: string | null;
  notes: string | null;
  is_global: boolean;
  doctor_id: string | null;
  created_at: string;
}

export const useMedicines = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch medicines
  const { data: medicines = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['medicines', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const response = await medicineApi.getMedicines();
        if (response.success && response.data) {
          return response.data.map(mapMedicine);
        }
        return [];
      } catch (error) {
        console.error('Error fetching medicines:', error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Create medicine
  const createMutation = useMutation({
    mutationFn: async (formData: MedicineFormData) => {
      const response = await medicineApi.createMedicine({
        ...formData,
        isGlobal: false,
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to create medicine');
      }
      return mapMedicine(response.data!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      toast.success('Medicine added successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to add medicine: ' + (error.response?.data?.message || error.message));
    },
  });

  // Update medicine
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...formData }: MedicineFormData & { id: string }) => {
      const response = await medicineApi.updateMedicine(id, formData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update medicine');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      toast.success('Medicine updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update medicine: ' + (error.response?.data?.message || error.message));
    },
  });

  // Delete medicine
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await medicineApi.deleteMedicine(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete medicine');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      toast.success('Medicine deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete medicine: ' + (error.response?.data?.message || error.message));
    },
  });

  // Get unique categories
  const categories = [...new Set(medicines.map((m) => m.category))].sort();

  return {
    medicines,
    loading,
    categories,
    createMedicine: createMutation.mutate,
    updateMedicine: updateMutation.mutate,
    deleteMedicine: deleteMutation.mutate,
    refetch,
  };
};