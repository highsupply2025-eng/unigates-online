import { describe, expect, it } from "vitest";
import fs from "fs";

const collegeSignup = fs.readFileSync("src/pages/CollegeAdminSignup.tsx", "utf-8");
const instituteSignup = fs.readFileSync("src/pages/InstituteAdminSignup.tsx", "utf-8");
const adminDashboard = fs.readFileSync("src/pages/AdminDashboard.tsx", "utf-8");
const authEmailHook = fs.readFileSync("supabase/functions/auth-email-hook/index.ts", "utf-8");
const authConfig = fs.readFileSync("supabase/config.toml", "utf-8");
const syncMigration = fs.readFileSync(
  "supabase/migrations/20260801040000_sync_institution_registration_email_confirmation.sql",
  "utf-8",
);

describe("institution registration confirmation flow", () => {
  for (const [kind, source] of [["college", collegeSignup], ["institute", instituteSignup]] as const) {
    it(`${kind} normalizes email and leaves confirmation server-controlled`, () => {
      expect(source).toContain("const normalizedEmail = email.trim().toLowerCase();");
      expect(source).toContain("email: normalizedEmail");
      expect(source).not.toContain("email_confirmed:");
      expect(source).toContain('supabase.rpc("confirm_registration_email", { _email: normalizedEmail })');
    });

    it(`${kind} supports confirmation resend and uploads logos before Auth signup`, () => {
      expect(source).toContain("supabase.auth.resend({");
      expect(source).toContain("emailRedirectTo: getAuthCallbackUrl()");
      expect(source).toContain("handleResendConfirmation");
      expect(source.indexOf("await uploadSignupLogo")).toBeLessThan(source.indexOf("supabase.auth.signUp"));
    });
  }

  it("sends Auth mail directly instead of relying on the queue worker", () => {
    expect(authEmailHook).toContain("parseEmailWebhookPayload, sendLovableEmail");
    expect(authEmailHook).toContain("await sendLovableEmail(");
    expect(authEmailHook).toContain("status: 'sent'");
    expect(authEmailHook).not.toContain("enqueue_email");
  });

  it("requires email confirmation in Supabase Auth configuration", () => {
    expect(authConfig).toContain("[auth.email]");
    expect(authConfig).toContain("enable_confirmations = true");
  });

  it("syncs confirmed Auth users to both registration tables and backfills old requests", () => {
    expect(syncMigration).toContain("AFTER INSERT OR UPDATE OF email_confirmed_at, email ON auth.users");
    expect(syncMigration.match(/UPDATE public\.college_registrations/g)?.length).toBeGreaterThanOrEqual(2);
    expect(syncMigration.match(/UPDATE public\.institute_registrations/g)?.length).toBeGreaterThanOrEqual(2);
    expect(syncMigration.match(/FROM auth\.users account/g)?.length).toBeGreaterThanOrEqual(2);
    expect(syncMigration).not.toContain("AFTER INSERT ON public.college_registrations");
    expect(syncMigration).not.toContain("AFTER INSERT ON public.institute_registrations");
  });

  it("prevents public confirmation spoofing and unconfirmed approval", () => {
    expect(syncMigration.match(/WITH CHECK \(status = 'pending' AND email_confirmed = false\)/g)?.length).toBe(2);
    expect(syncMigration).toContain("Registration email must be confirmed before approval");
    expect(syncMigration.match(/SET status = 'pending'/g)?.length).toBe(2);
    expect(adminDashboard).toContain("disabled={!college.email_confirmed}");
    expect(adminDashboard).toContain("disabled={!inst.email_confirmed}");
  });

  it("shows all institution requests to admins regardless of confirmation state", () => {
    const loadColleges = adminDashboard.slice(
      adminDashboard.indexOf("const loadColleges"),
      adminDashboard.indexOf("const loadCollegeInvitations"),
    );
    const loadInstitutes = adminDashboard.slice(
      adminDashboard.indexOf("const loadInstitutes"),
      adminDashboard.indexOf("const loadDepartments"),
    );
    expect(loadColleges).not.toContain('.eq("email_confirmed", true)');
    expect(loadInstitutes).not.toContain('.eq("email_confirmed", true)');
    expect(adminDashboard).toContain('ar("البريد غير مؤكد","Email unconfirmed")');
  });
});
