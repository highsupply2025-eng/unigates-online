import { supabase } from "@/integrations/supabase/client";

const clientToken = 
  (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined) || 
  "live_ed63bc96090a362134c6242a552";

declare global {
  interface Window {
    Paddle: any;
  }
}

/** Single source of truth for the payments environment on the client. */
export function getPaddleEnvironment(): "sandbox" | "live" {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

let paddleInitialized = false;
let initializedCustomerId: string | null = null;

import { PaddleProvisioningService } from "@/services/paddleProvisioningService";

type PaddleEventListener = (event: any) => void;
const paddleEventListeners: Set<PaddleEventListener> = new Set();

/**
 * Register a listener for Paddle checkout events (checkout.completed, checkout.loaded, checkout.closed, etc.)
 */
export function onPaddleEvent(listener: PaddleEventListener): () => void {
  paddleEventListeners.add(listener);
  return () => paddleEventListeners.delete(listener);
}

function handleGlobalPaddleEvent(event: any) {
  console.info("[Paddle Event]:", event?.name, event);

  // Notify registered callbacks
  paddleEventListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.warn("[Paddle Event Callback Error]:", err);
    }
  });

  // Handle successful transaction provisioning and redirect to /payment-success
  if (event?.name === "checkout.completed") {
    PaddleProvisioningService.onCheckoutComplete(event?.data);
  }
}

/**
 * Loads and initializes Paddle.js SDK v2 with customized responsive overlay settings.
 *
 * `paddleCustomerId` must be the signed-in user's Paddle customer ID (`ctm_...`),
 * never an internal user ID or email. It is passed to Paddle.Initialize as
 * `pwCustomer` so Paddle Retain can run its retention flows for that customer.
 */
export async function initializePaddle(paddleCustomerId?: string | null) {
  const pwCustomer = paddleCustomerId?.startsWith("ctm_") ? paddleCustomerId : null;
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";

  const defaultCheckoutSettings = {
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
  };

  if (paddleInitialized && typeof window !== "undefined" && window.Paddle) {
    // Re-run Initialize only when a customer identity became available (or changed).
    if (pwCustomer && pwCustomer !== initializedCustomerId) {
      window.Paddle.Initialize({ 
        token: clientToken, 
        pwCustomer: { id: pwCustomer },
        checkout: { settings: defaultCheckoutSettings },
        eventCallback: handleGlobalPaddleEvent
      });
      initializedCustomerId = pwCustomer;
    }
    return;
  }

  if (!clientToken) {
    throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");
  }

  return new Promise<void>((resolve, reject) => {
    if (typeof window !== "undefined" && window.Paddle) {
      const env = getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(env);
      window.Paddle.Initialize({
        token: clientToken,
        ...(pwCustomer ? { pwCustomer: { id: pwCustomer } } : {}),
        checkout: { settings: defaultCheckoutSettings },
        eventCallback: handleGlobalPaddleEvent,
      });
      initializedCustomerId = pwCustomer;
      paddleInitialized = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      const env = getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(env);
      window.Paddle.Initialize({
        token: clientToken,
        ...(pwCustomer ? { pwCustomer: { id: pwCustomer } } : {}),
        checkout: { settings: defaultCheckoutSettings },
        eventCallback: handleGlobalPaddleEvent,
      });
      initializedCustomerId = pwCustomer;
      paddleInitialized = true;
      resolve();
    };
    script.onerror = (err) => {
      console.error("[Paddle] Failed to load Paddle JS SDK:", err);
      reject(new Error("Failed to load Paddle JS SDK. Please check your connection."));
    };
    document.head.appendChild(script);
  });
}

export async function getPaddlePriceId(priceId: string): Promise<string> {
  const environment = getPaddleEnvironment();
  const { data, error } = await supabase.functions.invoke("get-paddle-price", {
    body: { priceId, environment },
  });
  if (error || !data?.paddleId) {
    throw new Error(`Failed to resolve price: ${priceId}`);
  }
  return data.paddleId as string;
}

export type PlanKey = "university" | "school" | "courses";
export type BillingInterval = "monthly" | "annual";

export const COURSES_PLATFORM_PRODUCT = "Unigates Courses Platform";
export const COURSES_PRODUCT_ID = "unigates_courses_platform";

/** $6 per month, annual billed at 12 months with a 10% discount. */
export const PLAN_PRICING: Record<PlanKey, Record<BillingInterval, { priceId: string; amount: number }>> = {
  university: {
    monthly: { priceId: "university_monthly", amount: 6 },
    annual: { priceId: "university_annual", amount: 64.8 },
  },
  school: {
    monthly: { priceId: "school_monthly", amount: 6 },
    annual: { priceId: "school_annual", amount: 64.8 },
  },
  courses: {
    monthly: { priceId: "courses_monthly", amount: 6 },
    annual: { priceId: "courses_annual", amount: 64.8 },
  },
};
