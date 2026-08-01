// Shared helpers for the UniGates Security Center edge functions.
// Defensive only: no exploitation, no code execution, no destructive operations.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature, x-timestamp, x-nonce, x-source",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

/** Generic denial: never reveals why access failed. */
export function forbidden() {
  return json({ error: "forbidden" }, 403);
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/**
 * Verifies the caller is an authenticated, approved super admin.
 * Roles are read from the database with a security-definer check —
 * never from the request body and never from editable auth metadata.
 */
export async function requireSuperAdmin(
  req: Request,
): Promise<{ userId: string; email: string | null } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);

  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false } },
  );
  const { data: userData, error: userErr } = await anon.auth.getUser(token);
  if (userErr || !userData?.user) return null;

  const svc = serviceClient();
  const { data: ok, error } = await svc.rpc("is_super_admin", { _user_id: userData.user.id });
  if (error || ok !== true) return null;

  return { userId: userData.user.id, email: userData.user.email ?? null };
}

/** Simple sliding-window rate limit backed by security_rate_limits. */
export async function rateLimit(
  svc: SupabaseClient,
  bucket: string,
  principal: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count } = await svc
    .from("security_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("principal", principal)
    .gte("attempted_at", since);
  if ((count ?? 0) >= maxAttempts) return false;
  await svc.from("security_rate_limits").insert({ bucket, principal, attempted_at: new Date().toISOString() });
  return true;
}

const SECRETISH = [
  // service-role / JWT shaped values
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  // common provider key prefixes
  /\b(?:sk|pk|rk|ghp|gho|ghs|ghu|github_pat|xoxb|xoxp|AIza|SG\.)[A-Za-z0-9_\-.]{8,}/g,
  // long hex/base64 blobs
  /\b[A-Fa-f0-9]{32,}\b/g,
];

/** Masks anything secret-shaped, emails and long digit runs before storage or AI use. */
export function maskSensitive(input: string | null | undefined, maxLen = 900): string {
  if (!input) return "";
  let out = String(input);
  for (const re of SECRETISH) out = out.replace(re, (m) => `${m.slice(0, 4)}****MASKED`);
  out = out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => {
    const [local, domain] = m.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
  });
  out = out.replace(/\b\d{7,}\b/g, "***");
  // Never echo raw UUIDs of real people in evidence.
  out = out.replace(
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
    (m) => `${m.slice(0, 8)}-****`,
  );
  return out.length > maxLen ? `${out.slice(0, maxLen)}…` : out;
}

export type Severity = "critical" | "high" | "medium" | "low" | "informational";

export interface RawFinding {
  fingerprint: string;
  scanner?: string;
  title_ar: string;
  title_en: string;
  severity: Severity;
  category: string;
  component?: string;
  evidence?: string;
  owasp_category?: string;
  impact_ar?: string;
  impact_en?: string;
  remediation_ar?: string;
  remediation_en?: string;
  confidence?: "high" | "medium" | "low";
  ai_analysis?: Record<string, unknown>;
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2,
  informational: 0,
};

export function countBySeverity(findings: RawFinding[]) {
  const counts: Record<Severity, number> = {
    critical: 0, high: 0, medium: 0, low: 0, informational: 0,
  };
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  return counts;
}

export function computeScore(findings: RawFinding[]): number {
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function stableFingerprint(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join("|").toLowerCase().replace(/\s+/g, "-").slice(0, 200);
}

/** Constant-time string compare for signatures. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
