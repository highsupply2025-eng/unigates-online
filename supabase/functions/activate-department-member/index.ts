// Activate a department member by creating an auth account instantly.
// The admin must be authenticated. The function:
//   1. Resolves the institution from the caller's email.
//   2. Creates an auth user with a temporary password.
//   3. Creates profile + user_roles.
//   4. Updates the department_members row with user_id.
//   5. If the role is faculty (not student), creates institution_faculty_members.
//   6. If the institution is a college, creates college_members.
//   7. Returns { success, email, password, user_id }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fail(
  step: string,
  message: string,
  status = 500,
  extra: Record<string, unknown> = {},
) {
  console.error(`[activate-department-member:${step}] ${message}`, extra);
  return json({ success: false, step, error: message, ...extra }, status);
}

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
  out =
    alpha[d[0] % alpha.length] +
    digits[d[1] % digits.length] +
    out.slice(2);
  return out;
}

const FACULTY_ROLES = new Set([
  "dean",
  "vice_dean",
  "vice_dean_postgrad",
  "vice_dean_students",
  "vice_dean_community",
  "vice_dean_environment",
  "department_head",
  "teaching_assistant",
  "professor",
  "doctor",
  "lecturer",
  "assistant_lecturer",
]);

function mapGeneralRole(
  specific: string,
): { profileRole: string; appRole: string } {
  switch (specific) {
    case "student":
      return { profileRole: "student", appRole: "student" };
    case "dean":
      return { profileRole: "dean", appRole: "dean" };
    case "vice_dean":
    case "vice_dean_postgrad":
    case "vice_dean_students":
    case "vice_dean_community":
    case "vice_dean_environment":
      return { profileRole: "vice_dean", appRole: "vice_dean" };
    case "teaching_assistant":
      return { profileRole: "teaching_assistant", appRole: "teaching_assistant" };
    case "department_head":
      return { profileRole: "department_head", appRole: "department_head" };
    default:
      // professor, doctor, lecturer, assistant_lecturer and any future
      // teaching role activate as a regular teaching account.
      return { profileRole: "lecturer", appRole: "lecturer" };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function findExistingAuthUser(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<any | null> {
  const target = email.trim().toLowerCase();
  try {
    const { data } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      filter: `email.eq.${target}`,
    } as any);
    const hit = (data?.users || []).find(
      (u: any) => u.email?.toLowerCase() === target,
    );
    if (hit) return hit;
  } catch (_) {
    /* fallthrough */
  }

  const perPage = 1000;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const users = data?.users || [];
    const hit = users.find(
      (u: any) => u.email?.toLowerCase() === target,
    );
    if (hit) return hit;
    if (users.length < perPage) return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  let createdUid: string | null = null;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // ---- Caller authentication ----
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user?.email) return fail("caller_auth", "Unauthorized", 401);
    const callerEmail = user.email.toLowerCase();

    // ---- Resolve institution ----
    let institutionId: string | null = null;
    let institutionType: "college" | "institute" | null = null;

    const { data: college } = await admin
      .from("college_registrations")
      .select("id, email, status")
      .eq("email", callerEmail)
      .eq("status", "approved")
      .maybeSingle();
    if (college) {
      institutionId = college.id;
      institutionType = "college";
    } else {
      const { data: inst } = await admin
        .from("institute_registrations")
        .select("id, email, status")
        .eq("email", callerEmail)
        .eq("status", "approved")
        .maybeSingle();
      if (inst) {
        institutionId = inst.id;
        institutionType = "institute";
      }
    }
    if (!institutionId || !institutionType) {
      return fail(
        "caller_permission",
        "Caller is not an approved institution admin",
        403,
      );
    }

    // ---- Parse payload ----
    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || "").trim();
    let email = String(body.email || "").trim().toLowerCase();
    const phoneRaw = String(body.phone || "").trim();
    const phone = phoneRaw.length > 0 ? phoneRaw : null;
    const departmentId = String(body.department_id || "").trim();
    const role = String(body.role || "").trim();
    const existingMemberId = String(body.existing_member_id || "").trim();

    if (!fullName) return fail("validate", "Missing full_name", 400);
    if (!departmentId) return fail("validate", "Missing department_id", 400);
    if (!role) return fail("validate", "Missing role", 400);

    // Synthesize email if not provided
    if (!email) {
      const slug =
        fullName
          .toLowerCase()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9.]/g, "")
          .slice(0, 20) || "member";
      email = `${slug}.${Date.now().toString(36)}@unigates.online`;
    }
    if (!EMAIL_RE.test(email)) return fail("validate", "Invalid email", 400);

    // ---- Verify department belongs to institution ----
    const { data: dept } = await admin
      .from("departments")
      .select("id, institution_id, institution_type, department_code")
      .eq("id", departmentId)
      .maybeSingle();
    if (!dept) return fail("department_not_found", "Department not found", 404);
    if (dept.institution_id !== institutionId) {
      return fail(
        "department_permission",
        "Department does not belong to your institution",
        403,
      );
    }

    // ---- Verify existing member row if provided ----
    let memberRow: any = null;
    if (existingMemberId) {
      const { data } = await admin
        .from("department_members")
        .select("id, user_id, department_id, role, full_name")
        .eq("id", existingMemberId)
        .maybeSingle();
      memberRow = data;
      if (!memberRow) {
        return fail("member_not_found", "Member not found", 404);
      }
      if (memberRow.department_id !== departmentId) {
        return fail(
          "member_dept_mismatch",
          "Member does not belong to this department",
          403,
        );
      }
      if (memberRow.user_id) {
        return fail(
          "already_activated",
          "Member already has an account",
          409,
        );
      }
    }

    // ---- Check for existing auth user ----
    let existing: any = null;
    try {
      existing = await findExistingAuthUser(admin, email);
    } catch (e: any) {
      return fail("auth_lookup", e?.message || "Auth lookup failed");
    }
    if (existing) {
      return fail(
        "auth_email_exists",
        "An account with this email already exists",
        409,
      );
    }

    // ---- Check for duplicate email in department ----
    const { data: dupMember } = await admin
      .from("department_members")
      .select("id")
      .eq("department_id", departmentId)
      .ilike("email", email)
      .limit(1);
    if (dupMember && dupMember.length > 0) {
      return fail(
        "email_exists_in_dept",
        "A member with this email already exists in this department",
        409,
      );
    }

    // ---- Create auth user ----
    const password = genPassword();
    const isFaculty = FACULTY_ROLES.has(role);
    const { profileRole, appRole } = mapGeneralRole(role);

    const { data: created, error: ce } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        seeded_via: "department_admin",
        must_change_password: true,
      },
    });
    if (ce || !created?.user)
      return fail("auth_create", ce?.message || "createUser failed");
    const uid = created.user.id;
    createdUid = uid;

    try {
      // ---- Create profile ----
      const { error: pe } = await admin.from("profiles").insert({
        user_id: uid,
        email,
        full_name: fullName,
        phone: phone || "+200000000000",
        role: profileRole,
        platform: "courses",
      });
      if (pe) throw new Error(`profile: ${pe.message}`);

      // ---- Create user_roles ----
      const { error: roleErr } = await admin.from("user_roles").insert({
        user_id: uid,
        role: appRole,
        approved: true,
      });
      if (roleErr) throw new Error(`user_roles: ${roleErr.message}`);

      // ---- Update or insert department_members ----
      if (existingMemberId) {
        const { error: updateErr } = await admin
          .from("department_members")
          .update({
            user_id: uid,
            email,
            phone: phone || null,
          })
          .eq("id", existingMemberId);
        if (updateErr)
          throw new Error(`department_members update: ${updateErr.message}`);
      } else {
        const { error: insertErr } = await admin
          .from("department_members")
          .insert({
            department_id: departmentId,
            full_name: fullName,
            role,
            user_id: uid,
            email,
            phone: phone || null,
            invitation_code: crypto
              .randomUUID()
              .replace(/-/g, "")
              .slice(0, 12)
              .toUpperCase(),
          });
        if (insertErr)
          throw new Error(`department_members insert: ${insertErr.message}`);
      }

      // ---- Create institution_faculty_members for faculty roles ----
      if (isFaculty) {
        const { data: existingIfm } = await admin
          .from("institution_faculty_members")
          .select("id")
          .eq("institution_id", institutionId)
          .eq("institution_type", institutionType)
          .eq("user_id", uid)
          .maybeSingle();

        if (!existingIfm) {
          const { error: ifmErr } = await admin
            .from("institution_faculty_members")
            .insert({
              institution_id: institutionId,
              institution_type: institutionType,
              user_id: uid,
              email,
              full_name: fullName,
              phone: phone || null,
              specific_role: role,
              department_id: departmentId,
            });
          if (ifmErr)
            throw new Error(
              `institution_faculty_members: ${ifmErr.message}`,
            );
        } else {
          // Update department_id on existing IFM row
          await admin
            .from("institution_faculty_members")
            .update({ department_id: departmentId })
            .eq("id", existingIfm.id);
        }
      }

      // ---- Create college_members for college institutions ----
      if (institutionType === "college") {
        const { error: cmErr } = await admin
          .from("college_members")
          .upsert(
            { college_id: institutionId, user_id: uid, role: profileRole },
            { onConflict: "college_id,user_id" } as any,
          );
        if (cmErr)
          throw new Error(`college_members: ${cmErr.message}`);
      }

      // ---- Return success ----
      return json({
        success: true,
        email,
        password,
        user_id: uid,
      });
    } catch (e: any) {
      // Rollback: delete the auth user if anything fails
      try {
        await admin.auth.admin.deleteUser(uid);
      } catch (_) {
        /* ignore */
      }
      return fail("rollback", e?.message || String(e), 500);
    }
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[activate-department-member] UNEXPECTED", {
      message,
      createdUid,
    });
    if (createdUid) {
      try {
        await admin.auth.admin.deleteUser(createdUid);
      } catch (_) {
        /* ignore */
      }
    }
    return fail("rollback", message, 500);
  }
});
