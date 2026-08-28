-- Migration: Schedules & Assignments Custom Sequential Approval Chain + File/Image Support + RLS & RPC
-- Date: 2026-08-28

-- 1. Enhance public.lecture_schedules
ALTER TABLE public.lecture_schedules
  ADD COLUMN IF NOT EXISTS approval_reviewers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS days_of_week TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS semester TEXT,
  ADD COLUMN IF NOT EXISTS academic_year TEXT,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 2. Enhance public.assignments
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS approval_reviewers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_by_head BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_head_id UUID,
  ADD COLUMN IF NOT EXISTS approved_by_head_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_id UUID,
  ADD COLUMN IF NOT EXISTS approved_by_vice_dean_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by_dean BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_by_dean_id UUID,
  ADD COLUMN IF NOT EXISTS approved_by_dean_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS file_urls TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS file_names TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS points NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 3. Permissive RLS Policies for lecture_schedules
DROP POLICY IF EXISTS "Faculty and leadership can insert schedules" ON public.lecture_schedules;
CREATE POLICY "Faculty and leadership can insert schedules"
ON public.lecture_schedules FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('dean', 'vice_dean', 'department_head', 'professor', 'doctor', 'teacher', 'assistant_lecturer', 'teaching_assistant', 'lecturer', 'school_teacher', 'admin', 'institution_admin')
  ) OR
  EXISTS (
    SELECT 1 FROM public.institution_faculty_members ifm
    WHERE ifm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Faculty and leadership can update schedules" ON public.lecture_schedules;
CREATE POLICY "Faculty and leadership can update schedules"
ON public.lecture_schedules FOR UPDATE TO authenticated
USING (
  auth.uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('dean', 'vice_dean', 'department_head', 'professor', 'doctor', 'teacher', 'assistant_lecturer', 'teaching_assistant', 'lecturer', 'school_teacher', 'admin', 'institution_admin')
  ) OR
  EXISTS (
    SELECT 1 FROM public.institution_faculty_members ifm
    WHERE ifm.user_id = auth.uid()
  )
);

-- 4. Permissive RLS Policies for assignments
DROP POLICY IF EXISTS "Faculty and leadership can insert assignments" ON public.assignments;
CREATE POLICY "Faculty and leadership can insert assignments"
ON public.assignments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('dean', 'vice_dean', 'department_head', 'professor', 'doctor', 'teacher', 'assistant_lecturer', 'teaching_assistant', 'lecturer', 'school_teacher', 'admin', 'institution_admin')
  ) OR
  EXISTS (
    SELECT 1 FROM public.institution_faculty_members ifm
    WHERE ifm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Faculty and leadership can update assignments" ON public.assignments;
CREATE POLICY "Faculty and leadership can update assignments"
ON public.assignments FOR UPDATE TO authenticated
USING (
  auth.uid() = creator_id OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('dean', 'vice_dean', 'department_head', 'professor', 'doctor', 'teacher', 'assistant_lecturer', 'teaching_assistant', 'lecturer', 'school_teacher', 'admin', 'institution_admin')
  ) OR
  EXISTS (
    SELECT 1 FROM public.institution_faculty_members ifm
    WHERE ifm.user_id = auth.uid()
  )
);

-- 5. Safe RPC: create_schedule_with_approval_chain
CREATE OR REPLACE FUNCTION public.create_schedule_with_approval_chain(
  p_course_id UUID,
  p_title_ar TEXT,
  p_title_en TEXT,
  p_schedule_type TEXT DEFAULT 'lecture',
  p_scheduled_date DATE DEFAULT CURRENT_DATE,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_location_ar TEXT DEFAULT NULL,
  p_location_en TEXT DEFAULT NULL,
  p_notes_ar TEXT DEFAULT NULL,
  p_notes_en TEXT DEFAULT NULL,
  p_department_id UUID DEFAULT NULL,
  p_days_of_week TEXT[] DEFAULT '{}'::text[],
  p_semester TEXT DEFAULT NULL,
  p_academic_year TEXT DEFAULT NULL,
  p_file_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_approval_reviewers JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_schedule_id UUID;
  v_dept_id UUID := p_department_id;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  IF v_dept_id IS NULL AND p_course_id IS NOT NULL THEN
    SELECT department_id INTO v_dept_id FROM public.courses WHERE id = p_course_id;
  END IF;

  INSERT INTO public.lecture_schedules (
    course_id,
    creator_id,
    title_ar,
    title_en,
    schedule_type,
    scheduled_date,
    start_time,
    end_time,
    location_ar,
    location_en,
    notes_ar,
    notes_en,
    department_id,
    days_of_week,
    semester,
    academic_year,
    file_url,
    file_name,
    approval_reviewers,
    approved_by_head,
    approved_by_vice_dean,
    approved_by_dean
  ) VALUES (
    p_course_id,
    v_user_id,
    p_title_ar,
    COALESCE(p_title_en, p_title_ar),
    COALESCE(p_schedule_type, 'lecture'),
    COALESCE(p_scheduled_date, CURRENT_DATE),
    p_start_time,
    p_end_time,
    p_location_ar,
    p_location_en,
    p_notes_ar,
    p_notes_en,
    v_dept_id,
    COALESCE(p_days_of_week, '{}'::text[]),
    p_semester,
    p_academic_year,
    p_file_url,
    p_file_name,
    COALESCE(p_approval_reviewers, '[]'::jsonb),
    false,
    false,
    false
  )
  RETURNING id INTO v_schedule_id;

  RETURN jsonb_build_object(
    'success', true,
    'schedule_id', v_schedule_id,
    'message', 'Schedule created successfully and submitted to approval chain'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 6. Safe RPC: create_assignment_with_approval_chain
CREATE OR REPLACE FUNCTION public.create_assignment_with_approval_chain(
  p_course_id UUID,
  p_title_ar TEXT,
  p_title_en TEXT,
  p_description_ar TEXT DEFAULT NULL,
  p_description_en TEXT DEFAULT NULL,
  p_due_date TIMESTAMPTZ DEFAULT NULL,
  p_points NUMERIC DEFAULT 10,
  p_department_id UUID DEFAULT NULL,
  p_file_urls TEXT[] DEFAULT '{}'::text[],
  p_file_names TEXT[] DEFAULT '{}'::text[],
  p_image_urls TEXT[] DEFAULT '{}'::text[],
  p_approval_reviewers JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_assignment_id UUID;
  v_dept_id UUID := p_department_id;
  v_primary_file_url TEXT := NULL;
  v_primary_file_name TEXT := NULL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  IF v_dept_id IS NULL AND p_course_id IS NOT NULL THEN
    SELECT department_id INTO v_dept_id FROM public.courses WHERE id = p_course_id;
  END IF;

  IF array_length(p_file_urls, 1) > 0 THEN
    v_primary_file_url := p_file_urls[1];
  END IF;
  IF array_length(p_file_names, 1) > 0 THEN
    v_primary_file_name := p_file_names[1];
  END IF;

  INSERT INTO public.assignments (
    course_id,
    creator_id,
    title_ar,
    title_en,
    description_ar,
    description_en,
    file_url,
    file_name,
    file_urls,
    file_names,
    image_urls,
    due_date,
    points,
    department_id,
    approval_reviewers,
    approved_by_head,
    approved_by_vice_dean,
    approved_by_dean,
    is_published
  ) VALUES (
    p_course_id,
    v_user_id,
    p_title_ar,
    COALESCE(p_title_en, p_title_ar),
    p_description_ar,
    p_description_en,
    v_primary_file_url,
    v_primary_file_name,
    COALESCE(p_file_urls, '{}'::text[]),
    COALESCE(p_file_names, '{}'::text[]),
    COALESCE(p_image_urls, '{}'::text[]),
    p_due_date,
    COALESCE(p_points, 10),
    v_dept_id,
    COALESCE(p_approval_reviewers, '[]'::jsonb),
    false,
    false,
    false,
    false
  )
  RETURNING id INTO v_assignment_id;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', v_assignment_id,
    'message', 'Assignment created successfully and submitted to approval chain'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
