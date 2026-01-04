import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

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
  const { user } = useAuth();
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setDoctorId(data.id);
      }
    };
    
    fetchDoctorId();
  }, [user?.id]);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!doctorId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('prescription_templates')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } else {
        const parsed = data?.map(t => ({
          ...t,
          symptoms: Array.isArray(t.symptoms) ? t.symptoms : [],
          medicines: Array.isArray(t.medicines) ? t.medicines : [],
        })) as PrescriptionTemplate[];
        setTemplates(parsed || []);
      }
      setLoading(false);
    };

    fetchTemplates();
  }, [doctorId]);

  const createTemplate = async (data: CreateTemplateData): Promise<PrescriptionTemplate | null> => {
    if (!doctorId) {
      toast.error('Doctor profile not found');
      return null;
    }

    const insertData = {
      doctor_id: doctorId,
      name: data.name,
      description: data.description || null,
      symptoms: JSON.parse(JSON.stringify(data.symptoms)) as Json,
      medicines: JSON.parse(JSON.stringify(data.medicines)) as Json,
      diagnosis: data.diagnosis || null,
      advice: data.advice || null,
    };

    const { data: template, error } = await supabase
      .from('prescription_templates')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to save template');
      return null;
    }

    const parsed = {
      ...template,
      symptoms: Array.isArray(template.symptoms) ? template.symptoms : [],
      medicines: Array.isArray(template.medicines) ? template.medicines : [],
    } as PrescriptionTemplate;

    setTemplates(prev => [...prev, parsed].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success('Template saved successfully');
    return parsed;
  };

  const deleteTemplate = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('prescription_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
      return false;
    }

    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted');
    return true;
  };

  return {
    templates,
    loading,
    doctorId,
    createTemplate,
    deleteTemplate,
  };
}
