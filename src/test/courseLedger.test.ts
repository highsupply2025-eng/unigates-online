import { describe, it, expect, beforeEach } from "vitest";
import { CourseLedgerService } from "@/services/courseLedgerService";
import { 
  captureCourseReferralFromUrl, 
  getCourseReferralInfo, 
  clearCourseReferral 
} from "@/services/courseReferralTracker";
import { COURSES_PLATFORM_PRODUCT, COURSES_PRODUCT_ID } from "@/lib/paddle";

describe("Courses Platform - Dynamic Ledger Allocation & Referral Tests", () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    const mockStorageImpl = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
      key: (_index: number) => null,
      length: 0,
    };

    globalThis.localStorage = mockStorageImpl as any;
    globalThis.sessionStorage = mockStorageImpl as any;
  });

  describe("Dynamic Ledger Allocation Splits", () => {
    it("enforces 80% instructor / 20% platform split when referral token is present", () => {
      const allocation = CourseLedgerService.calculateAllocation({
        grossAmount: 100,
        hasReferralToken: true,
        referralToken: "INST_AHMED_80",
        instructorId: "inst_123",
        courseId: "course_prog_01",
      });

      expect(allocation.hasReferral).toBe(true);
      expect(allocation.referralSource).toBe("instructor_referral");
      expect(allocation.instructorPercentage).toBe(80);
      expect(allocation.platformPercentage).toBe(20);
      expect(allocation.instructorGross).toBe(80.0);
      expect(allocation.platformGross).toBe(20.0);
      expect(allocation.instructorGross + allocation.platformGross).toBe(100.0);
    });

    it("applies 70% instructor / 30% platform split for direct platform registrations (no referral token)", () => {
      const allocation = CourseLedgerService.calculateAllocation({
        grossAmount: 100,
        hasReferralToken: false,
        referralToken: null,
        instructorId: "inst_123",
        courseId: "course_prog_01",
      });

      expect(allocation.hasReferral).toBe(false);
      expect(allocation.referralSource).toBe("direct_platform");
      expect(allocation.instructorPercentage).toBe(70);
      expect(allocation.platformPercentage).toBe(30);
      expect(allocation.instructorGross).toBe(70.0);
      expect(allocation.platformGross).toBe(30.0);
      expect(allocation.instructorGross + allocation.platformGross).toBe(100.0);
    });

    it("deducts payment gateway processing fees from the instructor share in both cases", () => {
      // 1. With referral (80/20):
      // Gross = $50. Fee (2.9% + $0.30) = $1.45 + $0.30 = $1.75
      // Instructor Gross = $40.00 -> Instructor Net = $40.00 - $1.75 = $38.25
      const referralAlloc = CourseLedgerService.calculateAllocation({
        grossAmount: 50,
        hasReferralToken: true,
        referralToken: "REF_PROMO",
        instructorId: "inst_123",
      });

      expect(referralAlloc.feeBearer).toBe("instructor");
      expect(referralAlloc.processingFee).toBe(1.75);
      expect(referralAlloc.platformGross).toBe(10.0);
      expect(referralAlloc.instructorNetPayout).toBe(38.25);

      // 2. Direct platform (70/30):
      // Gross = $50. Instructor Gross = $35.00 -> Instructor Net = $35.00 - $1.75 = $33.25
      const directAlloc = CourseLedgerService.calculateAllocation({
        grossAmount: 50,
        hasReferralToken: false,
      });

      expect(directAlloc.feeBearer).toBe("instructor");
      expect(directAlloc.processingFee).toBe(1.75);
      expect(directAlloc.platformGross).toBe(15.0);
      expect(directAlloc.instructorNetPayout).toBe(33.25);
    });

    it("builds correct customData payload for Paddle overlay checkout with full price and product context", () => {
      const allocation = CourseLedgerService.calculateAllocation({
        grossAmount: 25.50,
        hasReferralToken: true,
        referralToken: "VIP_TEACHER",
        instructorId: "inst_456",
        courseId: "course_789",
        courseTitle: "Fullstack Web Development",
      });

      const customData = CourseLedgerService.buildPaddleCustomData(allocation);

      expect(customData.productContext).toBe(COURSES_PLATFORM_PRODUCT);
      expect(customData.productId).toBe(COURSES_PRODUCT_ID);
      expect(customData.planKey).toBe("courses");
      expect(customData.grossAmount).toBe("25.50");
      expect(customData.splitInstructorPct).toBe("80");
      expect(customData.splitPlatformPct).toBe("20");
      expect(customData.referralToken).toBe("VIP_TEACHER");
      expect(customData.feeBearer).toBe("instructor");
    });
  });

  describe("Referral Tracking Engine", () => {
    it("captures referral token from query parameters and persists in storage", () => {
      const captured = captureCourseReferralFromUrl("https://unigates.online/courses?ref=PROF_KHALID&course_id=c101");

      expect(captured).not.toBeNull();
      expect(captured?.referralToken).toBe("PROF_KHALID");
      expect(captured?.courseId).toBe("c101");
      expect(captured?.source).toBe("instructor_referral");

      const info = getCourseReferralInfo();
      expect(info.isReferral).toBe(true);
      expect(info.referralToken).toBe("PROF_KHALID");
      expect(info.source).toBe("instructor_referral");
    });

    it("returns direct_platform when no referral token is present", () => {
      clearCourseReferral();
      const info = getCourseReferralInfo();
      expect(info.isReferral).toBe(false);
      expect(info.referralToken).toBeNull();
      expect(info.source).toBe("direct_platform");
    });
  });
});
