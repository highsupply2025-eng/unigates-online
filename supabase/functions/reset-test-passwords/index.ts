import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-reset-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const token = req.headers.get("x-reset-token") || "";
  const expected = Deno.env.get("ONESHOT_RESET_TOKEN_20260716") || "";
  if (!expected || token !== expected) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
  }
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const password = "Admin@1993Secure";
  const results: any[] = [];
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of list?.users || []) {
    const em = (u.email || "").toLowerCase();
    if (/^darobaid\d*@unigates\.online$/.test(em)) {
      const { error } = await admin.auth.admin.updateUserById(u.id, { password, email_confirm: true });
      results.push({ email: em, ok: !error, error: error?.message });
    }
  }
  return new Response(JSON.stringify({ success: true, password, results }), { headers: { ...cors, "Content-Type": "application/json" } });
});
