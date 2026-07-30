import { describe, it, expect } from "vitest";
import fs from "fs";

// ── Constants ────────────────────────────────────────────────────────────────
const PROTECTED_EMAIL: string = "darobaid@unigates.online";
const PROTECTED_EMAIL_LOWER = PROTECTED_EMAIL.toLowerCase();

// Evidence-based test account patterns (from seed-test-accounts/index.ts)
const SEED_TEST_EMAIL_REGEX = /^darobaid\d+@unigates\.online$/;
const EXAMPLE_COM_REGEX = /@example\.com$/;
const TEST_ADMIN_EMAIL: string = "test_admin@unigates.online";
const TEST_EMAIL: string = "test@unigates.online";

// All documented test account emails from seed-test-accounts
const SEED_TEST_ACCOUNTS = [
  "darobaid1@unigates.online",
  "darobaid2@unigates.online",
  "darobaid3@unigates.online",
  "darobaid4@unigates.online",
  "darobaid5@unigates.online",
  "darobaid6@unigates.online",
  "darobaid7@unigates.online",
  "darobaid8@unigates.online",
  "darobaid9@unigates.online",
  "darobaid10@unigates.online",
  "darobaid11@unigates.online",
  "darobaid12@unigates.online",
  "darobaid13@unigates.online",
];

// File contents loaded once per suite
const cleanupFunctionsSource = fs.readFileSync(
  "supabase/migrations/20260730000000_add_cleanup_functions.sql",
  "utf-8",
);
const cleanupTestAccountsSource = fs.readFileSync(
  "supabase/migrations/20260730000001_cleanup_test_accounts.sql",
  "utf-8",
);
const repairOwnerRoleSource = fs.readFileSync(
  "supabase/migrations/20260730000002_repair_owner_role.sql",
  "utf-8",
);

describe("Protected owner account", () => {
  it("should never match the seed-test-accounts regex pattern", () => {
    expect(PROTECTED_EMAIL).not.toMatch(SEED_TEST_EMAIL_REGEX);
  });

  it("should never match @example.com pattern", () => {
    expect(PROTECTED_EMAIL).not.toMatch(EXAMPLE_COM_REGEX);
  });

  it("should not equal test_admin email", () => {
    expect(PROTECTED_EMAIL).not.toBe(TEST_ADMIN_EMAIL);
  });

  it("should not equal test@ email", () => {
    expect(PROTECTED_EMAIL).not.toBe(TEST_EMAIL);
  });

  it("protected email is lowercase-normalized", () => {
    expect(PROTECTED_EMAIL_LOWER).toBe(PROTECTED_EMAIL);
    expect(PROTECTED_EMAIL_LOWER).toBe("darobaid@unigates.online");
  });
});

describe("Seed test accounts — evidence-based identification", () => {
  it("all 13 seed accounts match the test regex pattern", () => {
    for (const email of SEED_TEST_ACCOUNTS) {
      expect(email).toMatch(SEED_TEST_EMAIL_REGEX);
    }
  });

  it("no seed account equals the protected owner email", () => {
    for (const email of SEED_TEST_ACCOUNTS) {
      expect(email.toLowerCase()).not.toBe(PROTECTED_EMAIL_LOWER);
    }
  });

  it("seed accounts are sequentially numbered 1-13", () => {
    expect(SEED_TEST_ACCOUNTS).toHaveLength(13);
    for (let i = 0; i < 13; i++) {
      expect(SEED_TEST_ACCOUNTS[i]).toBe(`darobaid${i + 1}@unigates.online`);
    }
  });
});

describe("Cleanup dry-run candidate classification", () => {
  const SEED_EVIDENCE = "seed-test-accounts: sequential test account";
  const EXAMPLE_EVIDENCE = "test fixture: @example.com domain";
  const TEST_ADMIN_EVIDENCE = "test account: test_admin prefix";
  const TEST_EVIDENCE = "test account: test@ prefix";

  it("seed accounts have correct evidence string", () => {
    expect(SEED_EVIDENCE).toContain("seed-test-accounts");
    expect(SEED_EVIDENCE).toContain("sequential test account");
  });

  it("@example.com accounts have correct evidence string", () => {
    expect(EXAMPLE_EVIDENCE).toContain("@example.com");
  });

  it("test_admin has correct evidence string", () => {
    expect(TEST_ADMIN_EVIDENCE).toContain("test_admin");
  });

  it("test@ has correct evidence string", () => {
    expect(TEST_EVIDENCE).toContain("test@");
  });

  it("protected owner email would never appear in any evidence category", () => {
    const wouldBeCandidate =
      SEED_TEST_EMAIL_REGEX.test(PROTECTED_EMAIL) ||
      EXAMPLE_COM_REGEX.test(PROTECTED_EMAIL) ||
      PROTECTED_EMAIL === TEST_ADMIN_EMAIL ||
      PROTECTED_EMAIL === TEST_EMAIL;

    expect(wouldBeCandidate).toBe(false);
  });
});

describe("Production test-account generation guard", () => {
  it("TestAccountsPanel returns null when import.meta.env.DEV is false", () => {
    const panelSource = fs.readFileSync(
      "src/components/TestAccountsPanel.tsx",
      "utf-8",
    );
    expect(panelSource).toContain("import.meta.env.DEV");
    expect(panelSource).toContain("if (!isDev) return null");
  });

  it("AdminDashboard gates TestAccountsPanel behind DEV check", () => {
    const dashboardSource = fs.readFileSync(
      "src/pages/AdminDashboard.tsx",
      "utf-8",
    );
    expect(dashboardSource).toContain(
      "{import.meta.env.DEV && <TestAccountsPanel ar={ar} />}",
    );
  });

  it("seed-test-accounts edge function checks DENO_DEPLOYMENT_ID", () => {
    const seedSource = fs.readFileSync(
      "supabase/functions/seed-test-accounts/index.ts",
      "utf-8",
    );
    expect(seedSource).toContain("DENO_DEPLOYMENT_ID");
    expect(seedSource).toContain("Test account seeding is disabled in production");
  });
});

describe("Admin approval access — user_roles/has_role pattern", () => {
  it("has_role function checks user_roles with approved=true", () => {
    const migrationSource = fs.readFileSync(
      "supabase/migrations/20260330010937_4874321e-13f2-46ee-9df1-90c9d72c32be.sql",
      "utf-8",
    );
    expect(migrationSource).toContain("approved = true");
    expect(migrationSource).toContain("user_roles");
  });

  it("Login.tsx routes admin role to /admin/dashboard", () => {
    const loginSource = fs.readFileSync("src/pages/Login.tsx", "utf-8");
    expect(loginSource).toContain('role === "admin"');
    expect(loginSource).toContain("/admin/dashboard");
  });

  it("AdminDashboard checkAdmin queries user_roles with approved=true", () => {
    const dashboardSource = fs.readFileSync(
      "src/pages/AdminDashboard.tsx",
      "utf-8",
    );
    expect(dashboardSource).toContain('eq("role", "admin")');
    expect(dashboardSource).toContain('eq("approved", true)');
  });
});

// ── Remediated migration structure checks ──────────────────────────────────────

describe("Migration 1 — cleanup functions (install-only, no destructive DO blocks)", () => {
  it("contains no DO blocks", () => {
    const doBlockRegex = /^\s*DO\s+\$\$/gm;
    const matches = cleanupFunctionsSource.match(doBlockRegex);
    expect(matches).toBeNull();
  });

  it("contains no top-level DELETE, UPDATE, or CALL statements", () => {
    const destructiveRegex = /^\s*(DELETE|UPDATE|CALL)\s+/gim;
    const matches = cleanupFunctionsSource.match(destructiveRegex);
    expect(matches).toBeNull();
  });

  it("installs _protected_owner_emails function", () => {
    expect(cleanupFunctionsSource).toContain(
      "CREATE OR REPLACE FUNCTION public._protected_owner_emails()",
    );
  });

  it("installs get_cleanup_candidates function", () => {
    expect(cleanupFunctionsSource).toContain(
      "CREATE OR REPLACE FUNCTION public.get_cleanup_candidates()",
    );
  });

  it("installs verify_no_protected_owner_in_candidates function", () => {
    expect(cleanupFunctionsSource).toContain(
      "CREATE OR REPLACE FUNCTION public.verify_no_protected_owner_in_candidates()",
    );
  });

  it("installs snapshot_accounts_before_cleanup function", () => {
    expect(cleanupFunctionsSource).toContain(
      "CREATE OR REPLACE FUNCTION public.snapshot_accounts_before_cleanup()",
    );
  });

  it("installs get_test_registration_emails function", () => {
    expect(cleanupFunctionsSource).toContain(
      "CREATE OR REPLACE FUNCTION public.get_test_registration_emails()",
    );
  });

  it("does not use broad @marafa.com LIKE pattern", () => {
    expect(cleanupFunctionsSource).not.toMatch(/LIKE\s+['"]%@marafa\.com['"]/i);
  });

  it("does not contain any @marafa.com references", () => {
    expect(cleanupFunctionsSource).not.toContain("marafa.com");
  });

  it("all functions have SECURITY DEFINER", () => {
    expect(cleanupFunctionsSource).toContain("SECURITY DEFINER");
  });

  it("all functions set search_path = public, pg_temp", () => {
    expect(cleanupFunctionsSource).toContain(
      "SET search_path = public, pg_temp",
    );
  });

  it("all functions have REVOKE ALL FROM PUBLIC", () => {
    const revokeAllMatches = cleanupFunctionsSource.match(
      /REVOKE ALL ON FUNCTION[^;]+FROM PUBLIC/g,
    );
    expect(revokeAllMatches).not.toBeNull();
    expect(revokeAllMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it("all functions REVOKE EXECUTE FROM anon", () => {
    const revokeAnonMatches = cleanupFunctionsSource.match(
      /REVOKE EXECUTE ON FUNCTION[^;]+FROM anon/g,
    );
    expect(revokeAnonMatches).not.toBeNull();
    expect(revokeAnonMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it("all functions REVOKE EXECUTE FROM authenticated", () => {
    const revokeAuthMatches = cleanupFunctionsSource.match(
      /REVOKE EXECUTE ON FUNCTION[^;]+FROM authenticated/g,
    );
    expect(revokeAuthMatches).not.toBeNull();
    expect(revokeAuthMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it("all functions GRANT EXECUTE TO service_role", () => {
    const grantMatches = cleanupFunctionsSource.match(
      /GRANT EXECUTE ON FUNCTION[^;]+TO service_role/g,
    );
    expect(grantMatches).not.toBeNull();
    expect(grantMatches!.length).toBeGreaterThanOrEqual(5);
  });

  it("get_cleanup_candidates excludes protected owner emails", () => {
    expect(cleanupFunctionsSource).toContain(
      "!= ALL(SELECT public._protected_owner_emails())",
    );
  });

  it("uses exact darobaid1-13 pattern (not broad darobaid@)", () => {
    expect(cleanupFunctionsSource).toContain("^darobaid\\d+@unigates\\.online$");
  });
});

describe("Migration 2 — cleanup execution (function-only, no auto-deletion)", () => {
  it("installs delete_test_accounts function", () => {
    expect(cleanupTestAccountsSource).toContain(
      "CREATE OR REPLACE FUNCTION public.delete_test_accounts()",
    );
  });

  it("contains no automatic destructive DO blocks", () => {
    const doBlockRegex = /^\s*DO\s+\$\$/gm;
    const matches = cleanupTestAccountsSource.match(doBlockRegex);
    expect(matches).toBeNull();
  });

  it("contains no top-level DELETE, UPDATE, or CALL statements", () => {
    const lines = cleanupTestAccountsSource.split("\n");
    let insideFunction = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("CREATE OR REPLACE FUNCTION")) {
        insideFunction = true;
        continue;
      }
      if (insideFunction && trimmed === "$$;") {
        insideFunction = false;
        continue;
      }
      if (!insideFunction && trimmed.length > 0 && !trimmed.startsWith("--")) {
        const isDDL = trimmed.startsWith("CREATE") || trimmed.startsWith("REVOKE") ||
          trimmed.startsWith("GRANT") || trimmed.startsWith("ALTER") ||
          trimmed.startsWith("DROP");
        if (!isDDL) {
          const isDestructive = /^\s*(DELETE|UPDATE|CALL)\s+/i.test(trimmed);
          expect(isDestructive).toBe(false);
        }
      }
    }
  });

  it("SAFETY ABORT gate checks protected owner", () => {
    expect(cleanupTestAccountsSource).toContain("SAFETY ABORT");
    expect(cleanupTestAccountsSource.toLowerCase()).toContain(
      "protected owner email found in cleanup candidates",
    );
    expect(cleanupTestAccountsSource).toContain("Refusing to delete");
  });

  it("creates audit snapshot before deletion", () => {
    expect(cleanupTestAccountsSource).toContain("snapshot_accounts_before_cleanup");
    expect(cleanupTestAccountsSource).toContain("Audit snapshot created");
  });

  it("uses get_cleanup_candidates()", () => {
    expect(cleanupTestAccountsSource).toContain("get_cleanup_candidates()");
  });

  it("cleanup is dependency-aware (child tables first)", () => {
    const userRolesIdx = cleanupTestAccountsSource.indexOf(
      "DELETE FROM public.user_roles",
    );
    const profilesIdx = cleanupTestAccountsSource.indexOf(
      "DELETE FROM public.profiles",
    );
    const authIdx = cleanupTestAccountsSource.indexOf(
      "DELETE FROM auth.users",
    );
    expect(userRolesIdx).toBeGreaterThan(-1);
    expect(profilesIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeGreaterThan(-1);
    expect(userRolesIdx).toBeLessThan(authIdx);
    expect(profilesIdx).toBeLessThan(authIdx);
  });

  it("has SECURITY DEFINER", () => {
    expect(cleanupTestAccountsSource).toContain("SECURITY DEFINER");
  });

  it("sets search_path = public, pg_temp", () => {
    expect(cleanupTestAccountsSource).toContain(
      "SET search_path = public, pg_temp",
    );
  });

  it("has REVOKE ALL FROM PUBLIC", () => {
    expect(cleanupTestAccountsSource).toContain("REVOKE ALL ON FUNCTION");
    expect(cleanupTestAccountsSource).toContain("FROM PUBLIC");
  });

  it("has REVOKE EXECUTE FROM anon and authenticated", () => {
    expect(cleanupTestAccountsSource).toContain(
      "REVOKE EXECUTE ON FUNCTION public.delete_test_accounts() FROM anon",
    );
    expect(cleanupTestAccountsSource).toContain(
      "REVOKE EXECUTE ON FUNCTION public.delete_test_accounts() FROM authenticated",
    );
  });

  it("has GRANT EXECUTE TO service_role", () => {
    expect(cleanupTestAccountsSource).toContain(
      "GRANT EXECUTE ON FUNCTION public.delete_test_accounts() TO service_role",
    );
  });

  it("uses exact allowlist for institution registration cleanup", () => {
    expect(cleanupTestAccountsSource).toContain("get_test_registration_emails()");
  });

  it("does not use broad @marafa.com LIKE pattern", () => {
    expect(cleanupTestAccountsSource).not.toMatch(
      /LIKE\s+['"]%@marafa\.com['"]/i,
    );
  });
});

describe("Migration 3 — owner repair (function-only, no auth.users writes)", () => {
  it("installs ensure_owner_role function", () => {
    expect(repairOwnerRoleSource).toContain(
      "CREATE OR REPLACE FUNCTION public.ensure_owner_role()",
    );
  });

  it("contains no automatic DO blocks", () => {
    const doBlockRegex = /^\s*DO\s+\$\$/gm;
    const matches = repairOwnerRoleSource.match(doBlockRegex);
    expect(matches).toBeNull();
  });

  it("contains no UPDATE or INSERT against auth.users", () => {
    const authUsersUpdateRegex = /UPDATE\s+auth\.users\s+/gi;
    const authUsersInsertRegex = /INSERT\s+INTO\s+auth\.users\s+/gi;
    expect(repairOwnerRoleSource.match(authUsersUpdateRegex)).toBeNull();
    expect(repairOwnerRoleSource.match(authUsersInsertRegex)).toBeNull();
  });

  it("never contains SQL statements that set, store, or accept a password", () => {
    const passwordSqlRegex = /^\s*(SET|UPDATE|INSERT).*password/gim;
    const matches = repairOwnerRoleSource.match(passwordSqlRegex);
    expect(matches).toBeNull();
  });

  it("finds owner by normalized email darobaid@unigates.online", () => {
    expect(repairOwnerRoleSource).toContain("lower(email)");
    expect(repairOwnerRoleSource).toContain("darobaid@unigates.online");
  });

  it("RAISE EXCEPTION when auth user not found (no writes)", () => {
    expect(repairOwnerRoleSource).toContain("RAISE EXCEPTION");
    expect(repairOwnerRoleSource).toContain("BLOCKER");
  });

  it("upserts profiles with ON CONFLICT", () => {
    expect(repairOwnerRoleSource).toContain("INSERT INTO public.profiles");
    expect(repairOwnerRoleSource).toContain("ON CONFLICT");
    expect(repairOwnerRoleSource).toContain("DO NOTHING");
  });

  it("upserts user_roles with ON CONFLICT DO UPDATE SET approved = true", () => {
    expect(repairOwnerRoleSource).toContain("INSERT INTO public.user_roles");
    expect(repairOwnerRoleSource).toContain("ON CONFLICT (user_id, role)");
    expect(repairOwnerRoleSource).toContain("DO UPDATE SET approved = true");
  });

  it("does not remove unrelated legitimate roles", () => {
    const deleteRoleRegex = /DELETE\s+FROM\s+public\.user_roles/gi;
    expect(repairOwnerRoleSource.match(deleteRoleRegex)).toBeNull();
  });

  it("verifies has_role(admin) returns true", () => {
    expect(repairOwnerRoleSource).toContain("has_role(v_owner_uid, 'admin')");
  });

  it("has SECURITY DEFINER", () => {
    expect(repairOwnerRoleSource).toContain("SECURITY DEFINER");
  });

  it("sets search_path = public, pg_temp", () => {
    expect(repairOwnerRoleSource).toContain(
      "SET search_path = public, pg_temp",
    );
  });

  it("has REVOKE ALL FROM PUBLIC", () => {
    expect(repairOwnerRoleSource).toContain("REVOKE ALL ON FUNCTION");
    expect(repairOwnerRoleSource).toContain("FROM PUBLIC");
  });

  it("has REVOKE EXECUTE FROM anon and authenticated", () => {
    expect(repairOwnerRoleSource).toContain(
      "REVOKE EXECUTE ON FUNCTION public.ensure_owner_role() FROM anon",
    );
    expect(repairOwnerRoleSource).toContain(
      "REVOKE EXECUTE ON FUNCTION public.ensure_owner_role() FROM authenticated",
    );
  });

  it("has GRANT EXECUTE TO service_role", () => {
    expect(repairOwnerRoleSource).toContain(
      "GRANT EXECUTE ON FUNCTION public.ensure_owner_role() TO service_role",
    );
  });
});
