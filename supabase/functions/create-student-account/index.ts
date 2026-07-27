// Create a student account instantly from the college admin dashboard or via invitation link.
//
// Admin mode (no invitation_code): caller must be the institution admin.
//   Creates auth user with an auto-generated temporary password.
//
// Invitation mode (invitation_code present): public endpoint, no auth required.
//   Uses the user-provided password and resolves the institution from the token.
//
// In both modes, creates profile + approved user_role + department_members rows
// for each matching department code, plus college_members if applicable.

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
function fail(step: string, message: string, status = 500, extra: Record<string, unknown> = {}) {
  console.error(`[create-student-account:${step}] ${message}`);
  return json({ success: false, step, error: message, ...extra }, status);
}

function isEmailAlreadyExistsError(error: any) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return code === "email_exists" || message.includes("already registered") || message.includes("already exists") || message.includes("user already") || message.includes("email is already") || message.includes("email already");
}

function validatePassword(pw: string): { ok: boolean; reason?: string } {
  if (!pw || typeof pw !== "string") return { ok: false, reason: "Password is required" };
  if (pw !== pw.trim()) return { ok: false, reason: "Password must not have leading/trailing spaces" };
  if (pw.length < 8) return { ok: false, reason: "Password must be at least 8 characters" };
  if (!/[A-Z]/.test(pw)) return { ok: false, reason: "Password must contain an uppercase letter" };
  if (!/[a-z]/.test(pw)) return { ok: false, reason: "Password must contain a lowercase letter" };
  if (!/\d/.test(pw)) return { ok: false, reason: "Password must contain a digit" };
  if (/\s/.test(pw)) return { ok: false, reason: "Password must not contain spaces" };
  return { ok: true };
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

    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || "").trim();
    let email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const codes: string[] = Array.from(new Set((body.department_codes || []).map((c: string) => String(c).trim().toUpperCase()).filter(Boolean)));
    const invitationCode = String(body.invitation_code || "").trim();
    const temporaryPassword = String(body.temporary_password || "").trim();

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

    let institutionId: string;
    let institutionType: "college" | "institute";

    // ---- Two code paths ----
    if (invitationCode) {
      // Invitation mode: resolve institution from token (no caller auth required)
      const { data: invRows, error: invErr } = await admin.rpc(
        "verify_institution_invitation" as any,
        { _code: invitationCode }
      );
      if (invErr) return fail("verify_invitation", invErr.message, 500);
      const inv = invRows?.[0];
      if (!inv || !inv.is_valid) {
        return fail("verify_invitation", "Invalid, expired, or already used invitation", 400);
      }

      const role = (inv.role || "").toLowerCase();
      if (role !== "student") {
        return fail("verify_invitation", "This invitation is not for students", 400);
      }

      institutionId = inv.institution_id;
      institutionType = inv.kind === "college" ? "college" : "institute";

      // Use the user-provided password
      const pwCheck = validatePassword(temporaryPassword);
      if (!pwCheck.ok) {
        return fail("password", pwCheck.reason || "Invalid password", 400);
      }
    } else {
      // Admin mode: caller must be institution admin
      const authHeader = req.headers.get("Authorization") || "";
      const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user?.email) return json({ error: "Unauthorized" }, 401);

      const callerEmail = user.email.toLowerCase();
      const { data: colleges } = await admin
        .from("college_registrations")
        .select("id, email, status")
        .eq("email", callerEmail)
        .eq("status", "approved");
      const { data: institutes } = await admin
        .from("institute_registrations")
        .select("id, email, status")
        .eq("email", callerEmail)
        .eq("status", "approved");

      const ownedColleges = (colleges || []).map((r: any) => ({ id: r.id, type: "college" as const }));
      const ownedInstitutes = (institutes || []).map((r: any) => ({ id: r.id, type: "institute" as const }));
      const owned = [...ownedColleges, ...ownedInstitutes];

      if (owned.length === 0) {
        return json({ error: "No approved institution found for this admin" }, 403);
      }

      // Use the first owned institution (student accounts are institution-scoped)
      institutionId = owned[0].id;
      institutionType = owned[0].type;
    }

    // Resolve departments by code and verify they belong to the institution
    const { data: depts, error: deptErr } = await admin
      .from("departments")
      .select("id, department_code, institution_id, institution_type")
      .in("department_code", codes);
    if (deptErr) return fail("resolve_depts", deptErr.message, 500);
    if (!depts || depts.length === 0) return fail("resolve_depts", "No matching departments found", 404);

    const allowedDepts = depts.filter((d: any) => d.institution_id === institutionId);
    if (allowedDepts.length === 0) {
      return fail("resolve_depts", "Departments do not belong to the invited institution", 403);
    }

    // Synthesize email if not provided
    if (!email) {
      const slug = fullName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "").slice(0, 20) || "student";
      email = `${slug}.${Date.now().toString(36)}@unigates.online`;
    }

    const password = invitationCode ? temporaryPassword : genPassword();

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
        user_metadata: {
          full_name: fullName,
          seeded_via: invitationCode ? "student_invitation" : "college_admin",
          must_change_password: invitationCode ? false : true,
        },
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

      // Mark invitation as used
      if (invitationCode) {
        const invTable = institutionType === "college" ? "college_invitations" : "institute_invitations";
        const idColumn = institutionType === "college" ? "college_id" : "institute_id";

        // Read current counts
        const { data: invRow } = await admin
          .from(invTable as any)
          .select("id, used_count, max_uses")
          .eq("invitation_code", invitationCode)
          .single();

        if (invRow) {
          const newUsedCount = (invRow.used_count || 0) + 1;
          const maxUses = invRow.max_uses || 0;
          await admin
            .from(invTable as any)
            .update({
              used_count: newUsedCount,
              ...(maxUses > 0 && newUsedCount >= maxUses ? { is_active: false } : {}),
            } as any)
            .eq("id", invRow.id);
        }
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
