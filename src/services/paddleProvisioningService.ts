import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment, COURSES_PLATFORM_PRODUCT } from "@/lib/paddle";
import { CourseLedgerService } from "@/services/courseLedgerService";
import { clearCourseReferral } from "@/services/courseReferralTracker";

export interface ProvisioningPayload {
  transactionId: string;
  userId?: string;
  planKey?: string;
  priceId?: string;
  quantity?: number;
  customerEmail?: string;
  institutionId?: string;
  institutionType?: string;
  rawEvent?: any;
}

export class PaddleProvisioningService {
  /**
   * Handle onCheckoutComplete event from Paddle JS SDK.
   * Provisions account, updates subscription tier in database, and redirects to /payment-success.
   */
  public static async onCheckoutComplete(checkoutData: any): Promise<void> {
    try {
      console.info("[PaddleProvisioningService] onCheckoutComplete received:", checkoutData);

      // Extract transaction & custom details from Paddle JS v2 event payload
      const txnId = 
        checkoutData?.id || 
        checkoutData?.transaction_id || 
        checkoutData?.checkout?.id || 
        `txn_${Date.now()}`;

      const customData = 
        checkoutData?.custom_data || 
        checkoutData?.customData || 
        checkoutData?.checkout?.custom_data || 
        {};

      const items = checkoutData?.items || checkoutData?.checkout?.items || [];
      const primaryItem = items[0] || {};
      const priceId = primaryItem?.price?.id || primaryItem?.price_id || customData?.priceId || "";
      const quantity = primaryItem?.quantity || customData?.quantity || 1;

      // Identify user from customData or active Supabase session
      let userId = customData?.userId;
      let userEmail = customData?.customerEmail || checkoutData?.customer?.email;

      if (!userId) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          userId = sessionData?.session?.user?.id;
          if (!userEmail) userEmail = sessionData?.session?.user?.email;
        } catch (authErr) {
          console.warn("[PaddleProvisioningService] Auth session lookup notice:", authErr);
        }
      }

      const planKey = customData?.planKey || "university";
      const institutionId = customData?.institutionId;
      const institutionType = customData?.institutionType;

      const provisioning: ProvisioningPayload = {
        transactionId: txnId,
        userId,
        planKey,
        priceId,
        quantity,
        customerEmail: userEmail,
        institutionId,
        institutionType,
        rawEvent: checkoutData
      };

      // 1. Store local immediate receipt / transaction confirmation
      try {
        localStorage.setItem(
          "unigates_last_payment_success",
          JSON.stringify({
            ...provisioning,
            timestamp: new Date().toISOString(),
            status: "completed"
          })
        );
      } catch (storageErr) {
        console.warn("[PaddleProvisioningService] Storage notice:", storageErr);
      }

      // 2. Provision Database: Update institution plan if institution exists
      if (institutionId && institutionType) {
        try {
          const planDuration = priceId.includes("annual") ? "annual" : "monthly";
          await (supabase.rpc as any)("set_institution_subscription_plan", {
            _institution_type: institutionType,
            _institution_id: institutionId,
            _subscription_plan: planDuration,
          });
          console.info("[PaddleProvisioningService] Institution plan updated via RPC:", institutionType, institutionId);
        } catch (rpcErr) {
          console.warn("[PaddleProvisioningService] set_institution_subscription_plan notice:", rpcErr);
        }
      }

      // 3. Courses Platform: Process dynamic ledger allocation and enrollment
      const isCourseTransaction = 
        customData?.productContext === COURSES_PLATFORM_PRODUCT || 
        customData?.productContext === "Unigates Courses Platform" || 
        planKey === "courses";

      if (isCourseTransaction) {
        try {
          const grossAmount = Number(customData?.grossAmount || (primaryItem?.price?.unit_price ? Number(primaryItem.price.unit_price) / 100 : 6.0));
          const hasReferral = customData?.hasReferral === "true" || Boolean(customData?.referralToken);
          
          CourseLedgerService.recordTransaction({
            productContext: COURSES_PLATFORM_PRODUCT,
            productId: customData?.productId || "unigates_courses_platform",
            planKey: "courses",
            grossAmount,
            currency: customData?.currency || "USD",
            hasReferral,
            referralToken: customData?.referralToken || null,
            referralSource: (customData?.referralSource as any) || (hasReferral ? "instructor_referral" : "direct_platform"),
            instructorPercentage: Number(customData?.splitInstructorPct || (hasReferral ? 80 : 70)),
            platformPercentage: Number(customData?.splitPlatformPct || (hasReferral ? 20 : 30)),
            instructorGross: Number(customData?.instructorGross || ((grossAmount * (hasReferral ? 80 : 70)) / 100)),
            platformGross: Number(customData?.platformGross || ((grossAmount * (hasReferral ? 20 : 30)) / 100)),
            processingFee: Number(customData?.processingFee || 0.47),
            feeBearer: "instructor",
            instructorNetPayout: Number(customData?.instructorNetPayout || 0),
            courseId: customData?.courseId || undefined,
            courseTitle: customData?.courseTitle || undefined,
            instructorId: customData?.instructorId || undefined,
            instructorName: customData?.instructorName || undefined,
            studentId: userId,
            studentEmail: userEmail,
            calculatedAt: new Date().toISOString(),
          }, txnId);

          // Record client-side active course enrollment in storage
          if (customData?.courseId) {
            try {
              const enrolledRaw = localStorage.getItem("unigates_enrolled_courses");
              const enrolled: string[] = enrolledRaw ? JSON.parse(enrolledRaw) : [];
              if (!enrolled.includes(customData.courseId)) {
                enrolled.push(customData.courseId);
                localStorage.setItem("unigates_enrolled_courses", JSON.stringify(enrolled));
              }
            } catch (e) {
              console.warn("[PaddleProvisioningService] Course enroll storage notice:", e);
            }
          }

          // Clear referral token after successful conversion
          clearCourseReferral();
          console.info("[PaddleProvisioningService] Course transaction & dynamic ledger recorded successfully");
        } catch (ledgerErr) {
          console.warn("[PaddleProvisioningService] Course ledger recording notice:", ledgerErr);
        }
      }

      // 4. Provision Database: Update User Profile Metadata / Tier if userId is present
      if (userId) {
        try {
          const env = getPaddleEnvironment();
          // Attempt to log or invoke subscription provisioning Edge Function
          await supabase.functions.invoke("payments-webhook", {
            body: {
              eventType: "client.checkout.completed",
              data: {
                id: txnId,
                customerId: checkoutData?.customer?.id || `ctm_${userId.substring(0, 8)}`,
                status: "active",
                items: [{ price: { importMeta: { externalId: priceId } }, quantity }],
                customData: {
                  userId,
                  planKey,
                  institutionId,
                  institutionType
                }
              },
              env
            }
          }).catch(() => {
            // Non-fatal if client directly hits webhook; backend webhook from Paddle will also confirm
          });
        } catch (edgeErr) {
          console.warn("[PaddleProvisioningService] Edge provisioning notice:", edgeErr);
        }
      }

      // 4. Secure Redirection to /payment-success
      const params = new URLSearchParams({
        txn: txnId,
        plan: planKey,
        qty: String(quantity),
        status: "success",
        time: Date.now().toString()
      });

      if (userEmail) params.set("email", userEmail);

      const targetUrl = `/payment-success?${params.toString()}`;
      console.info("[PaddleProvisioningService] Redirecting to:", targetUrl);

      if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      }
    } catch (err) {
      console.error("[PaddleProvisioningService] onCheckoutComplete error:", err);
      // Fallback safe redirect
      if (typeof window !== "undefined") {
        window.location.href = "/payment-success?status=success";
      }
    }
  }
}
