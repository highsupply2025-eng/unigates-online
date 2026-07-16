// Create a faculty member (non-student) auth account instantly.
// - Caller must be the institution admin (matching college/institute email).
// - Creates auth user with a temporary password; profile flag must_change_password=true.
// - Creates approved user_role + department_members row inside the given department.
// Returns generated credentials so the admin can hand them to the member.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function genPassword() {
  // Strong-ish temp password: >=8 chars, letters + digits, one symbol
  return `Ug${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 9000 + 1000)}`;
}
function genCode(suffix: string) {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FAC-${Date.now().toString(36).toUpperCase()}-${r}-${suffix}`;
}
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const ALLOWED_ROLES = new Set([
  "dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community",
  "department_head", "professor", "doctor", "assistant_lecturer",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.email) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || "").trim();
    const role = String(body.role || "").trim();
    const departmentId = String(body.department_id || "").trim();
    let email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();

    const ALLOWED_EXTRA = [
      "date_of_birth", "photo_url", "national_id", "gender",
      "address", "qualification", "specialization", "hire_date", "notes",
    ] as const;
    const rawExtra = (body.extra && typeof body.extra === "object") ? body.extra : {};
    const extra: Record<string, unknown> = Object.fromEntries(
      Object.entries(rawExtra).filter(([k]) => (ALLOWED_EXTRA as readonly string[]).includes(k))
    );

    if (!fullName) return json({ error: "Missing full_name" }, 400);
    if (!ALLOWED_ROLES.has(role)) return json({ error: "Invalid role" }, 400);
    if (!departmentId) return json({ error: "Missing department_id" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

    // Resolve department and confirm caller owns its institution
    const { data: dept, error: dErr } = await admin
      .from("departments")
      .select("id, department_code, institution_id, institution_type")
      .eq("id", departmentId)
      .maybeSingle();
    if (dErr) return json({ error: dErr.message }, 500);
    if (!dept) return json({ error: "Department not found" }, 404);

    const callerEmail = user.email.toLowerCase();
    const table = dept.institution_type === "college" ? "college_registrations" : "institute_registrations";
    const { data: inst } = await admin.from(table).select("id, email, status").eq("id", dept.institution_id).maybeSingle();
    if (!inst || inst.email?.toLowerCase() !== callerEmail || inst.status !== "approved") {
      return json({ error: "Forbidden — department does not belong to your institution" }, 403);
    }

    // Synthesize email if missing
    if (!email) {
      const slug = fullName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "").slice(0, 20) || "faculty";
      email = `${slug}.${Date.now().toString(36)}@unigates.online`;
    }

    const password = genPassword();

    // Find or create user
    let uid: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = (list?.users || []).find((u: any) => u.email?.toLowerCase() === email);
    if (existing) {
      uid = existing.id;
      await admin.auth.admin.updateUserById(uid, { password, email_confirm: true });
    } else {
      const { data: created, error: ce } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, seeded_via: "institution_admin" },
      });
      if (ce || !created.user) return json({ error: ce?.message || "createUser failed" }, 500);
      uid = created.user.id;
    }

    // Upsert profile with must_change_password flag
    const { error: pe } = await admin.from("profiles").upsert(
      {
        user_id: uid,
        email,
        full_name: fullName,
        phone: phone || "+200000000000",
        role,
        platform: "university",
        must_change_password: true,
      } as any,
      { onConflict: "user_id" } as any,
    );
    if (pe) return json({ error: `profile: ${pe.message}` }, 500);

    // Approved role
    await admin.from("user_roles").upsert(
      { user_id: uid, role: role as any, approved: true },
      { onConflict: "user_id,role" } as any,
    );

    // Department member row (upsert-ish)
    const { data: existingMember } = await admin
      .from("department_members")
      .select("id")
      .eq("department_id", dept.id)
      .eq("user_id", uid)
      .maybeSingle();
    if (existingMember) {
      await admin.from("department_members").update({
        full_name: fullName,
        role,
        email,
        phone: phone || null,
        ...extra,
      }).eq("id", existingMember.id);
    } else {
      await admin.from("department_members").insert({
        department_id: dept.id,
        full_name: fullName,
        role,
        invitation_code: genCode(dept.department_code || "GEN"),
        user_id: uid,
        email,
        phone: phone || null,
        ...extra,
      });
    }

    if (dept.institution_type === "college") {
      await admin.from("college_members").upsert(
        { user_id: uid, college_id: dept.institution_id, role },
        { onConflict: "user_id,college_id" } as any,
      );
    }

    return json({ success: true, email, password, user_id: uid });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
