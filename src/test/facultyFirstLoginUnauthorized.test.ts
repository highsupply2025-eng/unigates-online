import { describe, it, expect } from "vitest";
import fs from "fs";

// New faculty members (any role) could not complete their first login with the
// temporary password: instead of the mandatory "يجب تغيير كلمة السر" dialog
// they got "غير مصرح" (Unauthorized).
//
// Root cause was NOT must_change_password logic — it was an RLS infinite-
// recursion cycle between `departments` and `department_members` policies.
// Two live `profiles` SELECT policies scan those tables, so EVERY
// authenticated `SELECT ... FROM profiles` failed with:
//   "infinite recursion detected in policy for relation ..."
// LeadershipDashboard.checkAccess ignored the query error, saw profile=null,
// and showed "غير مصرح" — locking new faculty out entirely.
//
// Fix:
//  1. Migration drops every policy in the departments <-> department_members
//     pair that cross-references its partner outside a SECURITY DEFINER call,
//     and re-points admin checks at is_department_admin() / can_view_profile().
//  2. LeadershipDashboard distinguishes "query failed" from "role not allowed".
//  3. Login.tsx surfaces roles/profiles query errors instead of misrouting.
//  4. ForcePasswordChangeDialog is mandatory again: no X button, no dismissal,
//     logout-only escape hatch.
//
// These tests pin the source to that behavior.

const MIGRATION = fs.readFileSync(
  "supabase/migrations/20260824220000_break_rls_recursion_completely.sql",
  "utf-8",
);

const DIALOG_SOURCE = fs.readFileSync(
  "src/components/ForcePasswordChangeDialog.tsx",
  "utf-8",
);

const LEADERSHIP_SOURCE = fs.readFileSync(
  "src/pages/LeadershipDashboard.tsx",
  "utf-8",
);

const LOGIN_SOURCE = fs.readFileSync("src/pages/Login.tsx", "utf-8");

const LEGACY_MIGRATIONS = fs
  .readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .map((f) => ({ name: f, sql: fs.readFileSync(`supabase/migrations/${f}`, "utf-8") }));

describe("RLS recursion cycle is removed", () => {
  it("drops every legacy department_members policy that JOINs departments directly", () => {
    for (const policy of [
      '"dpm_admin_select"',
      '"dpm_admin_insert"',
      '"dpm_admin_update"',
      '"dpm_admin_delete"',
      '"dpm_college_member_select"',
    ]) {
      const re = new RegExp(`DROP POLICY IF EXISTS\\s+${policy.replace(/"/g, '\\"')}\\s+ON public\\.department_members`);
      expect(MIGRATION).toMatch(re);
    }
  });

  it("drops the legacy departments policy that reads department_members directly", () => {
    expect(MIGRATION).toMatch(/DROP POLICY IF EXISTS\s+"dept_faculty_select"\s+ON public\.departments/);
  });

  it("replaces department_members admin checks with the SECURITY DEFINER helper", () => {
    // All four operations must route through is_department_admin(), which runs
    // as definer and therefore never re-enters RLS evaluation.
    const selectCount = (MIGRATION.match(/public\.is_department_admin\(/g) || []).length;
    expect(selectCount).toBeGreaterThanOrEqual(6);
    expect(MIGRATION).toContain("SECURITY DEFINER");
  });

  it("adds an SD profile-visibility helper and points profiles SELECT at it", () => {
    expect(MIGRATION).toContain("public.can_view_profile");
    expect(MIGRATION).toContain('CREATE POLICY "profiles_visible_via_helper"');
    expect(MIGRATION).toContain("USING (public.can_view_profile(user_id))");
  });

  it("removes the two fragile sub-scanning profiles policies", () => {
    expect(MIGRATION).toContain('DROP POLICY IF EXISTS "Institution admins can view department member profiles" ON public.profiles');
    expect(MIGRATION).toContain('DROP POLICY IF EXISTS "Leadership can view profiles in same department" ON public.profiles');
  });

  it("keeps self-read policies so users still see their own rows", () => {
    expect(MIGRATION).toContain("user_id = auth.uid()");
    expect(MIGRATION).toContain('"Users can view own profile"');
  });

  it("no live SQL migration re-creates a dropped cycle-forming policy after the fix", () => {
    const fixIndex = LEGACY_MIGRATIONS.findIndex(
      (m) => m.name === "20260824220000_break_rls_recursion_completely.sql",
    );
    expect(fixIndex).toBeGreaterThan(-1);
    const after = LEGACY_MIGRATIONS.slice(fixIndex + 1);
    for (const m of after) {
      expect(m.sql).not.toMatch(/CREATE\s+POLICY\s+"dept_faculty_select"/i);
      expect(m.sql).not.toMatch(/CREATE\s+POLICY\s+"dpm_admin_select"/i);
      expect(m.sql).not.toMatch(/CREATE\s+POLICY\s+"dpm_college_member_select"/i);
    }
  });
});

describe("first login shows the mandatory password dialog, never Unauthorized", () => {
  it("dashboard treats a failed profile query with fallbacks, never misrouting", () => {
    // Robust fallbacks exist in LeadershipDashboard
    expect(LEADERSHIP_SOURCE).toContain("get_or_create_login_profile");
    expect(LEADERSHIP_SOURCE).toContain("institution_faculty_members");
  });

  it("login surfaces roles/profiles query errors instead of silently misrouting", () => {
    expect(LOGIN_SOURCE).toContain("rolesError");
    expect(LOGIN_SOURCE).toContain("profileError");
    expect(LOGIN_SOURCE).toContain("if (rolesError) throw rolesError;");
  });

  it("password-change dialog is mandatory: no close button, no dismissal state", () => {
    expect(DIALOG_SOURCE).not.toContain("handleClose");
    expect(DIALOG_SOURCE).not.toContain("forcePwdDismissed");
    expect(DIALOG_SOURCE).not.toContain("<X ");
    // Escape / outside clicks are blocked.
    expect(DIALOG_SOURCE).toContain("onEscapeKeyDown={(e) => e.preventDefault()}");
    expect(DIALOG_SOURCE).toContain("onInteractOutside={(e) => e.preventDefault()}");
    // Logout remains as the only escape hatch.
    expect(DIALOG_SOURCE).toContain('isRtl ? "تسجيل الخروج" : "Sign out"');
  });

  it("dialog copy states that access requires changing the password first", () => {
    expect(DIALOG_SOURCE).toContain("يجب تغيير كلمة السر");
    expect(DIALOG_SOURCE).toContain("لا يمكن إغلاقها قبل تغيير كلمة السر");
    // The old dismissible copy must be gone.
    expect(DIALOG_SOURCE).not.toContain("يمكنك المتابعة لاحقًا");
  });
});
