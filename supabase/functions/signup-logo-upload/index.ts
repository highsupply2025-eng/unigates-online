import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// In-memory sliding-window rate limiter (per-IP) to prevent storage abuse.
// Anonymous signup flow calls this before an account exists, so we can't require auth;
// we throttle per source IP instead: max 5 uploads / 10 minutes.
const RL_MAX = 5;
const RL_WINDOW_MS = 10 * 60 * 1000;
const rlHits = new Map<string, number[]>();
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (rlHits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  if (arr.length >= RL_MAX) { rlHits.set(ip, arr); return false; }
  arr.push(now);
  rlHits.set(ip, arr);
  // Opportunistic cleanup
  if (rlHits.size > 5000) {
    for (const [k, v] of rlHits) {
      const kept = v.filter((t) => now - t < RL_WINDOW_MS);
      if (kept.length === 0) rlHits.delete(k); else rlHits.set(k, kept);
    }
  }
  return true;
}

// Verify a pending registration exists for the caller's IP (prevents abuse from random IPs).
async function hasPendingRegistration(
  supabase: ReturnType<typeof createClient>,
  ip: string,
  kind: string,
): Promise<boolean> {
  const table = kind === "college" ? "college_registrations" : "institute_registrations";
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return (count ?? 0) > 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (!rateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many uploads. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File) || (kind !== "college" && kind !== "institute")) {
      return new Response(
        JSON.stringify({ error: "Missing file or invalid institution type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (file.size > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "Image must be less than 5MB" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return new Response(
        JSON.stringify({ error: "Invalid image type. Allowed: JPG, PNG, WEBP, GIF" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify a pending registration exists for this institution type.
    // This prevents random IPs from flooding storage with junk files.
    if (!(await hasPendingRegistration(supabaseAdmin, ip, kind))) {
      return new Response(
        JSON.stringify({ error: "No pending registration found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const bucket = kind === "college" ? "college-logos" : "institute-logos";
    const path = `pending/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: "Upload failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

    return new Response(
      JSON.stringify({ path, publicUrl: data.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Upload failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});