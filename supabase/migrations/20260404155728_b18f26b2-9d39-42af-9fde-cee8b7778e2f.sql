
-- Drop the problematic anon policy if it exists
DROP POLICY IF EXISTS "Anon read approved schools safe cols" ON public.school_registrations;

-- Create a secure public view with only non-sensitive columns
CREATE OR REPLACE VIEW public.approved_schools_public
WITH (security_invoker = on) AS
  SELECT id, school_name, city, student_count
  FROM public.school_registrations
  WHERE status = 'approved';
