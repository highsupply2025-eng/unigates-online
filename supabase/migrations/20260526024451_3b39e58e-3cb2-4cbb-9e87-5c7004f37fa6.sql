
-- 1) Profiles: restrict leadership to SAME department only
DROP POLICY IF EXISTS "Leadership can view profiles in same institution dept" ON public.profiles;

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
    JOIN public.department_members dm_s
      ON dm_s.department_id = dm_t.department_id
    WHERE dm_t.user_id = profiles.user_id
      AND dm_s.user_id = auth.uid()
      AND dm_s.role IN ('department_head','vice_dean','dean')
  )
);

-- 2) Quizzes: scope leadership SELECT + UPDATE by institution
DROP POLICY IF EXISTS "Leadership can view quizzes for approval" ON public.quizzes;
DROP POLICY IF EXISTS "Leadership can approve quizzes" ON public.quizzes;

CREATE POLICY "Leadership view own institution quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
    OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
    OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND public.user_in_my_leadership_institution(creator_id)
);

CREATE POLICY "Leadership approve own institution quizzes"
ON public.quizzes
FOR UPDATE
TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
    OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
    OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND public.user_in_my_leadership_institution(creator_id)
)
WITH CHECK (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
    OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
    OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND public.user_in_my_leadership_institution(creator_id)
);

-- 3) Lecture ratings: scope by course creator's institution
DROP POLICY IF EXISTS "Leadership views lecture ratings" ON public.lecture_ratings;

CREATE POLICY "Leadership views own institution lecture ratings"
ON public.lecture_ratings
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = lecture_ratings.course_id
      AND public.user_in_my_leadership_institution(c.creator_id)
  )
);

-- 4) Quiz ratings: scope by quiz creator's institution
DROP POLICY IF EXISTS "Leadership views quiz ratings" ON public.quiz_ratings;

CREATE POLICY "Leadership views own institution quiz ratings"
ON public.quiz_ratings
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_ratings.quiz_id
      AND public.user_in_my_leadership_institution(q.creator_id)
  )
);

-- 5) Schedule ratings: scope by schedule creator's institution
DROP POLICY IF EXISTS "Leadership views schedule ratings" ON public.schedule_ratings;

CREATE POLICY "Leadership views own institution schedule ratings"
ON public.schedule_ratings
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.lecture_schedules ls
    WHERE ls.id = schedule_ratings.schedule_id
      AND public.user_in_my_leadership_institution(ls.creator_id)
  )
);

-- 6) Schedule views: scope by schedule creator's institution
DROP POLICY IF EXISTS "Leadership views schedule viewers" ON public.schedule_views;

CREATE POLICY "Leadership views own institution schedule viewers"
ON public.schedule_views
FOR SELECT
TO authenticated
USING (
  public.is_leadership(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.lecture_schedules ls
    WHERE ls.id = schedule_views.schedule_id
      AND public.user_in_my_leadership_institution(ls.creator_id)
  )
);
