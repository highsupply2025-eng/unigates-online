import { describe, expect, it } from "vitest";
import fs from "fs";

const migration = fs.readFileSync(
  "supabase/migrations/20260802000000_implement_institution_subscription_plans.sql",
  "utf-8",
);
const universityPlatform = fs.readFileSync("src/pages/UniversityPlatform.tsx", "utf-8");
const collegeSignup = fs.readFileSync("src/pages/CollegeAdminSignup.tsx", "utf-8");
const instituteSignup = fs.readFileSync("src/pages/InstituteAdminSignup.tsx", "utf-8");
const subscriptionsPage = fs.readFileSync("src/pages/StudentSubscriptions.tsx", "utf-8");
const accessGuard = fs.readFileSync("src/components/StudentAccessGuard.tsx", "utf-8");
const app = fs.readFileSync("src/App.tsx", "utf-8");

describe("institution subscription plan UI and registration", () => {
  it("shows the required Free, Monthly, and Annual plan details", () => {
    expect(universityPlatform).toContain('id: "free" as const');
    expect(universityPlatform).toContain('"لمدة 30 يوم"');
    expect(universityPlatform).toContain('"حتى 100 طالب لكل قسم"');
    expect(universityPlatform).toContain('"3 أعضاء هيئة تدريس لكل قسم"');
    expect(universityPlatform).toContain('id: "monthly" as const');
    expect(universityPlatform).toContain('"اشتراك لمدة 30 يوماً"');
    expect(universityPlatform).toContain('"حتى 2000 طالب لكل قسم"');
    expect(universityPlatform).toContain('"10 أعضاء هيئة تدريس لكل قسم"');
    expect(universityPlatform).toContain('id: "annual" as const');
    expect(universityPlatform).toContain('"قريباً"');
  });

  it("opens the institution-type choice and carries the selected plan", () => {
    expect(universityPlatform).toContain("setShowTypeDialog(true)");
    expect(universityPlatform).toContain("/signup/college?plan=${selectedPlan}");
    expect(universityPlatform).toContain("/signup/institute?plan=${selectedPlan}");
  });

  for (const [kind, source] of [["college", collegeSignup], ["institute", instituteSignup]] as const) {
    it(`validates and persists the selected plan for ${kind} registration`, () => {
      expect(source).toContain('searchParams.get("plan") === "free" ? "free" : "monthly"');
      expect(source).toContain("subscription_plan: plan");
    });
  }
});

describe("secure backend plan enforcement", () => {
  it("adds plan fields without rewriting existing registration rows", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS subscription_plan text");
    expect(migration).toContain("Existing registrations remain NULL-plan legacy accounts");
    expect(migration).not.toMatch(/SET subscription_plan\s*=\s*'(free|monthly)'/i);
  });

  it("starts the Free plan for exactly 30 days on approval", () => {
    expect(migration).toContain("manage_institution_registration_plan");
    expect(migration).toContain("OLD.status IS DISTINCT FROM 'approved'");
    expect(migration).toContain("NEW.plan_started_at + interval '30 days'");
    expect(migration).not.toContain("interval '1 month'");
  });

  it("enforces both plan capacities with a department row lock", () => {
    expect(migration).toContain("CASE WHEN cr.subscription_plan = 'free' THEN 100 ELSE 2000 END");
    expect(migration).toContain("CASE WHEN cr.subscription_plan = 'free' THEN 3 ELSE 10 END");
    expect(migration).toContain("CASE WHEN ir.subscription_plan = 'free' THEN 100 ELSE 2000 END");
    expect(migration).toContain("CASE WHEN ir.subscription_plan = 'free' THEN 3 ELSE 10 END");
    expect(migration).toContain("WHERE id = _department_id FOR UPDATE");
    expect(migration).toContain("Student limit reached for this department");
    expect(migration).toContain("Faculty limit reached for this department");
    expect(migration).toContain("enforce_department_member_plan_limits_trg");
    expect(migration).toContain("enforce_faculty_plan_limits_trg");
  });

  it("assigns and renews student access in exact 30-day periods", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.institution_student_subscriptions");
    expect(migration).toContain("PRIMARY KEY (institution_type, institution_id, user_id)");
    expect(migration).toContain("statement_timestamp() + interval '30 days'");
    expect(migration).toContain("_months * interval '30 days'");
    expect(migration).toContain("REVOKE UPDATE ON public.department_members FROM authenticated");
    expect(migration).toContain("Only the institution administrator can change membership identity or role");
    expect(migration).not.toContain("app.allow_subscription_renewal");
    expect(migration).toContain("_months IS NULL OR _months < 1 OR _months > 12");
    expect(migration).not.toContain("UPDATE public.department_members dm\n  SET subscription_expires_at");
  });

  it("binds access checks to the caller and gates backend department access", () => {
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.get_student_access_status()");
    expect(migration).toContain("_user_id IS DISTINCT FROM auth.uid()");
    expect(migration).toContain("payment_required");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.user_in_department");
    expect(migration).toContain("COALESCE(ss.expires_at, dm.subscription_expires_at) > clock_timestamp()");
    expect(migration).toContain("AS RESTRICTIVE FOR ALL TO authenticated");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.student_account_has_access()");
    expect(migration).toContain("'profiles', 'user_roles', 'college_registrations', 'institute_registrations'");
    expect(migration).toContain('ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated');
    expect(migration).toContain("Student subscription is inactive");
  });
});

describe("expired student experience", () => {
  it("guards every student route with backend subscription status", () => {
    expect(app).toContain('<Route element={<StudentAccessGuard />}>');
    expect(accessGuard).toContain('supabase.rpc("get_student_access_status")');
    expect(accessGuard).toContain("راجع إدارة الكلية");
    expect(accessGuard).toContain("راجع إدارة المعهد");
    expect(accessGuard).toContain("الاشتراك غير نشط");
  });

  it("shows expired students as inactive and requiring payment", () => {
    expect(subscriptionsPage).toContain('isRtl ? "غير نشط" : "Inactive"');
    expect(subscriptionsPage).toContain('isRtl ? "مطلوب الدفع" : "Payment Required"');
    expect(subscriptionsPage).toContain('isRtl ? "تجديد" : "Renew"');
    expect(subscriptionsPage).toContain("subscription_expires_at");
  });
});
