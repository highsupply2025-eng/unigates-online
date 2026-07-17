import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function logProfileState(label: string, details: Record<string, unknown>) {
  console.log(`[complete-password-change] ${label}`, JSON.stringify(details));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return json({ success: false, error: "Backend is not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData.user;
    if (userError || !user?.email) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = String(body.current_password || "");
    const newPassword = String(body.new_password || "");
    if (!currentPassword || newPassword.length < 8) {
      return json({ success: false, error: "Invalid password input" }, 400);
    }

    // Verify the temporary/current password against the auth backend before changing it.
    const verifyClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: verified, error: verifyError } = await verifyClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError || verified.user?.id !== user.id) {
      return json({ success: false, error: "Current password is incorrect" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profileBefore, error: beforeError } = await userClient
      .from("profiles")
      .select("user_id, email, must_change_password, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (beforeError) {
      logProfileState("profile read before update failed", {
        user_id: user.id,
        error: beforeError.message,
      });
      return json({ success: false, error: beforeError.message }, 500);
    }

    if (!profileBefore) {
      logProfileState("zero rows before update", {
        user_id: user.id,
        reason: "No profiles row exists for authenticated user",
      });
      return json({ success: false, error: "Profile not found" }, 404);
    }

    logProfileState("value before update", {
      user_id: user.id,
      must_change_password: profileBefore.must_change_password,
      updated_at: profileBefore.updated_at,
    });

    // 1) Update the auth password first. If this fails, the force-change flag remains true.
    const mergedMetadata = {
      ...(user.user_metadata || {}),
      must_change_password: false,
      force_password_change: false,
      is_first_login: false,
    };
    const { data: updatedUser, error: passwordError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: mergedMetadata,
    });
    if (passwordError || !updatedUser.user) {
      return json({ success: false, error: passwordError?.message || "Password update failed" }, 500);
    }

    // 2) Clear the database flag through the authenticated user's context.
    // The database helper uses RLS/auth.uid(), updates updated_at, clears
    // temporary_password when that column exists, and verifies exactly one row changed.
    const { data: updateRows, error: profileError } = await userClient.rpc("complete_password_change_profile_update");
    const updateResult = Array.isArray(updateRows) ? updateRows[0] : updateRows;

    if (profileError || !updateResult) {
      logProfileState("profile update failed", {
        user_id: user.id,
        rows_updated: 0,
        reason: profileError?.message || "No profile row returned after update",
      });
      return json({ success: false, error: profileError?.message || "Profile flag update failed" }, 500);
    }

    logProfileState("update result", {
      user_id: user.id,
      rows_updated: updateResult.rows_updated,
      before_must_change_password: updateResult.before_must_change_password,
      after_must_change_password: updateResult.after_must_change_password,
      temporary_password_column_present: updateResult.temporary_password_column_present,
    });

    if (updateResult.rows_updated !== 1) {
      logProfileState("unexpected update row count", {
        user_id: user.id,
        rows_updated: updateResult.rows_updated,
        reason: "Expected exactly one profiles row for authenticated user",
      });
      return json({ success: false, error: "Profile update did not affect exactly one row" }, 500);
    }

    if (updateResult.after_must_change_password !== false) {
      logProfileState("profile flag still true after update", {
        user_id: user.id,
        rows_updated: updateResult.rows_updated,
        after_must_change_password: updateResult.after_must_change_password,
      });
      return json({ success: false, error: "Password-change flag is still enabled" }, 500);
    }

    // 3) Re-read from the database as the final authoritative state before reporting success.
    const { data: committedProfile, error: commitError } = await userClient
      .from("profiles")
      .select("user_id, email, must_change_password, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    logProfileState("value after update", {
      user_id: user.id,
      must_change_password: committedProfile?.must_change_password,
      updated_at: committedProfile?.updated_at,
      error: commitError?.message || null,
    });

    if (commitError || !committedProfile || committedProfile.must_change_password !== false) {
      return json({ success: false, error: commitError?.message || "Committed profile verification failed" }, 500);
    }

    return json({
      success: true,
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        user_metadata: updatedUser.user.user_metadata,
      },
      profile: committedProfile,
    });
  } catch (error: unknown) {
    return json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
  }
});