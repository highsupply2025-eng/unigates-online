
-- Helper: is a target user in one of the viewer's leadership institutions?
CREATE OR REPLACE FUNCTION public.user_in_my_leadership_institution(_target_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leadership_institution_ids(auth.uid()) li
    JOIN public.departments d
      ON d.institution_id = li.institution_id
     AND d.institution_type = li.institution_type
    JOIN public.department_members dm
      ON dm.department_id = d.id
    WHERE dm.user_id = _target_user
  )
$$;

-- 1) quiz_questions: scope leadership SELECT to creators in their own institution
DROP POLICY IF EXISTS "Leadership can view all questions" ON public.quiz_questions;
CREATE POLICY "Leadership can view own institution questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND public.user_in_my_leadership_institution(q.creator_id)
  )
);

DROP POLICY IF EXISTS "Staff can read quiz_questions" ON public.quiz_questions;
CREATE POLICY "Staff can read quiz_questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND q.creator_id = auth.uid())
  OR (
    (has_approved_role(auth.uid(), 'department_head'::app_role)
     OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
     OR has_approved_role(auth.uid(), 'dean'::app_role))
    AND EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND public.user_in_my_leadership_institution(q.creator_id)
    )
  )
);

-- 2) live_streams: scope leadership SELECT to lecturers in their own institution
DROP POLICY IF EXISTS "Leadership can view all streams" ON public.live_streams;
CREATE POLICY "Leadership can view own institution streams"
ON public.live_streams
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND public.user_in_my_leadership_institution(creator_id)
);

-- 3) lecture_schedules: scope leadership SELECT to creators in their own institution
DROP POLICY IF EXISTS "Leadership view all schedules" ON public.lecture_schedules;
CREATE POLICY "Leadership view own institution schedules"
ON public.lecture_schedules
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND public.user_in_my_leadership_institution(creator_id)
);

DROP POLICY IF EXISTS "Leadership can approve schedules" ON public.lecture_schedules;
CREATE POLICY "Leadership can approve own institution schedules"
ON public.lecture_schedules
FOR UPDATE
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND public.user_in_my_leadership_institution(creator_id)
);

-- 4) stream_attendance: scope leadership SELECT via stream lecturer
DROP POLICY IF EXISTS "Leadership can view all stream attendance" ON public.stream_attendance;
CREATE POLICY "Leadership can view own institution attendance"
ON public.stream_attendance
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.live_streams ls
    WHERE ls.id = stream_attendance.stream_id
      AND public.user_in_my_leadership_institution(ls.creator_id)
  )
);

-- 5) quiz_submissions: replace department-co-membership with institution scoping
DROP POLICY IF EXISTS "Leadership view submissions in own institution" ON public.quiz_submissions;
CREATE POLICY "Leadership view submissions in own institution"
ON public.quiz_submissions
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.quizzes q
    JOIN public.courses c ON c.id = q.course_id
    WHERE q.id = quiz_submissions.quiz_id
      AND public.user_in_my_leadership_institution(c.creator_id)
  )
);
