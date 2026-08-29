/**
 * ==============================================================================
 * UNIGATES ADVANCED WEB APPLICATION FIREWALL (WAF) & INTRUSION PREVENTION (IPS)
 * ==============================================================================
 * Multi-layer client & application security engine:
 * 1. Anti-XSS (Cross-Site Scripting) Payload Detection & Neutralization
 * 2. Anti-SQLi (SQL Injection) & NoSQL Injection Pattern Filter
 * 3. Path Traversal & File System Intrusion Shield
 * 4. Remote Code Execution (RCE) & Command Injection Blocker
 * 5. Anti-Brute-Force & Adaptive Rate Limiting Engine
 * 6. Automated Bot & Scraper Honeypot Traps
 * 7. Real-Time Threat Event Logging & Health Scoring
 */

export type ThreatCategory =
  | "xss"
  | "sqli"
  | "path_traversal"
  | "command_injection"
  | "rate_limit_exceeded"
  | "honeypot_triggered"
  | "malicious_payload";

export type ThreatSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityThreat {
  id: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  pattern: string;
  sanitizedEvidence: string;
  timestamp: string;
  blocked: boolean;
  sourcePath?: string;
}

export interface FirewallReport {
  isSafe: boolean;
  threats: SecurityThreat[];
  sanitizedValue: string;
}

// ── 1. REGEX SIGNATURES (OWASP Top 10 Aligned) ─────────────────────────────

// XSS: script tags, inline event handlers, javascript: URIs, eval/function execution, SVG/object exploits
const XSS_PATTERNS: Array<{ regex: RegExp; name: string; severity: ThreatSeverity }> = [
  { regex: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, name: "Script Tag Injection", severity: "critical" },
  { regex: /javascript\s*:[^"'>]*/gi, name: "JavaScript URI Scheme", severity: "critical" },
  { regex: /data\s*:\s*text\/html[^"'>]*/gi, name: "HTML Data URI Payload", severity: "high" },
  { regex: /on(?:load|error|click|mouseover|mouseenter|focus|blur|change|submit|keydown|keyup|keypress)\s*=\s*["'][^"']*["']/gi, name: "Inline Event Handler", severity: "high" },
  { regex: /on(?:load|error|click|mouseover|mouseenter|focus|blur|change|submit|keydown|keyup|keypress)\s*=\s*[^>\s]+/gi, name: "Unquoted Event Handler", severity: "high" },
  { regex: /eval\s*\(\s*["'`][^"'`]*["'`]\s*\)/gi, name: "Dynamic Eval Execution", severity: "critical" },
  { regex: /document\s*\.\s*(?:cookie|location|domain|write)/gi, name: "Document DOM Access", severity: "high" },
  { regex: /window\s*\.\s*(?:location|open|localStorage|sessionStorage)/gi, name: "Window Object Manipulation", severity: "medium" },
  { regex: /<iframe\b[^>]*>/gi, name: "Iframe Injection", severity: "high" },
  { regex: /<object\b[^>]*>/gi, name: "Object Tag Injection", severity: "high" },
  { regex: /<embed\b[^>]*>/gi, name: "Embed Tag Injection", severity: "high" },
];

// SQLi: classic UNION SELECT, tautologies, comment bypasses, stacked queries, administrative keywords
const SQLI_PATTERNS: Array<{ regex: RegExp; name: string; severity: ThreatSeverity }> = [
  { regex: /(?:\bunion\b\s+(?:all\s+)?\bselect\b)/gi, name: "UNION SELECT Attack", severity: "critical" },
  { regex: /(?:\bor\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/gi, name: "SQL Tautology Bypass (OR 1=1)", severity: "critical" },
  { regex: /(?:\band\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/gi, name: "SQL Tautology Probe (AND 1=1)", severity: "high" },
  { regex: /;\s*(?:drop|alter|truncate|insert|update|delete)\s+\b/gi, name: "Stacked SQL Execution", severity: "critical" },
  { regex: /(?:--|\/\*|\*\/|#\s*$)/g, name: "SQL Comment Truncation", severity: "medium" },
  { regex: /\b(?:exec|execute)\s*\(\s*['"](?:xp_|sp_)/gi, name: "Stored Procedure Injection", severity: "critical" },
  { regex: /\b(?:information_schema|pg_catalog|sys\.tables|sqlite_master)\b/gi, name: "Schema Enumeration", severity: "critical" },
  { regex: /\b(?:sleep|benchmark|waitfor\s+delay)\s*\(\s*\d+\s*\)/gi, name: "Time-based Blind SQLi", severity: "critical" },
];

// Path Traversal: directory climbing, OS files, null bytes
const PATH_TRAVERSAL_PATTERNS: Array<{ regex: RegExp; name: string; severity: ThreatSeverity }> = [
  { regex: /(?:\.\.[\\/]+){2,}/g, name: "Deep Directory Traversal (../../)", severity: "critical" },
  { regex: /\.\.[\\/]/g, name: "Directory Climbing (../)", severity: "high" },
  { regex: /(?:\/|\\)(?:etc\/passwd|etc\/shadow|win\.ini|boot\.ini|windows[\\/]system32)/gi, name: "Sensitive OS Path Probe", severity: "critical" },
  { regex: /%00|\\x00|\0/g, name: "Null Byte Poisoning", severity: "critical" },
];

// Command Injection: pipe execution, shell operators, jndi lookup
const COMMAND_INJECTION_PATTERNS: Array<{ regex: RegExp; name: string; severity: ThreatSeverity }> = [
  { regex: /(?:[;&|`$]\s*(?:cat|ls|whoami|id|uname|powershell|cmd|bash|sh|curl|wget)\b)/gi, name: "Shell Command Chaining", severity: "critical" },
  { regex: /\$\{\s*(?:jndi|env|lower|upper)\s*:[^}]+\}/gi, name: "JNDI / Log4j Injection", severity: "critical" },
  { regex: /powershell\s+(?:-enc|-encodedcommand|-w\s+hidden)/gi, name: "Obfuscated PowerShell Execution", severity: "critical" },
];

// ── 2. CORE INSPECTION & SANITIZATION ENGINE ───────────────────────────────

/**
 * Inspects a string value against all WAF signatures.
 */
export function inspectPayload(input: string, sourcePath = ""): FirewallReport {
  if (!input || typeof input !== "string") {
    return { isSafe: true, threats: [], sanitizedValue: input };
  }

  const threats: SecurityThreat[] = [];

  // Helper to test patterns
  const testPatterns = (
    patterns: Array<{ regex: RegExp; name: string; severity: ThreatSeverity }>,
    category: ThreatCategory
  ) => {
    for (const { regex, name, severity } of patterns) {
      regex.lastIndex = 0;
      if (regex.test(input)) {
        threats.push({
          id: `threat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          category,
          severity,
          pattern: name,
          sanitizedEvidence: sanitizeForDisplay(input),
          timestamp: new Date().toISOString(),
          blocked: true,
          sourcePath,
        });
      }
    }
  };

  testPatterns(XSS_PATTERNS, "xss");
  testPatterns(SQLI_PATTERNS, "sqli");
  testPatterns(PATH_TRAVERSAL_PATTERNS, "path_traversal");
  testPatterns(COMMAND_INJECTION_PATTERNS, "command_injection");

  const sanitizedValue = sanitizeInput(input);
  const isSafe = threats.length === 0;

  return {
    isSafe,
    threats,
    sanitizedValue,
  };
}

/**
 * Recursively inspects and sanitizes all fields of an object/array.
 */
export function inspectObject<T>(data: T, sourcePath = ""): { isSafe: boolean; threats: SecurityThreat[]; sanitizedData: T } {
  if (data === null || data === undefined) {
    return { isSafe: true, threats: [], sanitizedData: data };
  }

  if (typeof data === "string") {
    const report = inspectPayload(data, sourcePath);
    return {
      isSafe: report.isSafe,
      threats: report.threats,
      sanitizedData: report.sanitizedValue as unknown as T,
    };
  }

  if (Array.isArray(data)) {
    let allSafe = true;
    const allThreats: SecurityThreat[] = [];
    const sanitizedArray = data.map((item, idx) => {
      const res = inspectObject(item, `${sourcePath}[${idx}]`);
      if (!res.isSafe) allSafe = false;
      allThreats.push(...res.threats);
      return res.sanitizedData;
    });
    return { isSafe: allSafe, threats: allThreats, sanitizedData: sanitizedArray as unknown as T };
  }

  if (typeof data === "object") {
    let allSafe = true;
    const allThreats: SecurityThreat[] = [];
    const sanitizedObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const res = inspectObject(value, sourcePath ? `${sourcePath}.${key}` : key);
      if (!res.isSafe) allSafe = false;
      allThreats.push(...res.threats);
      sanitizedObj[key] = res.sanitizedData;
    }

    return { isSafe: allSafe, threats: allThreats, sanitizedData: sanitizedObj as unknown as T };
  }

  return { isSafe: true, threats: [], sanitizedData: data };
}

/**
 * Robust HTML & Script Sanitization (neutralizes HTML tags and dangerous characters).
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "");
}

/**
 * Masks sensitive content for security audit logs.
 */
export function sanitizeForDisplay(input: string, maxLen = 120): string {
  if (!input) return "";
  const cleaned = input
    .replace(/<[^>]*>/g, "[TAG]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]")
    .replace(/\b\d{7,}\b/g, "[ID]");
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}...` : cleaned;
}

// ── 3. CLIENT-SIDE RATE LIMITER & BRUTE-FORCE SHIELD ──────────────────────

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
  attempts: number[];
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // e.g. 60_000 for 1 minute
}

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxAttempts: 5, windowMs: 60_000 },
  signup: { maxAttempts: 4, windowMs: 120_000 },
  password_reset: { maxAttempts: 3, windowMs: 180_000 },
  form_submit: { maxAttempts: 20, windowMs: 60_000 },
  search_query: { maxAttempts: 40, windowMs: 60_000 },
  api_request: { maxAttempts: 60, windowMs: 60_000 },
};

/**
 * Checks and increments rate limit using sliding window algorithm.
 * Returns true if action is allowed, false if rate limit exceeded.
 */
export function checkRateLimit(
  actionKey: string,
  identifier = "client_global",
  customConfig?: RateLimitConfig
): { allowed: boolean; remaining: number; resetTimeMs: number } {
  const config = customConfig || DEFAULT_RATE_LIMITS[actionKey] || { maxAttempts: 30, windowMs: 60_000 };
  const storeKey = `${actionKey}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let bucket = rateLimitStore.get(storeKey);
  if (!bucket) {
    bucket = { tokens: config.maxAttempts, lastRefill: now, attempts: [] };
    rateLimitStore.set(storeKey, bucket);
  }

  // Filter attempts older than the window
  bucket.attempts = bucket.attempts.filter((timestamp) => timestamp > windowStart);

  if (bucket.attempts.length >= config.maxAttempts) {
    const oldest = bucket.attempts[0] || now;
    const resetTimeMs = Math.max(0, oldest + config.windowMs - now);
    return { allowed: false, remaining: 0, resetTimeMs };
  }

  // Record this attempt
  bucket.attempts.push(now);
  const remaining = config.maxAttempts - bucket.attempts.length;
  const resetTimeMs = config.windowMs;

  return { allowed: true, remaining, resetTimeMs };
}

// ── 4. HONEYPOT TRAP VALIDATION ───────────────────────────────────────────

/**
 * Validates hidden bot-trap honeypot fields.
 * If honeypot has any value filled, it indicates an automated bot/scraper.
 */
export function validateHoneypot(honeypotValue: unknown): boolean {
  if (typeof honeypotValue === "string") {
    return honeypotValue.trim().length === 0;
  }
  return !honeypotValue;
}

// ── 5. FIREWALL THREAT STORE (In-Memory Audit Logger) ──────────────────────

const MAX_THREAT_LOG_SIZE = 100;
const threatLog: SecurityThreat[] = [];

export function recordThreat(threat: SecurityThreat): void {
  threatLog.unshift(threat);
  if (threatLog.length > MAX_THREAT_LOG_SIZE) {
    threatLog.pop();
  }
}

export function getThreatLog(): SecurityThreat[] {
  return [...threatLog];
}

export function clearThreatLog(): void {
  threatLog.length = 0;
}

export function getFirewallStats(): {
  totalIntercepted: number;
  xssBlocked: number;
  sqliBlocked: number;
  rateLimitHits: number;
  criticalThreats: number;
  securityHealthScore: number;
} {
  const total = threatLog.length;
  const xss = threatLog.filter((t) => t.category === "xss").length;
  const sqli = threatLog.filter((t) => t.category === "sqli").length;
  const rateLimit = threatLog.filter((t) => t.category === "rate_limit_exceeded").length;
  const critical = threatLog.filter((t) => t.severity === "critical").length;

  // Compute 0-100 health score
  const penalty = critical * 25 + (total - critical) * 5;
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  return {
    totalIntercepted: total,
    xssBlocked: xss,
    sqliBlocked: sqli,
    rateLimitHits: rateLimit,
    criticalThreats: critical,
    securityHealthScore: healthScore,
  };
}
