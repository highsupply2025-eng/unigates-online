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
const approvalMigration = fs.readFileSync(
  "supabase/migrations/20260801060000_secure_college_approval_flow.sql",
  "utf-8",
);
const login = fs.readFileSync("src/pages/Login.tsx", "utf-8");
const adminOverview = fs.readFileSync("src/pages/AdminOverview.tsx", "utf-8");

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
      if (kind === "college") {
        expect(source).toContain('emailRedirectTo: `${window.location.origin}/auth/callback`');
      } else {
        expect(source).toContain("emailRedirectTo: getAuthCallbackUrl()");
      }
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

  it("only shows callback success after Supabase returns a confirmed session", () => {
    const callback = fs.readFileSync("src/pages/AuthCallback.tsx", "utf-8");
    expect(callback).toContain("supabase.auth.getSession()");
    expect(callback).toContain("supabase.auth.exchangeCodeForSession(code)");
    expect(callback).toContain("session.user.email_confirmed_at");
    expect(callback).toContain('setStatus("success")');
    expect(callback).not.toContain("Timeout fallback");
    expect(callback).not.toContain('setTimeout(() => {\n            setStatus("success")');
    expect(callback).toContain("تم تأكيد البريد الإلكتروني، وحسابك بانتظار موافقة الإدارة.");
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

  it("shows college requests to admins after email confirmation", () => {
    const loadColleges = adminDashboard.slice(
      adminDashboard.indexOf("const loadColleges"),
      adminDashboard.indexOf("const loadCollegeInvitations"),
    );
    const loadInstitutes = adminDashboard.slice(
      adminDashboard.indexOf("const loadInstitutes"),
      adminDashboard.indexOf("const loadDepartments"),
    );
    expect(loadColleges).toContain('.eq("email_confirmed", true)');
    expect(loadInstitutes).not.toContain('.eq("email_confirmed", true)');
    expect(adminDashboard).toContain('ar("البريد غير مؤكد","Email unconfirmed")');
  });

  it("enforces college review and activation on the backend", () => {
    expect(approvalMigration).toContain("CREATE OR REPLACE FUNCTION public.review_college_registration");
    expect(approvalMigration).toContain("FROM auth.users account");
    expect(approvalMigration).toContain("account.email_confirmed_at IS NOT NULL");
    expect(approvalMigration).toContain('DROP POLICY IF EXISTS "Admins can update college registrations"');
    expect(approvalMigration).toContain("prevent_inactive_college_profile_trg");
    expect(approvalMigration).toContain("prevent_inactive_college_role_trg");
    expect(approvalMigration).toContain("College account is pending platform admin approval");
    expect(approvalMigration).toContain("registration.email_confirmed = true");
    expect(approvalMigration).toContain("raw_user_meta_data ->> 'institution_name'");
    expect(approvalMigration).toContain("CREATE OR REPLACE FUNCTION public.has_role");
    expect(approvalMigration).toContain("CREATE OR REPLACE FUNCTION public.has_approved_role");
    expect(approvalMigration).toContain("IN ('none', 'approved')");
  });

  it("uses the secure review RPC in every admin college approval surface", () => {
    expect(adminDashboard.match(/review_college_registration/g)?.length).toBe(2);
    expect(adminOverview).toContain('supabase.rpc("review_college_registration"');
    expect(adminDashboard).not.toContain('from("college_registrations").update({ status: "approved" })');
  });

  it("blocks pending college login before role routing", () => {
    const statusCheck = login.indexOf('supabase.rpc(\n        "get_college_account_status"');
    const roleLookup = login.indexOf('.from("user_roles")');
    expect(statusCheck).toBeGreaterThan(-1);
    expect(statusCheck).toBeLessThan(roleLookup);
    expect(login).toContain("تم تأكيد البريد الإلكتروني، وحسابك بانتظار موافقة الإدارة.");
    expect(login).not.toContain('institutionType === "college"');
  });
});
