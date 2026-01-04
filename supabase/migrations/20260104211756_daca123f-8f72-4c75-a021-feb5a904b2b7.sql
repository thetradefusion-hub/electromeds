-- Create prescription_templates table
CREATE TABLE public.prescription_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
  diagnosis TEXT,
  advice TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescription_templates ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their own templates
CREATE POLICY "Doctors can manage their own templates"
ON public.prescription_templates
FOR ALL
USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Super admins can view all templates
CREATE POLICY "Super admins can view all templates"
ON public.prescription_templates
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_prescription_templates_updated_at
BEFORE UPDATE ON public.prescription_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();