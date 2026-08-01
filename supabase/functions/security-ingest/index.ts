// Secure ingestion endpoint for external defensive scanners
// (Dependabot, GitHub code scanning, secret scanning, npm audit, and other approved
// read-only scanners running in GitHub Actions or a server-side worker).
//
// Auth: HMAC-SHA256 signature over `timestamp.nonce.body` using SECURITY_INGEST_SECRET.
// No browser client can call this successfully — the secret never leaves the server.

import {
  corsHeaders, json, forbidden, serviceClient, rateLimit,
  maskSensitive, computeScore, countBySeverity, stableFingerprint,
  timingSafeEqual, hmacSha256Hex, type RawFinding, type Severity,
} from "../_shared/security.ts";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "informational"];
const MAX_BODY_BYTES = 512 * 1024;
const MAX_SKEW_MS = 5 * 60 * 1000;

function normalize(raw: unknown, source: string): RawFinding | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const titleEn = typeof r.title === "string" ? r.title.slice(0, 300) : null;
  if (!titleEn) return null;
  const severity = SEVERITIES.includes(r.severity as Severity)
    ? (r.severity as Severity) : "medium";
  const component = typeof r.component === "string" ? r.component.slice(0, 300) : undefined;
  return {
    fingerprint: stableFingerprint([
      source,
      typeof r.rule_id === "string" ? r.rule_id : titleEn,
      component,
    ]),
    scanner: source,
    title_ar: typeof r.title_ar === "string" ? r.title_ar.slice(0, 300) : titleEn,
    title_en: titleEn,
    severity,
    category: typeof r.category === "string" ? r.category.slice(0, 60) : "source",
    component,
    // Evidence from external scanners is untrusted text: mask secrets before storing.
    evidence: maskSensitive(typeof r.evidence === "string" ? r.evidence : undefined),
    owasp_category: typeof r.owasp_category === "string" ? r.owasp_category.slice(0, 120) : undefined,
    impact_ar: typeof r.impact_ar === "string" ? r.impact_ar.slice(0, 800) : undefined,
    impact_en: typeof r.impact === "string" ? r.impact.slice(0, 800) : undefined,
    remediation_ar: typeof r.remediation_ar === "string" ? r.remediation_ar.slice(0, 1200) : undefined,
    remediation_en: typeof r.remediation === "string" ? r.remediation.slice(0, 1200) : undefined,
    confidence: r.confidence === "high" || r.confidence === "low" ? r.confidence : "medium",
  };
}

const ALLOWED_SOURCES = new Set([
  "dependabot", "code_scanning", "secret_scanning", "npm_audit", "worker", "scheduled",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return forbidden();

  const secret = Deno.env.get("SECURITY_INGEST_SECRET");
  if (!secret) {
    console.error("SECURITY_INGEST_SECRET is not configured");
    return forbidden();
  }

  const signature = req.headers.get("x-signature") ?? "";
  const timestamp = req.headers.get("x-timestamp") ?? "";
  const nonce = req.headers.get("x-nonce") ?? "";
  const source = (req.headers.get("x-source") ?? "").toLowerCase();
  if (!signature || !timestamp || !nonce || !ALLOWED_SOURCES.has(source)) return forbidden();

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) return forbidden();

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_BYTES) return json({ error: "payload_too_large" }, 413);

  const expected = await hmacSha256Hex(secret, `${timestamp}.${nonce}.${rawBody}`);
  if (!timingSafeEqual(expected, signature.toLowerCase())) return forbidden();

  const svc = serviceClient();

  if (!(await rateLimit(svc, "security_ingest", source, 20, 300))) {
    return json({ error: "rate_limited" }, 429);
  }

  // Replay protection: the same signed payload can only be accepted once.
  const { error: nonceErr } = await svc
    .from("security_ingest_nonces").insert({ nonce, source });
  if (nonceErr) return json({ error: "duplicate_submission" }, 409);

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const findings = (Array.isArray(payload?.findings) ? payload.findings : [])
    .map((r: unknown) => normalize(r, source))
    .filter((x: RawFinding | null): x is RawFinding => x !== null)
    .slice(0, 1000);

  // Deterministic idempotency key stops overlapping scheduled jobs creating duplicate scans.
  const idempotencyKey = typeof payload?.run_id === "string"
    ? `${source}-${payload.run_id}`.slice(0, 180)
    : `${source}-${new Date().toISOString().slice(0, 13)}`;

  const { data: scan, error: scanErr } = await svc
    .from("security_scans")
    .upsert(
      {
        scan_type: source,
        status: "completed",
        source,
        read_only: true,
        idempotency_key: idempotencyKey,
        score: computeScore(findings),
        counts: countBySeverity(findings),
        summary: `${findings.length} imported findings`,
        finished_at: new Date().toISOString(),
      },
      { onConflict: "idempotency_key" },
    )
    .select("id")
    .single();

  if (scanErr || !scan) {
    console.error("ingest scan upsert failed", scanErr?.code);
    return json({ error: "ingest_failed" }, 500);
  }

  const { error: recErr } = await svc.rpc("security_record_findings", {
    _scan_id: scan.id,
    _findings: findings,
  });
  if (recErr) {
    console.error("ingest record failed", recErr.code);
    return json({ error: "ingest_failed" }, 500);
  }

  return json({ success: true, scan_id: scan.id, imported: findings.length, read_only: true });
});
