-- ── Replay protection for the signed ingestion endpoint ──
CREATE TABLE public.security_ingest_nonces (
  nonce text NOT NULL PRIMARY KEY,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.security_ingest_nonces TO authenticated;
GRANT ALL ON public.security_ingest_nonces TO service_role;
ALTER TABLE public.security_ingest_nonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_nonces" ON public.security_ingest_nonces
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- ── Rate limiting for scan / ingest endpoints ──
CREATE TABLE public.security_rate_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket text NOT NULL,
  principal text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX security_rate_limits_lookup_idx
  ON public.security_rate_limits (bucket, principal, attempted_at DESC);
GRANT SELECT ON public.security_rate_limits TO authenticated;
GRANT ALL ON public.security_rate_limits TO service_role;
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin_read_rate_limits" ON public.security_rate_limits
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- ── Read-only posture snapshot (service_role only) ──
CREATE OR REPLACE FUNCTION public.security_audit_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'generated_at', now(),

    'tables_without_rls', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('table', c.relname))
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false
    ), '[]'::jsonb),

    'tables_rls_no_policy', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('table', c.relname))
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
        AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)
    ), '[]'::jsonb),

    'permissive_policies', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'table', tablename, 'policy', policyname, 'command', cmd,
        'roles', roles, 'using', qual, 'check', with_check))
      FROM pg_policies
      WHERE schemaname = 'public'
        AND (COALESCE(qual, 'true') = 'true' OR COALESCE(with_check, 'true') = 'true')
    ), '[]'::jsonb),

    'anon_writable_tables', COALESCE((
      SELECT jsonb_agg(DISTINCT jsonb_build_object('table', table_name, 'privilege', privilege_type))
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public' AND grantee = 'anon'
        AND privilege_type IN ('INSERT','UPDATE','DELETE','TRUNCATE')
    ), '[]'::jsonb),

    'definer_functions_without_search_path', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('function', p.proname))
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prosecdef = true
        AND NOT EXISTS (
          SELECT 1 FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
          WHERE cfg LIKE 'search_path=%'
        )
    ), '[]'::jsonb),

    'definer_functions_anon_executable', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('function', p.proname))
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.prosecdef = true
        AND has_function_privilege('anon', p.oid, 'EXECUTE')
    ), '[]'::jsonb),

    'views_without_security_invoker', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('view', c.relname))
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'v'
        AND NOT EXISTS (
          SELECT 1 FROM unnest(COALESCE(c.reloptions, ARRAY[]::text[])) opt
          WHERE opt ILIKE 'security_invoker=%true%'
        )
    ), '[]'::jsonb),

    'public_storage_buckets', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('bucket', b.id))
      FROM storage.buckets b WHERE b.public = true
    ), '[]'::jsonb),

    'tables_missing_owner_column', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('table', c.relname))
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
        AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns col
          WHERE col.table_schema = 'public' AND col.table_name = c.relname
            AND col.column_name IN ('user_id','owner_id','institution_id','department_id','creator_id','student_id')
        )
    ), '[]'::jsonb),

    'conflicting_active_roles', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'roles', roles))
      FROM (
        SELECT ur.user_id, array_agg(DISTINCT ur.role::text ORDER BY ur.role::text) AS roles
        FROM public.user_roles ur
        WHERE ur.approved = true
        GROUP BY ur.user_id
        HAVING count(DISTINCT ur.role) > 1
           AND bool_or(ur.role IN ('student','school_student'))
           AND bool_or(ur.role IN ('admin','lecturer','dean','vice_dean','department_head'))
      ) s
    ), '[]'::jsonb),

    'profile_role_mismatch_count', (
      SELECT count(*) FROM public.profiles p
      WHERE EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.user_id AND ur.approved = true AND ur.role::text <> p.role
      )
    ),

    'multi_institution_users', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'institutions', n))
      FROM (
        SELECT user_id, count(DISTINCT institution_id) AS n
        FROM public.institution_faculty_members
        GROUP BY user_id HAVING count(DISTINCT institution_id) > 1
      ) s
    ), '[]'::jsonb),

    'orphan_department_members', (
      SELECT count(*) FROM public.department_members dm
      WHERE NOT EXISTS (SELECT 1 FROM public.departments d WHERE d.id = dm.department_id)
    ),

    'unapproved_admin_roles', (
      SELECT count(*) FROM public.user_roles WHERE role = 'admin'::app_role AND approved = false
    ),

    'recent_role_changes', (
      SELECT count(*) FROM public.user_roles
      WHERE updated_at > now() - interval '7 days' AND updated_at <> created_at
    ),

    'recent_faculty_edits', (
      SELECT count(*) FROM public.faculty_edit_audit WHERE created_at > now() - interval '7 days'
    ),

    'pending_password_changes', (
      SELECT count(*) FROM public.profiles WHERE must_change_password = true
    ),

    'active_sessions_stale', (
      SELECT count(*) FROM public.active_sessions WHERE last_seen < now() - interval '30 days'
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.security_audit_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.security_audit_snapshot() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.security_audit_snapshot() TO service_role;

-- ── Deduplicating finding upsert (service_role only) ──
CREATE OR REPLACE FUNCTION public.security_record_findings(_scan_id uuid, _findings jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  f jsonb;
  n integer := 0;
BEGIN
  FOR f IN SELECT * FROM jsonb_array_elements(COALESCE(_findings, '[]'::jsonb))
  LOOP
    INSERT INTO public.security_findings (
      scan_id, fingerprint, scanner, title_ar, title_en, severity, category,
      component, evidence, owasp_category, impact_ar, impact_en,
      remediation_ar, remediation_en, confidence, ai_analysis
    ) VALUES (
      _scan_id,
      f->>'fingerprint',
      COALESCE(f->>'scanner', 'internal'),
      COALESCE(f->>'title_ar', f->>'title_en', 'finding'),
      COALESCE(f->>'title_en', f->>'title_ar', 'finding'),
      COALESCE(f->>'severity', 'informational'),
      COALESCE(f->>'category', 'general'),
      f->>'component',
      f->>'evidence',
      f->>'owasp_category',
      f->>'impact_ar', f->>'impact_en',
      f->>'remediation_ar', f->>'remediation_en',
      COALESCE(f->>'confidence', 'medium'),
      f->'ai_analysis'
    )
    ON CONFLICT (fingerprint) DO UPDATE SET
      scan_id = EXCLUDED.scan_id,
      severity = EXCLUDED.severity,
      component = EXCLUDED.component,
      evidence = EXCLUDED.evidence,
      impact_ar = EXCLUDED.impact_ar,
      impact_en = EXCLUDED.impact_en,
      remediation_ar = EXCLUDED.remediation_ar,
      remediation_en = EXCLUDED.remediation_en,
      confidence = EXCLUDED.confidence,
      ai_analysis = COALESCE(EXCLUDED.ai_analysis, public.security_findings.ai_analysis),
      last_detected_at = now(),
      updated_at = now(),
      status = CASE WHEN public.security_findings.status = 'fixed'
                    THEN 'open' ELSE public.security_findings.status END;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.security_record_findings(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.security_record_findings(uuid, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.security_record_findings(uuid, jsonb) TO service_role;