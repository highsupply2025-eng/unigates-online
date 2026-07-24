// Create a student account instantly from the college admin dashboard.
// - Caller must be the institution admin (matching college/institute email).
// - Creates auth user with a temporary password (if email missing one is synthesized).
// - Creates profile + approved user_role + department_members rows for each given dept code.
// Returns the generated credentials so the admin can hand them to the student.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function genPassword() {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = alpha + digits + "!@#$%^&*";
  const buf = new Uint32Array(16);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < 16; i++) out += all[buf[i] % all.length];
  const d = new Uint32Array(2);
  crypto.getRandomValues(d);
  out = alpha[d[0] % alpha.length] + digits[d[1] % digits.length] + out.slice(2);
  return out;
}
function genCode(suffix: string) {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `STU-${Date.now().toString(36).toUpperCase()}-${r}-${suffix}`;
}
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function isEmailAlreadyExistsError(error: any) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return code === "email_exists" || message.includes("already registered") || message.includes("already exists") || message.includes("user already") || message.includes("email is already") || message.includes("email already");
}

async function rollbackNewUser(admin: ReturnType<typeof createClient>, uid: string) {
  const tables = ["department_members", "college_members", "user_roles", "profiles"] as const;

  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", uid);
    if (error) {
      console.error(`Rollback cleanup failed for ${table}:`, error?.message || error);
    }
  }

  const { error: deleteUserErr } = await admin.auth.admin.deleteUser(uid);
  if (deleteUserErr) {
    console.error("Rollback deleteUser failed:", deleteUserErr?.message || deleteUserErr);
  }
}

async function findExistingAuthUser(admin: ReturnType<typeof createClient>, email: string) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const users = data?.users || [];
    const existing = users.find((u: any) => (u.email || "").trim().toLowerCase() === email);
    if (existing) return existing;

    if (users.length < 1000) break;
    page += 1;
  }

  return null;
}

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
    let email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const codes: string[] = Array.from(new Set((body.department_codes || []).map((c: string) => String(c).trim().toUpperCase()).filter(Boolean)));
    // Whitelist the only fields an institution admin is allowed to pass in
    // `extra`. Spreading raw client input previously let a malicious admin
    // override department_id/role/user_id and inject members into other
    // institutions.
    const ALLOWED_EXTRA = [
      "date_of_birth", "photo_url", "national_id", "gender",
      "address", "qualification", "specialization", "hire_date", "notes",
    ] as const;
    const rawExtra = (body.extra && typeof body.extra === "object") ? body.extra : {};
    const extra: Record<string, unknown> = Object.fromEntries(
      Object.entries(rawExtra).filter(([k]) => (ALLOWED_EXTRA as readonly string[]).includes(k))
    );

    if (!fullName) return json({ error: "Missing full_name" }, 400);
    if (codes.length === 0) return json({ error: "Missing department codes" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

    // Resolve departments by code and verify they belong to caller's institution
    const { data: depts, error: deptErr } = await admin
      .from("departments")
      .select("id, department_code, institution_id, institution_type")
      .in("department_code", codes);
    if (deptErr) return json({ error: deptErr.message }, 500);
    if (!depts || depts.length === 0) return json({ error: "No matching departments" }, 404);

    // Verify caller owns at least one institution covering the requested departments
    const callerEmail = user.email.toLowerCase();
    const instIds = Array.from(new Set(depts.map((d: any) => d.institution_id)));
    const { data: colleges } = await admin.from("college_registrations").select("id, email, status").in("id", instIds);
    const { data: institutes } = await admin.from("institute_registrations").select("id, email, status").in("id", instIds);
    const ownedIds = new Set<string>();
    for (const r of (colleges || [])) if (r.email?.toLowerCase() === callerEmail && r.status === "approved") ownedIds.add(r.id);
    for (const r of (institutes || [])) if (r.email?.toLowerCase() === callerEmail && r.status === "approved") ownedIds.add(r.id);
    const allowedDepts = depts.filter((d: any) => ownedIds.has(d.institution_id));
    if (allowedDepts.length === 0) return json({ error: "Forbidden — departments do not belong to your institution" }, 403);

    // Synthesize email if not provided
    if (!email) {
      const slug = fullName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "").slice(0, 20) || "student";
      email = `${slug}.${Date.now().toString(36)}@unigates.online`;
    }

    const password = genPassword();

    let uid: string | null = null;
    const existing = await findExistingAuthUser(admin, email);
    if (existing) {
      return json({ error: "Account already exists", code: "ACCOUNT_ALREADY_EXISTS" }, 409);
    }

    try {
      const { data: created, error: ce } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, seeded_via: "college_admin" },
      });
      if (ce) {
        if (isEmailAlreadyExistsError(ce)) {
          return json({ error: "Account already exists", code: "ACCOUNT_ALREADY_EXISTS" }, 409);
        }
        throw ce;
      }
      if (!created.user) {
        throw new Error("createUser failed");
      }
      uid = created.user.id;

      const { error: pe } = await admin.from("profiles").insert({
        user_id: uid,
        email,
        full_name: fullName,
        phone: phone || "+200000000000",
        role: "student",
        platform: "courses",
      });
      if (pe) throw new Error(`profile: ${pe.message}`);

      const { error: roleErr } = await admin.from("user_roles").insert({
        user_id: uid,
        role: "student" as any,
        approved: true,
      });
      if (roleErr) throw new Error(`user_roles: ${roleErr.message}`);

      let joined = 0;
      for (const d of allowedDepts) {
        const { error: memberErr } = await admin.from("department_members").insert({
          department_id: d.id,
          full_name: fullName,
          role: "student",
          invitation_code: genCode(d.department_code),
          user_id: uid,
          email,
          phone: phone || null,
          ...extra,
        });
        if (memberErr) throw new Error(`department_members: ${memberErr.message}`);

        if (d.institution_type === "college") {
          const { error: collegeMemberErr } = await admin.from("college_members").upsert(
            { user_id: uid, college_id: d.institution_id, role: "student" },
            { onConflict: "user_id,college_id" } as any,
          );
          if (collegeMemberErr) throw new Error(`college_members: ${collegeMemberErr.message}`);
        }

        joined++;
      }

      const missing = codes.filter(c => !allowedDepts.some((d: any) => (d.department_code || "").toUpperCase() === c));
      return json({ success: true, email, password, user_id: uid, joined, missing });
    } catch (e: any) {
      if (uid) {
        await rollbackNewUser(admin, uid);
      }
      return json({ error: e?.message || String(e) }, 500);
    }
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
