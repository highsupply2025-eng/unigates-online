
-- ============================================
-- 1. department_members: remove anon access
-- ============================================
DROP POLICY IF EXISTS "Anyone can verify unused department member codes" ON public.department_members;

CREATE OR REPLACE FUNCTION public.verify_department_invitation(_code text)
RETURNS TABLE(is_valid boolean, role text, department_id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true AS is_valid,
    dm.role,
    dm.department_id,
    dm.full_name
  FROM public.department_members dm
  WHERE dm.invitation_code = _code AND dm.user_id IS NULL
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.verify_department_invitation(text) TO anon, authenticated;

-- ============================================
-- 2. Remove sensitive tables from Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;
ALTER PUBLICATION supabase_realtime DROP TABLE public.school_registrations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.college_registrations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.institute_registrations;

-- ============================================
-- 3. RLS on realtime.messages: authenticated only
-- ============================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can subscribe" ON realtime.messages;
CREATE POLICY "Authenticated users can subscribe"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 4. quizzes: restrict to authenticated
-- ============================================
DROP POLICY IF EXISTS "Quizzes viewable by everyone" ON public.quizzes;

CREATE POLICY "Authenticated users can view published quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (is_published = true OR creator_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 5. lecture_schedules: restrict to authenticated
-- ============================================
DROP POLICY IF EXISTS "Schedules viewable by everyone" ON public.lecture_schedules;

CREATE POLICY "Authenticated users can view schedules"
ON public.lecture_schedules
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 6. Storage: restrict listing on course-thumbnails
-- ============================================
DROP POLICY IF EXISTS "Public can view course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Course thumbnails are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course thumbnails" ON storage.objects;

CREATE POLICY "Course thumbnails readable by id"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'course-thumbnails' AND name IS NOT NULL);
