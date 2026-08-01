-- Server-side super_admin verification (never trust client-sent roles)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
      AND approved = true
  )
$$;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

-- ─────────────── security_scans ───────────────
CREATE TABLE public.security_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_type text NOT NULL DEFAULT 'full',
  status text NOT NULL DEFAULT 'running',
  source text NOT NULL DEFAULT 'manual',
  read_only boolean NOT NULL DEFAULT true,
  triggered_by uuid,
  score integer,
  counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  error text,
  idempotency_key text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX security_scans_idempotency_key_uidx
  ON public.security_scans (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX security_scans_started_at_idx ON public.security_scans (started_at DESC);
CREATE UNIQUE INDEX security_scans_single_running_uidx
  ON public.security_scans ((status)) WHERE status = 'running';

GRANT SELECT ON public.security_scans TO authenticated;
GRANT ALL ON public.security_scans TO service_role;
ALTER TABLE public.security_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_scans" ON public.security_scans
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- ─────────────── security_findings ───────────────
CREATE TABLE public.security_findings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id uuid REFERENCES public.security_scans(id) ON DELETE SET NULL,
  fingerprint text NOT NULL,
  scanner text NOT NULL DEFAULT 'internal',
  title_ar text NOT NULL,
  title_en text NOT NULL,
  severity text NOT NULL DEFAULT 'informational',
  category text NOT NULL DEFAULT 'general',
  component text,
  evidence text,
  owasp_category text,
  impact_ar text,
  impact_en text,
  remediation_ar text,
  remediation_en text,
  confidence text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  ai_analysis jsonb,
  ai_is_recommendation boolean NOT NULL DEFAULT true,
  first_detected_at timestamptz NOT NULL DEFAULT now(),
  last_detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT security_findings_fingerprint_key UNIQUE (fingerprint),
  CONSTRAINT security_findings_severity_chk CHECK (severity IN ('critical','high','medium','low','informational')),
  CONSTRAINT security_findings_status_chk CHECK (status IN ('open','reviewing','accepted_risk','fixed','false_positive')),
  CONSTRAINT security_findings_confidence_chk CHECK (confidence IN ('high','medium','low'))
);
CREATE INDEX security_findings_severity_idx ON public.security_findings (severity);
CREATE INDEX security_findings_status_idx ON public.security_findings (status);
CREATE INDEX security_findings_scan_idx ON public.security_findings (scan_id);

GRANT SELECT, UPDATE ON public.security_findings TO authenticated;
GRANT ALL ON public.security_findings TO service_role;
ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_findings" ON public.security_findings
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin_triage_findings" ON public.security_findings
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Only the triage status may be changed from a browser session; everything else is server-owned.
CREATE OR REPLACE FUNCTION public.security_findings_client_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.fingerprint IS DISTINCT FROM OLD.fingerprint
     OR NEW.scan_id IS DISTINCT FROM OLD.scan_id
     OR NEW.scanner IS DISTINCT FROM OLD.scanner
     OR NEW.severity IS DISTINCT FROM OLD.severity
     OR NEW.category IS DISTINCT FROM OLD.category
     OR NEW.component IS DISTINCT FROM OLD.component
     OR NEW.evidence IS DISTINCT FROM OLD.evidence
     OR NEW.owasp_category IS DISTINCT FROM OLD.owasp_category
     OR NEW.title_ar IS DISTINCT FROM OLD.title_ar
     OR NEW.title_en IS DISTINCT FROM OLD.title_en
     OR NEW.ai_analysis IS DISTINCT FROM OLD.ai_analysis
     OR NEW.first_detected_at IS DISTINCT FROM OLD.first_detected_at
     OR NEW.last_detected_at IS DISTINCT FROM OLD.last_detected_at THEN
    RAISE EXCEPTION 'only the finding status may be updated from a client session';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER security_findings_client_update_guard_trg
  BEFORE UPDATE ON public.security_findings
  FOR EACH ROW EXECUTE FUNCTION public.security_findings_client_update_guard();

-- ─────────────── security_events ───────────────
CREATE TABLE public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'informational',
  actor_user_id uuid,
  target_user_id uuid,
  institution_id uuid,
  ip_hash text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX security_events_created_at_idx ON public.security_events (created_at DESC);
CREATE INDEX security_events_type_idx ON public.security_events (event_type);

GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_events" ON public.security_events
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- ─────────────── security_settings ───────────────
CREATE TABLE public.security_settings (
  id integer NOT NULL DEFAULT 1 PRIMARY KEY,
  ai_analysis_enabled boolean NOT NULL DEFAULT true,
  scheduled_scans_enabled boolean NOT NULL DEFAULT false,
  scan_cron text NOT NULL DEFAULT '0 3 * * *',
  notification_emails text[] NOT NULL DEFAULT ARRAY[]::text[],
  retention_days integer NOT NULL DEFAULT 180,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT security_settings_singleton_chk CHECK (id = 1)
);
INSERT INTO public.security_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

GRANT SELECT ON public.security_settings TO authenticated;
GRANT ALL ON public.security_settings TO service_role;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_settings" ON public.security_settings
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- ─────────────── security_notifications ───────────────
CREATE TABLE public.security_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finding_id uuid REFERENCES public.security_findings(id) ON DELETE CASCADE,
  scan_id uuid REFERENCES public.security_scans(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'email',
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.security_notifications TO authenticated;
GRANT ALL ON public.security_notifications TO service_role;
ALTER TABLE public.security_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_notifications" ON public.security_notifications
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- ─────────────── security_remediation_reviews ───────────────
CREATE TABLE public.security_remediation_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finding_id uuid NOT NULL REFERENCES public.security_findings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  decision text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT security_reviews_decision_chk CHECK (decision IN ('reviewing','accepted_risk','fixed','false_positive','reopened'))
);
CREATE INDEX security_reviews_finding_idx ON public.security_remediation_reviews (finding_id);

GRANT SELECT, INSERT ON public.security_remediation_reviews TO authenticated;
GRANT ALL ON public.security_remediation_reviews TO service_role;
ALTER TABLE public.security_remediation_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_reviews" ON public.security_remediation_reviews
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin_insert_reviews" ON public.security_remediation_reviews
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) AND reviewer_id = auth.uid());

CREATE TRIGGER security_scans_set_updated_at
  BEFORE UPDATE ON public.security_scans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();