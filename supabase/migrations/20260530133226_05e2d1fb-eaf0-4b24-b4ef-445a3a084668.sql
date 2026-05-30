
-- 1. Remove leadership/staff SELECT policies on quiz_questions (exposes correct_answer).
-- Leadership doesn't need question-level access; students use the quiz_questions_safe view.
DROP POLICY IF EXISTS "Leadership can view own institution questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Staff can read quiz_questions" ON public.quiz_questions;

-- 2. Harden leadership_institution_ids to require approved user_roles entries.
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
    AND dm.role IN ('department_head', 'vice_dean', 'dean')
    AND public.has_approved_role(_user_id, dm.role::app_role)
$function$;

-- 3. Atomic invitation use enforcement on college_members.
CREATE OR REPLACE FUNCTION public.enforce_college_invitation_use()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.college_invitations%ROWTYPE;
BEGIN
  IF NEW.invitation_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_inv FROM public.college_invitations
    WHERE id = NEW.invitation_id FOR UPDATE;

  IF NOT FOUND OR v_inv.college_id <> NEW.college_id THEN
    RAISE EXCEPTION 'Invalid invitation';
  END IF;
  IF v_inv.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Invitation inactive';
  END IF;
  IF v_inv.expires_at IS NOT NULL AND v_inv.expires_at <= now() THEN
    RAISE EXCEPTION 'Invitation expired';
  END IF;
  IF v_inv.max_uses <> 0 AND v_inv.used_count >= v_inv.max_uses THEN
    RAISE EXCEPTION 'Invitation use limit reached';
  END IF;

  UPDATE public.college_invitations
    SET used_count = used_count + 1
    WHERE id = v_inv.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_college_invitation_use_trg ON public.college_members;
CREATE TRIGGER enforce_college_invitation_use_trg
  BEFORE INSERT ON public.college_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_college_invitation_use();
