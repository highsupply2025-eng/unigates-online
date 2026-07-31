import { describe, it, expect } from "vitest";
import fs from "fs";

// The bulk-create-institution-accounts Edge Function had a cross-institution
// account-hijacking vulnerability: when a row's email already existed in the
// auth system, it silently rewrote that account's profile (name/phone/role),
// granted approved roles, and attached it to the caller's department and
// institution. Any approved institution admin could therefore claim any
// existing account into their own institution and downgrade or overwrite its
// identity.
//
// The fix: existing accounts are never mutated. The caller is verified
// server-side from the JWT via is_institution_admin, departments are resolved
// only within the caller's institution, and every existing email is either
// reported as an idempotent same-institution re-upload or rejected with a safe
// message through the invitation flow.
//
// These tests pin the source to the secure behavior.

const FN_SOURCE = fs.readFileSync(
  "supabase/functions/bulk-create-institution-accounts/index.ts",
  "utf-8",
);

const IFM_MIGRATION = fs.readFileSync(
  "supabase/migrations/20260719000211_485c155a-0609-42fd-9374-6893069b953a.sql",
  "utf-8",
);

const FACULTY_EDIT_MIGRATION = fs.readFileSync(
  "supabase/migrations/20260721010000_fix_faculty_edit_without_department.sql",
  "utf-8",
);

const COLLEGE_MEMBERS_MIGRATION = fs.readFileSync(
  "supabase/migrations/20260322220918_3a46ca24-6b91-4614-b2f2-90dfa42464d9.sql",
  "utf-8",
);

const DASHBOARD_SOURCE = fs.readFileSync(
  "src/pages/InstitutionDashboard.tsx",
  "utf-8",
);

const SAFE_ERROR =
  "البريد الإلكتروني مستخدم في حساب قائم ولا يمكن إضافته تلقائيًا. استخدم مسار الدعوة أو تواصل مع الدعم.";

// The existing-account classification section starts at this marker; no data
// mutation may appear after it.
const EXISTING_MARKER = "Existing account: classify";
const existingBranch = FN_SOURCE.slice(FN_SOURCE.indexOf(EXISTING_MARKER));

function indexBetween(needle: string, from: string, to: string): number {
  const idx = FN_SOURCE.indexOf(needle);
  expect(idx).toBeGreaterThan(-1);
  expect(idx).toBeGreaterThan(FN_SOURCE.indexOf(from));
  expect(idx).toBeLessThan(FN_SOURCE.indexOf(to));
  return idx;
}

describe("caller authorization is enforced server-side", () => {
  it("resolves the caller from the JWT via getUser()", () => {
    expect(FN_SOURCE).toContain("userClient.auth.getUser()");
    expect(FN_SOURCE).toContain('if (!user?.id) return json({ error: "Unauthorized" }, 401);');
  });

  it("verifies the caller with the is_institution_admin RPC using the JWT user id", () => {
    expect(FN_SOURCE).toContain('admin.rpc("is_institution_admin"');
    expect(FN_SOURCE).toContain("_user_id: user.id");
  });

  it("rejects callers who are not the approved admin", () => {
    expect(FN_SOURCE).toContain('if (isAdmin !== true) return json({ error: "Forbidden" }, 403);');
  });

  it("no longer trusts the registration-email table lookup driven by the caller-supplied id", () => {
    // The vulnerable version picked the table from the caller-supplied
    // institution_type and only compared registration email. That path is gone.
    expect(FN_SOURCE).not.toContain('const table = institutionType === "college"');
  });

  it("validates the institution type before any write", () => {
    expect(FN_SOURCE).toContain(
      'if (institutionType !== "college" && institutionType !== "institute") {',
    );
  });
});

describe("departments are resolved only inside the caller's institution", () => {
  it("scopes the department query to the caller institution", () => {
    expect(FN_SOURCE).toContain('.eq("institution_id", institutionId)');
    expect(FN_SOURCE).toContain('.eq("institution_type", institutionType)');
  });

  it("requires an exact active department match before creating an account", () => {
    expect(FN_SOURCE).toContain(
      'if (!deptId) {\n        results.push({ row: i + 2, email, ok: false, error: `القسم غير موجود أو غير معتمد',
    );
  });
});

describe("emails are normalized before any lookup or write", () => {
  it("trims and lowercases the email once at the top of each row", () => {
    expect(FN_SOURCE).toContain(
      'const email = String(r.email || "").trim().toLowerCase();',
    );
  });

  it("normalizes the email again when collecting existing ids", () => {
    expect(FN_SOURCE).toContain(
      'const e = String(r?.email || "").trim().toLowerCase();',
    );
  });
});

describe("new accounts are created safely", () => {
  it("creates a confirmed auth user with a unique generated password", () => {
    expect(FN_SOURCE).toContain("const password = genPassword();");
    expect(FN_SOURCE).toContain("email_confirm: true");
    expect(FN_SOURCE).toContain('seeded_via: "institution_bulk"');
    expect(FN_SOURCE).toContain("must_reset_password: true");
  });

  it("flags the profile for a forced password change", () => {
    expect(FN_SOURCE).toContain("must_change_password: true");
    expect(FN_SOURCE).toContain('from("profiles")');
  });

  it("grants an approved role and links department membership by user_id", () => {
    expect(FN_SOURCE).toContain('from("user_roles")');
    expect(FN_SOURCE).toContain("approved: true");
    expect(FN_SOURCE).toContain('from("department_members")');
    expect(FN_SOURCE).toContain("user_id: newUid");
  });

  it("never ships or logs a literal password", () => {
    expect(FN_SOURCE).not.toMatch(/password\s*[:=]\s*["'][^"']{6,}["']/i);
    expect(FN_SOURCE).not.toMatch(
      /console\.(log|warn|error)\([^)]*password/i,
    );
  });
});

describe("existing accounts are NEVER mutated (hijacking fix)", () => {
  it("does not reset or update passwords of existing users", () => {
    expect(FN_SOURCE).not.toContain("updateUserById");
  });

  it("the only data writes live in the new-account branch, before the existing-account section", () => {
    // The pre-fetch section above the loop is read-only. Every write helper
    // (createUser, upsert, insert) must appear inside the `if (!uid) {` block
    // that runs only for brand-new auth users.
    indexBetween("createUser", "if (!uid) {", EXISTING_MARKER);
    indexBetween(".upsert(", "if (!uid) {", EXISTING_MARKER);
    indexBetween(".insert(", "if (!uid) {", EXISTING_MARKER);
  });

  it("the existing-account section performs zero writes", () => {
    expect(existingBranch).not.toMatch(/\.insert\(/);
    expect(existingBranch).not.toMatch(/\.upsert\(/);
    expect(existingBranch).not.toMatch(/\.update\(/);
    expect(existingBranch).not.toMatch(/\.delete\(/);
    expect(existingBranch).not.toContain("createUser");
    expect(existingBranch).not.toContain("updateUserById");
  });

  it("rejects an account that belongs to another institution", () => {
    expect(FN_SOURCE).toContain("EMAIL_BELONGS_TO_ANOTHER_INSTITUTION");
    expect(existingBranch).toContain("belongsToAnother");
  });

  it("rejects protected/global accounts", () => {
    expect(FN_SOURCE).toContain("PROTECTED_ACCOUNT");
    expect(FN_SOURCE).toContain("PROTECTED_ROLES");
  });

  it("rejects unrelated existing accounts in favor of the invitation flow", () => {
    expect(FN_SOURCE).toContain("EXISTING_ACCOUNT_REQUIRES_INVITATION");
  });

  it("returns an idempotent ALREADY_MEMBER result for same-institution re-uploads", () => {
    expect(FN_SOURCE).toContain("ALREADY_MEMBER");
    expect(existingBranch).toContain("isSameInstitution");
    // No password is returned for an existing member.
    expect(existingBranch).not.toMatch(/password\s*:/);
    expect(existingBranch).not.toMatch(/\.password/);
  });

  it("uses one generic, safe Arabic message for every existing-account rejection", () => {
    // The message is defined exactly once as a constant so every rejection
    // branch shares the same safe text...
    expect(FN_SOURCE.split(SAFE_ERROR).length - 1).toBe(1);
    // ...and that constant is referenced by the constant definition plus each
    // rejection branch (createUser race, another institution, protected
    // account, requires invitation).
    expect(FN_SOURCE.split("EXISTING_ACCOUNT_SAFE_ERROR").length - 1).toBeGreaterThanOrEqual(5);
    expect(existingBranch.split("EXISTING_ACCOUNT_SAFE_ERROR").length - 1).toBeGreaterThanOrEqual(3);
  });

  it("never places a password on rejected rows", () => {
    // Rejected results carry `code`/`error` only; the only `password:` payload
    // in the whole function is on newly-created rows inside the new-account
    // branch, which is never reached for existing accounts.
    expect(existingBranch).not.toMatch(/password\s*:/);
    expect(existingBranch).not.toMatch(/\.password/);
    expect(existingBranch).not.toContain("genPassword");
  });
});

describe("idempotency and duplicate-membership protection", () => {
  it("inserts department membership with ignoreDuplicates", () => {
    expect(FN_SOURCE).toContain('{ onConflict: "department_id,user_id", ignoreDuplicates: true }');
  });

  it("department_members has a unique (department_id, user_id) index in the schema", () => {
    expect(FACULTY_EDIT_MIGRATION).toMatch(/department_members_department_user_unique/);
    expect(FACULTY_EDIT_MIGRATION).toMatch(/UNIQUE[^)]*department_id, user_id/);
  });

  it("institution_faculty_members.user_id is globally unique (one faculty row per user)", () => {
    expect(IFM_MIGRATION).toMatch(/user_id UUID NOT NULL UNIQUE REFERENCES auth\.users/);
  });

  it("college_members has a unique (college_id, user_id) constraint", () => {
    expect(COLLEGE_MEMBERS_MIGRATION).toMatch(/UNIQUE\(college_id, user_id\)/);
  });
});

describe("response contract is preserved for the frontend", () => {
  it("returns success, total, created, failed and per-row results", () => {
    expect(FN_SOURCE).toContain("total: rows.length");
    expect(FN_SOURCE).toContain("created");
    expect(FN_SOURCE).toContain("failed");
    expect(FN_SOURCE).toContain("results");
  });

  it("keeps the existing validation limits", () => {
    expect(FN_SOURCE).toContain('if (rows.length === 0) return json({ error: "Empty file" }, 400);');
    expect(FN_SOURCE).toContain('if (rows.length > 1000) return json({ error: "Max 1000 rows" }, 400);');
  });

  it("the dashboard still invokes with institution info and rows only", () => {
    expect(DASHBOARD_SOURCE).toContain(
      '"bulk-create-institution-accounts"',
    );
    expect(DASHBOARD_SOURCE).toContain(
      "institution_type: institutionType, institution_id: institutionId, rows",
    );
  });

  it("the dashboard renders created/failed/total and per-row password/error lists", () => {
    expect(DASHBOARD_SOURCE).toContain("bulkResult.created");
    expect(DASHBOARD_SOURCE).toContain("bulkResult.failed");
    expect(DASHBOARD_SOURCE).toContain("bulkResult.total");
    expect(DASHBOARD_SOURCE).toContain("r.ok && r.password");
    expect(DASHBOARD_SOURCE).toContain("r.error");
  });
});
