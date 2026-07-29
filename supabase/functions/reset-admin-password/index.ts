// One-time admin password reset function.
// SECURITY: Admin-only. Sets the password for darobaid@unigates.online.
// After use, this function can be deleted.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify admin caller
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden — admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const newPassword = body.password || "admin1993@";
    const targetEmail = body.email || "darobaid@unigates.online";

    // Find the target user
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const target = (list?.users || []).find((u: any) => (u.email || "").toLowerCase() === targetEmail.toLowerCase());
    if (!target) return json({ error: `User not found: ${targetEmail}` }, 404);

    // Update password
    const { error: pwErr } = await admin.auth.admin.updateUserById(target.id, {
      password: newPassword,
      email_confirm: true,
    });
    if (pwErr) return json({ error: `Password update failed: ${pwErr.message}` }, 500);

    // Ensure email is correct
    await admin.auth.admin.updateUserById(target.id, { email: targetEmail, email_confirm: true });
    await admin.from("profiles").update({ email: targetEmail }).eq("user_id", target.id);

    // Ensure admin role exists
    await admin.from("user_roles").upsert(
      { user_id: target.id, role: "admin" as any, approved: true },
      { onConflict: "user_id,role" } as any,
    );

    return json({
      success: true,
      message: `Admin password reset for ${targetEmail}`,
      email: targetEmail,
    });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
