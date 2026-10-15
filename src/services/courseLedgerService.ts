/**
 * UNIGATES Courses Platform - Dynamic Ledger Allocation Service
 * 
 * Implements the revenue allocation policy:
 *  - 80% Instructor / 20% Platform if an instructor referral token is present.
 *  - 70% Instructor / 30% Platform for direct platform registrations.
 *  - Payment gateway processing fees are borne by the instructor in both cases.
 *  - The full price is passed seamlessly to the Paddle overlay checkout session.
 */

export interface CourseLedgerCalculationParams {
  grossAmount: number;
  hasReferralToken: boolean;
  referralToken?: string | null;
  instructorId?: string | null;
  instructorName?: string | null;
  courseId?: string | null;
  courseTitle?: string | null;
  studentId?: string | null;
  studentEmail?: string | null;
  currency?: string;
  gatewayFeeRate?: number; // default 0.029 (2.9%)
  gatewayFeeFixed?: number; // default 0.30 ($0.30)
}

export interface CourseLedgerAllocation {
  productContext: string;
  productId: string;
  planKey: string;
  grossAmount: number;
  currency: string;
  hasReferral: boolean;
  referralToken: string | null;
  referralSource: "instructor_referral" | "direct_platform";
  
  // Percentages
  instructorPercentage: number; // 80 or 70
  platformPercentage: number;   // 20 or 30
  
  // Gross allocations
  instructorGross: number;
  platformGross: number;
  
  // Gateway fees (borne by instructor)
  processingFee: number;
  feeBearer: "instructor";
  
  // Net payout to instructor after gateway processing fees
  instructorNetPayout: number;
  
  // Metadata
  courseId?: string;
  courseTitle?: string;
  instructorId?: string;
  instructorName?: string;
  studentId?: string;
  studentEmail?: string;
  calculatedAt: string;
}

export interface CourseLedgerRecord extends CourseLedgerAllocation {
  id: string;
  transactionId: string;
  status: "completed" | "pending" | "refunded";
}

const STORAGE_LEDGER_KEY = "unigates_course_ledger_entries";

export class CourseLedgerService {
  public static readonly PRODUCT_CONTEXT = "Unigates Courses Platform";
  public static readonly PRODUCT_ID = "unigates_courses_platform";
  public static readonly PLAN_KEY = "courses";

  /**
   * Calculates the dynamic ledger allocation based on referral token presence.
   */
  public static calculateAllocation(params: CourseLedgerCalculationParams): CourseLedgerAllocation {
    const gross = Math.max(0, Number(params.grossAmount.toFixed(2)));
    const currency = params.currency || "USD";
    const hasReferral = Boolean(params.hasReferralToken && params.referralToken?.trim());

    // Enforce 80/20 vs 70/30 split
    const instructorPct = hasReferral ? 80 : 70;
    const platformPct = hasReferral ? 20 : 30;

    const instructorGross = Number(((gross * instructorPct) / 100).toFixed(2));
    const platformGross = Number((gross - instructorGross).toFixed(2)); // Ensures sum equals gross

    // Payment processing fee calculation (e.g. Paddle standard 2.9% + $0.30)
    const feeRate = params.gatewayFeeRate ?? 0.029;
    const feeFixed = params.gatewayFeeFixed ?? 0.30;
    const processingFee = gross > 0 
      ? Number((gross * feeRate + feeFixed).toFixed(2)) 
      : 0;

    // Fees borne by instructor in both cases:
    const instructorNet = Number(Math.max(0, instructorGross - processingFee).toFixed(2));

    return {
      productContext: this.PRODUCT_CONTEXT,
      productId: this.PRODUCT_ID,
      planKey: this.PLAN_KEY,
      grossAmount: gross,
      currency,
      hasReferral,
      referralToken: hasReferral ? params.referralToken!.trim() : null,
      referralSource: hasReferral ? "instructor_referral" : "direct_platform",
      instructorPercentage: instructorPct,
      platformPercentage: platformPct,
      instructorGross,
      platformGross,
      processingFee,
      feeBearer: "instructor",
      instructorNetPayout: instructorNet,
      courseId: params.courseId || undefined,
      courseTitle: params.courseTitle || undefined,
      instructorId: params.instructorId || undefined,
      instructorName: params.instructorName || undefined,
      studentId: params.studentId || undefined,
      studentEmail: params.studentEmail || undefined,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Builds the customData dictionary formatted for Paddle JS overlay checkout.
   * All string values as required by Paddle custom_data format.
   */
  public static buildPaddleCustomData(
    allocation: CourseLedgerAllocation,
    extraData?: Record<string, string>
  ): Record<string, string> {
    return {
      productContext: allocation.productContext,
      productId: allocation.productId,
      planKey: allocation.planKey,
      grossAmount: allocation.grossAmount.toFixed(2),
      currency: allocation.currency,
      referralSource: allocation.referralSource,
      hasReferral: String(allocation.hasReferral),
      referralToken: allocation.referralToken || "",
      splitInstructorPct: String(allocation.instructorPercentage),
      splitPlatformPct: String(allocation.platformPercentage),
      instructorGross: allocation.instructorGross.toFixed(2),
      platformGross: allocation.platformGross.toFixed(2),
      processingFee: allocation.processingFee.toFixed(2),
      feeBearer: allocation.feeBearer,
      instructorNetPayout: allocation.instructorNetPayout.toFixed(2),
      courseId: allocation.courseId || "",
      courseTitle: allocation.courseTitle || "",
      instructorId: allocation.instructorId || "",
      instructorName: allocation.instructorName || "",
      studentId: allocation.studentId || "",
      studentEmail: allocation.studentEmail || "",
      ...(extraData || {}),
    };
  }

  /**
   * Records a confirmed transaction into the persistent course ledger.
   */
  public static recordTransaction(
    allocation: CourseLedgerAllocation,
    transactionId: string
  ): CourseLedgerRecord {
    const record: CourseLedgerRecord = {
      ...allocation,
      id: `cldg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      transactionId,
      status: "completed",
    };

    try {
      if (typeof window !== "undefined") {
        const existingRaw = localStorage.getItem(STORAGE_LEDGER_KEY);
        const existing: CourseLedgerRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
        existing.unshift(record);
        localStorage.setItem(STORAGE_LEDGER_KEY, JSON.stringify(existing.slice(0, 500)));
      }
    } catch (err) {
      console.warn("[CourseLedgerService] Failed to record transaction locally:", err);
    }

    return record;
  }

  /**
   * Retrieves all recorded ledger transactions for instructor or admin dashboards.
   */
  public static getLedgerTransactions(instructorId?: string): CourseLedgerRecord[] {
    try {
      if (typeof window === "undefined") return [];
      const existingRaw = localStorage.getItem(STORAGE_LEDGER_KEY);
      if (!existingRaw) return [];
      const records: CourseLedgerRecord[] = JSON.parse(existingRaw);
      if (instructorId) {
        return records.filter((r) => r.instructorId === instructorId);
      }
      return records;
    } catch (err) {
      console.warn("[CourseLedgerService] Failed to retrieve ledger records:", err);
      return [];
    }
  }
}
