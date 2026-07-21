// Update a faculty member. Institution-admin only.
// - Verifies caller owns the college/institute the member belongs to.
// - Prevents privilege escalation to admin/super_admin/institution_admin.
// - Applies changes atomically via RPC update_faculty_member_tx.
// - Writes an audit log row with the diff (no secrets).
// - Optional account suspend/reactivate via auth admin ban_duration.
// - Email is NOT updated here (read-only in this version).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Returned to the client so a stale deployed function can be detected.
const FUNCTION_VERSION = "2026-07-21-nullable-department-v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function fail(step: string, message: string, status = 500, extra: Record<string, unknown> = {}) {
  console.error("UPDATE FACULTY MEMBER FAILED", { step, message, ...extra });
  return json({
    success: false,
    function_version: FUNCTION_VERSION,
    step,
    error: message,
    ...extra,
  }, status);
}

const ALLOWED_ROLES = new Set([
  "dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community",
  "department_head", "professor", "doctor", "lecturer", "assistant_lecturer",
]);
const FORBIDDEN_ROLES = new Set(["admin", "super_admin", "institution_admin"]);

function mapGeneralRole(specific: string): { profileRole: string; appRole: string } {
  switch (specific) {
    case "dean": return { profileRole: "dean", appRole: "dean" };
    case "vice_dean_postgrad":
    case "vice_dean_students":
    case "vice_dean_community":
      return { profileRole: "vice_dean", appRole: "vice_dean" };
    case "department_head":
      return { profileRole: "department_head", appRole: "department_head" };
    case "professor":
    case "doctor":
    case "lecturer":
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
    const callerEmail = user.email.toLowerCase();

    // ---- Payload ----
    const body = await req.json().catch(() => ({}));
    const memberId = String(body.member_id || "").trim();
    const targetUserId = String(body.user_id || "").trim();
    const fullName = String(body.full_name || "").trim();
    const role = String(body.role || "").trim();
    /*
     * A faculty member belongs to the institution first. Missing, null, and
     * empty department_id values all mean "not assigned to a department".
     */
    if (
      body.department_id !== undefined &&
      body.department_id !== null &&
      typeof body.department_id !== "string"
    ) {
      return fail("validate", "Invalid department_id", 400);
    }
    const newDepartmentId =
      typeof body.department_id === "string"
        ? body.department_id.trim() || null
        : null;
    const phoneRaw = String(body.phone || "").trim();
    const phone = phoneRaw.length > 0 ? phoneRaw : null;
    const banned = body.banned === true;

    if (!memberId) return fail("validate", "Missing member_id", 400);
    if (!fullName) return fail("validate", "Missing full_name", 400);
    if (FORBIDDEN_ROLES.has(role)) return fail("validate", "Role not allowed", 403);
    if (!ALLOWED_ROLES.has(role)) return fail("validate", `Invalid role: ${role}`, 400);
   

    // Sanitize/whitelist extra fields
    const ALLOWED_EXTRA = [
      "date_of_birth", "photo_url", "national_id", "gender",
      "address", "qualification", "specialization", "notes",
    ] as const;
    const rawExtra = (body.extra && typeof body.extra === "object") ? body.extra : {};
    const extra: Record<string, unknown> = Object.fromEntries(
      Object.entries(rawExtra)
        .filter(([k]) => (ALLOWED_EXTRA as readonly string[]).includes(k))
        .map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
        // Preserve null so a user can intentionally clear an optional field.
        .filter(([, v]) => v !== undefined),
    );

    // Validate DoB not in the future
    if (extra.date_of_birth && typeof extra.date_of_birth === "string") {
      const d = new Date(extra.date_of_birth);
      if (!isNaN(d.getTime()) && d.getTime() > Date.now()) {
        return fail("validate", "Date of birth cannot be in the future", 400);
      }
    }

    // ---- Load current member row ----
   const { data: currentMember, error: curErr } = await admin
  .from("institution_faculty_members")
  .select("*")
  .eq("id", memberId)
  .maybeSingle();
    if (curErr) return fail("load_member", curErr.message);
    if (!currentMember) return fail("load_member", "Member not found", 404);

    const currentUserId = currentMember.user_id as string | null;
    if (!currentUserId) return fail("load_member", "Member has no linked account yet", 400);
    if (targetUserId && targetUserId !== currentUserId) {
      return fail("load_member", "user_id/member_id mismatch", 400);
    }

    const institutionId = currentMember.institution_id as string;
const institutionType = currentMember.institution_type as
  | "college"
  | "institute";

if (!institutionId || !institutionType) {
  return fail(
    "load_member",
    "Institution metadata missing",
    400,
  );
}

    // ---- Caller permission: must own the institution ----
    const table = institutionType === "college" ? "college_registrations" : "institute_registrations";
    const { data: inst } = await admin
      .from(table).select("id, email, status").eq("id", institutionId).maybeSingle();
    if (!inst || inst.email?.toLowerCase() !== callerEmail || inst.status !== "approved") {
      return fail("caller_permission", "Forbidden — member does not belong to your institution", 403);
    }

   let newDept: any = null;

if (newDepartmentId) {
  const { data: nd, error: ndErr } = await admin
    .from("departments")
    .select("id, institution_id, institution_type")
    .eq("id", newDepartmentId)
    .maybeSingle();

  if (ndErr)
    return fail("validate_department", ndErr.message);

  if (!nd)
    return fail("validate_department", "Department not found", 404);

  if (
    nd.institution_id !== institutionId ||
    nd.institution_type !== institutionType
  ) {
    return fail(
      "validate_department",
      "Department does not belong to this institution",
      403,
    );
  }

  newDept = nd;

    }

    // ---- Prevent role escalation via profiles check ----
    const { data: currentProfile } = await admin
      .from("profiles").select("role, full_name, phone, email, avatar_url")
      .eq("user_id", currentUserId).maybeSingle();
    if (currentProfile?.role === "admin") {
      return fail("caller_permission", "Cannot modify an admin account", 403);
    }

    const { profileRole, appRole } = mapGeneralRole(role);
    const avatarUrl = typeof extra.photo_url === "string" ? extra.photo_url : null;

    // ---- Transactional update ----
    const { error: txErr } = await admin.rpc("update_faculty_member_tx", {
      p_user_id: currentUserId,
      p_full_name: fullName,
      p_phone: phone,
      p_profile_role: profileRole,
      p_app_role: appRole,
     p_old_department_id: currentMember.department_id ?? null,
     p_new_department_id: newDept?.id ?? null,
      p_specific_role: role,
      p_institution_type: institutionType,
      p_institution_id: institutionId,
      p_extra: extra,
      p_avatar_url: avatarUrl,
    });
    if (txErr) {
      return fail("database_transaction", txErr.message, 500, {
        code: (txErr as any).code, details: (txErr as any).details,
      });
    }

    // ---- Optional suspend/reactivate ----
    if (typeof body.banned === "boolean") {
      try {
        await admin.auth.admin.updateUserById(currentUserId, {
          ban_duration: banned ? "876000h" : "none",
        } as any);
      } catch (e) {
        console.error("ban toggle failed", e);
      }
    }

    // ---- Post-save verification ----
  const [{ data: prof }, { data: member }] = await Promise.all([
  admin
    .from("profiles")
    .select("role, full_name")
    .eq("user_id", currentUserId)
    .maybeSingle(),

  admin
    .from("institution_faculty_members")
    .select("specific_role, department_id")
    .eq("id", memberId)
    .maybeSingle(),
]);
    const problems: string[] = [];
    if (!prof) problems.push("profiles missing");
    else if (prof.role !== profileRole) problems.push(`profiles.role=${prof.role}!=${profileRole}`);
  if (!member) {
  problems.push("institution_faculty_members missing");
} else {
  if (member.specific_role !== role) {
    problems.push(
      `specific_role=${member.specific_role}!=${role}`
    );
  }

  const expectedDepartmentId = newDept?.id ?? null;

  if ((member.department_id ?? null) !== expectedDepartmentId) {
    problems.push(
      `department_id=${member.department_id ?? null}!=${expectedDepartmentId}`
    );
  }
}
    if (problems.length) return fail("verification", problems.join("; "), 500);

    // ---- Diff for audit log (skip large/binary and sensitive) ----
    const oldRow: Record<string, unknown> = {
      full_name: currentMember.full_name,
      phone: currentMember.phone,
     role: currentMember.specific_role,
     department_id: currentMember.department_id,
      profile_role: currentProfile?.role,
      date_of_birth: currentMember.date_of_birth,
      gender: currentMember.gender,
      national_id: currentMember.national_id,
      address: currentMember.address,
      qualification: currentMember.qualification,
      specialization: currentMember.specialization,
      notes: currentMember.notes,
      photo_url: currentMember.photo_url,
    };
    const newRow: Record<string, unknown> = {
      full_name: fullName,
      phone,
      role,
      department_id: newDept?.id ?? null,
      profile_role: profileRole,
      date_of_birth: extra.date_of_birth ?? currentMember.date_of_birth,
      gender: extra.gender ?? currentMember.gender,
      national_id: extra.national_id ?? currentMember.national_id,
      address: extra.address ?? currentMember.address,
      qualification: extra.qualification ?? currentMember.qualification,
      specialization: extra.specialization ?? currentMember.specialization,
      notes: extra.notes ?? currentMember.notes,
      photo_url: extra.photo_url ?? currentMember.photo_url,
    };
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const k of Object.keys(newRow)) {
      if (JSON.stringify(oldRow[k] ?? null) !== JSON.stringify(newRow[k] ?? null)) {
        changes[k] = { old: oldRow[k] ?? null, new: newRow[k] ?? null };
      }
    }
    if (typeof body.banned === "boolean") {
      changes["banned"] = { old: null, new: banned };
    }

    if (Object.keys(changes).length > 0) {
      await admin.from("faculty_edit_audit").insert({
        member_user_id: currentUserId,
        member_department_member_id: memberId,
        edited_by: user.id,
        edited_by_email: callerEmail,
        institution_id: institutionId,
        institution_type: institutionType,
        changes,
      });
    }

    return json({
      success: true,
      function_version: FUNCTION_VERSION,
      department_id: newDept?.id ?? null,
      changed: Object.keys(changes),
    });
  } catch (e: any) {
    return fail("unexpected", e?.message || String(e), 500);
  }
});
