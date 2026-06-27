// Seed test accounts for review/QA
// Creates one auto-approved account per role with unified credentials.
// SECURITY: Admin-only. For internal review/testing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Password is generated per invocation from SEED_TEST_PASSWORD secret or a random value.
// Never hardcode credentials in source.
const DOMAIN = "unigates.online";
const PREFIX = "darobaid";

function generatePassword(): string {
  const fromEnv = Deno.env.get("SEED_TEST_PASSWORD");
  if (fromEnv && fromEnv.length >= 12) return fromEnv;
  // Random 24-char password
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 24) + "Aa1!";
}

// Sequential numbering across all accounts (darobaid1, darobaid2, ...).
type RoleSpec = {
  kind: "user_role" | "college_admin" | "institute_admin" | "school_admin";
  role?: string;       // app_role enum (only for kind=user_role)
  platform?: string;   // courses | school | bookstore
  label_ar: string;
};

const SEEDS: RoleSpec[] = [
  // 1: app-role accounts (use complete_signup with force_approve)
  { kind: "user_role", role: "student",         platform: "courses",   label_ar: "طالب جامعي" },
  { kind: "user_role", role: "lecturer",        platform: "courses",   label_ar: "محاضر" },
  { kind: "user_role", role: "department_head", platform: "courses",   label_ar: "رئيس قسم" },
  { kind: "user_role", role: "vice_dean",       platform: "courses",   label_ar: "وكيل عميد" },
  { kind: "user_role", role: "dean",            platform: "courses",   label_ar: "عميد" },
  // 6-8: institution-admin accounts (logged via approved registration email)
  { kind: "college_admin",   label_ar: "إدارة كلية" },
  { kind: "institute_admin", label_ar: "إدارة معهد" },
  { kind: "school_admin",    label_ar: "إدارة مدرسة" },
  // 9-12: school sector roles
  { kind: "user_role", role: "teacher",        platform: "school",    label_ar: "معلم" },
  { kind: "user_role", role: "school_student", platform: "school",    label_ar: "طالب مدرسة" },
  { kind: "user_role", role: "parent",         platform: "school",    label_ar: "ولي أمر" },
  // 12: bookstore
  { kind: "user_role", role: "publisher",      platform: "bookstore", label_ar: "ناشر" },
  // 13: personal
  { kind: "user_role", role: "personal",       platform: "courses",   label_ar: "حساب شخصي" },
];

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
    if (!user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden — admin only" }, 403);

    // Get all existing users once for idempotent lookup
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byEmail: Record<string, string> = {};
    for (const u of list?.users || []) {
      if (u.email) byEmail[u.email.toLowerCase()] = u.id;
    }

    // Cleanup: delete obsolete test accounts from previous domain (marafa.com)
    for (const u of list?.users || []) {
      const em = (u.email || "").toLowerCase();
      if (/^admin\d+@marafa\.com$/.test(em)) {
        try { await admin.auth.admin.deleteUser(u.id); } catch (_) {}
      }
    }

    // Ensure the calling admin user uses the canonical admin email
    const ADMIN_EMAIL = `${PREFIX}@${DOMAIN}`;
    try {
      await admin.auth.admin.updateUserById(user.id, { email: ADMIN_EMAIL, email_confirm: true });
      await admin.from("profiles").update({ email: ADMIN_EMAIL }).eq("user_id", user.id);
    } catch (_) {}

    const results: any[] = [];


    const PASSWORD = generatePassword();

    for (let i = 0; i < SEEDS.length; i++) {
      const idx = i + 1;
      const seed = SEEDS[i];
      const email = `${PREFIX}${idx}@${DOMAIN}`;
      const fullName = `حساب اختبار - ${seed.label_ar}`;

      try {
        // 1) Create or reuse auth user
        let uid = byEmail[email.toLowerCase()] || null;
        if (!uid) {
          const { data: created, error: ce } = await admin.auth.admin.createUser({
            email, password: PASSWORD, email_confirm: true,
            user_metadata: { full_name: fullName, seeded_role: seed.role || seed.kind },
          });
          if (ce || !created.user) throw new Error(ce?.message || "createUser failed");
          uid = created.user.id;
        } else {
          await admin.auth.admin.updateUserById(uid, { password: PASSWORD, email_confirm: true });
        }

        if (seed.kind === "user_role") {
          // Direct upsert profile + approved role (avoid complete_signup which may fail for some roles)
          const { error: pe } = await admin.from("profiles").upsert(
            {
              user_id: uid,
              email,
              full_name: fullName,
              phone: "+201000000000",
              role: seed.role!,
              platform: seed.platform!,
            },
            { onConflict: "user_id" } as any,
          );
          if (pe) throw new Error(`profiles: ${pe.message}`);

          const { error: ure } = await admin.from("user_roles").upsert(
            { user_id: uid, role: seed.role as any, approved: true },
            { onConflict: "user_id,role" } as any,
          );
          if (ure) throw new Error(`user_roles: ${ure.message}`);
        } else if (seed.kind === "college_admin") {
          await upsertCollege(admin, email, fullName);
        } else if (seed.kind === "institute_admin") {
          await upsertInstitute(admin, email, fullName);
        } else if (seed.kind === "school_admin") {
          await upsertSchool(admin, email, fullName);
        }

        results.push({ idx, email, password: PASSWORD, kind: seed.kind, role: seed.role || null, label: seed.label_ar, ok: true });
      } catch (err: any) {
        results.push({ idx, email, kind: seed.kind, ok: false, error: err?.message || String(err) });
      }
    }

    return json({ success: true, password: PASSWORD, accounts: results });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function upsertCollege(admin: any, email: string, name: string) {
  const { data: existing } = await admin.from("college_registrations").select("id").eq("email", email).maybeSingle();
  if (existing) {
    await admin.from("college_registrations").update({ status: "approved" }).eq("id", existing.id);
  } else {
    await admin.from("college_registrations").insert({
      college_name: "كلية اختبار للمراجعة",
      city: "القاهرة",
      dean_name: name,
      email, phone: "+201000000000",
      type: "college",
      status: "approved",
    });
  }
}

async function upsertInstitute(admin: any, email: string, name: string) {
  const { data: existing } = await admin.from("institute_registrations").select("id").eq("email", email).maybeSingle();
  if (existing) {
    await admin.from("institute_registrations").update({ status: "approved" }).eq("id", existing.id);
  } else {
    await admin.from("institute_registrations").insert({
      institute_name: "معهد اختبار للمراجعة",
      city: "القاهرة",
      director_name: name,
      email, phone: "+201000000000",
      status: "approved",
    });
  }
}

async function upsertSchool(admin: any, email: string, name: string) {
  const { data: existing } = await admin.from("school_registrations").select("id").eq("email", email).maybeSingle();
  if (existing) {
    await admin.from("school_registrations").update({ status: "approved" }).eq("id", existing.id);
  } else {
    await admin.from("school_registrations").insert({
      school_name: "مدرسة اختبار للمراجعة",
      city: "القاهرة",
      principal_name: name,
      email, phone: "+201000000000",
      status: "approved",
    });
  }
}
