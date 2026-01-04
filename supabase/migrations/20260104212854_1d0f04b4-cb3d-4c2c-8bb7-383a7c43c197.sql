-- Create storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', false);

-- RLS policies for medical reports bucket
CREATE POLICY "Doctors can upload medical reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medical-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Doctors can view their uploaded reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical-reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Doctors can delete their reports" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medical-reports' AND auth.uid() IS NOT NULL);