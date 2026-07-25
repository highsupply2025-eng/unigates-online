
-- ============================================================================
-- Lock down leadership-approval columns on public.quizzes and public.lecture_schedules
-- via BEFORE INSERT / BEFORE UPDATE triggers. Idempotent.
-- ============================================================================

-- ---------- QUIZZES ---------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_quiz_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_service boolean := (auth.role() = 'service_role');
  v_is_admin boolean := v_uid IS NOT NULL AND public.has_role(v_uid, 'admin'::app_role);
  v_in_inst boolean;
  v_is_head boolean;
  v_is_vd boolean;
  v_is_dean boolean;
  v_stage_changed_lecturer boolean;
  v_stage_changed_head boolean;
  v_stage_changed_vd_students boolean;
  v_stage_changed_vd_postgrad boolean;
  v_stage_changed_vd_environment boolean;
  v_stage_changed_vd_combined boolean;
  v_stage_changed_dean boolean;
  v_stage_changed_publish boolean;
  v_stage_changed_reject boolean;
  v_all_vd_new boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Force all protected fields to safe defaults; ignore anything the client sent.
    NEW.approved_by_lecturer := false;
    NEW.approved_by_lecturer_at := NULL;
    NEW.approved_by_lecturer_id := NULL;
    NEW.approved_by_head := false;
    NEW.approved_by_head_at := NULL;
    NEW.approved_by_head_id := NULL;
    NEW.approved_by_vice_dean := false;
    NEW.approved_by_vice_dean_at := NULL;
    NEW.approved_by_vice_dean_id := NULL;
    NEW.approved_by_vice_dean_students := false;
    NEW.approved_by_vice_dean_students_at := NULL;
    NEW.approved_by_vice_dean_students_id := NULL;
    NEW.approved_by_vice_dean_postgrad := false;
    NEW.approved_by_vice_dean_postgrad_at := NULL;
    NEW.approved_by_vice_dean_postgrad_id := NULL;
    NEW.approved_by_vice_dean_environment := false;
    NEW.approved_by_vice_dean_environment_at := NULL;
    NEW.approved_by_vice_dean_environment_id := NULL;
    NEW.approved_by_dean := false;
    NEW.approved_by_dean_at := NULL;
    NEW.approved_by_dean_id := NULL;
    NEW.results_published := false;
    NEW.rejected_by := NULL;
    NEW.rejected_at := NULL;
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE path
  IF v_is_service OR v_is_admin THEN
    RETURN NEW;
  END IF;

  v_stage_changed_lecturer :=
        NEW.approved_by_lecturer    IS DISTINCT FROM OLD.approved_by_lecturer
     OR NEW.approved_by_lecturer_at IS DISTINCT FROM OLD.approved_by_lecturer_at
     OR NEW.approved_by_lecturer_id IS DISTINCT FROM OLD.approved_by_lecturer_id;

  v_stage_changed_head :=
        NEW.approved_by_head    IS DISTINCT FROM OLD.approved_by_head
     OR NEW.approved_by_head_at IS DISTINCT FROM OLD.approved_by_head_at
     OR NEW.approved_by_head_id IS DISTINCT FROM OLD.approved_by_head_id;

  v_stage_changed_vd_students :=
        NEW.approved_by_vice_dean_students    IS DISTINCT FROM OLD.approved_by_vice_dean_students
     OR NEW.approved_by_vice_dean_students_at IS DISTINCT FROM OLD.approved_by_vice_dean_students_at
     OR NEW.approved_by_vice_dean_students_id IS DISTINCT FROM OLD.approved_by_vice_dean_students_id;

  v_stage_changed_vd_postgrad :=
        NEW.approved_by_vice_dean_postgrad    IS DISTINCT FROM OLD.approved_by_vice_dean_postgrad
     OR NEW.approved_by_vice_dean_postgrad_at IS DISTINCT FROM OLD.approved_by_vice_dean_postgrad_at
     OR NEW.approved_by_vice_dean_postgrad_id IS DISTINCT FROM OLD.approved_by_vice_dean_postgrad_id;

  v_stage_changed_vd_environment :=
        NEW.approved_by_vice_dean_environment    IS DISTINCT FROM OLD.approved_by_vice_dean_environment
     OR NEW.approved_by_vice_dean_environment_at IS DISTINCT FROM OLD.approved_by_vice_dean_environment_at
     OR NEW.approved_by_vice_dean_environment_id IS DISTINCT FROM OLD.approved_by_vice_dean_environment_id;

  v_stage_changed_vd_combined :=
        NEW.approved_by_vice_dean    IS DISTINCT FROM OLD.approved_by_vice_dean
     OR NEW.approved_by_vice_dean_at IS DISTINCT FROM OLD.approved_by_vice_dean_at
     OR NEW.approved_by_vice_dean_id IS DISTINCT FROM OLD.approved_by_vice_dean_id;

  v_stage_changed_dean :=
        NEW.approved_by_dean    IS DISTINCT FROM OLD.approved_by_dean
     OR NEW.approved_by_dean_at IS DISTINCT FROM OLD.approved_by_dean_at
     OR NEW.approved_by_dean_id IS DISTINCT FROM OLD.approved_by_dean_id;

  v_stage_changed_publish := NEW.results_published IS DISTINCT FROM OLD.results_published;

  v_stage_changed_reject :=
        NEW.rejected_by      IS DISTINCT FROM OLD.rejected_by
     OR NEW.rejected_at      IS DISTINCT FROM OLD.rejected_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason;

  -- Fast path: nothing protected changed.
  IF NOT (v_stage_changed_lecturer OR v_stage_changed_head
       OR v_stage_changed_vd_students OR v_stage_changed_vd_postgrad OR v_stage_changed_vd_environment
       OR v_stage_changed_vd_combined OR v_stage_changed_dean
       OR v_stage_changed_publish OR v_stage_changed_reject) THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not allowed to modify quiz approval fields'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Once rejected, only admins/service (already returned above) may touch protected fields.
  IF OLD.rejected_by IS NOT NULL THEN
    RAISE EXCEPTION 'Quiz already rejected; approval fields are frozen'
      USING ERRCODE = 'check_violation';
  END IF;

  v_in_inst := public.user_in_my_leadership_institution(OLD.creator_id);
  v_is_head := public.has_approved_role(v_uid, 'department_head'::app_role);
  v_is_vd   := public.has_approved_role(v_uid, 'vice_dean'::app_role);
  v_is_dean := public.has_approved_role(v_uid, 'dean'::app_role);

  -- Lecturer sign-off: only the creator may set it, only to TRUE, only once.
  IF v_stage_changed_lecturer THEN
    IF v_uid <> OLD.creator_id
       OR OLD.approved_by_lecturer
       OR NEW.approved_by_lecturer IS NOT TRUE
       OR NEW.approved_by_lecturer_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_lecturer_at IS NULL THEN
      RAISE EXCEPTION 'Invalid lecturer approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Head approval: only an approved department_head in this institution, after lecturer sign-off, one-way to TRUE.
  IF v_stage_changed_head THEN
    IF NOT (v_is_head AND v_in_inst)
       OR NOT COALESCE(NEW.approved_by_lecturer, false)
       OR OLD.approved_by_head
       OR NEW.approved_by_head IS NOT TRUE
       OR NEW.approved_by_head_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_head_at IS NULL THEN
      RAISE EXCEPTION 'Invalid head approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Any vice-dean sub-approval: requires vice_dean role in institution, head approved, one-way to TRUE, id=self.
  IF v_stage_changed_vd_students THEN
    IF NOT (v_is_vd AND v_in_inst)
       OR NOT COALESCE(NEW.approved_by_head, false)
       OR OLD.approved_by_vice_dean_students
       OR NEW.approved_by_vice_dean_students IS NOT TRUE
       OR NEW.approved_by_vice_dean_students_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_vice_dean_students_at IS NULL THEN
      RAISE EXCEPTION 'Invalid vice-dean (students) approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF v_stage_changed_vd_postgrad THEN
    IF NOT (v_is_vd AND v_in_inst)
       OR NOT COALESCE(NEW.approved_by_head, false)
       OR OLD.approved_by_vice_dean_postgrad
       OR NEW.approved_by_vice_dean_postgrad IS NOT TRUE
       OR NEW.approved_by_vice_dean_postgrad_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_vice_dean_postgrad_at IS NULL THEN
      RAISE EXCEPTION 'Invalid vice-dean (postgrad) approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF v_stage_changed_vd_environment THEN
    IF NOT (v_is_vd AND v_in_inst)
       OR NOT COALESCE(NEW.approved_by_head, false)
       OR OLD.approved_by_vice_dean_environment
       OR NEW.approved_by_vice_dean_environment IS NOT TRUE
       OR NEW.approved_by_vice_dean_environment_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_vice_dean_environment_at IS NULL THEN
      RAISE EXCEPTION 'Invalid vice-dean (environment) approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  v_all_vd_new :=
       COALESCE(NEW.approved_by_vice_dean_students, false)
   AND COALESCE(NEW.approved_by_vice_dean_postgrad, false)
   AND COALESCE(NEW.approved_by_vice_dean_environment, false);

  -- Combined vice-dean flag: only a VD in institution may set it, and only when all three sub-approvals are TRUE in NEW.
  IF v_stage_changed_vd_combined THEN
    IF NOT (v_is_vd AND v_in_inst)
       OR OLD.approved_by_vice_dean
       OR NEW.approved_by_vice_dean IS NOT TRUE
       OR NEW.approved_by_vice_dean_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_vice_dean_at IS NULL
       OR NOT v_all_vd_new THEN
      RAISE EXCEPTION 'Invalid combined vice-dean approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Dean approval: dean role in institution, all VD sub-approvals TRUE, one-way to TRUE, id=self.
  IF v_stage_changed_dean THEN
    IF NOT (v_is_dean AND v_in_inst)
       OR NOT v_all_vd_new
       OR OLD.approved_by_dean
       OR NEW.approved_by_dean IS NOT TRUE
       OR NEW.approved_by_dean_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_dean_at IS NULL THEN
      RAISE EXCEPTION 'Invalid dean approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Results publication: only the dean may set it, only to TRUE, only after full chain in NEW.
  IF v_stage_changed_publish THEN
    IF NOT (v_is_dean AND v_in_inst)
       OR NEW.results_published IS NOT TRUE
       OR NOT COALESCE(NEW.approved_by_lecturer, false)
       OR NOT COALESCE(NEW.approved_by_head, false)
       OR NOT v_all_vd_new
       OR NOT COALESCE(NEW.approved_by_dean, false) THEN
      RAISE EXCEPTION 'Invalid results_published change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Rejection: any head/VD/dean in the institution may reject; must record their own id.
  IF v_stage_changed_reject THEN
    IF NOT ((v_is_head OR v_is_vd OR v_is_dean) AND v_in_inst)
       OR NEW.rejected_by IS DISTINCT FROM v_uid
       OR NEW.rejected_at IS NULL THEN
      RAISE EXCEPTION 'Invalid rejection change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_quiz_approval_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_quiz_approval_fields_ins ON public.quizzes;
DROP TRIGGER IF EXISTS enforce_quiz_approval_fields_upd ON public.quizzes;
CREATE TRIGGER enforce_quiz_approval_fields_ins
  BEFORE INSERT ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quiz_approval_fields();
CREATE TRIGGER enforce_quiz_approval_fields_upd
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quiz_approval_fields();


-- ---------- LECTURE SCHEDULES ----------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_schedule_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_service boolean := (auth.role() = 'service_role');
  v_is_admin boolean := v_uid IS NOT NULL AND public.has_role(v_uid, 'admin'::app_role);
  v_in_inst boolean;
  v_is_head boolean;
  v_is_vd boolean;
  v_is_dean boolean;
  v_ch_head boolean;
  v_ch_vd boolean;
  v_ch_dean boolean;
  v_ch_reject boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.approved_by_head := false;
    NEW.approved_by_head_at := NULL;
    NEW.approved_by_head_id := NULL;
    NEW.approved_by_vice_dean := false;
    NEW.approved_by_vice_dean_at := NULL;
    NEW.approved_by_vice_dean_id := NULL;
    NEW.approved_by_dean := false;
    NEW.approved_by_dean_at := NULL;
    NEW.approved_by_dean_id := NULL;
    NEW.rejected_by := NULL;
    NEW.rejected_at := NULL;
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  IF v_is_service OR v_is_admin THEN
    RETURN NEW;
  END IF;

  v_ch_head :=
        NEW.approved_by_head    IS DISTINCT FROM OLD.approved_by_head
     OR NEW.approved_by_head_at IS DISTINCT FROM OLD.approved_by_head_at
     OR NEW.approved_by_head_id IS DISTINCT FROM OLD.approved_by_head_id;
  v_ch_vd :=
        NEW.approved_by_vice_dean    IS DISTINCT FROM OLD.approved_by_vice_dean
     OR NEW.approved_by_vice_dean_at IS DISTINCT FROM OLD.approved_by_vice_dean_at
     OR NEW.approved_by_vice_dean_id IS DISTINCT FROM OLD.approved_by_vice_dean_id;
  v_ch_dean :=
        NEW.approved_by_dean    IS DISTINCT FROM OLD.approved_by_dean
     OR NEW.approved_by_dean_at IS DISTINCT FROM OLD.approved_by_dean_at
     OR NEW.approved_by_dean_id IS DISTINCT FROM OLD.approved_by_dean_id;
  v_ch_reject :=
        NEW.rejected_by      IS DISTINCT FROM OLD.rejected_by
     OR NEW.rejected_at      IS DISTINCT FROM OLD.rejected_at
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason;

  IF NOT (v_ch_head OR v_ch_vd OR v_ch_dean OR v_ch_reject) THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not allowed to modify schedule approval fields'
      USING ERRCODE = 'check_violation';
  END IF;

  IF OLD.rejected_by IS NOT NULL THEN
    RAISE EXCEPTION 'Schedule already rejected; approval fields are frozen'
      USING ERRCODE = 'check_violation';
  END IF;

  v_in_inst := public.user_in_my_leadership_institution(OLD.creator_id);
  v_is_head := public.has_approved_role(v_uid, 'department_head'::app_role);
  v_is_vd   := public.has_approved_role(v_uid, 'vice_dean'::app_role);
  v_is_dean := public.has_approved_role(v_uid, 'dean'::app_role);

  IF v_ch_head THEN
    IF NOT (v_is_head AND v_in_inst)
       OR OLD.approved_by_head
       OR NEW.approved_by_head IS NOT TRUE
       OR NEW.approved_by_head_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_head_at IS NULL THEN
      RAISE EXCEPTION 'Invalid schedule head approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_ch_vd THEN
    IF NOT (v_is_vd AND v_in_inst)
       OR NOT COALESCE(NEW.approved_by_head, false)
       OR OLD.approved_by_vice_dean
       OR NEW.approved_by_vice_dean IS NOT TRUE
       OR NEW.approved_by_vice_dean_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_vice_dean_at IS NULL THEN
      RAISE EXCEPTION 'Invalid schedule vice-dean approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_ch_dean THEN
    IF NOT (v_is_dean AND v_in_inst)
       OR NOT COALESCE(NEW.approved_by_vice_dean, false)
       OR OLD.approved_by_dean
       OR NEW.approved_by_dean IS NOT TRUE
       OR NEW.approved_by_dean_id IS DISTINCT FROM v_uid
       OR NEW.approved_by_dean_at IS NULL THEN
      RAISE EXCEPTION 'Invalid schedule dean approval change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF v_ch_reject THEN
    IF NOT ((v_is_head OR v_is_vd OR v_is_dean) AND v_in_inst)
       OR NEW.rejected_by IS DISTINCT FROM v_uid
       OR NEW.rejected_at IS NULL THEN
      RAISE EXCEPTION 'Invalid schedule rejection change'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_schedule_approval_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS enforce_schedule_approval_fields_ins ON public.lecture_schedules;
DROP TRIGGER IF EXISTS enforce_schedule_approval_fields_upd ON public.lecture_schedules;
CREATE TRIGGER enforce_schedule_approval_fields_ins
  BEFORE INSERT ON public.lecture_schedules
  FOR EACH ROW EXECUTE FUNCTION public.enforce_schedule_approval_fields();
CREATE TRIGGER enforce_schedule_approval_fields_upd
  BEFORE UPDATE ON public.lecture_schedules
  FOR EACH ROW EXECUTE FUNCTION public.enforce_schedule_approval_fields();
