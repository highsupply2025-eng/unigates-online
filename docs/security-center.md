# UniGates AI Security Center

Defensive, read-only security posture monitoring for UniGates-owned systems.
It contains **no** offensive tooling: no exploitation, no attack payloads, no
arbitrary code execution and no destructive penetration testing.

- Route: `/admin/security-center`
- Audience: verified super admins only (an **approved** `admin` row in `user_roles`)

## Access control

1. The page calls `is_super_admin(auth.uid())` in the database before it renders.
   Failing that check redirects away.
2. Every privileged edge function re-verifies the JWT with `auth.getUser(token)`
   and then re-checks `is_super_admin` with the service-role client. A role sent
   in a request body is never used.
3. Unauthorized access returns `HTTP 403 {"error":"forbidden"}` with no detail
   about why it failed.
4. **MFA is strongly recommended for every super admin account.** Enable it in
   the backend auth settings; the Security Center reports it as a finding until
   it is confirmed.

## Tables (all RLS-protected, super-admin read only)

| Table | Purpose |
| --- | --- |
| `security_scans` | one row per scan: type, source, status, score, severity counts |
| `security_findings` | deduplicated findings keyed by `fingerprint` |
| `security_events` | authentication / admin monitoring events (hashed IPs only) |
| `security_settings` | singleton settings (AI on/off, schedule, retention) |
| `security_notifications` | outbound alert log |
| `security_remediation_reviews` | human review decisions |
| `security_ingest_nonces` | replay protection for signed ingestion |
| `security_rate_limits` | sliding-window rate limits |

Browser clients have `SELECT` only, plus `UPDATE` on `security_findings.status`
(enforced by the `security_findings_client_update_guard` trigger) and `INSERT`
on their own `security_remediation_reviews` row. All trusted writes go through
`security_record_findings()`, which is `service_role`-only.

## Edge functions

| Function | Auth | Notes |
| --- | --- | --- |
| `security-scan` | JWT + super admin | read-only audit, 5 runs / 5 min |
| `security-report` | JWT + super admin | masked JSON export, 10 / 5 min |
| `security-ingest` | HMAC-SHA256 signature | external scanner import, 20 / 5 min |

### Signed ingestion

Sign `"{timestamp}.{nonce}.{rawBody}"` with `SECURITY_INGEST_SECRET`:

```
POST /functions/v1/security-ingest
x-timestamp: <epoch ms, ±5 min>
x-nonce:     <unique per request>
x-source:    dependabot | code_scanning | secret_scanning | npm_audit | worker | scheduled
x-signature: <hex HMAC-SHA256>

{ "run_id": "<ci run id>", "findings": [ { "title": "...", "severity": "high", "rule_id": "...", "component": "...", "evidence": "...", "remediation": "..." } ] }
```

Duplicate nonces return `409`. `run_id` becomes the scan idempotency key so
overlapping or retried scheduled jobs cannot create duplicate scans, and
findings dedupe on `fingerprint`.

## What the read-only audit checks

**Database / RLS** — public tables without RLS; RLS with no policies; overly
permissive policies (`USING true` / `WITH CHECK true`); write grants to `anon`;
`SECURITY DEFINER` functions without a fixed `search_path`; `SECURITY DEFINER`
functions executable by `anon`; views without `security_invoker`; public storage
buckets; tables with no ownership / `institution_id` column.

**UniGates authorization** — students holding lecturer/leadership/admin roles;
conflicting active roles; profile role disagreeing with the authoritative
`user_roles` row; accounts attached to multiple institutions (cross-institution
exposure); unapproved admin rows; orphan department members.

**Authentication monitoring** — failed-login bursts, password-reset abuse,
invitation-link abuse, recent role changes, long-lived temporary passwords,
stale sessions. Derived from `security_events` and safe aggregate counts.

**Baseline hardening** — MFA for super admins, security headers, endpoint rate
limits.

Source and dependency scanning (npm audit, hardcoded secrets, dangerous
dynamic execution, unsafe HTML, open redirects, weak CORS, missing headers,
sensitive log output, unvalidated uploads, client-only authorization) runs in
CI and is imported through `security-ingest` — repository scanners never run in
the browser.

## AI analysis

AI is used **only** to classify, deduplicate, prioritise and explain findings a
deterministic scanner already produced.

- Scanner data is wrapped in `<scanner_data>` and declared untrusted; the system
  prompt forbids following instructions found inside it.
- Output must satisfy a strict `json_schema`; anything unexpected is discarded.
- Only masked titles, components and evidence are sent — never passwords,
  tokens, full personal records or private student data.
- The model cannot run SQL, shell commands, migrations, network requests or code.
- Deterministic `critical` findings are never downgraded by the model.
- Every AI remediation is stored with `requires_human_review: true` and
  `auto_apply: false`. **This version never auto-applies a fix.**

## Recommended CI workflow

`.github/workflows/security-scan.yml` runs `npm audit` on a schedule, normalises
the output and posts it to `security-ingest`. Dependabot alerts, code scanning
and secret scanning can be exported the same way. Concurrency is limited so
scheduled jobs cannot overlap.

## Recommended Cloudflare / edge configuration (not applied automatically)

Rate limits (per IP unless noted):

| Endpoint | Limit |
| --- | --- |
| login | 10 / 5 min, then challenge |
| password reset | 5 / hour per IP and per email |
| signup | 5 / hour |
| invitation redemption | 10 / hour per IP, plus per-code `max_uses` |
| `create-faculty-account`, `create-student-account`, bulk import | 30 / 10 min per authenticated user |
| `security-scan`, `security-report`, `security-ingest` | already limited in-function |

Headers (roll out in report-only mode first so nothing breaks):

```
Content-Security-Policy-Report-Only: default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-Frame-Options: DENY
Permissions-Policy: geolocation=(self), camera=(self), microphone=()
```

Cloudflare changes must be made manually by an operator — nothing here mutates
external infrastructure.

## Required environment variables

| Name | Where | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | edge functions | provided automatically |
| `SUPABASE_ANON_KEY` | edge functions | provided automatically |
| `SUPABASE_SERVICE_ROLE_KEY` | edge functions | provided automatically, server-side only |
| `LOVABLE_API_KEY` | edge functions | AI triage; scan still works without it |
| `SECURITY_INGEST_SECRET` | edge functions **and** GitHub Actions | shared HMAC secret, must be created by an operator |

No secret is ever exposed to the browser, and no placeholder that resembles a
real credential is committed.

## Known limitations

- Repository/source and dependency findings only appear after CI ingestion runs.
- Failed-login and reset-abuse detection depends on `security_events` being
  populated; wire in the auth hooks to enrich it.
- `is_super_admin` currently equals "approved platform admin". Introduce a
  dedicated `super_admin` role if a narrower tier is needed.
- Scheduled scans are disabled by default (`security_settings.scheduled_scans_enabled`).
- MFA enforcement, CSP and rate limits are reported as recommendations, not applied.
