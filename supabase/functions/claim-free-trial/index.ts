// Grants the first month free — once per user and once per IP address.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_KEYS = ["university", "school", "courses"];

async function hashIp(ip: string): Promise<string> {
  const salt = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const bytes = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const planKey = String(body.planKey ?? "courses");
    if (!PLAN_KEYS.includes(planKey)) return json({ error: "Invalid planKey" }, 400);

    const ip =
      req.headers.get("cf-connecting-ip") ||
      (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
      "unknown";
    const ipHash = await hashIp(ip);

    const { data: existing } = await admin
      .from("free_trial_claims")
      .select("id, user_id, expires_at")
      .or(`ip_hash.eq.${ipHash},user_id.eq.${user.id}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return json({
        claimed: false,
        reason: (existing as { user_id: string }).user_id === user.id ? "already_claimed_user" : "already_claimed_ip",
        expiresAt: (existing as { expires_at: string }).expires_at,
      });
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: insertError } = await admin.from("free_trial_claims").insert({
      ip_hash: ipHash,
      user_id: user.id,
      plan_key: planKey,
      institution_type: body.institutionType ?? null,
      institution_id: body.institutionId ?? null,
      expires_at: expiresAt,
    });

    if (insertError) {
      // Unique index race — treat as already claimed.
      return json({ claimed: false, reason: "already_claimed_ip" });
    }

    return json({ claimed: true, expiresAt });
  } catch (e) {
    console.error("claim-free-trial error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
