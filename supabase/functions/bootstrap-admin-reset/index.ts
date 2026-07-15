// One-shot bootstrap: reset primary admin + reseed test accounts.
// Guarded by X-Bootstrap-Token matching BOOTSTRAP_ADMIN_TOKEN env secret.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bootstrap-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DOMAIN = "unigates.online";
const PREFIX = "darobaid";

type RoleSpec = {
  kind: "user_role" | "college_admin" | "institute_admin" | "school_admin";
  role?: string;
  platform?: string;
  label_ar: string;
};

const SEEDS: RoleSpec[] = [
  { kind: "user_role", role: "student",         platform: "courses",   label_ar: "طالب جامعي" },
  { kind: "user_role", role: "lecturer",        platform: "courses",   label_ar: "محاضر" },
  { kind: "user_role", role: "department_head", platform: "courses",   label_ar: "رئيس قسم" },
  { kind: "user_role", role: "vice_dean",       platform: "courses",   label_ar: "وكيل عميد" },
  { kind: "user_role", role: "dean",            platform: "courses",   label_ar: "عميد" },
  { kind: "college_admin",   label_ar: "إدارة كلية" },
  { kind: "institute_admin", label_ar: "إدارة معهد" },
  { kind: "school_admin",    label_ar: "إدارة مدرسة" },
  { kind: "user_role", role: "teacher",        platform: "school",    label_ar: "معلم" },
  { kind: "user_role", role: "school_student", platform: "school",    label_ar: "طالب مدرسة" },
  { kind: "user_role", role: "parent",         platform: "school",    label_ar: "ولي أمر" },
  { kind: "user_role", role: "publisher",      platform: "bookstore", label_ar: "ناشر" },
  { kind: "user_role", role: "personal",       platform: "courses",   label_ar: "حساب شخصي" },
];

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
      college_name: "كلية اختبار للمراجعة", city: "القاهرة", dean_name: name,
      email, phone: "+201000000000", type: "college", status: "approved",
    });
  }
}
async function upsertInstitute(admin: any, email: string, name: string) {
  const { data: existing } = await admin.from("institute_registrations").select("id").eq("email", email).maybeSingle();
  if (existing) {
    await admin.from("institute_registrations").update({ status: "approved" }).eq("id", existing.id);
  } else {
    await admin.from("institute_registrations").insert({
      institute_name: "معهد اختبار للمراجعة", city: "القاهرة", director_name: name,
      email, phone: "+201000000000", status: "approved",
    });
  }
}
async function upsertSchool(admin: any, email: string, name: string) {
  const { data: existing } = await admin.from("school_registrations").select("id").eq("email", email).maybeSingle();
  if (existing) {
    await admin.from("school_registrations").update({ status: "approved" }).eq("id", existing.id);
  } else {
    await admin.from("school_registrations").insert({
      school_name: "مدرسة اختبار للمراجعة", city: "القاهرة", principal_name: name,
      email, phone: "+201000000000", status: "approved",
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const expected = Deno.env.get("BOOTSTRAP_ADMIN_TOKEN") || "";
    const provided = req.headers.get("x-bootstrap-token") || "";
    if (!expected || provided !== expected) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PASSWORD = Deno.env.get("SEED_TEST_PASSWORD") || "";
    if (PASSWORD.length < 8) return json({ error: "SEED_TEST_PASSWORD not set (min 8)" }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1) Ensure primary admin exists with canonical email + password
    const ADMIN_EMAIL = `${PREFIX}@${DOMAIN}`;
    const { data: existingAdminRoles } = await admin
      .from("user_roles").select("user_id").eq("role", "admin").limit(1);
    let adminUid: string | null = existingAdminRoles?.[0]?.user_id ?? null;

    if (adminUid) {
      await admin.auth.admin.updateUserById(adminUid, {
        email: ADMIN_EMAIL, password: PASSWORD, email_confirm: true,
      });
    } else {
      // Try create; if email already taken, look it up
      const { data: created, error: ce } = await admin.auth.admin.createUser({
        email: ADMIN_EMAIL, password: PASSWORD, email_confirm: true,
        user_metadata: { full_name: "Admin" },
      });
      if (created?.user) {
        adminUid = created.user.id;
      } else {
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        adminUid = list?.users?.find((u: any) => u.email?.toLowerCase() === ADMIN_EMAIL)?.id ?? null;
        if (!adminUid) throw new Error(ce?.message || "cannot create/find admin");
        await admin.auth.admin.updateUserById(adminUid, { password: PASSWORD, email_confirm: true });
      }
      await admin.from("user_roles").upsert(
        { user_id: adminUid, role: "admin" as any, approved: true },
        { onConflict: "user_id,role" } as any,
      );
    }

    // Ensure admin profile row exists
    await admin.from("profiles").upsert(
      { user_id: adminUid, email: ADMIN_EMAIL, full_name: "Admin", role: "admin", platform: "courses" },
      { onConflict: "user_id" } as any,
    );

    // 2) Reseed the 13 test accounts
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byEmail: Record<string, string> = {};
    for (const u of list?.users || []) if (u.email) byEmail[u.email.toLowerCase()] = u.id;

    const results: any[] = [];
    for (let i = 0; i < SEEDS.length; i++) {
      const idx = i + 1;
      const seed = SEEDS[i];
      const email = `${PREFIX}${idx}@${DOMAIN}`;
      const fullName = `حساب اختبار - ${seed.label_ar}`;
      try {
        let uid = byEmail[email.toLowerCase()] || null;
        if (!uid) {
          const { data: created, error: ce } = await admin.auth.admin.createUser({
            email, password: PASSWORD, email_confirm: true,
            user_metadata: { full_name: fullName, seeded_role: seed.role || seed.kind },
          });
          if (ce || !created?.user) throw new Error(ce?.message || "createUser failed");
          uid = created.user.id;
        } else {
          await admin.auth.admin.updateUserById(uid, { password: PASSWORD, email_confirm: true });
        }

        if (seed.kind === "user_role") {
          const { error: pe } = await admin.from("profiles").upsert(
            { user_id: uid, email, full_name: fullName, phone: "+201000000000",
              role: seed.role!, platform: seed.platform! },
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

        results.push({ idx, email, kind: seed.kind, role: seed.role || null, label: seed.label_ar, ok: true });
      } catch (err: any) {
        results.push({ idx, email, kind: seed.kind, ok: false, error: err?.message || String(err) });
      }
    }

    return json({
      success: true,
      primary_admin: { email: ADMIN_EMAIL, password: PASSWORD },
      accounts: results,
    });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
