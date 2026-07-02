
-- 1. Fix complete_signup: drop overload with p_force_approve, add auth guard to base function
DROP FUNCTION IF EXISTS public.complete_signup(uuid, text, text, text, text, text, text, text, text[], text, boolean);

CREATE OR REPLACE FUNCTION public.complete_signup(
  p_user_id uuid,
  p_role text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_platform text DEFAULT 'courses'::text,
  p_id_photo_url text DEFAULT NULL::text,
  p_university_cert_url text DEFAULT NULL::text,
  p_additional_certs_urls text[] DEFAULT '{}'::text[],
  p_live_photo_url text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_exists boolean;
  v_approved boolean;
BEGIN
  -- Only the signed-in user may complete their own signup
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_role = 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Forbidden role');
  END IF;

  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_exists;
  IF NOT v_exists THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_user_id) INTO v_exists;
  IF v_exists THEN
    RETURN json_build_object('success', false, 'error', 'Profile already exists');
  END IF;

  -- Auto-approve only low-risk roles. Elevated roles require admin approval.
  v_approved := p_role IN ('personal', 'school_student', 'parent', 'student');

  INSERT INTO public.profiles (user_id, role, full_name, phone, email, platform)
  VALUES (p_user_id, p_role, p_full_name, p_phone, p_email, p_platform);

  -- Store identity documents in a separate protected table
  IF p_id_photo_url IS NOT NULL
     OR p_university_cert_url IS NOT NULL
     OR p_live_photo_url IS NOT NULL
     OR COALESCE(array_length(p_additional_certs_urls, 1), 0) > 0 THEN
    INSERT INTO public.profile_documents (user_id, id_photo_url, university_cert_url, additional_certs_urls, live_photo_url)
    VALUES (p_user_id, p_id_photo_url, p_university_cert_url, COALESCE(p_additional_certs_urls, '{}'::text[]), p_live_photo_url);
  END IF;

  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (p_user_id, p_role::app_role, v_approved);

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 2. Split identity documents into a separate admin/owner-only table
CREATE TABLE IF NOT EXISTS public.profile_documents (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_photo_url text,
  university_cert_url text,
  additional_certs_urls text[] DEFAULT '{}'::text[],
  live_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_documents TO authenticated;
GRANT ALL ON public.profile_documents TO service_role;

ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.profile_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.profile_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.profile_documents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all documents" ON public.profile_documents
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all documents" ON public.profile_documents
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing document data
INSERT INTO public.profile_documents (user_id, id_photo_url, university_cert_url, additional_certs_urls, live_photo_url)
SELECT user_id, id_photo_url, university_cert_url, COALESCE(additional_certs_urls, '{}'::text[]), live_photo_url
FROM public.profiles
WHERE id_photo_url IS NOT NULL
   OR university_cert_url IS NOT NULL
   OR live_photo_url IS NOT NULL
   OR COALESCE(array_length(additional_certs_urls, 1), 0) > 0
ON CONFLICT (user_id) DO NOTHING;

-- Drop the sensitive doc columns from profiles so leadership SELECT can't reach them
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS id_photo_url,
  DROP COLUMN IF EXISTS university_cert_url,
  DROP COLUMN IF EXISTS additional_certs_urls,
  DROP COLUMN IF EXISTS live_photo_url;

-- 3. Tighten course-content SELECT policy to require currently-approved lecturer role
DROP POLICY IF EXISTS "Lecturers can view own course content" ON storage.objects;
CREATE POLICY "Lecturers can view own course content" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-content'
    AND has_approved_role(auth.uid(), 'lecturer'::app_role)
    AND (storage.foldername(name))[1] = (auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM public.courses
      WHERE (courses.id)::text = (storage.foldername(objects.name))[2]
        AND courses.creator_id = auth.uid()
    )
  );
