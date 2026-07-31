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
// The fix: existing accounts are never looked up or reused. The caller is
// verified server-side from the JWT via is_institution_admin, departments are
// resolved only within the caller's institution, and createUser is the sole
// account entry point. Supabase rejects an existing email before the function
// writes any profile, role, or department membership.
//
// These tests pin the source to the secure behavior.

const FN_SOURCE = fs.readFileSync(
  "supabase/functions/bulk-create-institution-accounts/index.ts",
  "utf-8",
);

const DASHBOARD_SOURCE = fs.readFileSync(
  "src/pages/InstitutionDashboard.tsx",
  "utf-8",
);

const SAFE_ERROR =
  "البريد الإلكتروني مستخدم في حساب قائم ولا يمكن إضافته تلقائيًا. استخدم مسار الدعوة أو تواصل مع الدعم.";

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

describe("existing accounts are never looked up or reused (hijacking fix)", () => {
  it("does not enumerate auth users or fetch account affiliations", () => {
    expect(FN_SOURCE).not.toContain("listUsers");
    expect(FN_SOURCE).not.toContain('from("institution_faculty_members")');
    expect(FN_SOURCE).not.toContain('from("college_members")');
    expect(FN_SOURCE).not.toContain('.in("user_id"');
  });

  it("does not update any existing auth user", () => {
    expect(FN_SOURCE).not.toContain("updateUserById");
  });

  it("uses createUser as the only source of an imported user id", () => {
    expect(FN_SOURCE).toContain("admin.auth.admin.createUser");
    expect(FN_SOURCE).toContain("newUid = createdUser.user.id;");
    expect(FN_SOURCE).not.toMatch(/const\s+uid\s*=/);
    expect(FN_SOURCE).not.toMatch(/user_id:\s*uid\b/);
  });

  it("rejects every existing email through the invitation flow", () => {
    expect(FN_SOURCE).toContain("EXISTING_ACCOUNT_REQUIRES_INVITATION");
    expect(FN_SOURCE).toContain("if (isEmailAlreadyExistsError(ce))");
    expect(FN_SOURCE).toContain("code: REJECTION.requiresInvitation");
  });

  it("uses one generic message that does not disclose account ownership", () => {
    expect(FN_SOURCE.split(SAFE_ERROR).length - 1).toBe(1);
    expect(FN_SOURCE.split("EXISTING_ACCOUNT_SAFE_ERROR").length - 1).toBe(2);
  });

  it("rejects duplicate emails before profile, role, and membership writes", () => {
    const duplicateCheck = FN_SOURCE.indexOf("if (isEmailAlreadyExistsError(ce))");
    const duplicateExit = FN_SOURCE.indexOf("continue;", duplicateCheck);
    const profileWrite = FN_SOURCE.indexOf('from("profiles").upsert', duplicateCheck);
    expect(duplicateCheck).toBeGreaterThan(-1);
    expect(duplicateExit).toBeGreaterThan(duplicateCheck);
    expect(profileWrite).toBeGreaterThan(duplicateExit);
  });

  it("rolls back only the user id returned by a successful createUser call", () => {
    const assignedUid = FN_SOURCE.indexOf("newUid = createdUser.user.id;");
    const rollbackCall = FN_SOURCE.indexOf("rollbackNewUser(admin, newUid)");
    expect(assignedUid).toBeGreaterThan(-1);
    expect(rollbackCall).toBeGreaterThan(assignedUid);
    expect(FN_SOURCE).toContain("if (newUid) await rollbackNewUser(admin, newUid);");
  });

  it("cleans partial application records before deleting a failed new auth user", () => {
    const rollbackStart = FN_SOURCE.indexOf("async function rollbackNewUser");
    const rollbackEnd = FN_SOURCE.indexOf("Deno.serve", rollbackStart);
    const rollbackSource = FN_SOURCE.slice(rollbackStart, rollbackEnd);
    expect(rollbackSource).toContain('"department_members", "user_roles", "profiles"');
    expect(rollbackSource).toContain('.delete().eq("user_id", uid)');
    expect(rollbackSource).toContain("admin.auth.admin.deleteUser(uid)");
  });
});

describe("duplicate-membership protection", () => {
  it("inserts department membership with ignoreDuplicates", () => {
    expect(FN_SOURCE).toContain('{ onConflict: "department_id,user_id", ignoreDuplicates: true }');
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
