
-- Fix 1: Make user-documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'user-documents';

-- Drop the overly permissive "Anyone can view documents" policy
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;

-- Add admin access policy for viewing user documents
CREATE POLICY "Admins can view user documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-documents' AND public.has_role(auth.uid(), 'admin'));

-- Fix 2: Drop overly broad profiles SELECT policy
DROP POLICY IF EXISTS "Anyone can count profiles" ON public.profiles;

-- Create a secure count function instead
CREATE OR REPLACE FUNCTION public.get_profile_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM profiles
$$;

-- Create counts by role function for stats
CREATE OR REPLACE FUNCTION public.get_profile_count_by_role(_role text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM profiles WHERE role = _role
$$;
