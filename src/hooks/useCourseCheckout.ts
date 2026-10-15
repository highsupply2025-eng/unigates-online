import { useState } from "react";
import { initializePaddle, getPaddlePriceId, PLAN_PRICING, COURSES_PLATFORM_PRODUCT, COURSES_PRODUCT_ID } from "@/lib/paddle";
import { getCourseReferralInfo, StudentReferralStatus } from "@/services/courseReferralTracker";
import { CourseLedgerService, CourseLedgerAllocation } from "@/services/courseLedgerService";
import { supabase } from "@/integrations/supabase/client";

export interface CourseCheckoutTarget {
  id: string;
  title_ar: string;
  title_en?: string;
  price?: number;
  price_egp?: number;
  instructor_ar?: string;
  instructor_en?: string;
  creator_id?: string | null;
  instructor_id?: string | null;
}

export interface CourseCheckoutOptions {
  course: CourseCheckoutTarget;
  customPriceAmount?: number;
  customerEmail?: string;
  paddleCustomerId?: string | null;
  referralOverride?: string;
  instructorIdOverride?: string;
  successUrl?: string;
  onSuccess?: (allocation: CourseLedgerAllocation, checkoutData: any) => void;
  onError?: (err: Error) => void;
}

export function useCourseCheckout() {
  const [loading, setLoading] = useState(false);
  const [lastAllocation, setLastAllocation] = useState<CourseLedgerAllocation | null>(null);

  const checkoutCourse = async (options: CourseCheckoutOptions) => {
    setLoading(true);
    try {
      const { course } = options;

      // 1. Detect Referral Information
      const referralStatus: StudentReferralStatus = getCourseReferralInfo();
      const effectiveReferralToken = options.referralOverride || referralStatus.referralToken;
      const hasReferral = Boolean(effectiveReferralToken);

      const effectiveInstructorId = 
        options.instructorIdOverride || 
        course.creator_id || 
        course.instructor_id || 
        referralStatus.instructorId || 
        "instructor_platform_direct";

      const instructorName = course.instructor_en || course.instructor_ar || "Verified Academy Instructor";
      const courseTitle = course.title_en || course.title_ar || "Course Enrollment";

      // Determine price amount in USD (fallback to standard $6 course platform plan if not explicitly in USD)
      const baseGrossPrice = 
        options.customPriceAmount ?? 
        (course.price ? Number(course.price) : 6.0);

      // 2. Compute Dynamic Ledger Allocation (80/20 vs 70/30)
      const allocation = CourseLedgerService.calculateAllocation({
        grossAmount: baseGrossPrice,
        hasReferralToken: hasReferral,
        referralToken: effectiveReferralToken,
        instructorId: effectiveInstructorId,
        instructorName,
        courseId: course.id,
        courseTitle,
        studentEmail: options.customerEmail,
        currency: "USD",
      });

      setLastAllocation(allocation);

      // 3. Resolve Current User Info (if authenticated)
      let userId = "";
      let userEmail = options.customerEmail || "";
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          userId = sessionData.session.user.id;
          if (!userEmail) userEmail = sessionData.session.user.email || "";
        }
      } catch (authErr) {
        console.warn("[useCourseCheckout] User session lookup notice:", authErr);
      }

      if (userId) {
        allocation.studentId = userId;
      }
      if (userEmail) {
        allocation.studentEmail = userEmail;
      }

      // 4. Initialize Paddle SDK
      await initializePaddle(options.paddleCustomerId);

      if (!window.Paddle?.Checkout) {
        throw new Error("Paddle Checkout SDK is not ready. Please try again.");
      }

      // 5. Resolve Paddle Price ID for Courses Platform
      // Standard product price is 'courses_monthly'
      const basePriceId = PLAN_PRICING.courses.monthly.priceId;
      let paddlePriceId = basePriceId;
      try {
        paddlePriceId = await getPaddlePriceId(basePriceId);
      } catch (priceErr) {
        console.warn("[useCourseCheckout] Edge price resolution notice, falling back to direct ID:", priceErr);
      }

      // 6. Build Rich CustomData for Paddle Session
      const customData = CourseLedgerService.buildPaddleCustomData(allocation, {
        userId: userId || "",
        studentEmail: userEmail || "",
        checkoutSource: "course_purchase_overlay",
        productContext: COURSES_PLATFORM_PRODUCT,
        productId: COURSES_PRODUCT_ID,
      });

      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

      const defaultSuccessUrl = 
        options.successUrl || 
        `${window.location.origin}/payment-success?product=courses&courseId=${encodeURIComponent(course.id)}`;

      // 7. Launch Paddle Overlay Checkout Session
      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        customData,
        settings: {
          displayMode: "overlay",
          theme: isDark ? "dark" : "light",
          locale: isRtl ? "ar" : "en",
          variant: "one-page",
          allowLogout: false,
          showAddTaxId: true,
          showAddDiscounts: true,
          allowedPaymentMethods: ["card", "paypal"],
          frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
          frameInitialHeight: 480,
          successUrl: defaultSuccessUrl,
        },
      });

      return allocation;
    } catch (err: any) {
      console.error("[useCourseCheckout] Checkout error:", err);
      options.onError?.(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    checkoutCourse,
    loading,
    lastAllocation,
    referralInfo: getCourseReferralInfo(),
  };
}
