import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

export interface OpenCheckoutOptions {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  /** Paddle customer ID (`ctm_...`) of the signed-in user, for Paddle Retain. */
  paddleCustomerId?: string | null;
  customData?: Record<string, string>;
  successUrl?: string;
  theme?: "light" | "dark";
  locale?: string;
}

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: OpenCheckoutOptions) => {
    setLoading(true);
    try {
      await initializePaddle(options.paddleCustomerId);
      
      let paddlePriceId = options.priceId;
      try {
        paddlePriceId = await getPaddlePriceId(options.priceId);
      } catch (priceErr) {
        console.warn("[usePaddleCheckout] Edge function price resolution notice, fallback to direct price ID:", priceErr);
      }

      if (!window.Paddle?.Checkout) {
        throw new Error("Paddle Checkout SDK is not loaded. Please try again.");
      }

      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: options.quantity ?? 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: options.customData,
        settings: {
          displayMode: "overlay",
          theme: options.theme || (isDark ? "dark" : "light"),
          locale: options.locale || (isRtl ? "ar" : "en"),
          variant: "one-page",
          allowLogout: false,
          showAddTaxId: true,
          showAddDiscounts: true,
          allowedPaymentMethods: ["card", "paypal"],
          frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
          frameInitialHeight: 480,
          successUrl: options.successUrl || `${window.location.origin}/checkout/success`,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
