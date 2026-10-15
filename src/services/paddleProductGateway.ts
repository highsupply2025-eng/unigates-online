import { initializePaddle, getPaddlePriceId, PADDLE_ACTIVE_PRODUCTS } from "@/lib/paddle";
import { getCourseReferralToken } from "@/services/courseReferralTracker";
import { CourseLedgerService } from "@/services/courseLedgerService";

export type ActiveProductType = "ebooks" | "physical_books" | "publishing_services" | "courses";

export interface LiveProductCheckoutOptions {
  productType: ActiveProductType;
  priceId?: string;
  grossAmount: number;
  currency?: string;
  userId?: string;
  userEmail?: string;
  orderNumber?: string;
  invoiceId?: string;
  courseId?: string;
  courseTitle?: string;
  instructorId?: string;
  instructorName?: string;
  metadata?: Record<string, any>;
  successUrl?: string;
}

export class PaddleProductGateway {
  /**
   * Launch the responsive live Paddle JS overlay checkout for any of the 4 official products.
   */
  public static async openLiveProductCheckout(options: LiveProductCheckoutOptions): Promise<void> {
    const {
      productType,
      grossAmount,
      currency = "USD",
      userId,
      userEmail,
      orderNumber,
      invoiceId,
      courseId,
      courseTitle,
      instructorId,
      instructorName,
      metadata = {},
      successUrl,
    } = options;

    // 1. Resolve product metadata
    let productContext: string;
    let productId: string;
    let defaultPriceKey: string;

    switch (productType) {
      case "ebooks":
        productContext = PADDLE_ACTIVE_PRODUCTS.EBOOKS.name;
        productId = PADDLE_ACTIVE_PRODUCTS.EBOOKS.id;
        defaultPriceKey = "courses_monthly"; // maps to active catalog price
        break;
      case "physical_books":
        productContext = PADDLE_ACTIVE_PRODUCTS.PHYSICAL_BOOKS.name;
        productId = PADDLE_ACTIVE_PRODUCTS.PHYSICAL_BOOKS.id;
        defaultPriceKey = "courses_monthly";
        break;
      case "publishing_services":
        productContext = PADDLE_ACTIVE_PRODUCTS.PUBLISHING_SERVICES.name;
        productId = PADDLE_ACTIVE_PRODUCTS.PUBLISHING_SERVICES.id;
        defaultPriceKey = "courses_monthly";
        break;
      case "courses":
      default:
        productContext = PADDLE_ACTIVE_PRODUCTS.COURSES_PLATFORM.name;
        productId = PADDLE_ACTIVE_PRODUCTS.COURSES_PLATFORM.id;
        defaultPriceKey = "courses_monthly";
        break;
    }

    // 2. Initialize Paddle JS SDK with live production token & theme settings
    await initializePaddle(userId ? `ctm_${userId.substring(0, 8)}` : null);

    // 3. Resolve active Paddle Price ID
    let resolvedPriceId = options.priceId;
    if (!resolvedPriceId) {
      try {
        resolvedPriceId = await getPaddlePriceId(defaultPriceKey);
      } catch (err) {
        console.warn("[PaddleProductGateway] Price resolution notice, using fallback:", err);
        resolvedPriceId = "pri_live_courses_default";
      }
    }

    // 4. Handle dynamic ledger calculation if Course Platform
    let ledgerAllocation: any = null;
    let referralToken: string | null = null;
    if (productType === "courses") {
      referralToken = getCourseReferralToken();
      ledgerAllocation = CourseLedgerService.calculateAllocation(
        grossAmount,
        Boolean(referralToken),
        referralToken,
        {
          courseId,
          courseTitle,
          instructorId,
          instructorName,
          studentId: userId,
          studentEmail: userEmail,
        }
      );
    }

    // 5. Build secure customData payload
    const customData: Record<string, string> = {
      productContext,
      productId,
      grossAmount: String(grossAmount),
      currency,
      checkoutSource: `live_gateway_${productType}`,
      timestamp: new Date().toISOString(),
    };

    if (userId) customData.userId = userId;
    if (userEmail) customData.customerEmail = userEmail;
    if (orderNumber) customData.orderNumber = orderNumber;
    if (invoiceId) customData.invoiceId = invoiceId;

    if (courseId) customData.courseId = courseId;
    if (courseTitle) customData.courseTitle = courseTitle;
    if (instructorId) customData.instructorId = instructorId;
    if (instructorName) customData.instructorName = instructorName;

    if (ledgerAllocation) {
      customData.hasReferral = String(ledgerAllocation.hasReferral);
      if (referralToken) customData.referralToken = referralToken;
      customData.referralSource = ledgerAllocation.referralSource;
      customData.splitInstructorPct = String(ledgerAllocation.instructorPercentage);
      customData.splitPlatformPct = String(ledgerAllocation.platformPercentage);
      customData.instructorGross = String(ledgerAllocation.instructorGross);
      customData.platformGross = String(ledgerAllocation.platformGross);
      customData.processingFee = String(ledgerAllocation.processingFee);
      customData.instructorNetPayout = String(ledgerAllocation.instructorNetPayout);
    }

    // Merge any extra metadata
    Object.entries(metadata).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        customData[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
      }
    });

    // 6. UI layout & responsive settings
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

    const targetSuccessUrl =
      successUrl ||
      `${window.location.origin}/payment-success?product=${encodeURIComponent(productId)}&gross=${encodeURIComponent(
        grossAmount
      )}${orderNumber ? `&order=${encodeURIComponent(orderNumber)}` : ""}${
        invoiceId ? `&invoice=${encodeURIComponent(invoiceId)}` : ""
      }${courseId ? `&courseId=${encodeURIComponent(courseId)}` : ""}`;

    // 7. Open live Paddle Overlay Checkout
    if (typeof window !== "undefined" && window.Paddle) {
      window.Paddle.Checkout.open({
        items: [{ priceId: resolvedPriceId, quantity: 1 }],
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
          frameStyle: "width: 100%; min-width: 320px; background-color: transparent; border: none;",
          frameInitialHeight: 480,
          successUrl: targetSuccessUrl,
        },
      });
    } else {
      throw new Error("Paddle JS SDK not initialized or window unavailable.");
    }
  }

  /**
   * Helper: Checkout for 'Unigates E-Books'
   */
  public static async checkoutEBooks(params: {
    grossAmount: number;
    currency?: string;
    orderNumber: string;
    userId?: string;
    userEmail?: string;
    bookIds: string[];
  }): Promise<void> {
    return this.openLiveProductCheckout({
      productType: "ebooks",
      grossAmount: params.grossAmount,
      currency: params.currency || "USD",
      orderNumber: params.orderNumber,
      userId: params.userId,
      userEmail: params.userEmail,
      metadata: { bookIds: params.bookIds.join(",") },
    });
  }

  /**
   * Helper: Checkout for 'Unigates Physical Books'
   */
  public static async checkoutPhysicalBooks(params: {
    grossAmount: number;
    currency?: string;
    orderNumber: string;
    userId?: string;
    userEmail?: string;
    bookIds: string[];
    shippingAddress?: any;
  }): Promise<void> {
    return this.openLiveProductCheckout({
      productType: "physical_books",
      grossAmount: params.grossAmount,
      currency: params.currency || "USD",
      orderNumber: params.orderNumber,
      userId: params.userId,
      userEmail: params.userEmail,
      metadata: {
        bookIds: params.bookIds.join(","),
        shippingAddress: params.shippingAddress,
      },
    });
  }

  /**
   * Helper: Checkout for 'Unigates Publishing Services'
   */
  public static async checkoutPublishingServices(params: {
    grossAmount: number;
    currency?: string;
    invoiceId: string;
    invoiceNumber: string;
    userId?: string;
    userEmail?: string;
    serviceName?: string;
  }): Promise<void> {
    return this.openLiveProductCheckout({
      productType: "publishing_services",
      grossAmount: params.grossAmount,
      currency: params.currency || "USD",
      invoiceId: params.invoiceId,
      orderNumber: params.invoiceNumber,
      userId: params.userId,
      userEmail: params.userEmail,
      metadata: {
        serviceName: params.serviceName || "Academic Publishing Services",
        invoiceNumber: params.invoiceNumber,
      },
    });
  }
}
