import { supabase } from "@/integrations/supabase/client";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

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

export async function initializePaddle() {
  if (paddleInitialized) return;

  if (!clientToken) {
    throw new Error("VITE_PAYMENTS_CLIENT_TOKEN is not set");
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      const env = getPaddleEnvironment() === "sandbox" ? "sandbox" : "production";
      window.Paddle.Environment.set(env);
      window.Paddle.Initialize({ token: clientToken });
      paddleInitialized = true;
      resolve();
    };
    script.onerror = reject;
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
