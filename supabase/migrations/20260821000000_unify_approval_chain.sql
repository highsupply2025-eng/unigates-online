-- ═══════════════════════════════════════════════════════════════════
-- Unify the approval chain across all dashboards
--
-- 1) leadership_institution_ids: recognize the specific vice-dean role
--    strings written by the faculty flow (department_members) and the
--    signup flow (college_members), so every approver (dept head,
--    vice deans, dean) passes leadership RLS scoping regardless of how
--    their account was created.
-- 2) get_user_sub_role: prefer specific vice_dean_% strings so the
--    correct approval column is resolved deterministically.
-- 3) Students only reach FULLY approved quizzes: gate quizzes SELECT,
--    quiz_questions SELECT and quiz_submissions INSERT on the complete
--    approval chain (mirrors the existing lecture_schedules RLS).
-- ═══════════════════════════════════════════════════════════════════

-- ── 1) Leadership institution scope: cover both role vocabularies ──
CREATE OR REPLACE FUNCTION public.leadership_institution_ids(_user_id uuid)
 RETURNS TABLE(institution_id uuid, institution_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT DISTINCT d.institution_id, d.institution_type
  FROM public.department_members dm
  JOIN public.departments d ON d.id = dm.department_id
  WHERE dm.user_id = _user_id
    AND dm.role IN ('department_head','vice_dean','dean',
                    'vice_dean_students','vice_dean_postgrad',
                    'vice_dean_environment','vice_dean_community')
    AND public.has_approved_role(
          _user_id,
          (CASE
            WHEN dm.role = 'department_head' THEN 'department_head'
            WHEN dm.role = 'dean' THEN 'dean'
            ELSE 'vice_dean'
          END)::app_role)
  UNION
  SELECT DISTINCT cr.id, 'college'::text
  FROM public.college_members cm
  JOIN public.college_registrations cr ON cr.id = cm.college_id
  WHERE cm.user_id = _user_id
    AND cm.role IN ('dean','vice_dean','vice_dean_students',
                    'vice_dean_postgrad','vice_dean_environment',
                    'vice_dean_community')
    AND public.has_approved_role(
          _user_id,
          (CASE WHEN cm.role = 'dean' THEN 'dean' ELSE 'vice_dean' END)::app_role)
$function$;

-- ── 2) Deterministic sub-role resolution ──
CREATE OR REPLACE FUNCTION public.get_user_sub_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM (
    SELECT role FROM public.college_members
      WHERE user_id = _user_id AND _user_id = auth.uid()
    UNION ALL
    SELECT role FROM public.department_members
      WHERE user_id = _user_id AND _user_id = auth.uid()
  ) r
  ORDER BY (role LIKE 'vice_dean_%') DESC,
           (role IN ('department_head','dean')) DESC
  LIMIT 1
$function$;

-- ── 3a) quizzes: subscription branch requires the full chain ──
DROP POLICY IF EXISTS "Subscribed students, creator, or admin can view quizzes" ON public.quizzes;
CREATE POLICY "Subscribed students see fully approved quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
  creator_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    is_published = true
    AND approved_by_lecturer = true
    AND approved_by_head = true
    AND approved_by_vice_dean_students = true
    AND approved_by_vice_dean_postgrad = true
    AND approved_by_vice_dean_environment = true
    AND approved_by_dean = true
    AND EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = auth.uid()
        AND us.course_id = quizzes.course_id
        AND us.status = 'active'
    )
  )
);

-- ── 3b) quiz_questions: same gate for the subscription branch ──
DROP POLICY IF EXISTS "View-gated read for quiz_questions" ON public.quiz_questions;
CREATE POLICY "View-gated read for quiz_questions"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    JOIN public.user_subscriptions us ON us.course_id = q.course_id
    WHERE q.id = quiz_questions.quiz_id
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
      AND q.is_published = true
      AND q.approved_by_lecturer = true
      AND q.approved_by_head = true
      AND q.approved_by_vice_dean_students = true
      AND q.approved_by_vice_dean_postgrad = true
      AND q.approved_by_vice_dean_environment = true
      AND q.approved_by_dean = true
  )
  OR EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND q.creator_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (
    (
      public.has_approved_role(auth.uid(), 'department_head'::app_role)
      OR public.has_approved_role(auth.uid(), 'vice_dean'::app_role)
      OR public.has_approved_role(auth.uid(), 'dean'::app_role)
    )
    AND EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND public.user_in_my_leadership_institution(q.creator_id))
  )
);

-- ── 3c) quiz_submissions INSERT: parent quiz must be fully approved ──
DROP POLICY IF EXISTS "Students can submit quiz to enrolled courses" ON public.quiz_submissions;
CREATE POLICY "Students can submit to fully approved quizzes"
ON public.quiz_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1
    FROM public.quizzes q
    JOIN public.user_subscriptions us ON us.course_id = q.course_id
    WHERE q.id = quiz_submissions.quiz_id
      AND q.is_published = true
      AND q.approved_by_lecturer = true
      AND q.approved_by_head = true
      AND q.approved_by_vice_dean_students = true
      AND q.approved_by_vice_dean_postgrad = true
      AND q.approved_by_vice_dean_environment = true
      AND q.approved_by_dean = true
      AND us.user_id = auth.uid()
      AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > now())
  )
);
