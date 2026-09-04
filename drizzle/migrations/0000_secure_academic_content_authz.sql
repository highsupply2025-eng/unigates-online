-- Secure academic-content authorization helpers
CREATE OR REPLACE FUNCTION public.can_manage_department_content(_uid uuid, _dept uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_dept public.departments;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid, 'admin'::app_role) THEN RETURN true; END IF;
  IF _dept IS NULL THEN RETURN false; END IF;
  SELECT * INTO v_dept FROM public.departments WHERE id = _dept;
  IF v_dept.id IS NULL THEN RETURN false; END IF;
  IF public.is_institution_admin(_uid, v_dept.institution_id, v_dept.institution_type) THEN RETURN true; END IF;
  IF EXISTS (
    SELECT 1 FROM public.institution_faculty_members ifm
    WHERE ifm.user_id = _uid
      AND ifm.institution_id = v_dept.institution_id
      AND ifm.institution_type = v_dept.institution_type
  ) THEN RETURN true; END IF;
  IF EXISTS (
    SELECT 1 FROM public.department_members dm
    WHERE dm.user_id = _uid AND dm.department_id = _dept
      AND COALESCE(dm.role, 'student') <> 'student'
  ) THEN RETURN true; END IF;
  RETURN false;
END; $$;

REVOKE ALL ON FUNCTION public.can_manage_department_content(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_department_content(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_manage_course_content(_uid uuid, _course uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_creator uuid; v_dept uuid;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.has_role(_uid, 'admin'::app_role) THEN RETURN true; END IF;
  IF _course IS NULL THEN RETURN false; END IF;
  SELECT creator_id, department_id INTO v_creator, v_dept FROM public.courses WHERE id = _course;
  IF v_creator IS NULL AND v_dept IS NULL THEN RETURN false; END IF;
  IF v_creator = _uid THEN RETURN true; END IF;
  RETURN public.can_manage_department_content(_uid, v_dept);
END; $$;

REVOKE ALL ON FUNCTION public.can_manage_course_content(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_course_content(uuid, uuid) TO authenticated, service_role;

-- Columns required by the approval-chain features
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS approval_reviewers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS results_approval_reviewers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS results_status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS results_approved_by_head BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS results_approved_by_head_id UUID,
  ADD COLUMN IF NOT EXISTS results_approved_by_head_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_approved_by_vice_dean BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS results_approved_by_vice_dean_id UUID,
  ADD COLUMN IF NOT EXISTS results_approved_by_vice_dean_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_approved_by_dean BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS results_approved_by_dean_id UUID,
  ADD COLUMN IF NOT EXISTS results_approved_by_dean_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_rejected_by UUID,
  ADD COLUMN IF NOT EXISTS results_rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS results_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_submitted_by UUID;

ALTER TABLE public.lecture_schedules
  ADD COLUMN IF NOT EXISTS approval_reviewers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS days_of_week TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS semester TEXT,
  ADD COLUMN IF NOT EXISTS academic_year TEXT;

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
  ADD COLUMN IF NOT EXISTS points NUMERIC DEFAULT 10;

-- Tenant-scoped write policies
DROP POLICY IF EXISTS "Faculty and leadership can insert schedules" ON public.lecture_schedules;
CREATE POLICY "Faculty and leadership can insert schedules"
ON public.lecture_schedules FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  AND (public.can_manage_course_content(auth.uid(), course_id)
       OR public.can_manage_department_content(auth.uid(), department_id))
);

DROP POLICY IF EXISTS "Faculty and leadership can update schedules" ON public.lecture_schedules;
CREATE POLICY "Faculty and leadership can update schedules"
ON public.lecture_schedules FOR UPDATE TO authenticated
USING (auth.uid() = creator_id
  OR public.can_manage_course_content(auth.uid(), course_id)
  OR public.can_manage_department_content(auth.uid(), department_id))
WITH CHECK (auth.uid() = creator_id
  OR public.can_manage_course_content(auth.uid(), course_id)
  OR public.can_manage_department_content(auth.uid(), department_id));

DROP POLICY IF EXISTS "Faculty and leadership can insert assignments" ON public.assignments;
CREATE POLICY "Faculty and leadership can insert assignments"
ON public.assignments FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  AND (public.can_manage_course_content(auth.uid(), course_id)
       OR public.can_manage_department_content(auth.uid(), department_id))
);

DROP POLICY IF EXISTS "Faculty and leadership can update assignments" ON public.assignments;
CREATE POLICY "Faculty and leadership can update assignments"
ON public.assignments FOR UPDATE TO authenticated
USING (auth.uid() = creator_id
  OR public.can_manage_course_content(auth.uid(), course_id)
  OR public.can_manage_department_content(auth.uid(), department_id))
WITH CHECK (auth.uid() = creator_id
  OR public.can_manage_course_content(auth.uid(), course_id)
  OR public.can_manage_department_content(auth.uid(), department_id));

DROP POLICY IF EXISTS "Faculty and leadership can insert quizzes" ON public.quizzes;
CREATE POLICY "Faculty and leadership can insert quizzes"
ON public.quizzes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  AND (public.can_manage_course_content(auth.uid(), course_id)
       OR public.can_manage_department_content(auth.uid(), department_id))
);

DROP POLICY IF EXISTS "Faculty and leadership can update quizzes" ON public.quizzes;
CREATE POLICY "Faculty and leadership can update quizzes"
ON public.quizzes FOR UPDATE TO authenticated
USING (
  auth.uid() = creator_id
  OR public.can_manage_course_content(auth.uid(), course_id)
  OR public.can_manage_department_content(auth.uid(), department_id)
  OR EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(approval_reviewers, '[]'::jsonb)) e
             WHERE (e->>'user_id') = auth.uid()::text)
  OR EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(results_approval_reviewers, '[]'::jsonb)) e
             WHERE (e->>'user_id') = auth.uid()::text)
);

DROP POLICY IF EXISTS "Faculty and leadership can insert streams" ON public.live_streams;
DROP POLICY IF EXISTS "Faculty and leadership can create streams" ON public.live_streams;
CREATE POLICY "Faculty and leadership can create streams"
ON public.live_streams FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = creator_id
  AND (public.can_manage_course_content(auth.uid(), course_id)
       OR public.can_manage_department_content(auth.uid(), department_id))
);

-- Never expose quiz question content unconditionally
DROP POLICY IF EXISTS "Questions viewable by authorized users" ON public.quiz_questions;
DROP POLICY IF EXISTS "Questions viewable by everyone" ON public.quiz_questions;

-- Assignment ratings, leadership scoped to their own institution
CREATE TABLE IF NOT EXISTS public.assignment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL,
  course_id UUID,
  user_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.assignment_ratings TO authenticated;
GRANT ALL ON public.assignment_ratings TO service_role;
ALTER TABLE public.assignment_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own assignment rating" ON public.assignment_ratings;
CREATE POLICY "Users insert own assignment rating" ON public.assignment_ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view own assignment rating" ON public.assignment_ratings;
CREATE POLICY "Users view own assignment rating" ON public.assignment_ratings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own assignment rating" ON public.assignment_ratings;
CREATE POLICY "Users update own assignment rating" ON public.assignment_ratings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Course creator views assignment ratings" ON public.assignment_ratings;
CREATE POLICY "Course creator views assignment ratings" ON public.assignment_ratings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = assignment_ratings.course_id AND c.creator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_ratings.assignment_id AND a.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "Leadership views assignment ratings" ON public.assignment_ratings;
CREATE POLICY "Leadership views assignment ratings" ON public.assignment_ratings
  FOR SELECT TO authenticated USING (
    public.is_leadership(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_ratings.assignment_id
        AND public.user_in_my_leadership_institution(a.creator_id)
    )
  );

-- Authorized RPCs
CREATE OR REPLACE FUNCTION public.create_quiz_with_approval_chain(
  p_course_id uuid, p_title_ar text, p_title_en text,
  p_description_ar text DEFAULT NULL, p_description_en text DEFAULT NULL,
  p_duration_minutes integer DEFAULT 30, p_due_date timestamptz DEFAULT NULL,
  p_department_id uuid DEFAULT NULL, p_approval_reviewers jsonb DEFAULT '[]'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user_id uuid := auth.uid(); v_dept uuid := p_department_id; v_quiz_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF v_dept IS NULL AND p_course_id IS NOT NULL THEN
    SELECT department_id INTO v_dept FROM public.courses WHERE id = p_course_id;
  END IF;
  IF NOT (public.can_manage_course_content(v_user_id, p_course_id)
          OR public.can_manage_department_content(v_user_id, v_dept)) THEN
    RAISE EXCEPTION 'Not authorized to create quizzes for this course';
  END IF;
  INSERT INTO public.quizzes (
    course_id, creator_id, title_ar, title_en, description_ar, description_en,
    duration_minutes, due_date, department_id, approval_reviewers, is_published,
    approved_by_lecturer, approved_by_lecturer_at, approved_by_lecturer_id
  ) VALUES (
    p_course_id, v_user_id, TRIM(p_title_ar), TRIM(COALESCE(p_title_en, p_title_ar)),
    p_description_ar, p_description_en, COALESCE(p_duration_minutes, 30), p_due_date,
    v_dept, COALESCE(p_approval_reviewers, '[]'::jsonb), false, true, now(), v_user_id
  ) RETURNING id INTO v_quiz_id;
  RETURN v_quiz_id;
END; $$;

REVOKE ALL ON FUNCTION public.create_quiz_with_approval_chain(uuid, text, text, text, text, integer, timestamptz, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_quiz_with_approval_chain(uuid, text, text, text, text, integer, timestamptz, uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_schedule_with_approval_chain(
  p_course_id UUID, p_title_ar TEXT, p_title_en TEXT,
  p_schedule_type TEXT DEFAULT 'lecture', p_scheduled_date DATE DEFAULT CURRENT_DATE,
  p_start_time TIME DEFAULT NULL, p_end_time TIME DEFAULT NULL,
  p_location_ar TEXT DEFAULT NULL, p_location_en TEXT DEFAULT NULL,
  p_notes_ar TEXT DEFAULT NULL, p_notes_en TEXT DEFAULT NULL,
  p_department_id UUID DEFAULT NULL, p_days_of_week TEXT[] DEFAULT '{}'::text[],
  p_semester TEXT DEFAULT NULL, p_academic_year TEXT DEFAULT NULL,
  p_file_url TEXT DEFAULT NULL, p_file_name TEXT DEFAULT NULL,
  p_approval_reviewers JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user_id UUID := auth.uid(); v_schedule_id UUID; v_dept_id UUID := p_department_id;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  IF v_dept_id IS NULL AND p_course_id IS NOT NULL THEN
    SELECT department_id INTO v_dept_id FROM public.courses WHERE id = p_course_id;
  END IF;
  IF NOT (public.can_manage_course_content(v_user_id, p_course_id)
          OR public.can_manage_department_content(v_user_id, v_dept_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this course or department');
  END IF;
  INSERT INTO public.lecture_schedules (
    course_id, creator_id, title_ar, title_en, schedule_type, scheduled_date,
    start_time, end_time, location_ar, location_en, notes_ar, notes_en,
    department_id, days_of_week, semester, academic_year, file_url, file_name,
    approval_reviewers, approved_by_head, approved_by_vice_dean, approved_by_dean
  ) VALUES (
    p_course_id, v_user_id, p_title_ar, COALESCE(p_title_en, p_title_ar),
    COALESCE(p_schedule_type, 'lecture'), COALESCE(p_scheduled_date, CURRENT_DATE),
    p_start_time, p_end_time, p_location_ar, p_location_en, p_notes_ar, p_notes_en,
    v_dept_id, COALESCE(p_days_of_week, '{}'::text[]), p_semester, p_academic_year,
    p_file_url, p_file_name, COALESCE(p_approval_reviewers, '[]'::jsonb), false, false, false
  ) RETURNING id INTO v_schedule_id;
  RETURN jsonb_build_object('success', true, 'schedule_id', v_schedule_id);
END; $$;

REVOKE ALL ON FUNCTION public.create_schedule_with_approval_chain(uuid, text, text, text, date, time, time, text, text, text, text, uuid, text[], text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_schedule_with_approval_chain(uuid, text, text, text, date, time, time, text, text, text, text, uuid, text[], text, text, text, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_assignment_with_approval_chain(
  p_course_id UUID, p_title_ar TEXT, p_title_en TEXT,
  p_description_ar TEXT DEFAULT NULL, p_description_en TEXT DEFAULT NULL,
  p_due_date TIMESTAMPTZ DEFAULT NULL, p_points NUMERIC DEFAULT 10,
  p_department_id UUID DEFAULT NULL, p_file_urls TEXT[] DEFAULT '{}'::text[],
  p_file_names TEXT[] DEFAULT '{}'::text[], p_image_urls TEXT[] DEFAULT '{}'::text[],
  p_approval_reviewers JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user_id UUID := auth.uid(); v_assignment_id UUID; v_dept_id UUID := p_department_id;
        v_primary_file_url TEXT; v_primary_file_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  IF v_dept_id IS NULL AND p_course_id IS NOT NULL THEN
    SELECT department_id INTO v_dept_id FROM public.courses WHERE id = p_course_id;
  END IF;
  IF NOT (public.can_manage_course_content(v_user_id, p_course_id)
          OR public.can_manage_department_content(v_user_id, v_dept_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this course or department');
  END IF;
  IF array_length(p_file_urls, 1) > 0 THEN v_primary_file_url := p_file_urls[1]; END IF;
  IF array_length(p_file_names, 1) > 0 THEN v_primary_file_name := p_file_names[1]; END IF;
  INSERT INTO public.assignments (
    course_id, creator_id, title_ar, title_en, description_ar, description_en,
    file_url, file_name, file_urls, file_names, image_urls, due_date, points,
    department_id, approval_reviewers, approved_by_head, approved_by_vice_dean,
    approved_by_dean, is_published
  ) VALUES (
    p_course_id, v_user_id, p_title_ar, COALESCE(p_title_en, p_title_ar),
    p_description_ar, p_description_en, v_primary_file_url, v_primary_file_name,
    COALESCE(p_file_urls, '{}'::text[]), COALESCE(p_file_names, '{}'::text[]),
    COALESCE(p_image_urls, '{}'::text[]), p_due_date, COALESCE(p_points, 10),
    v_dept_id, COALESCE(p_approval_reviewers, '[]'::jsonb), false, false, false, false
  ) RETURNING id INTO v_assignment_id;
  RETURN jsonb_build_object('success', true, 'assignment_id', v_assignment_id);
END; $$;

REVOKE ALL ON FUNCTION public.create_assignment_with_approval_chain(uuid, text, text, text, text, timestamptz, numeric, uuid, text[], text[], text[], jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_assignment_with_approval_chain(uuid, text, text, text, text, timestamptz, numeric, uuid, text[], text[], text[], jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.create_live_stream_secure(
  p_title_ar text, p_title_en text, p_category_ar text DEFAULT NULL,
  p_category_en text DEFAULT NULL, p_instructor_ar text DEFAULT NULL,
  p_instructor_en text DEFAULT NULL, p_status text DEFAULT 'scheduled',
  p_scheduled_at timestamptz DEFAULT now(), p_department_id uuid DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_user_id uuid := auth.uid(); v_stream_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_manage_department_content(v_user_id, p_department_id) THEN
    RAISE EXCEPTION 'Not authorized to create live streams for this department';
  END IF;
  INSERT INTO public.live_streams (
    creator_id, title_ar, title_en, category_ar, category_en,
    instructor_ar, instructor_en, status, scheduled_at, department_id, expires_at
  ) VALUES (
    v_user_id, TRIM(p_title_ar), TRIM(COALESCE(p_title_en, p_title_ar)),
    TRIM(COALESCE(p_category_ar, 'عام')), TRIM(COALESCE(p_category_en, 'General')),
    TRIM(COALESCE(p_instructor_ar, 'المحاضر')), TRIM(COALESCE(p_instructor_en, 'Instructor')),
    COALESCE(p_status, 'scheduled'), COALESCE(p_scheduled_at, now()), p_department_id, p_expires_at
  ) RETURNING id INTO v_stream_id;
  RETURN v_stream_id;
END; $$;

REVOKE ALL ON FUNCTION public.create_live_stream_secure(text, text, text, text, text, text, text, timestamptz, uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_live_stream_secure(text, text, text, text, text, text, text, timestamptz, uuid, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_quiz_results_for_approval(
  p_quiz_id UUID, p_reviewers JSONB, p_user_id UUID DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_caller UUID := auth.uid(); v_quiz RECORD;
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  SELECT id, creator_id, course_id, department_id INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id;
  IF v_quiz.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz not found');
  END IF;
  IF NOT (v_quiz.creator_id = v_caller
          OR public.can_manage_course_content(v_caller, v_quiz.course_id)
          OR public.can_manage_department_content(v_caller, v_quiz.department_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized for this quiz');
  END IF;
  UPDATE public.quizzes SET
    results_approval_reviewers = COALESCE(p_reviewers, '[]'::jsonb),
    results_status = 'pending_approval',
    results_submitted_at = NOW(),
    results_submitted_by = v_caller,
    results_approved_by_head = false,
    results_approved_by_vice_dean = false,
    results_approved_by_dean = false,
    results_rejected_by = NULL,
    results_rejected_at = NULL,
    results_rejection_reason = NULL
  WHERE id = p_quiz_id;
  RETURN jsonb_build_object('success', true, 'quiz_id', p_quiz_id);
END; $$;

REVOKE ALL ON FUNCTION public.submit_quiz_results_for_approval(uuid, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_quiz_results_for_approval(uuid, jsonb, uuid) TO authenticated, service_role;

-- Storage: remove loose course-content write policies
DROP POLICY IF EXISTS "Users can upload own course content" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own course content" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own course content" ON storage.objects;

-- PII / course-creation RPCs never reachable anonymously
REVOKE ALL ON FUNCTION public.get_user_profiles_for_institution(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_profiles_for_institution(uuid[]) TO authenticated;
REVOKE ALL ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_institution_course(uuid, text, text, text, text, text, text, text, timestamptz, boolean, timestamptz) TO authenticated;