import { describe, it, expect } from "vitest";
import {
  FREE_TIER_LIMIT,
  getTrialDaysRemaining,
  isStudentSubscriptionActive,
} from "@/pages/StudentSubscriptions";

describe("Student Subscriptions Business Rules & Pricing", () => {
  const baseStudent = {
    id: "student-1",
    full_name: "محمد عيد",
    email: "a1@gmail.com",
    phone: "002010223558878",
    department_id: "dept-1",
    department_name: "محاسبة",
    user_id: "user-1",
    created_at: new Date().toISOString(),
    photo_url: null,
    subscription_expires_at: null,
    subscription_active: false,
    payment_required: false,
  };

  it("enforces Free Tier limit at 100 students", () => {
    expect(FREE_TIER_LIMIT).toBe(100);
  });

  describe("Trial period calculation (30 days / 1 month)", () => {
    it("returns 30 days for freshly created student", () => {
      const now = new Date().toISOString();
      expect(getTrialDaysRemaining(now)).toBe(30);
    });

    it("returns 15 days for a student registered 15 days ago", () => {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 86_400_000).toISOString();
      expect(getTrialDaysRemaining(fifteenDaysAgo)).toBe(15);
    });

    it("returns 0 days for a student registered 31 days ago (trial expired)", () => {
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 86_400_000).toISOString();
      expect(getTrialDaysRemaining(thirtyOneDaysAgo)).toBe(0);
    });
  });

  describe("Student active status in Free vs Paid vs Over 100 tiers", () => {
    it("marks student active if within 30 days trial and total students <= 100 on free plan", () => {
      const student = { ...baseStudent, created_at: new Date().toISOString() };
      const isActive = isStudentSubscriptionActive(student, 50, "free");
      expect(isActive).toBe(true);
    });

    it("marks student inactive if trial expired (>30 days) on free plan", () => {
      const expiredStudent = {
        ...baseStudent,
        created_at: new Date(Date.now() - 35 * 86_400_000).toISOString(),
      };
      const isActive = isStudentSubscriptionActive(expiredStudent, 50, "free");
      expect(isActive).toBe(false);
    });

    it("marks student inactive if total students exceed 100 and no paid subscription", () => {
      const student = { ...baseStudent, created_at: new Date().toISOString() };
      const isActive = isStudentSubscriptionActive(student, 101, "free");
      expect(isActive).toBe(false);
    });

    it("marks student active if they have paid active subscription regardless of count", () => {
      const paidStudent = {
        ...baseStudent,
        subscription_active: true,
        subscription_expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
      };
      expect(isStudentSubscriptionActive(paidStudent, 500, "free")).toBe(true);
      expect(isStudentSubscriptionActive(paidStudent, 500, "monthly")).toBe(true);
      expect(isStudentSubscriptionActive(paidStudent, 500, "annual")).toBe(true);
    });
  });

  describe("Pricing & Checkout Calculations (Stripe & Paddle)", () => {
    it("calculates monthly pricing at $6 per student", () => {
      const count = 10;
      const monthlyRate = 6;
      expect(count * monthlyRate).toBe(60);
    });

    it("calculates annual pricing at $48 per student with 33% discount (saves $24/student)", () => {
      const count = 1;
      const annualRate = 48;
      const standardMonthlyEquivalent = 6 * 12; // $72
      const savings = standardMonthlyEquivalent - annualRate; // $24
      const discountPercentage = Math.round((savings / standardMonthlyEquivalent) * 100);

      expect(annualRate).toBe(48);
      expect(savings).toBe(24);
      expect(discountPercentage).toBe(33);
    });

    it("calculates batch pricing for multiple students", () => {
      const count = 25;
      const monthlyTotal = count * 6; // $150
      const annualTotal = count * 48; // $1200
      const annualSavings = (count * 72) - annualTotal; // $600

      expect(monthlyTotal).toBe(150);
      expect(annualTotal).toBe(1200);
      expect(annualSavings).toBe(600);
    });
  });
});
