// UniGates Security Center — read-only defensive audit.
// Super-admin only. Performs NO writes to production data; the only writes are
// to the security_* bookkeeping tables. No exploitation, no code execution.

import {
  corsHeaders, json, forbidden, serviceClient, requireSuperAdmin, rateLimit,
  maskSensitive, computeScore, countBySeverity, stableFingerprint,
  type RawFinding, type Severity,
} from "../_shared/security.ts";
import { analyzeFindings } from "./ai.ts";

const FUNCTION_VERSION = "2026-08-01-security-center-v1";

function f(
  partial: Omit<RawFinding, "fingerprint"> & { key: string },
): RawFinding {
  const { key, ...rest } = partial;
  return {
    ...rest,
    evidence: maskSensitive(rest.evidence),
    fingerprint: stableFingerprint([rest.category, key]),
  };
}

type Snapshot = Record<string, any>;

function dbFindings(s: Snapshot): RawFinding[] {
  const out: RawFinding[] = [];

  for (const row of s.tables_without_rls ?? []) {
    out.push(f({
      key: `no-rls:${row.table}`, category: "database", severity: "critical",
      title_ar: `جدول عام بدون سياسات حماية الصفوف: ${row.table}`,
      title_en: `Public table without RLS: ${row.table}`,
      component: `public.${row.table}`,
      evidence: `RLS is disabled on public.${row.table}`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "قد تكون كل صفوف الجدول قابلة للقراءة أو التعديل عبر واجهة البيانات.",
      impact_en: "Every row may be readable or writable through the Data API.",
      remediation_ar: "قم بتمكين RLS على الجدول ثم أضف سياسات محددة النطاق.",
      remediation_en: "Enable RLS on the table and add scoped policies.",
      confidence: "high",
    }));
  }

  for (const row of s.tables_rls_no_policy ?? []) {
    out.push(f({
      key: `rls-no-policy:${row.table}`, category: "database", severity: "medium",
      title_ar: `RLS مُمكّن بدون أي سياسة: ${row.table}`,
      title_en: `RLS enabled with no policies: ${row.table}`,
      component: `public.${row.table}`,
      evidence: `public.${row.table} has RLS enabled but zero policies`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "الجدول مقفل تماماً؛ قد تتعطل ميزات تعتمد عليه.",
      impact_en: "Table is fully locked; dependent features may break.",
      remediation_ar: "أضف سياسات صريحة أو أكد أن الجدول للخدمات الخلفية فقط.",
      remediation_en: "Add explicit policies or confirm the table is service-only.",
      confidence: "high",
    }));
  }

  for (const row of s.permissive_policies ?? []) {
    const anonExposed = String(row.roles ?? "").includes("anon");
    out.push(f({
      key: `permissive:${row.table}:${row.policy}`, category: "database",
      severity: anonExposed ? "high" : "medium",
      title_ar: `سياسة واسعة جداً على ${row.table}`,
      title_en: `Overly permissive policy on ${row.table}`,
      component: `public.${row.table} → ${row.policy}`,
      evidence: `command=${row.command} roles=${row.roles} using=${row.using ?? "true"} check=${row.check ?? "true"}`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "السياسة تسمح بالوصول دون التحقق من المالك أو المؤسسة.",
      impact_en: "Policy grants access without an owner or institution check.",
      remediation_ar: "قيّد السياسة بـ auth.uid() أو بملكية المؤسسة (institution_id).",
      remediation_en: "Scope the policy by auth.uid() or institution ownership.",
      confidence: anonExposed ? "high" : "medium",
    }));
  }

  for (const row of s.anon_writable_tables ?? []) {
    out.push(f({
      key: `anon-grant:${row.table}:${row.privilege}`, category: "database", severity: "high",
      title_ar: `صلاحية ${row.privilege} ممنوحة لدور anon على ${row.table}`,
      title_en: `${row.privilege} granted to anon on ${row.table}`,
      component: `public.${row.table}`,
      evidence: `grantee=anon privilege=${row.privilege}`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "زوار غير مسجلين قد يكتبون في الجدول.",
      impact_en: "Unauthenticated visitors may write to the table.",
      remediation_ar: "اسحب الصلاحية من anon واحتفظ بها لـ authenticated/service_role فقط.",
      remediation_en: "Revoke the grant from anon; keep authenticated/service_role only.",
      confidence: "high",
    }));
  }

  for (const row of s.definer_functions_without_search_path ?? []) {
    out.push(f({
      key: `definer-search-path:${row.function}`, category: "database", severity: "medium",
      title_ar: `دالة SECURITY DEFINER بدون search_path ثابت: ${row.function}`,
      title_en: `SECURITY DEFINER function without fixed search_path: ${row.function}`,
      component: `public.${row.function}()`,
      evidence: `prosecdef=true, no search_path in proconfig`,
      owasp_category: "A04:2021 Insecure Design",
      impact_ar: "قابلة لاختطاف مسار البحث وتنفيذ كائنات غير مقصودة.",
      impact_en: "Vulnerable to search_path hijacking.",
      remediation_ar: "أضف SET search_path = public إلى تعريف الدالة.",
      remediation_en: "Add SET search_path = public to the function definition.",
      confidence: "high",
    }));
  }

  for (const row of s.definer_functions_anon_executable ?? []) {
    out.push(f({
      key: `definer-anon:${row.function}`, category: "database", severity: "high",
      title_ar: `دالة SECURITY DEFINER قابلة للتنفيذ من anon: ${row.function}`,
      title_en: `SECURITY DEFINER function executable by anon: ${row.function}`,
      component: `public.${row.function}()`,
      evidence: `anon has EXECUTE on public.${row.function}`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "يمكن استدعاء منطق مرتفع الصلاحيات بدون تسجيل دخول.",
      impact_en: "Privileged logic can be invoked without signing in.",
      remediation_ar: "REVOKE EXECUTE من anon إن لم تكن الدالة عامة بشكل مقصود.",
      remediation_en: "REVOKE EXECUTE from anon unless the function is intentionally public.",
      confidence: "medium",
    }));
  }

  for (const row of s.views_without_security_invoker ?? []) {
    out.push(f({
      key: `view-invoker:${row.view}`, category: "database", severity: "high",
      title_ar: `عرض قد يتجاوز RLS: ${row.view}`,
      title_en: `View may bypass RLS: ${row.view}`,
      component: `public.${row.view}`,
      evidence: `security_invoker is not enabled on public.${row.view}`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "العرض ينفذ بصلاحيات مالكه فيتجاوز سياسات الجداول.",
      impact_en: "The view runs as its owner and bypasses table policies.",
      remediation_ar: "ALTER VIEW ... SET (security_invoker = true).",
      remediation_en: "ALTER VIEW ... SET (security_invoker = true).",
      confidence: "high",
    }));
  }

  for (const row of s.public_storage_buckets ?? []) {
    out.push(f({
      key: `public-bucket:${row.bucket}`, category: "storage", severity: "medium",
      title_ar: `مخزن ملفات عام: ${row.bucket}`,
      title_en: `Public storage bucket: ${row.bucket}`,
      component: `storage.buckets/${row.bucket}`,
      evidence: `bucket ${row.bucket} is public`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "الملفات قابلة للقراءة والسرد بدون مصادقة.",
      impact_en: "Files are readable and listable without authentication.",
      remediation_ar: "اجعل المخزن خاصاً واستخدم روابط موقعة مؤقتة.",
      remediation_en: "Make the bucket private and use short-lived signed URLs.",
      confidence: "medium",
    }));
  }

  for (const row of s.tables_missing_owner_column ?? []) {
    out.push(f({
      key: `no-owner-col:${row.table}`, category: "database", severity: "low",
      title_ar: `جدول بلا عمود ملكية أو institution_id: ${row.table}`,
      title_en: `Table without an ownership / institution_id column: ${row.table}`,
      component: `public.${row.table}`,
      evidence: `no user_id / institution_id / department_id column found`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "لا يمكن تقييد الوصول لكل مؤسسة أو مستخدم على مستوى الصف.",
      impact_en: "Row-level scoping per institution or user is not expressible.",
      remediation_ar: "أضف عمود ملكية واستخدمه في السياسات، أو أكد أن البيانات عامة.",
      remediation_en: "Add an ownership column and use it in policies, or confirm the data is public.",
      confidence: "low",
    }));
  }

  return out;
}

function authzFindings(s: Snapshot): RawFinding[] {
  const out: RawFinding[] = [];

  const conflicts = s.conflicting_active_roles ?? [];
  if (conflicts.length > 0) {
    out.push(f({
      key: "conflicting-active-roles", category: "authorization", severity: "critical",
      title_ar: `حسابات تحمل أدواراً متعارضة نشطة (${conflicts.length})`,
      title_en: `Accounts holding conflicting active roles (${conflicts.length})`,
      component: "public.user_roles",
      evidence: `${conflicts.length} accounts hold both a student role and a lecturer/leadership/admin role`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "قد يحصل طالب على صلاحيات محاضر أو إدارة.",
      impact_en: "A student may gain lecturer or admin privileges.",
      remediation_ar: "راجع الحسابات وأزل الدور غير المقصود، وامنع تعدد الأدوار المتعارضة.",
      remediation_en: "Review the accounts, remove the unintended role, and block conflicting role pairs.",
      confidence: "high",
    }));
  }

  if ((s.profile_role_mismatch_count ?? 0) > 0) {
    out.push(f({
      key: "profile-role-mismatch", category: "authorization", severity: "high",
      title_ar: `تعارض بين دور الحساب ودور الملف الشخصي (${s.profile_role_mismatch_count})`,
      title_en: `Profile role does not match the granted role (${s.profile_role_mismatch_count})`,
      component: "public.profiles / public.user_roles",
      evidence: `${s.profile_role_mismatch_count} profiles disagree with their approved user_roles entry`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "قرارات واجهة المستخدم قد تعتمد على دور غير المعتمد فعلياً.",
      impact_en: "UI decisions may rely on a role that is not the authoritative one.",
      remediation_ar: "اعتمد user_roles كمصدر وحيد للحقيقة وأعد مزامنة profiles.role.",
      remediation_en: "Treat user_roles as the single source of truth and resync profiles.role.",
      confidence: "medium",
    }));
  }

  const multi = s.multi_institution_users ?? [];
  if (multi.length > 0) {
    out.push(f({
      key: "multi-institution-users", category: "authorization", severity: "high",
      title_ar: `حسابات مرتبطة بأكثر من مؤسسة (${multi.length})`,
      title_en: `Accounts attached to more than one institution (${multi.length})`,
      component: "public.institution_faculty_members",
      evidence: `${multi.length} users are linked to multiple institutions`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "احتمال وصول عبر المؤسسات إلى الأعضاء والطلاب والنتائج والجداول.",
      impact_en: "Possible cross-institution access to members, students, results and schedules.",
      remediation_ar: "أكد أن الربط المتعدد مقصود، وإلا افصل الحسابات وقيّد الاستعلامات بـ institution_id.",
      remediation_en: "Confirm the multi-attachment is intended; otherwise split accounts and scope queries by institution_id.",
      confidence: "medium",
    }));
  }

  if ((s.unapproved_admin_roles ?? 0) > 0) {
    out.push(f({
      key: "unapproved-admin-roles", category: "authorization", severity: "medium",
      title_ar: `طلبات دور أدمن غير معتمدة (${s.unapproved_admin_roles})`,
      title_en: `Unapproved admin role rows (${s.unapproved_admin_roles})`,
      component: "public.user_roles",
      evidence: `${s.unapproved_admin_roles} admin rows with approved = false`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "أي منطق يتجاهل approved قد يمنح صلاحيات إدارية.",
      impact_en: "Any logic that ignores `approved` would grant admin access.",
      remediation_ar: "احذف الصفوف غير المطلوبة وتحقق دائماً من approved = true.",
      remediation_en: "Delete unwanted rows and always check approved = true.",
      confidence: "high",
    }));
  }

  if ((s.orphan_department_members ?? 0) > 0) {
    out.push(f({
      key: "orphan-department-members", category: "authorization", severity: "low",
      title_ar: `أعضاء أقسام بلا قسم صالح (${s.orphan_department_members})`,
      title_en: `Department members with no valid department (${s.orphan_department_members})`,
      component: "public.department_members",
      evidence: `${s.orphan_department_members} rows reference a missing department`,
      owasp_category: "A04:2021 Insecure Design",
      impact_ar: "قد تفشل فحوص العزل المعتمدة على القسم.",
      impact_en: "Department-based isolation checks may fail open.",
      remediation_ar: "نظّف الصفوف المعلّقة وأضف قيد مفتاح أجنبي.",
      remediation_en: "Clean up orphan rows and add a foreign key constraint.",
      confidence: "medium",
    }));
  }

  return out;
}

function authMonitoringFindings(s: Snapshot, events: any[]): RawFinding[] {
  const out: RawFinding[] = [];
  const byType = (t: string) => events.filter((e) => e.event_type === t).length;

  const failedLogins = byType("failed_login");
  if (failedLogins >= 20) {
    out.push(f({
      key: "failed-login-burst", category: "authentication", severity: "high",
      title_ar: `محاولات دخول فاشلة متكررة (${failedLogins} في 24 ساعة)`,
      title_en: `Repeated failed login attempts (${failedLogins} in 24h)`,
      component: "auth",
      evidence: `${failedLogins} failed_login events in the last 24 hours`,
      owasp_category: "A07:2021 Identification and Authentication Failures",
      impact_ar: "مؤشر على محاولات تخمين كلمات المرور.",
      impact_en: "Indicator of credential-guessing attempts.",
      remediation_ar: "طبّق حدود معدل على تسجيل الدخول وفعّل MFA لحسابات الإدارة.",
      remediation_en: "Apply login rate limits and enable MFA for admin accounts.",
      confidence: "medium",
    }));
  }

  const resets = byType("password_reset_requested");
  if (resets >= 10) {
    out.push(f({
      key: "password-reset-abuse", category: "authentication", severity: "medium",
      title_ar: `استخدام مكثف لإعادة تعيين كلمة المرور (${resets})`,
      title_en: `Elevated password reset activity (${resets})`,
      component: "auth",
      evidence: `${resets} password reset events in the last 24 hours`,
      owasp_category: "A07:2021 Identification and Authentication Failures",
      impact_ar: "احتمال إساءة استخدام روابط إعادة التعيين.",
      impact_en: "Possible abuse of reset links.",
      remediation_ar: "حدّد معدل الطلبات لكل بريد وعنوان IP.",
      remediation_en: "Rate limit reset requests per email and IP.",
      confidence: "medium",
    }));
  }

  const invites = byType("invitation_used");
  if (invites >= 50) {
    out.push(f({
      key: "invitation-abuse", category: "authentication", severity: "medium",
      title_ar: `استخدام غير معتاد لروابط الدعوة (${invites})`,
      title_en: `Unusual invitation link usage (${invites})`,
      component: "invitations",
      evidence: `${invites} invitation_used events in the last 24 hours`,
      owasp_category: "A01:2021 Broken Access Control",
      impact_ar: "قد تُستخدم دعوة واحدة لإنشاء حسابات غير مصرح بها.",
      impact_en: "A single invitation may be used to create unauthorized accounts.",
      remediation_ar: "قيّد max_uses وتاريخ الانتهاء وحدود المعدل لكل كود.",
      remediation_en: "Constrain max_uses, expiry and per-code rate limits.",
      confidence: "low",
    }));
  }

  if ((s.recent_role_changes ?? 0) > 0) {
    out.push(f({
      key: "recent-role-changes", category: "authentication", severity: "informational",
      title_ar: `تغييرات أدوار خلال 7 أيام (${s.recent_role_changes})`,
      title_en: `Role changes in the last 7 days (${s.recent_role_changes})`,
      component: "public.user_roles",
      evidence: `${s.recent_role_changes} role rows were updated after creation`,
      owasp_category: "A09:2021 Security Logging and Monitoring Failures",
      impact_ar: "تصعيد صلاحيات غير مقصود قد يمر دون ملاحظة.",
      impact_en: "Unintended privilege escalation could go unnoticed.",
      remediation_ar: "راجع سجل التغييرات وأبقِ تدقيقاً دائماً لتغيير الأدوار.",
      remediation_en: "Review the change log and keep a permanent role-change audit trail.",
      confidence: "high",
    }));
  }

  if ((s.pending_password_changes ?? 0) > 0) {
    out.push(f({
      key: "pending-temp-passwords", category: "authentication", severity: "low",
      title_ar: `حسابات ما زالت على كلمة مرور مؤقتة (${s.pending_password_changes})`,
      title_en: `Accounts still on a temporary password (${s.pending_password_changes})`,
      component: "public.profiles",
      evidence: `${s.pending_password_changes} profiles have must_change_password = true`,
      owasp_category: "A07:2021 Identification and Authentication Failures",
      impact_ar: "كلمات مرور مؤقتة طويلة العمر تزيد خطر الاختراق.",
      impact_en: "Long-lived temporary passwords increase takeover risk.",
      remediation_ar: "أضف انتهاء صلاحية لكلمات المرور المؤقتة وذكّر المستخدمين.",
      remediation_en: "Expire temporary passwords and remind users.",
      confidence: "high",
    }));
  }

  if ((s.active_sessions_stale ?? 0) > 0) {
    out.push(f({
      key: "stale-sessions", category: "authentication", severity: "informational",
      title_ar: `جلسات قديمة لم تُنظّف (${s.active_sessions_stale})`,
      title_en: `Stale sessions not cleaned up (${s.active_sessions_stale})`,
      component: "public.active_sessions",
      evidence: `${s.active_sessions_stale} sessions older than 30 days`,
      owasp_category: "A07:2021 Identification and Authentication Failures",
      impact_ar: "بيانات جلسات لا لزوم لها تبقى مخزنة.",
      impact_en: "Unnecessary session records are retained.",
      remediation_ar: "نظّف الجلسات القديمة دورياً.",
      remediation_en: "Periodically purge stale sessions.",
      confidence: "high",
    }));
  }

  return out;
}

/** Baseline hardening recommendations that are always reported as informational. */
function hardeningFindings(): RawFinding[] {
  const items: Array<[string, string, string, string, string, Severity]> = [
    [
      "mfa-super-admin",
      "تفعيل المصادقة الثنائية لحسابات الأدمن العام",
      "Enable MFA for super admin accounts",
      "أي اختراق لحساب أدمن يعني اختراق المنصة بالكامل.",
      "A compromised admin account compromises the whole platform.",
      "high",
    ],
    [
      "security-headers",
      "ترويسات الأمان (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, حماية الإطارات)",
      "Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame protection)",
      "غياب الترويسات يزيد مخاطر XSS وclickjacking وتسريب المُحيل.",
      "Missing headers increase XSS, clickjacking and referrer-leak risk.",
      "medium",
    ],
    [
      "edge-rate-limits",
      "حدود معدل لنقاط الدخول الحساسة (تسجيل الدخول، إعادة التعيين، التسجيل، الدعوات، الفانكشنز)",
      "Rate limits for sensitive endpoints (login, reset, signup, invitations, edge functions)",
      "بدون حدود معدل يمكن تنفيذ تخمين أو إساءة استخدام آلية.",
      "Without rate limits, automated guessing and abuse are possible.",
      "medium",
    ],
  ];
  return items.map(([key, ar, en, impactAr, impactEn, severity]) =>
    f({
      key, category: "hardening", severity,
      title_ar: ar, title_en: en,
      component: "platform",
      evidence: "Baseline hardening recommendation (not derived from live data).",
      owasp_category: "A05:2021 Security Misconfiguration",
      impact_ar: impactAr, impact_en: impactEn,
      remediation_ar: "راجع docs/security-center.md لخطوات التطبيق الموصى بها.",
      remediation_en: "See docs/security-center.md for the recommended rollout steps.",
      confidence: "high",
    })
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return forbidden();

  const caller = await requireSuperAdmin(req);
  if (!caller) return forbidden();

  const svc = serviceClient();

  const allowed = await rateLimit(svc, "security_scan", caller.userId, 5, 300);
  if (!allowed) return json({ error: "rate_limited" }, 429);

  // Prevent overlapping scans: a single running scan is enforced by a partial unique index.
  const { data: scan, error: scanErr } = await svc
    .from("security_scans")
    .insert({
      scan_type: "full",
      status: "running",
      source: "manual",
      read_only: true,
      triggered_by: caller.userId,
      idempotency_key: `manual-${new Date().toISOString().slice(0, 16)}`,
    })
    .select("id")
    .single();

  if (scanErr || !scan) {
    console.error("scan start failed", scanErr?.code);
    return json({ error: "scan_already_running_or_failed" }, 409);
  }

  try {
    const [{ data: snapshot, error: snapErr }, { data: events }] = await Promise.all([
      svc.rpc("security_audit_snapshot"),
      svc.from("security_events")
        .select("event_type")
        .gte("created_at", new Date(Date.now() - 86_400_000).toISOString())
        .limit(5000),
    ]);
    if (snapErr) throw snapErr;

    const s = (snapshot ?? {}) as Snapshot;
    let findings = [
      ...dbFindings(s),
      ...authzFindings(s),
      ...authMonitoringFindings(s, events ?? []),
      ...hardeningFindings(),
    ];

    // Optional AI pass: classification / summarisation only. Never auto-applies fixes.
    const { data: settings } = await svc
      .from("security_settings").select("ai_analysis_enabled").eq("id", 1).maybeSingle();
    let aiSummary: string | null = null;
    if (settings?.ai_analysis_enabled !== false) {
      const ai = await analyzeFindings(findings);
      findings = ai.findings;
      aiSummary = ai.summary;
    }

    const counts = countBySeverity(findings);
    const score = computeScore(findings);

    await svc.rpc("security_record_findings", { _scan_id: scan.id, _findings: findings });

    await svc.from("security_scans").update({
      status: "completed",
      finished_at: new Date().toISOString(),
      score,
      counts,
      summary: aiSummary ?? `${findings.length} findings`,
    }).eq("id", scan.id);

    return json({
      success: true,
      function_version: FUNCTION_VERSION,
      scan_id: scan.id,
      read_only: true,
      score,
      counts,
      total: findings.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "scan failed";
    console.error("security scan failed", message);
    await svc.from("security_scans").update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: message.slice(0, 400),
    }).eq("id", scan.id);
    return json({ error: "scan_failed" }, 500);
  }
});
