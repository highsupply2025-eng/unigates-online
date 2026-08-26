-- ═══════════════════════════════════════════════════════════════════════════
-- Fix RLS Policies for Courses and Storage Thumbnails + Add create_institution_course RPC
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Fix course-thumbnails Storage Policies
DO $$
BEGIN
  -- Drop restrictive policies
  DROP POLICY IF EXISTS "Lecturers and admins can upload thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload course thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update course thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete course thumbnails" ON storage.objects;
END $$;

CREATE POLICY "Allow authenticated users to upload course thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-thumbnails');

CREATE POLICY "Allow authenticated users to update course thumbnails"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Allow authenticated users to delete course thumbnails"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'course-thumbnails');

-- 2. Fix Courses Table RLS Policies
DROP POLICY IF EXISTS "Approved lecturers can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Department heads can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Teaching assistants can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Faculty and lecturers can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Dept scope: courses insert" ON public.courses;

CREATE POLICY "Faculty and lecturers can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Lecturers can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Creators and admins can update courses" ON public.courses;
CREATE POLICY "Creators and admins can update courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (
  auth.uid() = creator_id
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Lecturers can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Creators and admins can delete courses" ON public.courses;
CREATE POLICY "Creators and admins can delete courses"
ON public.courses
FOR DELETE
TO authenticated
USING (
  auth.uid() = creator_id
  OR public.has_role(auth.uid(), 'admin')
);

-- 3. Atomic RPC function for course creation
CREATE OR REPLACE FUNCTION public.create_institution_course(
  p_department_id uuid,
  p_title_ar text,
  p_title_en text,
  p_category_ar text DEFAULT 'عام',
  p_category_en text DEFAULT 'General',
  p_instructor_ar text DEFAULT '',
  p_instructor_en text DEFAULT '',
  p_thumbnail_url text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL,
  p_is_free boolean DEFAULT false,
  p_created_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_course_id uuid;
  v_user_id uuid := auth.uid();
  v_instructor text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_instructor_ar IS NULL OR p_instructor_ar = '' THEN
    SELECT full_name INTO v_instructor FROM public.profiles WHERE user_id = v_user_id;
    IF v_instructor IS NULL THEN
      v_instructor := '';
    END IF;
  ELSE
    v_instructor := p_instructor_ar;
  END IF;

  INSERT INTO public.courses (
    title_ar,
    title_en,
    category_ar,
    category_en,
    instructor_ar,
    instructor_en,
    is_free,
    creator_id,
    thumbnail_url,
    department_id,
    expires_at,
    created_at
  ) VALUES (
    p_title_ar,
    p_title_en,
    COALESCE(p_category_ar, 'عام'),
    COALESCE(p_category_en, 'General'),
    v_instructor,
    COALESCE(NULLIF(p_instructor_en, ''), v_instructor),
    COALESCE(p_is_free, false),
    v_user_id,
    p_thumbnail_url,
    p_department_id,
    p_expires_at,
    COALESCE(p_created_at, NOW())
  )
  RETURNING id INTO v_course_id;

  RETURN v_course_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) TO authenticated;
