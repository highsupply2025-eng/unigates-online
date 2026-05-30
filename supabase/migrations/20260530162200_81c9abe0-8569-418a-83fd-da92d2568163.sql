
-- Add university_name and logo_url to college_registrations
ALTER TABLE public.college_registrations
  ADD COLUMN IF NOT EXISTS university_name text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Rebuild the public view to include new fields
DROP VIEW IF EXISTS public.approved_colleges_public;
CREATE VIEW public.approved_colleges_public
WITH (security_invoker = true) AS
SELECT id, college_name, university_name, dean_name, city, student_count, logo_url, type
FROM public.college_registrations
WHERE status = 'approved'::text;

GRANT SELECT ON public.approved_colleges_public TO anon, authenticated;

-- Create public bucket for college logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('college-logos', 'college-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for college logos
DROP POLICY IF EXISTS "College logos publicly readable" ON storage.objects;
CREATE POLICY "College logos publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'college-logos');

-- Anyone can upload during signup (anon allowed since signup happens pre-auth)
DROP POLICY IF EXISTS "Anyone can upload college logos" ON storage.objects;
CREATE POLICY "Anyone can upload college logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'college-logos');
