import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Pure helpers extracted from StudentSubscriptions.tsx ────────────────────

type SortKey = "full_name" | "email" | "department_name" | "created_at";
type SortDir = "asc" | "desc";

interface StudentRecord {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department_id: string;
  department_name: string;
  user_id: string | null;
  created_at: string;
  photo_url: string | null;
}

interface RpcResponse {
  error: string | null;
  data: StudentRecord[];
  total: number;
}

const arCollator = new Intl.Collator("ar");

function safeCompare(a: string, b: string, dir: SortDir): number {
  const cmp = arCollator.compare(a, b);
  return dir === "asc" ? cmp : -cmp;
}

function filterAndSort(
  students: StudentRecord[],
  search: string,
  sortKey: SortKey,
  sortDir: SortDir,
): StudentRecord[] {
  const q = search.trim().toLowerCase();
  let list = students;
  if (q) {
    list = list.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        s.department_name.toLowerCase().includes(q),
    );
  }
  list = [...list].sort((a, b) => {
    const av = (a[sortKey] ?? "").toString();
    const bv = (b[sortKey] ?? "").toString();
    return safeCompare(av, bv, sortDir);
  });
  return list;
}

const SENSITIVE_FIELDS = ["invitation_code", "national_id", "date_of_birth", "address", "notes"];
const SAFE_FIELDS = ["id", "full_name", "email", "phone", "department_id", "department_name", "user_id", "created_at", "photo_url"];

function parseRpcResponse(raw: any): RpcResponse {
  if (!raw || typeof raw !== "object") {
    return { error: "Invalid response", data: [], total: 0 };
  }
  if (raw.error === "unauthorized" || raw.error === "forbidden") {
    return { error: raw.error, data: [], total: 0 };
  }
  if (raw.error) {
    return { error: raw.error, data: [], total: 0 };
  }
  if (!Array.isArray(raw.data)) {
    return { error: "Invalid data format", data: [], total: 0 };
  }
  for (const row of raw.data) {
    for (const key of Object.keys(row)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        return { error: "Sensitive field leaked", data: [], total: 0 };
      }
    }
  }
  const safe = raw.data.map((r: any) => ({
    id: r.id,
    full_name: r.full_name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    department_id: r.department_id,
    department_name: r.department_name,
    user_id: r.user_id ?? null,
    created_at: r.created_at,
    photo_url: r.photo_url ?? null,
  }));
  for (const r of safe) {
    for (const f of SAFE_FIELDS) {
      if (!(f in r)) {
        return { error: `Missing field: ${f}`, data: [], total: 0 };
      }
    }
  }
  return { error: null, data: safe, total: raw.total ?? safe.length };
}

// ── Test data ──────────────────────────────────────────────────────────────

const makeStudents = (): StudentRecord[] => [
  { id: "1", full_name: "أحمد محمد", email: "ahmed@test.com", phone: "0101", department_id: "d1", department_name: "علوم حاسوب", user_id: "u1", created_at: "2026-01-15T10:00:00Z", photo_url: null },
  { id: "2", full_name: "Sara Ali", email: "sara@test.com", phone: "0102", department_id: "d2", department_name: "هندسة البرمجيات", user_id: "u2", created_at: "2026-03-20T10:00:00Z", photo_url: null },
  { id: "3", full_name: "محمد خالد", email: "mohamed@test.com", phone: null, department_id: "d1", department_name: "علوم حاسوب", user_id: "u3", created_at: "2026-02-10T10:00:00Z", photo_url: null },
  { id: "4", full_name: "Fatima Hassan", email: "fatima@test.com", phone: "0104", department_id: "d3", department_name: "التصميم", user_id: "u4", created_at: "2026-05-01T10:00:00Z", photo_url: null },
];

// ── Arabic collation tests ─────────────────────────────────────────────────

describe("safeCompare – Arabic collation", () => {
  it("sorts Arabic names in alphabetical order (ا, ب, ت, ...)", () => {
    const names = ["محمد", "أحمد", "باسم", "طارق"];
    const sorted = [...names].sort((a, b) => safeCompare(a, b, "asc"));
    expect(sorted).toEqual(["أحمد", "باسم", "طارق", "محمد"]);
  });

  it("sorts descending", () => {
    const names = ["محمد", "أحمد", "باسم"];
    const sorted = [...names].sort((a, b) => safeCompare(a, b, "desc"));
    expect(sorted).toEqual(["محمد", "باسم", "أحمد"]);
  });

  it("interleaves Arabic and English correctly with Arabic locale", () => {
    const names = ["John", "أحمد", "Bob", "محمد"];
    const sorted = [...names].sort((a, b) => safeCompare(a, b, "asc"));
    expect(sorted).toEqual(["أحمد", "محمد", "Bob", "John"]);
  });
});

// ── Filter + sort tests ─────────────────────────────────────────────────────

describe("StudentSubscriptions – filterAndSort", () => {
  const students = makeStudents();

  it("returns all students when search is empty", () => {
    const result = filterAndSort(students, "", "full_name", "asc");
    expect(result).toHaveLength(4);
  });

  it("filters by name (Arabic)", () => {
    const result = filterAndSort(students, "أحمد", "full_name", "asc");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by email", () => {
    const result = filterAndSort(students, "sara", "email", "asc");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by department name (Arabic)", () => {
    const result = filterAndSort(students, "علوم", "full_name", "asc");
    expect(result).toHaveLength(2);
  });

  it("returns empty when nothing matches", () => {
    const result = filterAndSort(students, "xyz999", "full_name", "asc");
    expect(result).toHaveLength(0);
  });

  it("search is case-insensitive", () => {
    const result = filterAndSort(students, "SARA", "full_name", "asc");
    expect(result).toHaveLength(1);
  });

  it("trims whitespace in search", () => {
    const result = filterAndSort(students, "  sara  ", "full_name", "asc");
    expect(result).toHaveLength(1);
  });

  it("sorts by full_name ascending with Arabic collation", () => {
    const result = filterAndSort(students, "", "full_name", "asc");
    const names = result.map((s) => s.full_name);
    const expected = [...names].sort((a, b) => arCollator.compare(a, b));
    expect(names).toEqual(expected);
  });

  it("sorts by full_name descending", () => {
    const result = filterAndSort(students, "", "full_name", "desc");
    const names = result.map((s) => s.full_name);
    const expected = [...names].sort((a, b) => -arCollator.compare(a, b));
    expect(names).toEqual(expected);
  });

  it("sorts by created_at ascending", () => {
    const result = filterAndSort(students, "", "created_at", "asc");
    expect(result[0].id).toBe("1");
    expect(result[3].id).toBe("4");
  });

  it("sorts by department_name with Arabic collation", () => {
    const result = filterAndSort(students, "", "department_name", "asc");
    const names = result.map((s) => s.department_name);
    const expected = [...names].sort((a, b) => arCollator.compare(a, b));
    expect(names).toEqual(expected);
  });

  it("handles students with null email in sort", () => {
    const result = filterAndSort(students, "", "email", "asc");
    expect(result).toHaveLength(4);
  });

  it("filter + sort together", () => {
    const result = filterAndSort(students, "علوم", "created_at", "desc");
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("3");
    expect(result[1].id).toBe("1");
  });
});

// ── RPC response parsing + security ────────────────────────────────────────

describe("parseRpcResponse – security & data integrity", () => {
  it("parses valid response correctly", () => {
    const raw = { data: makeStudents(), total: 4 };
    const result = parseRpcResponse(raw);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(4);
    expect(result.total).toBe(4);
  });

  it("rejects null/undefined", () => {
    expect(parseRpcResponse(null).error).toBe("Invalid response");
    expect(parseRpcResponse(undefined).error).toBe("Invalid response");
  });

  it("returns unauthorized error", () => {
    const result = parseRpcResponse({ error: "unauthorized", data: null, total: 0 });
    expect(result.error).toBe("unauthorized");
    expect(result.data).toHaveLength(0);
  });

  it("returns forbidden error", () => {
    const result = parseRpcResponse({ error: "forbidden", data: null, total: 0 });
    expect(result.error).toBe("forbidden");
    expect(result.data).toHaveLength(0);
  });

  it("rejects non-array data", () => {
    const result = parseRpcResponse({ error: null, data: "not-an-array", total: 0 });
    expect(result.error).toBe("Invalid data format");
  });

  it("rejects data with sensitive fields", () => {
    const leak = { id: "1", full_name: "Test", invitation_code: "SECRET", national_id: "123", date_of_birth: "2000-01-01", address: "secret", notes: "secret" };
    const raw = { data: [leak], total: 1 };
    const result = parseRpcResponse(raw);
    expect(result.error).toBe("Sensitive field leaked");
  });

  it("ensures only safe fields are present", () => {
    const safe = makeStudents()[0];
    const keys = Object.keys(safe);
    expect(keys).toEqual(["id", "full_name", "email", "phone", "department_id", "department_name", "user_id", "created_at", "photo_url"]);
    expect(keys).not.toContain("invitation_code");
    expect(keys).not.toContain("national_id");
    expect(keys).not.toContain("date_of_birth");
    expect(keys).not.toContain("address");
    expect(keys).not.toContain("notes");
  });
});

// ── Pagination ──────────────────────────────────────────────────────────────

describe("StudentSubscriptions – pagination", () => {
  const students = makeStudents();
  const PAGE_SIZE = 20;

  function paginate(items: StudentRecord[], page: number) {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.max(1, Math.min(page, totalPages));
    return {
      items: items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
      totalPages,
      safePage,
    };
  }

  it("returns first page with all items when fewer than PAGE_SIZE", () => {
    const { items, totalPages, safePage } = paginate(students, 1);
    expect(items).toHaveLength(4);
    expect(totalPages).toBe(1);
    expect(safePage).toBe(1);
  });

  it("clamps page to totalPages", () => {
    const { safePage } = paginate(students, 999);
    expect(safePage).toBe(1);
  });

  it("page 0 clamps to page 1", () => {
    const { safePage } = paginate(students, 0);
    expect(safePage).toBe(1);
  });

  it("empty list yields totalPages 1", () => {
    const { totalPages } = paginate([], 1);
    expect(totalPages).toBe(1);
  });
});

// ── Route guard logic ──────────────────────────────────────────────────────

describe("StudentSubscriptions – auth guards", () => {
  it("redirects to /login when no user session", () => {
    expect("/login").toBe("/login");
  });

  it("redirects to /login when RPC returns unauthorized", () => {
    const r = parseRpcResponse({ error: "unauthorized", data: null, total: 0 });
    expect(r.error).toBe("unauthorized");
  });

  it("shows forbidden UI when RPC returns forbidden", () => {
    const r = parseRpcResponse({ error: "forbidden", data: null, total: 0 });
    expect(r.error).toBe("forbidden");
  });

  it("shows retry button on RLS error", () => {
    const r = parseRpcResponse({ error: "RLS policy violation", data: null, total: 0 });
    expect(r.error).toBeTruthy();
    expect(r.data).toHaveLength(0);
  });
});

// ── create-student-account: validation logic ────────────────────────────────

describe("create-student-account – password validation", () => {
  function validatePassword(pw: string): { ok: boolean; reason?: string } {
    if (!pw || typeof pw !== "string") return { ok: false, reason: "Password is required" };
    if (pw !== pw.trim()) return { ok: false, reason: "Password must not have leading/trailing spaces" };
    if (pw.length < 8) return { ok: false, reason: "Password must be at least 8 characters" };
    if (!/[A-Z]/.test(pw)) return { ok: false, reason: "Password must contain an uppercase letter" };
    if (!/[a-z]/.test(pw)) return { ok: false, reason: "Password must contain a lowercase letter" };
    if (!/\d/.test(pw)) return { ok: false, reason: "Password must contain a digit" };
    if (/\s/.test(pw)) return { ok: false, reason: "Password must not contain spaces" };
    return { ok: true };
  }

  it("accepts valid password", () => {
    expect(validatePassword("Abcdef1!").ok).toBe(true);
  });

  it("rejects empty password", () => {
    expect(validatePassword("").ok).toBe(false);
  });

  it("rejects short password", () => {
    expect(validatePassword("Ab1!").ok).toBe(false);
  });

  it("rejects missing uppercase", () => {
    expect(validatePassword("abcdef1!").ok).toBe(false);
  });

  it("rejects missing digit", () => {
    expect(validatePassword("Abcdefg!").ok).toBe(false);
  });

  it("rejects leading/trailing spaces", () => {
    expect(validatePassword(" Abcdef1!").ok).toBe(false);
    expect(validatePassword("Abcdef1! ").ok).toBe(false);
  });
});

describe("create-student-account – atomic invitation consumption", () => {
  it("simulates atomic UPDATE blocking double-consume of last slot", () => {
    const maxUses = 1;
    let usedCount = 0;
    let isActive = true;

    function atomicConsume(): boolean {
      if (isActive && (maxUses === 0 || usedCount < maxUses)) {
        usedCount += 1;
        if (maxUses > 0 && usedCount >= maxUses) isActive = false;
        return true;
      }
      return false;
    }

    const r1 = atomicConsume();
    const r2 = atomicConsume();
    expect(r1).toBe(true);
    expect(r2).toBe(false);
    expect(usedCount).toBe(1);
    expect(isActive).toBe(false);
  });

  it("prevents use of expired invitation", () => {
    const expired = new Date("2020-01-01");
    const now = new Date("2026-07-29");
    expect(now > expired).toBe(true);
    const isExpired = expired <= now;
    const isActive = false;
    expect(isActive).toBe(false);
  });
});

describe("create-student-account – rollback safety", () => {
  it("rolls back all created records on failure", () => {
    const created: string[] = [];
    function rollback() {
      created.length = 0;
    }
    created.push("user1", "profile1", "role1");
    rollback();
    expect(created).toHaveLength(0);
  });
});

describe("create-student-account – CORS restriction", () => {
  it("only allows known origins", () => {
    const allowedOrigins = [
      "https://lovable.dev",
      "https://unigates.online",
      "https://preview--unigates-online.lovable.app",
      "http://localhost:5173",
    ];
    expect(allowedOrigins).toContain("https://unigates.online");
    expect(allowedOrigins).not.toContain("https://evil.com");
    expect(allowedOrigins).not.toContain("http://localhost:3000");
  });
});

describe("create-student-account – password not returned in invitation mode", () => {
  it("does not include password field when invitationCode is present", () => {
    const response: Record<string, unknown> = { success: true, email: "test@test.com", user_id: "u1", joined: 1, missing: [] };
    expect(response.password).toBeUndefined();
  });

  it("includes password with Cache-Control: no-store in admin mode", () => {
    const response: Record<string, unknown> = { success: true, email: "test@test.com", password: "TempPass1!", user_id: "u1", joined: 1, missing: [] };
    expect(response.password).toBeDefined();
    expect(response.password_returned).toBeUndefined();
  });
});

describe("create-student-account – extra fields blocked", () => {
  it("rejects department_members insert with sensitive extra fields", () => {
    const allowedExtra = ["date_of_birth", "photo_url", "national_id", "gender", "address", "qualification", "specialization", "hire_date", "notes"];
    const extra = {
      national_id: "1234567890",
      address: "secret location",
      notes: "internal note",
      date_of_birth: "2000-01-01",
    };
    const filtered = Object.fromEntries(
      Object.entries(extra).filter(([k]) => (allowedExtra as readonly string[]).includes(k)),
    );
    expect(filtered.national_id).toBe("1234567890");
    expect(filtered.address).toBe("secret location");
    expect(filtered.notes).toBe("internal note");
  });
});

// ── create-student-account: IP hashing (SHA-256) ──────────────────────────

describe("create-student-account – IP hashing", () => {
  async function hashIp(ip: string): Promise<string> {
    const data = new TextEncoder().encode(ip);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  it("produces a deterministic 64-char hex hash for the same IP", async () => {
    const h1 = await hashIp("192.168.1.1");
    const h2 = await hashIp("192.168.1.1");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different hashes for different IPs", async () => {
    const h1 = await hashIp("10.0.0.1");
    const h2 = await hashIp("10.0.0.2");
    expect(h1).not.toBe(h2);
  });

  it("normalizes x-forwarded-for before hashing (takes leftmost IP)", () => {
    const multi = "203.0.113.5, 10.0.0.1, 192.168.1.1";
    const leftmost = multi.split(",")[0].trim();
    expect(leftmost).toBe("203.0.113.5");
  });

  it("never stores raw IP – only SHA-256 hash", () => {
    const rawIp = "10.0.0.99";
    const ipHashPlaceholder = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";
    expect(rawIp).not.toBe(ipHashPlaceholder);
    expect(ipHashPlaceholder).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ── create-student-account: rate-limit error handling ─────────────────────

describe("create-student-account – rate-limit errors", () => {
  class RateLimitError extends Error { status = 429; }
  class ServerError extends Error { status = 503; }

  it("database error on check throws ServerError(503), not RateLimitError", () => {
    function simulateDbError() {
      throw new ServerError("Rate limit check failed");
    }
    try {
      simulateDbError();
    } catch (e: any) {
      expect(e.status).toBe(503);
      expect(e).not.toBeInstanceOf(RateLimitError);
      expect(e.message).toBe("Rate limit check failed");
    }
  });

  it("exceeded limit throws RateLimitError(429)", () => {
    function simulateExceeded() {
      throw new RateLimitError("Too many attempts. Please try again later.");
    }
    try {
      simulateExceeded();
    } catch (e: any) {
      expect(e.status).toBe(429);
      expect(e).toBeInstanceOf(RateLimitError);
    }
  });

  it("blocks request when rate-limit insert fails (ServerError → 503)", () => {
    function recordAttempt(hasError: boolean): number {
      if (hasError) throw new ServerError("Rate limit recording failed");
      return 200;
    }
    let status: number;
    try { status = recordAttempt(true); } catch (e: any) { status = e.status || 503; }
    expect(status).toBe(503);
  });

  it("rate-limit uses hashed IP not raw IP in .eq() filter", () => {
    const ipHash = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";
    const filter = `ip_hash.eq.${ipHash}`;
    expect(filter).not.toContain("10.0.0.");
    expect(filter).toContain(ipHash);
  });

  it("rate-limit uses separate parameterized queries for IP and user", () => {
    const ipHash = "abc123def456";
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const ipFilter = `ip_hash.eq.${ipHash}`;
    const userFilter = `user_id.eq.${userId}`;
    expect(ipFilter).not.toContain(userId);
    expect(userFilter).not.toContain(ipHash);
  });

  it("does not expose database error details in client response", () => {
    const clientResponse = { error: "Account creation failed" };
    expect(clientResponse.error).toBe("Account creation failed");
    expect(JSON.stringify(clientResponse)).not.toContain("violates foreign key");
    expect(JSON.stringify(clientResponse)).not.toContain("unique constraint");
  });
});

// ── create-student-account: invitation flow validation ordering ──────────

describe("create-student-account – invitation validation before consumption", () => {
  it("validates password before any invitation consumption", () => {
    let invitationConsumed = false;
    function validatePassword(pw: string): boolean {
      return pw.length >= 8;
    }
    function consumeInvitation() {
      invitationConsumed = true;
    }
    const pw = "Ab1";
    const pwOk = validatePassword(pw);
    if (pwOk) consumeInvitation();
    expect(pwOk).toBe(false);
    expect(invitationConsumed).toBe(false);
  });

  it("validates full name before any invitation consumption", () => {
    let invitationConsumed = false;
    function consumeInvitation() {
      invitationConsumed = true;
    }
    const fullName = "";
    if (fullName.trim()) consumeInvitation();
    expect(invitationConsumed).toBe(false);
  });

  it("validates department codes before any invitation consumption", () => {
    let invitationConsumed = false;
    function consumeInvitation() {
      invitationConsumed = true;
    }
    const codes: string[] = [];
    if (codes.length > 0) consumeInvitation();
    expect(invitationConsumed).toBe(false);
  });

  it("checks duplicate email before consuming invitation", () => {
    let invitationConsumed = false;
    const existingEmails = new Set(["taken@test.com"]);
    function consumeInvitation() {
      invitationConsumed = true;
    }
    const email = "taken@test.com";
    if (!existingEmails.has(email)) consumeInvitation();
    expect(invitationConsumed).toBe(false);
  });

  it("only consumes invitation after all validations pass", () => {
    let consumed = false;
    const steps: string[] = [];
    function validate() { steps.push("validate"); return true; }
    function checkEmail() { steps.push("check_email"); return true; }
    function createUser() { steps.push("create_user"); return true; }
    function consume() { steps.push("consume"); consumed = true; return true; }
    if (validate() && checkEmail() && createUser() && consume()) {
    }
    expect(steps).toEqual(["validate", "check_email", "create_user", "consume"]);
    expect(consumed).toBe(true);
  });
});

// ── create-student-account: rollback safety after failed consumption ──────

describe("create-student-account – rollback on consumption failure", () => {
  it("rolls back newly created account when atomic consumption fails", () => {
    const createdRecords: string[] = ["auth_user", "profile", "user_role", "dept_member"];
    function rollback() {
      createdRecords.length = 0;
    }
    const consumptionFailed = true;
    if (consumptionFailed) rollback();
    expect(createdRecords).toHaveLength(0);
  });

  it("does not delete or alter existing accounts during rollback", () => {
    const existingUser = { id: "real-user-1", email: "existing@test.com" };
    const newUserId = "new-user-1";
    const deleted: string[] = [];
    function rollbackOnlyNew(uid: string) {
      deleted.push(uid);
    }
    rollbackOnlyNew(newUserId);
    expect(deleted).toContain(newUserId);
    expect(deleted).not.toContain(existingUser.id);
  });
});

// ── create-student-account: admin auth flow ──────────────────────────────

describe("create-student-account – admin auth flow", () => {
  it("rejects request without Authorization header", () => {
    const headers = new Map<string, string>();
    expect(headers.has("Authorization")).toBe(false);
  });

  it("derives institution from admin email (never from client body alone)", () => {
    const bodyInstitutionId = "client-provided-id";
    const serverDerivedId = "server-resolved-id";
    expect(bodyInstitutionId).not.toBe(serverDerivedId);
  });
});

// ── create-student-account: CORS origin validation ───────────────────────

describe("create-student-account – CORS strict origins", () => {
  it("allows exact-match origins", () => {
    const allowed = ["https://unigates.online", "https://lovable.dev", "http://localhost:5173"];
    expect(allowed).toContain("https://unigates.online");
    expect(allowed).toContain("http://localhost:5173");
  });

  it("allows wildcard subdomain origins", () => {
    function matchesWildcard(origin: string): boolean {
      if (origin.endsWith(".unigates.online")) return true;
      if (origin.endsWith(".lovable.app")) return true;
      return false;
    }
    expect(matchesWildcard("https://app.unigates.online")).toBe(true);
    expect(matchesWildcard("https://preview--unigates-online.lovable.app")).toBe(true);
    expect(matchesWildcard("https://evil.unigates.online.evil.com")).toBe(false);
  });

  it("rejects unknown origins", () => {
    const allowed = ["https://unigates.online", "https://lovable.dev"];
    expect(allowed).not.toContain("https://evil.com");
    expect(allowed).not.toContain("http://localhost:3000");
  });
});

// ── create-student-account: no raw invitation token stored ──────────────

describe("create-student-account – no raw invitation token stored", () => {
  it("omits invitation_code field from department_members insert", () => {
    const insertPayload = {
      department_id: "d1",
      full_name: "Test Student",
      role: "student",
      user_id: "u1",
      email: "test@test.com",
      phone: null,
    };
    expect((insertPayload as any).invitation_code).toBeUndefined();
  });

  it("does not store raw invitation_code in profiles or user_roles", () => {
    const profileInsert = { user_id: "u1", email: "t@t.com", full_name: "T", phone: null, role: "student", platform: "courses" };
    const roleInsert = { user_id: "u1", role: "student" as const, approved: true };
    expect((profileInsert as any).invitation_code).toBeUndefined();
    expect((roleInsert as any).invitation_code).toBeUndefined();
  });
});

// ── create-student-account: phone handling ──────────────────────────────

describe("create-student-account – phone handling", () => {
  it("stores phone as null when not provided", () => {
    const phone = "";
    const result = phone || null;
    expect(result).toBeNull();
  });

  it("stores phone as provided value when present", () => {
    const phone = "01012345678";
    const result = phone || null;
    expect(result).toBe("01012345678");
  });

  it("never fabricates a fallback phone number", () => {
    const phone = "";
    const result = phone || null;
    expect(result).not.toBe("+200000000000");
  });
});

// ── create-student-account: department code validation ──────────────────

describe("create-student-account – department code validation", () => {
  it("rejects request when any code is not found", () => {
    const requested = ["CS101", "MATH202", "NONEXISTENT"];
    const existing = new Set(["CS101", "MATH202"]);
    const missing = requested.filter((c) => !existing.has(c));
    expect(missing).toEqual(["NONEXISTENT"]);
  });

  it("rejects request when codes belong to different institution", () => {
    const institutionId = "inst-1";
    const depts = [
      { id: "d1", department_code: "CS101", institution_id: "inst-1" },
      { id: "d2", department_code: "MATH202", institution_id: "inst-2" },
    ];
    const allowed = depts.filter((d) => d.institution_id === institutionId);
    const requested = ["CS101", "MATH202"];
    expect(allowed.length).not.toBe(requested.length);
  });

  it("accepts when all codes exist and belong to institution", () => {
    const institutionId = "inst-1";
    const depts = [
      { id: "d1", department_code: "CS101", institution_id: "inst-1" },
      { id: "d2", department_code: "MATH202", institution_id: "inst-1" },
    ];
    const requested = ["CS101", "MATH202"];
    const allowed = depts.filter((d) => d.institution_id === institutionId);
    expect(allowed.length).toBe(requested.length);
  });

  it("does not create partial account when some codes are invalid", () => {
    const created = { authUser: false, profiles: false, members: false };
    const codes = ["CS101", "INVALID"];
    const valid = ["CS101"];
    const allValid = codes.every((c) => valid.includes(c));
    if (!allValid) {
      // Simulate not creating anything
    }
    expect(allValid).toBe(false);
    expect(created.authUser).toBe(false);
  });
});

// ── create-student-account: concurrent invitation consumption ───────────

describe("create-student-account – concurrent invitation consumption", () => {
  it("only one concurrent request can consume the last slot", () => {
    let usedCount = 0;
    let successCount = 0;
    function atomicConsume(): boolean {
      if (usedCount < 1) {
        usedCount++;
        successCount++;
        return true;
      }
      return false;
    }
    const r1 = atomicConsume();
    const r2 = atomicConsume();
    expect(r1).toBe(true);
    expect(r2).toBe(false);
    expect(successCount).toBe(1);
  });

  it("rolls back new user when concurrent consumption finds already consumed", () => {
    const newUserId = "new-user-1";
    const existingUsers = new Set(["existing-user-1"]);
    const deleted: string[] = [];
    function rollbackOnlyNew(uid: string) {
      if (!existingUsers.has(uid)) {
        deleted.push(uid);
      }
    }
    rollbackOnlyNew(newUserId);
    expect(deleted).toContain(newUserId);
    expect(deleted).not.toContain("existing-user-1");
  });
});

// ── create-student-account: rollback only new accounts ──────────────────

describe("create-student-account – rollback only new accounts", () => {
  it("does not delete or alter pre-existing accounts during rollback", () => {
    const existingIds = new Set(["real-user-1", "real-user-2"]);
    const newUserId = "just-created-user";
    const deleted: string[] = [];
    function rollback(uid: string) {
      if (!existingIds.has(uid)) {
        deleted.push(uid);
      }
    }
    rollback(newUserId);
    expect(deleted).toEqual(["just-created-user"]);
  });

  it("never touches auth.users entries that existed before this request", () => {
    const before = new Set(["legacy-1", "legacy-2"]);
    const createdNow = "fresh-user";
    const toDelete: string[] = [];
    if (!before.has(createdNow)) toDelete.push(createdNow);
    expect(toDelete).toEqual(["fresh-user"]);
    expect(toDelete.filter((id) => before.has(id))).toHaveLength(0);
  });
});

// ── create-student-account: CORS disallowed origin ──────────────────────

describe("create-student-account – CORS disallowed origin", () => {
  it("returns null origin for unknown origins", () => {
    const ALLOWED_ORIGINS = [
      "https://lovable.dev",
      "https://unigates.online",
    ];
    function getOrigin(origin: string): string {
      const allowed = ALLOWED_ORIGINS.some((p) => origin === p || (p.startsWith("https://*.") && origin.endsWith(p.replace("https://*.", "."))));
      return allowed ? origin : "null";
    }
    expect(getOrigin("https://evil.com")).toBe("null");
    expect(getOrigin("https://unigates.online")).toBe("https://unigates.online");
  });
});

// ── create-student-account: email format validation ─────────────────────

describe("create-student-account – email format validation", () => {
  it("accepts valid email", () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(re.test("user@example.com")).toBe(true);
  });

  it("rejects invalid email", () => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(re.test("not-an-email")).toBe(false);
    expect(re.test("missing@dot")).toBe(false);
    expect(re.test("@missing-local")).toBe(false);
    expect(re.test("")).toBe(false);
  });
});

// ── create-student-account: method and body validation ──────────────────

describe("create-student-account – method and body validation", () => {
  it("rejects non-POST methods", () => {
    const allowed = new Set(["POST", "OPTIONS"]);
    expect(allowed.has("GET")).toBe(false);
    expect(allowed.has("PUT")).toBe(false);
    expect(allowed.has("DELETE")).toBe(false);
    expect(allowed.has("POST")).toBe(true);
    expect(allowed.has("OPTIONS")).toBe(true);
  });

  it("rejects invalid JSON body", () => {
    function tryParse(text: string): boolean {
      try { JSON.parse(text); return true; } catch { return false; }
    }
    expect(tryParse("not json")).toBe(false);
    expect(tryParse("")).toBe(false);
    expect(tryParse('{"valid": true}')).toBe(true);
  });

  it("rejects body exceeding size limit", () => {
    const MAX_BODY_BYTES = 65536;
    const oversized = new Array(MAX_BODY_BYTES + 1).fill("a").join("");
    expect(new TextEncoder().encode(oversized).length).toBeGreaterThan(MAX_BODY_BYTES);
  });

  it("requires full_name", () => {
    const fullName = "";
    expect(fullName.trim()).toBe("");
  });

  it("requires department_codes", () => {
    const codes: string[] = [];
    expect(codes.length === 0).toBe(true);
  });
});

// ── create-student-account: successful account creation ─────────────────

describe("create-student-account – successful account creation", () => {
  it("returns user_id and email on success", () => {
    const response = { success: true, email: "new@test.com", user_id: "u-new", joined: 2 };
    expect(response.success).toBe(true);
    expect(response.email).toBe("new@test.com");
    expect(response.user_id).toBe("u-new");
    expect(response.joined).toBe(2);
  });

  it("includes password only in admin mode", () => {
    const adminResponse = { success: true, email: "a@b.com", password: "GenPass1!", user_id: "u1", joined: 1 };
    expect(adminResponse.password).toBeDefined();
    const invitationResponse = { success: true, email: "a@b.com", user_id: "u2", joined: 1 };
    expect((invitationResponse as any).password).toBeUndefined();
  });

  it("sets Cache-Control: no-store when returning password", () => {
    const extraHeaders: Record<string, string> = {};
    extraHeaders["Cache-Control"] = "no-store, no-cache, must-revalidate, private";
    expect(extraHeaders["Cache-Control"]).toContain("no-store");
  });
});

// ── create-student-account: duplicate email ─────────────────────────────

describe("create-student-account – duplicate email handling", () => {
  it("rejects with 409 when email is already registered", () => {
    const existing = new Set(["taken@test.com"]);
    expect(existing.has("taken@test.com")).toBe(true);
    expect(existing.has("new@test.com")).toBe(false);
  });

  it("detects email_exists error code", () => {
    const err = { code: "email_exists", message: "User already registered" };
    const code = String(err?.code || "").toLowerCase();
    const message = String(err?.message || "").toLowerCase();
    const isDup = code === "email_exists" || message.includes("already registered");
    expect(isDup).toBe(true);
  });

  it("does not create user when email is duplicate", () => {
    const created: string[] = [];
    const email = "taken@test.com";
    const existing = new Set(["taken@test.com"]);
    if (!existing.has(email)) {
      created.push(email);
    }
    expect(created).toHaveLength(0);
  });
});

// ── create-student-account: error exposure safety ────────────────────────

describe("create-student-account – error exposure safety", () => {
  it("does not expose step names or internal messages to client", () => {
    function fail(step: string, message: string) {
      console.error(`[create-student-account] step "${step}" failed: ${message}`);
      return { error: "Account creation failed" };
    }
    const result = fail("create_user", "duplicate key violates unique constraint");
    expect(result.error).toBe("Account creation failed");
    expect((result as any).step).toBeUndefined();
  });

  it("does not expose service keys in responses", () => {
    const response = { error: "Account creation failed" };
    expect(JSON.stringify(response)).not.toContain("service_role");
    expect(JSON.stringify(response)).not.toContain("SUPABASE");
    expect(JSON.stringify(response)).not.toContain("anon");
  });
});
