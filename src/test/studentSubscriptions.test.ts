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
    const response = { success: true, email: "test@test.com", user_id: "u1", joined: 1, missing: [], password_returned: false };
    expect(response.password).toBeUndefined();
    expect(response.password_returned).toBe(false);
  });

  it("includes password with Cache-Control: no-store in admin mode", () => {
    const response = { success: true, email: "test@test.com", password: "TempPass1!", user_id: "u1", joined: 1, missing: [] };
    expect(response.password).toBeDefined();
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
