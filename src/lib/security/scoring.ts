/**
 * Pure, testable helpers shared by the Security Center UI.
 * Mirrors the server-side logic in supabase/functions/_shared/security.ts.
 * No secrets, no network, no side effects.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "informational";
export type FindingStatus = "open" | "reviewing" | "accepted_risk" | "fixed" | "false_positive";

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "informational"];

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 25,
  high: 12,
  medium: 5,
  low: 2,
  informational: 0,
};

export const STATUS_LABELS: Record<FindingStatus, { ar: string; en: string }> = {
  open: { ar: "مفتوح", en: "Open" },
  reviewing: { ar: "قيد المراجعة", en: "Reviewing" },
  accepted_risk: { ar: "خطر مقبول", en: "Accepted risk" },
  fixed: { ar: "تم الإصلاح", en: "Fixed" },
  false_positive: { ar: "إنذار خاطئ", en: "False positive" },
};

export const SEVERITY_LABELS: Record<Severity, { ar: string; en: string }> = {
  critical: { ar: "حرج", en: "Critical" },
  high: { ar: "مرتفع", en: "High" },
  medium: { ar: "متوسط", en: "Medium" },
  low: { ar: "منخفض", en: "Low" },
  informational: { ar: "معلوماتي", en: "Informational" },
};

/** 0–100 posture score; only open/reviewing findings count against it. */
export function computeScore(
  findings: Array<{ severity: Severity; status?: FindingStatus }>,
): number {
  const penalty = findings
    .filter((f) => !f.status || f.status === "open" || f.status === "reviewing")
    .reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function countBySeverity(
  findings: Array<{ severity: Severity }>,
): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0, high: 0, medium: 0, low: 0, informational: 0,
  };
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  return counts;
}

const SECRETISH: RegExp[] = [
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  /\b(?:sk|pk|rk|ghp|gho|ghs|ghu|github_pat|xoxb|xoxp|AIza|SG\.)[A-Za-z0-9_\-.]{8,}/g,
  /\b[A-Fa-f0-9]{32,}\b/g,
];

/** Masks secret-shaped values, emails, long digit runs and UUIDs for display. */
export function maskSensitive(input: string | null | undefined, maxLen = 900): string {
  if (!input) return "";
  let out = String(input);
  for (const re of SECRETISH) out = out.replace(re, (m) => `${m.slice(0, 4)}****MASKED`);
  out = out.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => {
    const [local, domain] = m.split("@");
    return `${local.slice(0, 2)}***@${domain}`;
  });
  out = out.replace(/\b\d{7,}\b/g, "***");
  out = out.replace(
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
    (m) => `${m.slice(0, 8)}-****`,
  );
  return out.length > maxLen ? `${out.slice(0, maxLen)}…` : out;
}

export function scoreBand(score: number): "good" | "fair" | "poor" {
  if (score >= 80) return "good";
  if (score >= 50) return "fair";
  return "poor";
}
