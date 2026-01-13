import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicineApi, Medicine, MedicineFormData } from '@/lib/api/medicine.api';
import { classicalHomeopathyApi, Remedy as RemedyType } from '@/lib/api/classicalHomeopathy.api';
import { doctorApi } from '@/lib/api/doctor.api';

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
  modality?: 'electro_homeopathy' | 'classical_homeopathy';
}

export interface Remedy {
  id: string;
  name: string;
  category: string;
  modality: 'classical_homeopathy';
  constitutionTraits: string[];
  modalities: {
    better: string[];
    worse: string[];
  };
  clinicalIndications: string[];
  supportedPotencies: string[];
  indications: string | null;
  defaultDosage: string | null;
  contraIndications: string | null;
  notes: string | null;
  is_global: boolean;
  doctor_id: string | null;
  created_at: string;
}

// Map backend Remedy to frontend format
const mapRemedy = (rem: RemedyType): Remedy => ({
  id: rem._id,
  name: rem.name,
  category: rem.category,
  modality: rem.modality,
  constitutionTraits: rem.constitutionTraits || [],
  modalities: rem.modalities || { better: [], worse: [] },
  clinicalIndications: rem.clinicalIndications || [],
  supportedPotencies: rem.supportedPotencies || [],
  indications: rem.indications || null,
  defaultDosage: rem.defaultDosage || null,
  contraIndications: rem.contraIndications || null,
  notes: rem.notes || null,
  is_global: rem.isGlobal,
  doctor_id: rem.doctorId || null,
  created_at: rem.createdAt,
});

export const useMedicines = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch doctor modality
  const { data: doctorModality } = useQuery({
    queryKey: ['doctor-modality', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const response = await doctorApi.getMyProfile();
        if (response.success && response.data) {
          return {
            modality: response.data.doctor.modality || 'electro_homeopathy',
            preferredModality: response.data.doctor.preferredModality,
          };
        }
        return null;
      } catch (error) {
        console.error('Error fetching doctor modality:', error);
        return null;
      }
    },
    enabled: !!user,
  });

  // Determine which modality to show
  const modality = doctorModality?.modality || 'electro_homeopathy';
  const showModality = modality === 'both' 
    ? doctorModality.preferredModality || 'electro_homeopathy'
    : modality;

  // Fetch medicines (Electro Homeopathy) - fetch when not only classical
  const { data: medicines = [], isLoading: medicinesLoading } = useQuery({
    queryKey: ['medicines', user?.id, modality],
    queryFn: async () => {
      if (!user || modality === 'classical_homeopathy') return [];
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
    enabled: !!user && modality !== 'classical_homeopathy',
  });

  // Fetch remedies (Classical Homeopathy) - fetch when classical or both
  const { data: remedies = [], isLoading: remediesLoading } = useQuery({
    queryKey: ['remedies', user?.id, modality],
    queryFn: async () => {
      if (!user) return [];
      // Fetch remedies if doctor has classical_homeopathy or both modalities
      if (modality === 'electro_homeopathy') return [];
      
      try {
        console.log('[useMedicines] Fetching remedies, doctor modality:', modality);
        const response = await classicalHomeopathyApi.getRemedies();
        console.log('[useMedicines] Remedies response:', response.success, 'count:', response.data?.length || 0);
        if (response.success && response.data) {
          return response.data.map(mapRemedy);
        }
        return [];
      } catch (error) {
        console.error('[useMedicines] Error fetching remedies:', error);
        return [];
      }
    },
    enabled: !!user && (modality === 'classical_homeopathy' || modality === 'both'),
  });

  // Combine medicines and remedies for display based on actual modality (not showModality)
  const allItems = modality === 'both' 
    ? [...medicines, ...remedies]
    : modality === 'classical_homeopathy'
    ? remedies
    : medicines;

  const loading = medicinesLoading || remediesLoading;

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

  // Get unique categories from both medicines and remedies
  const categories = [...new Set([
    ...medicines.map((m) => m.category),
    ...remedies.map((r) => r.category),
  ])].sort();

  // Get doctorId for edit/delete checks
  const { data: doctorId } = useQuery({
    queryKey: ['doctor-id', user?.id],
    queryFn: async () => {
      if (!user || user.role !== 'doctor') return null;
      try {
        const response = await doctorApi.getMyProfile();
        if (response.success && response.data) {
          return response.data.doctor.id;
        }
        return null;
      } catch (error) {
        console.error('Error fetching doctor ID:', error);
        return null;
      }
    },
    enabled: !!user && user.role === 'doctor',
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['medicines'] });
    queryClient.invalidateQueries({ queryKey: ['remedies'] });
    queryClient.invalidateQueries({ queryKey: ['doctor-modality'] });
  };

  return {
    medicines: allItems,
    remedies,
    loading,
    categories,
    showModality,
    doctorModality: modality,
    createMedicine: createMutation.mutate,
    updateMedicine: updateMutation.mutate,
    deleteMedicine: deleteMutation.mutate,
    refetch,
    doctorId: doctorId || null,
  };
};