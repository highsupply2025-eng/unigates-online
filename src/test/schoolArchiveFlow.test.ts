import fs from "fs";
import { describe, expect, it } from "vitest";

const adminDashboard = fs.readFileSync("src/pages/AdminDashboard.tsx", "utf-8");
const login = fs.readFileSync("src/pages/Login.tsx", "utf-8");
const schoolLogin = fs.readFileSync("src/pages/SchoolLogin.tsx", "utf-8");
const migration = fs.readFileSync(
  "supabase/migrations/20260801070000_archive_school_registration.sql",
  "utf-8",
);

describe("school archive flow", () => {
  it("archives one selected school through an admin-only idempotent RPC", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.archive_school_registration");
    expect(migration).toContain("NOT public.has_role(auth.uid(), 'admin')");
    expect(migration).toContain("WHERE school.id = _school_id");
    expect(migration).toContain("IF v_school.status = 'archived'");
    expect(migration).toContain("SET status = 'archived'");
    expect(migration).not.toMatch(/DELETE FROM public\.school_registrations/i);
  });

  it("deactivates archived school accounts without deleting related data", () => {
    expect(migration).toContain("school_account_is_archived");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS auth_user_id uuid");
    expect(migration).toContain("sync_school_registration_auth_user_trg");
    expect(migration).toContain("protect_school_auth_user_id_trg");
    expect(migration).toContain("link_approved_school_auth_user_trg");
    expect(migration).toContain("School account ownership is server-controlled");
    expect(migration).toContain("Approved school account owner is not linked");
    expect(migration).toContain('CREATE POLICY "Archived school owner cannot access departments"');
    expect(migration).toContain('CREATE POLICY "Archived school owner cannot access department members"');
    expect(migration).toContain("AS RESTRICTIVE");
    expect(migration).not.toMatch(/DELETE FROM public\.(profiles|user_roles|courses|user_subscriptions)/i);
  });

  it("isolates the archived school by immutable account and institution IDs", () => {
    expect(migration).toContain("school.auth_user_id = _user_id");
    expect(migration).toContain("can_access_school_institution");
    expect(migration).toContain("can_access_school_department");
    expect(migration).toContain("WHERE school.id = _school_id");
  });

  it("shows an Arabic school-specific confirmation and refreshes active data", () => {
    expect(adminDashboard).toContain("تأكيد أرشفة المدرسة");
    expect(adminDashboard).toContain("هل أنت متأكد من أرشفة مدرسة");
    expect(adminDashboard).toContain("deleteTarget.name");
    expect(adminDashboard).toContain('supabase.rpc("archive_school_registration"');
    expect(adminDashboard).toContain('current.filter((school) => school.id !== deleteTarget.id)');
    expect(adminDashboard).toContain("Promise.all([loadSchoolRegistrations(), loadStats()])");
    expect(adminDashboard).toContain('.neq("status", "archived")');
    expect(adminDashboard).toContain("تمت أرشفة المدرسة وتعطيل حسابها بنجاح");
    expect(adminDashboard).toContain("تعذر أرشفة المدرسة. يرجى المحاولة مرة أخرى.");
  });

  it("blocks archived accounts only in the school login entry point", () => {
    expect(login).not.toContain('"is_current_school_account_archived"');
    expect(schoolLogin).toContain('"is_current_school_account_archived"');
    expect(schoolLogin).toContain("تمت أرشفة حساب المدرسة");
  });
});
