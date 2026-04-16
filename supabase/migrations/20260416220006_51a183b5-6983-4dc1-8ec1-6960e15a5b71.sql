
-- 1. PROFILES: scope by SAME institution + SAME department
DROP POLICY IF EXISTS "Leadership can view profiles in their department" ON public.profiles;
CREATE POLICY "Leadership can view profiles in same institution dept"
ON public.profiles FOR SELECT TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.department_members dm_t
    JOIN public.departments d_t ON d_t.id = dm_t.department_id
    JOIN public.departments d_s ON d_s.institution_id = d_t.institution_id
                                AND d_s.institution_type = d_t.institution_type
    JOIN public.department_members dm_s ON dm_s.department_id = d_s.id
    WHERE dm_t.user_id = profiles.user_id
      AND dm_s.user_id = auth.uid()
  )
);

-- 2. QUIZ_SUBMISSIONS: scope leadership to their own institution
DROP POLICY IF EXISTS "Leadership can view submissions (no PII)" ON public.quiz_submissions;
CREATE POLICY "Leadership view submissions in own institution"
ON public.quiz_submissions FOR SELECT TO authenticated
USING (
  (has_approved_role(auth.uid(), 'department_head'::app_role)
   OR has_approved_role(auth.uid(), 'vice_dean'::app_role)
   OR has_approved_role(auth.uid(), 'dean'::app_role))
  AND EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.courses c ON c.id = q.course_id
    JOIN public.department_members dm_self ON dm_self.user_id = auth.uid()
    WHERE q.id = quiz_submissions.quiz_id
      AND c.creator_id IN (
        SELECT dm.user_id FROM public.department_members dm
        WHERE dm.department_id = dm_self.department_id
      )
  )
);

-- 3. LECTURER_RATINGS: restrict reads
DROP POLICY IF EXISTS "Anyone authenticated can read ratings" ON public.lecturer_ratings;
CREATE POLICY "Students see own ratings"
ON public.lecturer_ratings FOR SELECT TO authenticated
USING (auth.uid() = student_id);
CREATE POLICY "Lecturers see ratings on own courses"
ON public.lecturer_ratings FOR SELECT TO authenticated
USING (auth.uid() = lecturer_id);
CREATE POLICY "Admins see all ratings"
ON public.lecturer_ratings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. REALTIME: strict prefix match
DROP POLICY IF EXISTS "Users subscribe only to own scoped channels" ON realtime.messages;
CREATE POLICY "Strict per-user channel subscription"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE ('private-' || auth.uid()::text || '%')
);
