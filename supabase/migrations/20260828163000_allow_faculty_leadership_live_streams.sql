-- Allow faculty, department heads, deans, vice deans, and teaching assistants to manage live streams
-- 1. Drop existing restrictive policies on live_streams
DROP POLICY IF EXISTS "Lecturers can create streams" ON public.live_streams;
DROP POLICY IF EXISTS "Faculty and leadership can create streams" ON public.live_streams;
DROP POLICY IF EXISTS "Faculty and leadership can update own streams" ON public.live_streams;
DROP POLICY IF EXISTS "Faculty and leadership can delete own streams" ON public.live_streams;
DROP POLICY IF EXISTS "Department heads can insert streams" ON public.live_streams;
DROP POLICY IF EXISTS "Teaching assistants can insert streams" ON public.live_streams;

-- 2. Create permissive INSERT policy for faculty, leadership, teachers, and admins
CREATE POLICY "Faculty and leadership can create streams"
ON public.live_streams FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  AND (
    public.has_approved_role(auth.uid(), 'lecturer')
    OR public.has_approved_role(auth.uid(), 'department_head')
    OR public.has_approved_role(auth.uid(), 'dean')
    OR public.has_approved_role(auth.uid(), 'vice_dean')
    OR public.has_approved_role(auth.uid(), 'teaching_assistant')
    OR public.has_approved_role(auth.uid(), 'school_teacher')
    OR public.has_approved_role(auth.uid(), 'admin')
    OR public.has_approved_role(auth.uid(), 'super_admin')
    OR public.has_approved_role(auth.uid(), 'institution_admin')
    OR EXISTS (
      SELECT 1 FROM public.institution_faculty_members ifm
      WHERE ifm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.department_faculty_members dfm
      WHERE dfm.faculty_id = auth.uid()
    )
  )
);

-- 3. Create permissive UPDATE policy for creators
CREATE POLICY "Faculty and leadership can update own streams"
ON public.live_streams FOR UPDATE TO authenticated
USING (
  auth.uid() = creator_id
  OR public.has_approved_role(auth.uid(), 'admin')
  OR public.has_approved_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  auth.uid() = creator_id
  OR public.has_approved_role(auth.uid(), 'admin')
  OR public.has_approved_role(auth.uid(), 'super_admin')
);

-- 4. Create permissive DELETE policy for creators
CREATE POLICY "Faculty and leadership can delete own streams"
ON public.live_streams FOR DELETE TO authenticated
USING (
  auth.uid() = creator_id
  OR public.has_approved_role(auth.uid(), 'admin')
  OR public.has_approved_role(auth.uid(), 'super_admin')
);

-- 5. RPC function for creating live streams safely (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_live_stream_secure(
  p_title_ar text,
  p_title_en text,
  p_category_ar text DEFAULT NULL,
  p_category_en text DEFAULT NULL,
  p_instructor_ar text DEFAULT NULL,
  p_instructor_en text DEFAULT NULL,
  p_status text DEFAULT 'scheduled',
  p_scheduled_at timestamptz DEFAULT now(),
  p_department_id uuid DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_stream_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.live_streams (
    creator_id,
    title_ar,
    title_en,
    category_ar,
    category_en,
    instructor_ar,
    instructor_en,
    status,
    scheduled_at,
    department_id,
    expires_at
  ) VALUES (
    v_user_id,
    TRIM(p_title_ar),
    TRIM(p_title_en),
    TRIM(COALESCE(p_category_ar, 'عام')),
    TRIM(COALESCE(p_category_en, 'General')),
    TRIM(COALESCE(p_instructor_ar, 'المحاضر')),
    TRIM(COALESCE(p_instructor_en, 'Instructor')),
    COALESCE(p_status, 'scheduled'),
    COALESCE(p_scheduled_at, now()),
    p_department_id,
    p_expires_at
  )
  RETURNING id INTO v_stream_id;

  RETURN v_stream_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_live_stream_secure TO authenticated;
