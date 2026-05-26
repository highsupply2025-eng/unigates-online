-- 1) Restrict the leadership-on-profiles policy to the same institution
DROP POLICY IF EXISTS "Leadership can view profiles in same department" ON public.profiles;

CREATE POLICY "Leadership can view profiles in same department"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.department_members dm_t
    JOIN public.departments d_t ON d_t.id = dm_t.department_id
    JOIN public.department_members dm_s ON dm_s.user_id = auth.uid()
    JOIN public.departments d_s
      ON d_s.id = dm_s.department_id
     AND d_s.institution_id = d_t.institution_id
     AND d_s.institution_type = d_t.institution_type
    WHERE dm_t.user_id = profiles.user_id
      AND dm_s.role = ANY (ARRAY['department_head','vice_dean','dean'])
  )
);

-- 2) Replace bare is_leadership() with explicit role checks on rating/view policies
DROP POLICY IF EXISTS "Leadership views own institution lecture ratings" ON public.lecture_ratings;
CREATE POLICY "Leadership views own institution lecture ratings"
ON public.lecture_ratings
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = lecture_ratings.course_id
      AND user_in_my_leadership_institution(c.creator_id)
  )
);

DROP POLICY IF EXISTS "Leadership views own institution schedule ratings" ON public.schedule_ratings;
CREATE POLICY "Leadership views own institution schedule ratings"
ON public.schedule_ratings
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.lecture_schedules ls
    WHERE ls.id = schedule_ratings.schedule_id
      AND user_in_my_leadership_institution(ls.creator_id)
  )
);

DROP POLICY IF EXISTS "Leadership views own institution quiz ratings" ON public.quiz_ratings;
CREATE POLICY "Leadership views own institution quiz ratings"
ON public.quiz_ratings
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_ratings.quiz_id
      AND user_in_my_leadership_institution(q.creator_id)
  )
);

DROP POLICY IF EXISTS "Leadership views own institution schedule viewers" ON public.schedule_views;
CREATE POLICY "Leadership views own institution schedule viewers"
ON public.schedule_views
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.lecture_schedules ls
    WHERE ls.id = schedule_views.schedule_id
      AND user_in_my_leadership_institution(ls.creator_id)
  )
);

-- 3) Enforce column-level REVOKE on quiz_questions.correct_answer and expected_answer
-- so even leadership/staff SELECT policies cannot read the answer key. Grading still
-- works because submit_quiz / get_quiz_review are SECURITY DEFINER.
REVOKE SELECT (correct_answer, expected_answer) ON public.quiz_questions FROM authenticated, anon;