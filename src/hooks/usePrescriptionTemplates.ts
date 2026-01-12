import { useState, useEffect } from 'react';
import { prescriptionTemplateApi, PrescriptionTemplate, CreateTemplateData } from '@/lib/api/prescriptionTemplate.api';
import { useAuth } from '@/hooks/useAuth';
import { useDoctor } from '@/hooks/useDoctor';
import { toast } from 'sonner';

export interface PrescriptionTemplate {
  id: string;
  doctor_id: string;
  name: string;
  description: string | null;
  symptoms: Array<{
    id: string;
    name: string;
    severity: 'low' | 'medium' | 'high';
    duration: number;
    durationUnit: 'days' | 'weeks' | 'months';
  }>;
  medicines: Array<{
    id: string;
    name: string;
    category: string;
    dosage: string;
    duration: string;
    instructions: string;
  }>;
  diagnosis: string | null;
  advice: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  symptoms: PrescriptionTemplate['symptoms'];
  medicines: PrescriptionTemplate['medicines'];
  diagnosis?: string;
  advice?: string;
}

export function usePrescriptionTemplates() {
  const { doctorId } = useDoctor();
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await prescriptionTemplateApi.getPrescriptionTemplates();
        
        if (response.success && response.data) {
          // Map backend format to frontend format
          const mapped = response.data.map(t => ({
            id: t._id,
            doctor_id: typeof t.doctorId === 'string' ? t.doctorId : t.doctorId,
            name: t.name,
            description: t.description || null,
            symptoms: t.symptoms.map(s => ({
              id: s.symptomId,
              name: s.name,
              severity: s.severity,
              duration: s.duration,
              durationUnit: s.durationUnit,
            })),
            medicines: t.medicines.map(m => ({
              id: m.medicineId,
              name: m.name,
              category: m.category,
              dosage: m.dosage,
              duration: m.duration,
              instructions: m.instructions || '',
            })),
            diagnosis: t.diagnosis || null,
            advice: t.advice || null,
            created_at: t.createdAt,
            updated_at: t.updatedAt,
          }));
          
          setTemplates(mapped.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          toast.error('Failed to load templates');
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const createTemplate = async (data: CreateTemplateData): Promise<PrescriptionTemplate | null> => {
    if (!doctorId) {
      toast.error('Doctor profile not found');
      return null;
    }

    try {
      const response = await prescriptionTemplateApi.createPrescriptionTemplate({
        name: data.name,
        description: data.description,
        symptoms: data.symptoms.map(s => ({
          symptomId: s.id,
          name: s.name,
          severity: s.severity,
          duration: s.duration,
          durationUnit: s.durationUnit,
        })),
        medicines: data.medicines.map(m => ({
          medicineId: m.id,
          name: m.name,
          category: m.category,
          dosage: m.dosage,
          duration: m.duration,
          instructions: m.instructions,
        })),
        diagnosis: data.diagnosis,
        advice: data.advice,
      });

      if (response.success && response.data) {
        const template = response.data;
        const mapped: PrescriptionTemplate = {
          id: template._id,
          doctor_id: typeof template.doctorId === 'string' ? template.doctorId : template.doctorId,
          name: template.name,
          description: template.description || null,
          symptoms: template.symptoms.map(s => ({
            id: s.symptomId,
            name: s.name,
            severity: s.severity,
            duration: s.duration,
            durationUnit: s.durationUnit,
          })),
          medicines: template.medicines.map(m => ({
            id: m.medicineId,
            name: m.name,
            category: m.category,
            dosage: m.dosage,
            duration: m.duration,
            instructions: m.instructions || '',
          })),
          diagnosis: template.diagnosis || null,
          advice: template.advice || null,
          created_at: template.createdAt,
          updated_at: template.updatedAt,
        };

        setTemplates(prev => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Template saved successfully');
        return mapped;
      } else {
        toast.error('Failed to save template');
        return null;
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to save template');
      return null;
    }
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const response = await prescriptionTemplateApi.deletePrescriptionTemplate(id);
      
      if (response.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast.success('Template deleted');
        return true;
      } else {
        toast.error('Failed to delete template');
        return false;
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
      return false;
    }
  };

  return {
    templates,
    loading,
    doctorId,
    createTemplate,
    deleteTemplate,
  };
}
