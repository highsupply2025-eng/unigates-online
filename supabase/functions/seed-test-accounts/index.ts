// Seed test accounts for review/QA
// Creates one auto-approved user per role with a unified password.
// SECURITY: This is a review-only utility. It requires the caller to be an admin.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RoleSpec = {
  role: string;          // app_role
  platform: string;      // courses | school | bookstore
  full_name_ar: string;
};

const ROLES: RoleSpec[] = [
  { role: "student",         platform: "courses",   full_name_ar: "حساب اختبار - طالب جامعي" },
  { role: "lecturer",        platform: "courses",   full_name_ar: "حساب اختبار - محاضر" },
  { role: "department_head", platform: "courses",   full_name_ar: "حساب اختبار - رئيس قسم" },
  { role: "vice_dean",       platform: "courses",   full_name_ar: "حساب اختبار - وكيل عميد" },
  { role: "dean",            platform: "courses",   full_name_ar: "حساب اختبار - عميد" },
  { role: "college_admin",   platform: "courses",   full_name_ar: "حساب اختبار - إدارة كلية" },
  { role: "institute_admin", platform: "courses",   full_name_ar: "حساب اختبار - إدارة معهد" },
  { role: "school_admin",    platform: "school",    full_name_ar: "حساب اختبار - إدارة مدرسة" },
  { role: "teacher",         platform: "school",    full_name_ar: "حساب اختبار - معلم" },
  { role: "school_student",  platform: "school",    full_name_ar: "حساب اختبار - طالب مدرسة" },
  { role: "parent",          platform: "school",    full_name_ar: "حساب اختبار - ولي أمر" },
  { role: "publisher",       platform: "bookstore", full_name_ar: "حساب اختبار - ناشر" },
  { role: "personal",        platform: "courses",   full_name_ar: "حساب اختبار - حساب شخصي" },
];

const PASSWORD = "admin1993";
const EMAIL_BASE = "admin"; // -> admin1@marafa.com, admin2@marafa.com, ...
const EMAIL_DOMAIN = "marafa.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id, _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (let i = 0; i < ROLES.length; i++) {
      const idx = i + 1;
      const spec = ROLES[i];
      const email = `${EMAIL_BASE}${idx}@${EMAIL_DOMAIN}`;

      // 1) Create auth user (idempotent: skip if exists)
      let userId: string | null = null;
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: spec.full_name_ar, role: spec.role, seeded: true },
      });

      if (createErr) {
        // Look up existing user by email
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (existing) {
          userId = existing.id;
          // Reset password to ensure unified credential
          await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
        } else {
          results.push({ email, role: spec.role, ok: false, error: createErr.message });
          continue;
        }
      } else {
        userId = created.user.id;
      }

      if (!userId) {
        results.push({ email, role: spec.role, ok: false, error: "No user id" });
        continue;
      }

      // 2) Ensure profile exists (using force_approve so role is auto-approved)
      const { data: existingProfile } = await admin
        .from("profiles").select("user_id").eq("user_id", userId).maybeSingle();

      if (!existingProfile) {
        const { error: rpcErr } = await admin.rpc("complete_signup", {
          p_user_id: userId,
          p_role: spec.role,
          p_full_name: spec.full_name_ar,
          p_phone: "+201000000000",
          p_email: email,
          p_platform: spec.platform,
          p_force_approve: true,
        });
        if (rpcErr) {
          results.push({ email, role: spec.role, ok: false, error: rpcErr.message });
          continue;
        }
      } else {
        // Make sure role row is approved
        await admin.from("user_roles").upsert(
          { user_id: userId, role: spec.role as any, approved: true },
          { onConflict: "user_id,role" } as any,
        );
      }

      results.push({ email, password: PASSWORD, role: spec.role, platform: spec.platform, ok: true });
    }

    return new Response(JSON.stringify({ success: true, accounts: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
