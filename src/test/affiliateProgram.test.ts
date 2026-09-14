import { describe, it, expect, beforeEach } from "vitest";
import {
  generateReferralCode,
  calculateAffiliateCommission,
  buildLecturerInviteLink,
  buildWhatsAppInviteMessage,
  saveCurrentAffiliate,
  getCurrentAffiliate,
  logoutAffiliate,
  getSampleAffiliateData,
  AffiliateProfile
} from "@/lib/affiliate/affiliateService";

describe("UNIGATES Affiliate Program (20% RevShare) Service Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should generate valid unique referral codes with prefix", () => {
    const code1 = generateReferralCode("UG");
    const code2 = generateReferralCode("VIP");

    expect(code1).toMatch(/^UG-[A-Z0-9]{5}$/);
    expect(code2).toMatch(/^VIP-[A-Z0-9]{5}$/);
    expect(code1).not.toBe(code2);
  });

  it("should calculate exact 20% commission on course sales correctly", () => {
    // 20% of 1000 = 200
    expect(calculateAffiliateCommission(1000, 20)).toBe(200);
    // 20% of 500 = 100
    expect(calculateAffiliateCommission(500, 20)).toBe(100);
    // 20% of 850 = 170
    expect(calculateAffiliateCommission(850, 20)).toBe(170);
    // 20% of 1200 = 240
    expect(calculateAffiliateCommission(1200, 20)).toBe(240);
    // 20% of 0 = 0
    expect(calculateAffiliateCommission(0, 20)).toBe(0);
  });

  it("should construct valid lecturer invite links with ref query parameter", () => {
    const link = buildLecturerInviteLink("UG-ALPHA");
    expect(link).toContain("/courses/signup?ref=UG-ALPHA");
  });

  it("should construct localized WhatsApp invitation messages containing the referral link", () => {
    const msgAr = buildWhatsAppInviteMessage("UG-TOP1", "أحمد", true);
    expect(msgAr).toContain("/courses/signup?ref=UG-TOP1");
    expect(msgAr).toContain("UNIGATES");
    expect(msgAr).toContain("دكتور / أستاذ");

    const msgEn = buildWhatsAppInviteMessage("UG-TOP1", "Ahmed", false);
    expect(msgEn).toContain("/courses/signup?ref=UG-TOP1");
    expect(msgEn).toContain("Hello Professor / Instructor");
  });

  it("should store and retrieve current affiliate profile from storage", () => {
    const mockAffiliate: AffiliateProfile = {
      id: "aff-123",
      fullName: "محمد أحمد",
      email: "mohamed@example.com",
      phone: "+966501234567",
      countryCode: "+966",
      referralCode: "UG-MOHAMED",
      commissionRate: 20,
      walletBalance: 1500,
      totalEarned: 3000,
      totalWithdrawn: 1500,
      pendingPayout: 0,
      payoutMethod: "bank_iban",
      payoutAccountDetails: "SA1234567890",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    saveCurrentAffiliate(mockAffiliate);
    const retrieved = getCurrentAffiliate();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe("aff-123");
    expect(retrieved?.referralCode).toBe("UG-MOHAMED");
    expect(retrieved?.commissionRate).toBe(20);

    logoutAffiliate();
    expect(getCurrentAffiliate()).toBeNull();
  });

  it("should return populated sample lecturers and 20% commission records", () => {
    const mockAffiliate: AffiliateProfile = {
      id: "aff-test",
      fullName: "Test Affiliate",
      email: "test@example.com",
      phone: "+966500000000",
      countryCode: "+966",
      referralCode: "UG-TEST1",
      commissionRate: 20,
      walletBalance: 1000,
      totalEarned: 1000,
      totalWithdrawn: 0,
      pendingPayout: 0,
      payoutMethod: "bank_iban",
      payoutAccountDetails: "SA0000",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    const data = getSampleAffiliateData(mockAffiliate);
    expect(data.lecturers.length).toBeGreaterThan(0);
    expect(data.commissions.length).toBeGreaterThan(0);

    // Verify 20% commission on records
    data.commissions.forEach((c) => {
      expect(c.commissionRate).toBe(20);
      expect(c.commissionEarned).toBe(calculateAffiliateCommission(c.coursePrice, 20));
    });
  });
});
