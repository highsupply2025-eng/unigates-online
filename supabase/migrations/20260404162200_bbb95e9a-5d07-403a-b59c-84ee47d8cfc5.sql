-- Drop the problematic anon policy that exposes PII
DROP POLICY IF EXISTS "Anon read approved schools safe cols" ON public.school_registrations;