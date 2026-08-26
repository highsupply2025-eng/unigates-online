-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: 500 Internal Server Error on profiles queries during login (v2)
--
-- ROOT CAUSE:
-- The "profiles_visible_via_safe_helper" RLS policy calls can_view_profile()
-- which queries tables (department_members, departments, etc.) that have their
-- own recursive RLS policies. Even with EXCEPTION WHEN OTHERS in PL/pgSQL,
-- PostgreSQL can propagate the error to PostgREST before the handler catches
-- it, resulting in a 500.
--
-- FIX:
--   1. Drop the problematic cross-user SELECT policies on profiles.
--   2. Keep only the simple self-read policy (auth.uid() = user_id).
--   3. Ensure the required columns exist (idempotent).
--   4. Create a SECURITY DEFINER RPC (get_or_create_login_profile) that
--      bypasses RLS entirely and auto-creates a profile row if missing.
--   5. Cross-user visibility (admin/institution leader) is handled via
--      dedicated RPCs, not RLS policies on profiles.
--
-- Idempotent: safe to run repeatedly.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── A. Ensure required columns exist ───────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'courses';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- ── B. Drop ALL problematic cross-user SELECT policies ─────────────────────
-- These policies call can_view_profile() or join department_members/departments
-- which have recursive RLS, causing 500 errors.
DROP POLICY IF EXISTS "profiles_visible_via_safe_helper"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_visible_via_helper"                  ON public.profiles;
DROP POLICY IF EXISTS "Institution admins can view department member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Leadership can view profiles in same department"       ON public.profiles;

-- ── C. Ensure the self-read policy exists (simple, bulletproof) ────────────
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ── D. Admin view-all policy using a safe SECURITY DEFINER function ────────
-- This function does NOT recurse into tables with recursive RLS.
CREATE OR REPLACE FUNCTION public.is_admin_user(_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role = 'admin'
      AND approved = true
    LIMIT 1
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin_user());

-- ── E. SECURITY DEFINER RPC: get_or_create_login_profile ───────────────────
-- Bypasses RLS entirely. Returns the user's profile row as JSON.
-- If no profile exists, auto-creates one from auth.users + user_roles data.
-- This is the ONLY way to fetch a profile during login — avoids RLS 500s.
CREATE OR REPLACE FUNCTION public.get_or_create_login_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id  uuid := auth.uid();
  v_profile  json;
  v_email    text;
  v_name     text;
  v_role     text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. Try existing profile (fast path — no write)
  SELECT row_to_json(p) INTO v_profile
  FROM public.profiles p
  WHERE p.user_id = v_user_id;

  IF v_profile IS NOT NULL THEN
    RETURN v_profile;
  END IF;

  -- 2. Profile missing — gather data from auth.users + user_roles
  SELECT email,
         COALESCE(raw_user_meta_data ->> 'full_name', ''),
         COALESCE(raw_user_meta_data ->> 'name', '')
  INTO v_email, v_name, v_name
  FROM auth.users
  WHERE id = v_user_id;

  SELECT role::text INTO v_role
  FROM public.user_roles
  WHERE user_id = v_user_id
  ORDER BY
    CASE role
      WHEN 'admin'             THEN 1
      WHEN 'dean'              THEN 2
      WHEN 'vice_dean'         THEN 3
      WHEN 'department_head'   THEN 4
      WHEN 'college_admin'     THEN 5
      WHEN 'institute_admin'   THEN 6
      WHEN 'school_admin'      THEN 7
      WHEN 'lecturer'          THEN 8
      WHEN 'teacher'           THEN 9
      WHEN 'teaching_assistant'THEN 10
      WHEN 'college_secretary' THEN 11
      WHEN 'library_manager'   THEN 12
      WHEN 'student'           THEN 13
      WHEN 'school_student'    THEN 14
      WHEN 'personal'          THEN 15
      WHEN 'parent'            THEN 16
      ELSE 99
    END
  LIMIT 1;

  -- 3. Insert with ON CONFLICT to avoid race conditions
  INSERT INTO public.profiles (user_id, role, full_name, email, platform)
  VALUES (
    v_user_id,
    COALESCE(v_role, 'student'),
    COALESCE(NULLIF(v_name, ''), v_email, 'User'),
    COALESCE(v_email, ''),
    'courses'
  )
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = EXCLUDED.full_name
  RETURNING row_to_json(profiles.*) INTO v_profile;

  -- 4. Final fetch (covers ON CONFLICT DO UPDATE path)
  IF v_profile IS NULL THEN
    SELECT row_to_json(p) INTO v_profile
    FROM public.profiles p
    WHERE p.user_id = v_user_id;
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_login_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_login_profile() TO authenticated;

-- ── F. Re-add safe cross-user visibility policy ─────────────────────────────
-- The old can_view_profile() queried department_members/departments which have
-- recursive RLS, causing 500s.  This version removes that join entirely and
-- only uses institution_faculty_members + college/institute_registrations
-- (which are SAFE because can_view_profile is SECURITY DEFINER and bypasses
-- their RLS).  The EXCEPTION WHEN OTHERS guard catches any remaining edge case.
CREATE OR REPLACE FUNCTION public.can_view_profile(_target uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF _target = auth.uid() THEN
    RETURN true;
  END IF;

  IF public.is_admin_user() THEN
    RETURN true;
  END IF;

  -- Institution owner: can see members of their approved college / institute.
  IF EXISTS (
    SELECT 1
    FROM public.institution_faculty_members f
    JOIN auth.users u ON u.id = auth.uid()
    WHERE f.user_id = _target
      AND (
        (f.institution_type = 'college' AND EXISTS (
          SELECT 1 FROM public.college_registrations cr
          WHERE cr.id = f.institution_id AND cr.status = 'approved'
            AND lower(cr.email) = lower(u.email)
        ))
        OR (f.institution_type = 'institute' AND EXISTS (
          SELECT 1 FROM public.institute_registrations ir
          WHERE ir.id = f.institution_id AND ir.status = 'approved'
            AND lower(ir.email) = lower(u.email)
        ))
      )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated;

-- ── G. Cross-user visibility via safe helper (institution leaders, etc.) ────
CREATE POLICY "profiles_visible_via_safe_helper"
ON public.profiles FOR SELECT TO authenticated
USING (public.can_view_profile(user_id));
