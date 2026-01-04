-- Create medicine_rules table
CREATE TABLE public.medicine_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  symptom_ids UUID[] NOT NULL DEFAULT '{}',
  medicine_ids UUID[] NOT NULL DEFAULT '{}',
  dosage TEXT NOT NULL,
  duration TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_global BOOLEAN NOT NULL DEFAULT true,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medicine_rules ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all global rules
CREATE POLICY "Super admins can manage all rules"
ON public.medicine_rules FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Doctors can view global rules
CREATE POLICY "Doctors can view global rules"
ON public.medicine_rules FOR SELECT
USING (is_global = true OR doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- Doctors can manage their own rules
CREATE POLICY "Doctors can manage their own rules"
ON public.medicine_rules FOR ALL
USING (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()))
WITH CHECK (doctor_id IN (SELECT id FROM public.doctors WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_medicine_rules_updated_at
BEFORE UPDATE ON public.medicine_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster symptom matching
CREATE INDEX idx_medicine_rules_symptom_ids ON public.medicine_rules USING GIN(symptom_ids);
CREATE INDEX idx_medicine_rules_priority ON public.medicine_rules(priority DESC);