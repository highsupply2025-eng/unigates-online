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
  return `Ug${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 9000 + 1000)}`;
}
function genCode(suffix: string) {
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FAC-${Date.now().toString(36).toUpperCase()}-${r}-${suffix}`;
}
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function fail(step: string, message: string, status = 500) {
  console.error("CREATE FACULTY ACCOUNT FAILED", { step, message });
  return json({ success: false, step, error: message }, status);
}

const ALLOWED_ROLES = new Set([
  "dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community",
  "department_head", "professor", "doctor", "assistant_lecturer",
]);

// Map the specific faculty position to the general values accepted by
// profiles.role (CHECK constraint) and user_roles.role (app_role enum).
function mapGeneralRole(specific: string): { profileRole: string; appRole: string } {
  switch (specific) {
    case "dean":
      return { profileRole: "dean", appRole: "dean" };
    case "vice_dean_postgrad":
    case "vice_dean_students":
    case "vice_dean_community":
      return { profileRole: "dean", appRole: "vice_dean" }; // profiles has no vice_dean; store as dean-tier leadership
    case "department_head":
      return { profileRole: "department_head", appRole: "department_head" };
    case "professor":
    case "doctor":
    case "assistant_lecturer":
    default:
      return { profileRole: "lecturer", appRole: "lecturer" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  let createdUid: string | null = null;
  let didCreateAuthUser = false;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.email) return fail("auth", "Unauthorized", 401);

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
      Object.entries(rawExtra)
        .filter(([k]) => (ALLOWED_EXTRA as readonly string[]).includes(k))
        .filter(([, v]) => v !== "" && v !== undefined && v !== null),
    );

    if (!fullName) return fail("validate", "Missing full_name", 400);
    if (!ALLOWED_ROLES.has(role)) return fail("validate", `Invalid role: ${role}`, 400);
    if (!departmentId) return fail("validate", "Missing department_id", 400);

    // Resolve department and confirm caller owns its institution
    const { data: dept, error: dErr } = await admin
      .from("departments")
      .select("id, department_code, institution_id, institution_type")
      .eq("id", departmentId)
      .maybeSingle();
    if (dErr) return fail("department_lookup", dErr.message);
    if (!dept) return fail("department_lookup", "Department not found", 404);

    const callerEmail = user.email.toLowerCase();
    const table = dept.institution_type === "college" ? "college_registrations" : "institute_registrations";
    const { data: inst } = await admin.from(table).select("id, email, status").eq("id", dept.institution_id).maybeSingle();
    if (!inst || inst.email?.toLowerCase() !== callerEmail || inst.status !== "approved") {
      return fail("ownership", "Forbidden — department does not belong to your institution", 403);
    }

    // Synthesize email if missing
    if (!email) {
      const slug = fullName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "").slice(0, 20) || "faculty";
      email = `${slug}.${Date.now().toString(36)}@unigates.online`;
    }

    const password = genPassword();

    // Find or create auth user
    let uid: string | null = null;
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) return fail("auth_list", listErr.message);
    const existing = (list?.users || []).find((u: any) => u.email?.toLowerCase() === email);
    if (existing) {
      uid = existing.id;
      const { error: upErr } = await admin.auth.admin.updateUserById(uid, { password, email_confirm: true });
      if (upErr) return fail("auth_update", upErr.message);
    } else {
      const { data: created, error: ce } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, seeded_via: "institution_admin" },
      });
      if (ce || !created.user) return fail("auth_create", ce?.message || "createUser failed");
      uid = created.user.id;
      createdUid = uid;
      didCreateAuthUser = true;
    }

    const { profileRole, appRole } = mapGeneralRole(role);

    // --- profiles: safe select-then-update-or-insert ---
    const profilePayload = {
      user_id: uid,
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      phone: phone?.trim() || "+200000000000",
      role: profileRole,
      platform: "university",
      must_change_password: true,
    };

    const { data: existingProfile, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();
    if (lookupError) {
      console.error("PROFILE LOOKUP ERROR", lookupError);
      throw new Error(`profiles_lookup: ${lookupError.message}`);
    }

    let profileError;
    if (existingProfile) {
      const r = await admin.from("profiles").update(profilePayload).eq("user_id", uid);
      profileError = r.error;
    } else {
      const r = await admin.from("profiles").insert(profilePayload);
      profileError = r.error;
    }
    if (profileError) {
      console.error("PROFILE SAVE ERROR", {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
      });
      throw new Error(`profiles_save: ${profileError.message}`);
    }

    // --- user_roles ---
    const { error: rolesErr } = await admin.from("user_roles").upsert(
      { user_id: uid, role: appRole as any, approved: true },
      { onConflict: "user_id,role" } as any,
    );
    if (rolesErr) {
      console.error("USER_ROLES SAVE ERROR", rolesErr);
      throw new Error(`user_roles_save: ${rolesErr.message}`);
    }

    // --- department_members (store specific position in role) ---
    const { data: existingMember, error: memLookupErr } = await admin
      .from("department_members")
      .select("id")
      .eq("department_id", dept.id)
      .eq("user_id", uid)
      .maybeSingle();
    if (memLookupErr) {
      console.error("DEPT MEMBER LOOKUP ERROR", memLookupErr);
      throw new Error(`department_members_lookup: ${memLookupErr.message}`);
    }
    if (existingMember) {
      const { error: umErr } = await admin.from("department_members").update({
        full_name: fullName,
        role,
        email,
        phone: phone || null,
        ...extra,
      }).eq("id", existingMember.id);
      if (umErr) {
        console.error("DEPT MEMBER UPDATE ERROR", umErr);
        throw new Error(`department_members_save: ${umErr.message}`);
      }
    } else {
      const { error: imErr } = await admin.from("department_members").insert({
        department_id: dept.id,
        full_name: fullName,
        role,
        invitation_code: genCode(dept.department_code || "GEN"),
        user_id: uid,
        email,
        phone: phone || null,
        ...extra,
      });
      if (imErr) {
        console.error("DEPT MEMBER INSERT ERROR", imErr);
        throw new Error(`department_members_save: ${imErr.message}`);
      }
    }

    if (dept.institution_type === "college") {
      const { error: cmErr } = await admin.from("college_members").upsert(
        { user_id: uid, college_id: dept.institution_id, role: profileRole },
        { onConflict: "user_id,college_id" } as any,
      );
      if (cmErr) {
        console.error("COLLEGE MEMBER SAVE ERROR", cmErr);
        throw new Error(`college_members_save: ${cmErr.message}`);
      }
    }

    return json({ success: true, email, password, user_id: uid });
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    const step = message.includes(":") ? message.split(":")[0] : "unknown";
    console.error("CREATE FACULTY ACCOUNT FAILED", { step, message, createdUid, didCreateAuthUser });

    // Roll back the auth user only if we created it this invocation.
    if (didCreateAuthUser && createdUid) {
      try {
        await admin.auth.admin.deleteUser(createdUid);
        console.warn("Rolled back orphan auth user", createdUid);
      } catch (delErr) {
        console.error("Failed to roll back auth user", delErr);
      }
    }

    return json({ success: false, step, error: message }, 500);
  }
});
