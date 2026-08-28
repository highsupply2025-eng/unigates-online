-- Add approval_reviewers JSONB column to quizzes table
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS approval_reviewers JSONB DEFAULT '[]'::jsonb;

-- Ensure quizzes table has permissive policies for all faculty & leadership
DROP POLICY IF EXISTS "Quizzes viewable by everyone" ON public.quizzes;
DROP POLICY IF EXISTS "Lecturers can insert own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Lecturers can update own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Lecturers can delete own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Faculty and leadership can insert quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Faculty and leadership can update quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Faculty and leadership can delete quizzes" ON public.quizzes;

-- 1. SELECT Policy: Everyone can view published quizzes; creators and reviewers can view all
CREATE POLICY "Quizzes viewable by authorized users"
ON public.quizzes FOR SELECT TO authenticated
USING (
  is_published = true
  OR creator_id = auth.uid()
  OR public.has_approved_role(auth.uid(), 'dean')
  OR public.has_approved_role(auth.uid(), 'vice_dean')
  OR public.has_approved_role(auth.uid(), 'department_head')
  OR public.has_approved_role(auth.uid(), 'admin')
  OR public.has_approved_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(approval_reviewers) elem
    WHERE (elem->>'user_id')::text = auth.uid()::text
  )
);

-- 2. INSERT Policy: Faculty and leadership can create quizzes
CREATE POLICY "Faculty and leadership can insert quizzes"
ON public.quizzes FOR INSERT TO authenticated
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

-- 3. UPDATE Policy: Creator, Dean, Vice Deans, Dept Heads, and Appointed Reviewers
CREATE POLICY "Faculty and leadership can update quizzes"
ON public.quizzes FOR UPDATE TO authenticated
USING (
  auth.uid() = creator_id
  OR public.has_approved_role(auth.uid(), 'dean')
  OR public.has_approved_role(auth.uid(), 'vice_dean')
  OR public.has_approved_role(auth.uid(), 'department_head')
  OR public.has_approved_role(auth.uid(), 'admin')
  OR public.has_approved_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(approval_reviewers) elem
    WHERE (elem->>'user_id')::text = auth.uid()::text
  )
);

-- 4. DELETE Policy: Creator and Admins
CREATE POLICY "Faculty and leadership can delete quizzes"
ON public.quizzes FOR DELETE TO authenticated
USING (
  auth.uid() = creator_id
  OR public.has_approved_role(auth.uid(), 'admin')
  OR public.has_approved_role(auth.uid(), 'super_admin')
);

-- 5. Quiz Questions RLS: Allow creators and admins to manage questions
DROP POLICY IF EXISTS "Questions viewable by everyone" ON public.quiz_questions;
DROP POLICY IF EXISTS "Lecturers can manage questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Faculty can manage quiz questions" ON public.quiz_questions;

CREATE POLICY "Questions viewable by authorized users"
ON public.quiz_questions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Faculty can manage quiz questions"
ON public.quiz_questions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = quiz_questions.quiz_id
    AND (
      quizzes.creator_id = auth.uid()
      OR public.has_approved_role(auth.uid(), 'admin')
      OR public.has_approved_role(auth.uid(), 'super_admin')
    )
  )
);

-- 6. RPC function: create_quiz_with_approval_chain
CREATE OR REPLACE FUNCTION public.create_quiz_with_approval_chain(
  p_course_id uuid,
  p_title_ar text,
  p_title_en text,
  p_description_ar text DEFAULT NULL,
  p_description_en text DEFAULT NULL,
  p_duration_minutes integer DEFAULT 30,
  p_due_date timestamptz DEFAULT NULL,
  p_department_id uuid DEFAULT NULL,
  p_approval_reviewers jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_quiz_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.quizzes (
    course_id,
    creator_id,
    title_ar,
    title_en,
    description_ar,
    description_en,
    duration_minutes,
    due_date,
    department_id,
    approval_reviewers,
    is_published,
    approved_by_lecturer,
    approved_by_lecturer_at,
    approved_by_lecturer_id
  ) VALUES (
    p_course_id,
    v_user_id,
    TRIM(p_title_ar),
    TRIM(p_title_en),
    p_description_ar,
    p_description_en,
    COALESCE(p_duration_minutes, 30),
    p_due_date,
    p_department_id,
    COALESCE(p_approval_reviewers, '[]'::jsonb),
    false, -- Unapproved quizzes are not published to students until final Dean approval
    true,  -- The creator automatically approves their own creation step
    now(),
    v_user_id
  )
  RETURNING id INTO v_quiz_id;

  RETURN v_quiz_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_quiz_with_approval_chain TO authenticated;
