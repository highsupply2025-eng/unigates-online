
-- Add logo_url to institute_registrations
ALTER TABLE public.institute_registrations ADD COLUMN IF NOT EXISTS logo_url text;

-- Create institute-logos bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('institute-logos', 'institute-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (mirror college-logos)
DROP POLICY IF EXISTS "Public read institute logos" ON storage.objects;
CREATE POLICY "Public read institute logos" ON storage.objects FOR SELECT USING (bucket_id = 'institute-logos');

DROP POLICY IF EXISTS "Anyone can upload institute logos" ON storage.objects;
CREATE POLICY "Anyone can upload institute logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'institute-logos');

-- Recreate approved_institutes_public view to include director_name and logo_url
DROP VIEW IF EXISTS public.approved_institutes_public;
CREATE VIEW public.approved_institutes_public WITH (security_invoker = true) AS
SELECT id, institute_name, director_name, city, student_count, logo_url
FROM public.institute_registrations
WHERE status = 'approved';

GRANT SELECT ON public.approved_institutes_public TO anon, authenticated;
