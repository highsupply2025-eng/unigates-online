// Create a faculty member (non-student) auth account instantly.
// PHASE 1 stabilized version:
// - Correct vice_dean mapping (never stored as dean).
// - Rejects existing emails with HTTP 409; never mutates existing auth users.
// - Reliable paginated auth lookup.
// - No fake phone placeholder — null when missing.
// - All public rows saved via single transactional RPC (save_faculty_member_tx).
// - Post-save verification.
// - Structured error steps.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function genPassword() {
  return `Ug${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 9000 + 1000)}`;
}
function genCode(suffix: string) {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FAC-${Date.now().toString(36).toUpperCase()}-${r}-${suffix}`;
}
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function fail(step: string, message: string, status = 500, extra: Record<string, unknown> = {}) {
  console.error("CREATE FACULTY ACCOUNT FAILED", { step, message, ...extra });
  return json({ success: false, step, error: message, ...extra }, status);
}

const ALLOWED_ROLES = new Set([
  "dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community",
  "department_head", "professor", "doctor", "assistant_lecturer",
]);

function mapGeneralRole(specific: string): { profileRole: string; appRole: string } {
  switch (specific) {
    case "dean":
      return { profileRole: "dean", appRole: "dean" };
    case "vice_dean_postgrad":
    case "vice_dean_students":
    case "vice_dean_community":
      return { profileRole: "vice_dean", appRole: "vice_dean" };
    case "department_head":
      return { profileRole: "department_head", appRole: "department_head" };
    case "professor":
    case "doctor":
    case "assistant_lecturer":
    default:
      return { profileRole: "lecturer", appRole: "lecturer" };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findAuthUserByEmail(admin: any, email: string): Promise<any | null> {
  const target = email.trim().toLowerCase();
  // Try direct filter (newer Supabase versions accept it and ignore if unsupported).
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1, filter: `email.eq.${target}` } as any);
    const hit = (data?.users || []).find((u: any) => u.email?.toLowerCase() === target);
    if (hit) return hit;
  } catch (_) { /* fall through to pagination */ }

  const perPage = 1000;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const hit = users.find((u: any) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (users.length < perPage) return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  let createdUid: string | null = null;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ---- Caller auth ----
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.email) return fail("caller_auth", "Unauthorized", 401);

    // ---- Payload validation ----
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || "").trim();
    const role = String(body.role || "").trim();
    const departmentId = String(body.department_id || "").trim();
    let email = String(body.email || "").trim().toLowerCase();
    const phoneRaw = String(body.phone || "").trim();
    const phone = phoneRaw.length > 0 ? phoneRaw : null;

    const ALLOWED_EXTRA = [
      "date_of_birth", "photo_url", "national_id", "gender",
      "address", "qualification", "specialization", "notes",
    ] as const;
    const rawExtra = (body.extra && typeof body.extra === "object") ? body.extra : {};
    const extra: Record<string, unknown> = Object.fromEntries(
      Object.entries(rawExtra)
        .filter(([k]) => (ALLOWED_EXTRA as readonly string[]).includes(k))
        .filter(([, v]) => v !== "" && v !== undefined && v !== null),
    );

    if (!fullName) return fail("validate", "Missing full_name", 400);
    if (!ALLOWED_ROLES.has(role)) return fail("validate", `Invalid role: ${role}`, 400);
    if (!departmentId) return fail("validate", "Missing department_id", 400);

    // ---- Department + caller permission ----
    const { data: dept, error: dErr } = await admin
      .from("departments")
      .select("id, department_code, institution_id, institution_type")
      .eq("id", departmentId)
      .maybeSingle();
    if (dErr) return fail("caller_permission", dErr.message);
    if (!dept) return fail("caller_permission", "Department not found", 404);

    const callerEmail = user.email.toLowerCase();
    const table = dept.institution_type === "college" ? "college_registrations" : "institute_registrations";
    const { data: inst } = await admin
      .from(table).select("id, email, status").eq("id", dept.institution_id).maybeSingle();
    if (!inst || inst.email?.toLowerCase() !== callerEmail || inst.status !== "approved") {
      return fail("caller_permission", "Forbidden — department does not belong to your institution", 403);
    }

    // ---- Email: synthesize if missing, then validate ----
    if (!email) {
      const slug = fullName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "").slice(0, 20) || "faculty";
      email = `${slug}.${Date.now().toString(36)}@unigates.online`;
    }
    if (!EMAIL_RE.test(email)) return fail("validate", "Invalid email", 400);

    // ---- Reject existing auth email (no mutation) ----
    let existing: any = null;
    try {
      existing = await findAuthUserByEmail(admin, email);
    } catch (e: any) {
      return fail("auth_lookup", e?.message || "Auth lookup failed");
    }
    if (existing) {
      return fail("auth_email_exists", "An account with this email already exists", 409);
    }

    // ---- Create auth user ----
    const providedPassword = typeof body.temporary_password === "string" ? body.temporary_password.trim() : "";
    const passwordOk = providedPassword.length >= 8 && /[A-Z]/.test(providedPassword) && /[a-z]/.test(providedPassword) && /\d/.test(providedPassword) && !/\s/.test(providedPassword);
    const password = passwordOk ? providedPassword : genPassword();
    const { data: created, error: ce } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, seeded_via: "institution_admin" },
    });

    if (ce || !created?.user) return fail("auth_create", ce?.message || "createUser failed");
    const uid = created.user.id;
    createdUid = uid;

    const { profileRole, appRole } = mapGeneralRole(role);
    const invitationCode = genCode(dept.department_code || "GEN");

    // ---- Transactional save ----
    const { error: txErr } = await admin.rpc("save_faculty_member_tx", {
      p_user_id: uid,
      p_email: email,
      p_full_name: fullName,
      p_phone: phone,
      p_profile_role: profileRole,
      p_app_role: appRole,
      p_department_id: dept.id,
      p_specific_role: role,
      p_invitation_code: invitationCode,
      p_institution_type: dept.institution_type,
      p_institution_id: dept.institution_id,
      p_extra: extra,
    });
    if (txErr) {
      // Roll back the auth user we just made
      try { await admin.auth.admin.deleteUser(uid); } catch (delErr) {
        console.error("rollback: failed to delete auth user", delErr);
      }
      return fail("database_transaction", txErr.message, 500, {
        code: (txErr as any).code, details: (txErr as any).details,
      });
    }

    // ---- Post-save verification ----
    const [{ data: prof }, { data: uroles }, { data: dm }, cmRes] = await Promise.all([
      admin.from("profiles").select("user_id, role").eq("user_id", uid).maybeSingle(),
      admin.from("user_roles").select("role, approved").eq("user_id", uid),
      admin.from("department_members").select("user_id, role, department_id").eq("department_id", dept.id).eq("user_id", uid).maybeSingle(),
      dept.institution_type === "college"
        ? admin.from("college_members").select("user_id, role").eq("user_id", uid).eq("college_id", dept.institution_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const problems: string[] = [];
    if (!prof || prof.user_id !== uid) problems.push("profiles missing");
    else if (prof.role !== profileRole) problems.push(`profiles.role=${prof.role}!=${profileRole}`);
    if (!uroles?.some((r: any) => r.role === appRole && r.approved === true))
      problems.push(`user_roles missing approved ${appRole}`);
    if (!dm || dm.user_id !== uid) problems.push("department_members missing");
    else if (dm.role !== role) problems.push(`department_members.role=${dm.role}!=${role}`);
    if (dept.institution_type === "college") {
      const cm = (cmRes as any).data;
      if (!cm || cm.user_id !== uid) problems.push("college_members missing");
      else if (cm.role !== profileRole) problems.push(`college_members.role=${cm.role}!=${profileRole}`);
    }

    if (problems.length > 0) {
      try { await admin.auth.admin.deleteUser(uid); } catch (_) { /* ignore */ }
      return fail("verification", `Post-save verification failed: ${problems.join("; ")}`, 500);
    }

    return json({ success: true, email, password, user_id: uid });
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("CREATE FACULTY ACCOUNT UNEXPECTED", { message, createdUid });
    if (createdUid) {
      try { await admin.auth.admin.deleteUser(createdUid); } catch (_) { /* ignore */ }
    }
    return fail("rollback", message, 500);
  }
});
