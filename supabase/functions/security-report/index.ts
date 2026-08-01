// Exports a masked security report for verified super admins only.
// Read-only: performs no scan and no production data changes.

import {
  corsHeaders, json, forbidden, serviceClient, requireSuperAdmin, rateLimit, maskSensitive,
} from "../_shared/security.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return forbidden();

  const caller = await requireSuperAdmin(req);
  if (!caller) return forbidden();

  const svc = serviceClient();
  if (!(await rateLimit(svc, "security_report", caller.userId, 10, 300))) {
    return json({ error: "rate_limited" }, 429);
  }

  const [{ data: scans }, { data: findings }] = await Promise.all([
    svc.from("security_scans").select("*").order("started_at", { ascending: false }).limit(20),
    svc.from("security_findings").select("*").order("severity").limit(2000),
  ]);

  const latest = (scans ?? [])[0] ?? null;

  const report = {
    generated_at: new Date().toISOString(),
    platform: "UniGates",
    read_only: true,
    latest_scan: latest
      ? {
          id: latest.id, status: latest.status, score: latest.score,
          counts: latest.counts, started_at: latest.started_at, finished_at: latest.finished_at,
        }
      : null,
    scan_history: (scans ?? []).map((s) => ({
      id: s.id, scan_type: s.scan_type, source: s.source, status: s.status,
      score: s.score, counts: s.counts, started_at: s.started_at,
    })),
    findings: (findings ?? []).map((f) => ({
      id: f.id,
      title_ar: f.title_ar,
      title_en: f.title_en,
      severity: f.severity,
      category: f.category,
      component: f.component,
      // Defence in depth: mask again on the way out.
      evidence: maskSensitive(f.evidence),
      owasp_category: f.owasp_category,
      impact_ar: f.impact_ar,
      impact_en: f.impact_en,
      remediation_ar: f.remediation_ar,
      remediation_en: f.remediation_en,
      remediation_is_recommendation: true,
      confidence: f.confidence,
      status: f.status,
      first_detected_at: f.first_detected_at,
      last_detected_at: f.last_detected_at,
      ai_analysis: f.ai_analysis
        ? { ...f.ai_analysis, requires_human_review: true, auto_apply: false }
        : null,
    })),
    notes: [
      "All evidence is masked. No secrets or full personal records are included.",
      "AI-generated remediation is a recommendation requiring human review.",
    ],
  };

  return json(report, 200, {
    "Content-Disposition": `attachment; filename="unigates-security-report-${
      new Date().toISOString().slice(0, 10)
    }.json"`,
  });
});
