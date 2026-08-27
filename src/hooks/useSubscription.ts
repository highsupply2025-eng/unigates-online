import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  product_id: string;
  price_id: string;
  status: string;
  quantity: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
}

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

function computeActive(row: SubscriptionRow | null, trialExpiresAt: string | null): boolean {
  if (trialExpiresAt && new Date(trialExpiresAt) > new Date()) return true;
  if (!row) return false;
  const notExpired = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (ACTIVE_STATUSES.includes(row.status)) return notExpired;
  // Canceled subscriptions keep access until the paid period ends.
  return row.status === "canceled" && notExpired;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async (uid: string) => {
    const env = getPaddleEnvironment();
    const [subRes, trialRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", uid)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("free_trial_claims")
        .select("expires_at")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);

    setSubscription((subRes.data as unknown as SubscriptionRow) ?? null);
    setTrialExpiresAt(((trialRes.data as { expires_at?: string } | null)?.expires_at) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        setLoading(false);
        return;
      }
      await load(uid);

      channel = supabase
        .channel(`subscriptions-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${uid}` },
          () => void load(uid),
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  return {
    subscription,
    trialExpiresAt,
    isActive: computeActive(subscription, trialExpiresAt),
    isPastDue: subscription?.status === "past_due",
    loading,
    userId,
    refresh: () => (userId ? load(userId) : Promise.resolve()),
  };
}
