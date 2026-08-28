-- ============================================================================
-- إصلاح: رئيس القسم مسجل في القسم لكنه لا يستطيع إنشاء محاضرة
-- ("لست عضواً في أي قسم" أو خطأ row-level security عند الإنشاء)
--
-- السبب الجذري:
--   سياسات RLS على courses/lecture_schedules تعتمد على user_in_department()
--   وكانت الدالة تنظر فقط إلى department_members، بينما أعضاء هيئة التدريس
--   مسجلون في institution_faculty_members فقط → يُرفض الإدخال رغم صحته.
--
-- طريقة الاستخدام:
--   1) افتح Supabase Dashboard → SQL Editor
--   2) عدّل البريد في القسم (أ) ثم شغّله بالكامل (Run)
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────
-- (أ) تشخيص حالة رئيس القسم — ضع بريده هنا (غيّر البريد في كل المواضع)
-- ──────────────────────────────────────────────────────────────────────────
WITH head AS (
  SELECT id FROM auth.users WHERE email = 'head@example.com' -- ← بريد الرئيس
)
SELECT 'auth_user' AS step, id::text AS info FROM head
UNION ALL
SELECT 'profile', role || ' / ' || coalesce(full_name,'')
FROM public.profiles WHERE user_id IN (SELECT id FROM head)
UNION ALL
SELECT 'user_roles', r.role || ' approved=' || r.approved
FROM public.user_roles r WHERE r.user_id IN (SELECT id FROM head)
UNION ALL
SELECT 'institution_faculty_members',
       coalesce(specific_role,'?') || ' dept=' || coalesce(department_id::text,'NULL')
       || ' inst=' || coalesce(institution_id::text,'NULL')
FROM public.institution_faculty_members f WHERE f.user_id IN (SELECT id FROM head)
UNION ALL
SELECT 'department_members', coalesce(d.department_name,'?') || ' (' || dm.department_id::text || ')'
FROM public.department_members dm
LEFT JOIN public.departments d ON d.id = dm.department_id
WHERE dm.user_id IN (SELECT id FROM head);

-- ──────────────────────────────────────────────────────────────────────────
-- (1) إعادة تعريف user_in_department لتشمل institution_faculty_members
--     (نفس هجرة 20260824000002)
-- ──────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.user_in_department(_user uuid, _dept uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT (
    auth.role() = 'service_role'
    OR _user = auth.uid()
  ) AND (
    EXISTS (
      SELECT 1
      FROM public.department_members dm
      JOIN public.departments d ON d.id = dm.department_id
      WHERE dm.user_id = _user
        AND dm.department_id = _dept
        AND public.institution_plan_is_active(d.institution_type, d.institution_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.institution_faculty_members ifm
      JOIN public.departments d ON d.id = ifm.department_id
      WHERE ifm.user_id = _user
        AND ifm.department_id = _dept
        AND public.institution_plan_is_active(d.institution_type, d.institution_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.institution_faculty_members ifm2
      JOIN public.departments d2 ON d2.institution_id = ifm2.institution_id
        AND d2.institution_type = ifm2.institution_type
        AND d2.id = _dept
      WHERE ifm2.user_id = _user
        AND ifm2.specific_role IN (
          'dean','vice_dean','vice_dean_postgrad','vice_dean_students',
          'vice_dean_community','vice_dean_environment'
        )
    )
  )
$$;

REVOKE ALL ON FUNCTION public.user_in_department(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_in_department(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_department_member(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ SELECT public.user_in_department(_user_id, _department_id) $$;

REVOKE ALL ON FUNCTION public.is_department_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_department_member(uuid, uuid) TO authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────
-- (2) سياسة القراءة: أعضاء الكلية يرون أقسام مؤسستهم (هجرة 20260819000000)
-- ──────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='departments' AND policyname='dept_faculty_select'
  ) THEN
    CREATE POLICY "dept_faculty_select"
    ON public.departments FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.institution_faculty_members ifm
        WHERE ifm.user_id = auth.uid()
          AND ifm.institution_id = departments.institution_id
          AND ifm.institution_type = departments.institution_type
          AND ifm.specific_role IN (
            'dean','vice_dean_postgrad','vice_dean_students','vice_dean_community',
            'department_head','teaching_assistant','professor','doctor',
            'assistant_lecturer','lecturer'
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.department_members dm
        WHERE dm.user_id = auth.uid()
          AND dm.department_id = departments.id
          AND dm.role IN (
            'dean','vice_dean_postgrad','vice_dean_students','vice_dean_community',
            'department_head','teaching_assistant','professor','doctor',
            'assistant_lecturer','lecturer'
          )
      )
    );
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- (3) سياسة السماح لرئيس القسم بإدراج المحاضرات (هجرة 20260817000000)
-- ──────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='courses' AND policyname='Department heads can insert courses'
  ) THEN
    CREATE POLICY "Department heads can insert courses"
    ON public.courses FOR INSERT
    WITH CHECK (
      public.has_approved_role(auth.uid(), 'department_head')
      AND auth.uid() = creator_id
    );
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- (4) ترحيل أعضاء هيئة التدريس الناقصين إلى department_members
--     (نسخة مطورة من back-fill في 20260819000000 — تعمل لأي عضو ناقص)
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO public.department_members (
  department_id, user_id, full_name, role, email, phone, invitation_code,
  date_of_birth, photo_url, national_id, gender, address, qualification,
  specialization, hire_date, notes
)
SELECT
  ifm.department_id, ifm.user_id, ifm.full_name, ifm.specific_role, ifm.email,
  ifm.phone,
  'FAC-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  ifm.date_of_birth, ifm.photo_url, ifm.national_id, ifm.gender, ifm.address,
  ifm.qualification, ifm.specialization, ifm.hire_date, ifm.notes
FROM public.institution_faculty_members ifm
WHERE ifm.department_id IS NOT NULL
  AND ifm.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.department_members dm
    WHERE dm.department_id = ifm.department_id AND dm.user_id = ifm.user_id
  )
ON CONFLICT (department_id, user_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────
-- (5) التأكد أن دور رئيس القسم معتمد في user_roles
--     (استبدل البريد ببريد الرئيس إن لزم — يعمم على كل من دوره في IFM رئيس قسم)
-- ──────────────────────────────────────────────────────────────────────────
INSERT INTO public.user_roles (user_id, role, approved)
SELECT DISTINCT ifm.user_id, 'department_head'::app_role, true
FROM public.institution_faculty_members ifm
WHERE ifm.specific_role = 'department_head'
  AND ifm.user_id IS NOT NULL
ON CONFLICT (user_id, role) DO UPDATE SET approved = true;

-- ──────────────────────────────────────────────────────────────────────────
-- (6) تحقق نهائي: هل يستطيع الرئيس الآن الإدراج؟ (يجب أن يرجع true)
--     ضع بريده واسم قسم المحاسبة
-- ──────────────────────────────────────────────────────────────────────────
-- SELECT public.user_in_department(
--   (SELECT id FROM auth.users WHERE email = 'head@example.com'),
--   (SELECT id FROM public.departments WHERE department_name ILIKE '%محاسبات%')
-- ) AS can_insert;
