// Bulk create institution accounts (students, lecturers, department heads)
// from an Excel upload. Caller must be the approved admin of the institution,
// resolved server-side from the caller's JWT and verified via the
// is_institution_admin helper.
//
// Security model:
//   - Caller-supplied institution_id/role/department are never trusted as the
//     authority. The caller's institution is derived from their JWT, and every
//     department is resolved within that institution only.
//   - New emails => new auth users with a unique temporary password, profiles,
//     approved user_roles, and department_members linked by user_id.
//   - Emails that already exist are NEVER mutated. They are reported as already
//     a member of this institution, or rejected (email belongs to another
//     institution, protected/global account, or existing account that must be
//     onboarded through the invitation flow).
//   - No passwords are written to logs or included in error messages.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Row = {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department_name?: string;
};

type BulkRowResult = {
  row: number;
  email: string;
  ok: boolean;
  password?: string;
  role?: string;
  code?: string;
  already?: boolean;
  error?: string;
};

const ROLE_MAP: Record<string, string> = {
  student: "student",
  طالب: "student",
  lecturer: "lecturer",
  محاضر: "lecturer",
  department_head: "department_head",
  head: "department_head",
  "رئيس قسم": "department_head",
  "رئيس القسم": "department_head",
};

// Platform/global roles that must never be claimed by an institution import.
const PROTECTED_ROLES = new Set<string>([
  "admin",
  "personal",
  "publisher",
  "seller",
  "school",
  "school_admin",
  "school_student",
  "parent",
  "teacher",
  "training_center",
  "language_center",
]);

// Generic, safe user-facing message for every existing-account rejection.
// It does not reveal whether the account belongs to another institution, is a
// protected account, or requires the invitation flow.
const EXISTING_ACCOUNT_SAFE_ERROR =
  "البريد الإلكتروني مستخدم في حساب قائم ولا يمكن إضافته تلقائيًا. استخدم مسار الدعوة أو تواصل مع الدعم.";

const REJECTION = {
  alreadyMember: "ALREADY_MEMBER",
  anotherInstitution: "EMAIL_BELONGS_TO_ANOTHER_INSTITUTION",
  protectedAccount: "PROTECTED_ACCOUNT",
  requiresInvitation: "EXISTING_ACCOUNT_REQUIRES_INVITATION",
} as const;

function normRole(v: unknown): string | null {
  if (!v) return null;
  const k = String(v).trim().toLowerCase();
  if (ROLE_MAP[k]) return ROLE_MAP[k];
  const kk = String(v).trim();
  return ROLE_MAP[kk] || null;
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const buf = new Uint32Array(8);
  crypto.getRandomValues(buf);
  let c = "";
  for (let i = 0; i < 8; i++) c += chars[buf[i] % chars.length];
  return c;
}

// Cryptographically strong per-user temporary password.
// 16 chars from a URL-safe alphabet, guaranteed to include letters + digits.
function genPassword() {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const all = alpha + digits + "!@#$%^&*";
  const buf = new Uint32Array(16);
  crypto.getRandomValues(buf);
  let out = "";
  for (let i = 0; i < 16; i++) out += all[buf[i] % all.length];
  // Ensure at least one digit + one letter
  const d = new Uint32Array(2);
  crypto.getRandomValues(d);
  out = alpha[d[0] % alpha.length] + digits[d[1] % digits.length] + out.slice(2);
  return out;
}

function isEmailAlreadyExistsError(error: { code?: unknown; message?: unknown }) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return (
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("user already") ||
    message.includes("email is already") ||
    message.includes("email already")
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.id) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const institutionType: string = body.institution_type;
    const institutionId: string = body.institution_id;
    const rows: Row[] = Array.isArray(body.rows) ? body.rows : [];
    if (!institutionType || !institutionId) return json({ error: "Missing institution" }, 400);
    if (institutionType !== "college" && institutionType !== "institute") {
      return json({ error: "Invalid institution type" }, 400);
    }
    if (rows.length === 0) return json({ error: "Empty file" }, 400);
    if (rows.length > 1000) return json({ error: "Max 1000 rows" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is the approved admin of this institution.
    // The institution id supplied by the caller is only trusted AFTER the
    // caller's identity (from the JWT) is confirmed against it.
    const { data: isAdmin } = await admin.rpc("is_institution_admin", {
      _user_id: user.id,
      _institution_id: institutionId,
      _institution_type: institutionType,
    });
    if (isAdmin !== true) return json({ error: "Forbidden" }, 403);

    // Departments lookup scoped to the caller's institution (active only).
    const { data: depts } = await admin
      .from("departments")
      .select("id, department_name, status")
      .eq("institution_id", institutionId)
      .eq("institution_type", institutionType);
    const deptByName = new Map<string, string>();
    const callerDeptIds = new Set<string>();
    for (const d of depts || []) {
      callerDeptIds.add(d.id);
      if (d.status === "active") deptByName.set(String(d.department_name).trim().toLowerCase(), d.id);
    }

    // Pre-list users for idempotency.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byEmail: Record<string, string> = {};
    for (const u of list?.users || []) {
      if (u.email) byEmail[u.email.toLowerCase()] = u.id;
    }

    // Pre-fetch existing accounts' institution affiliations, roles and
    // department memberships (batched) so existing users are classified
    // without mutating anything and without N+1 queries.
    const existingIds = Array.from(
      new Set(
        rows
          .map((r) => {
            const e = String(r?.email || "").trim().toLowerCase();
            return e ? byEmail[e] || null : null;
          })
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const facultyByUid = new Map<string, { institution_id: string; institution_type: string }>();
    const collegeIdsByUid = new Map<string, Set<string>>();
    const deptMembersByUid = new Map<string, Set<string>>();
    const profileRoleByUid = new Map<string, string>();
    const rolesByUid = new Map<string, Set<string>>();
    for (const batch of chunk(existingIds, 100)) {
      const { data: fac } = await admin
        .from("institution_faculty_members")
        .select("user_id, institution_id, institution_type")
        .in("user_id", batch);
      for (const f of fac || []) {
        if (f.user_id && f.institution_id) {
          facultyByUid.set(f.user_id, { institution_id: f.institution_id, institution_type: f.institution_type });
        }
      }

      const { data: cols } = await admin
        .from("college_members")
        .select("user_id, college_id")
        .in("user_id", batch);
      for (const c of cols || []) {
        if (!c.user_id || !c.college_id) continue;
        if (!collegeIdsByUid.has(c.user_id)) collegeIdsByUid.set(c.user_id, new Set());
        collegeIdsByUid.get(c.user_id)!.add(c.college_id);
      }

      const { data: dms } = await admin
        .from("department_members")
        .select("user_id, department_id")
        .in("user_id", batch);
      for (const dm of dms || []) {
        if (!dm.user_id || !dm.department_id) continue;
        if (!deptMembersByUid.has(dm.user_id)) deptMembersByUid.set(dm.user_id, new Set());
        deptMembersByUid.get(dm.user_id)!.add(dm.department_id);
      }

      const { data: profs } = await admin
        .from("profiles")
        .select("user_id, role")
        .in("user_id", batch);
      for (const p of profs || []) {
        if (p.user_id) profileRoleByUid.set(p.user_id, String(p.role || "").toLowerCase());
      }

      const { data: urs } = await admin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", batch);
      for (const u of urs || []) {
        if (!u.user_id || !u.role) continue;
        if (!rolesByUid.has(u.user_id)) rolesByUid.set(u.user_id, new Set());
        rolesByUid.get(u.user_id)!.add(String(u.role).toLowerCase());
      }
    }

    const results: BulkRowResult[] = [];
    let created = 0;
    let already = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const full_name = String(r.full_name || "").trim();
      const email = String(r.email || "").trim().toLowerCase();
      const phone = String(r.phone || "").trim();
      const role = normRole(r.role);
      const deptKey = String(r.department_name || "").trim().toLowerCase();
      const deptId = deptByName.get(deptKey);

      if (!full_name || !email || !role) {
        results.push({ row: i + 2, email, ok: false, error: "بيانات ناقصة (الاسم/الإيميل/الدور)" });
        continue;
      }
      if (!deptId) {
        results.push({ row: i + 2, email, ok: false, error: `القسم غير موجود أو غير معتمد: ${r.department_name || ""}` });
        continue;
      }

      const uid = byEmail[email] || null;

      // ── New account: create auth user + profile + role + membership ──
      if (!uid) {
        const password = genPassword();
        try {
          const { data: createdUser, error: ce } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, seeded_via: "institution_bulk", must_reset_password: true },
          });
          if (ce) {
            // Race with another creation (or user list > 1000): never mutate,
            // report the existing account through the invitation flow instead.
            if (isEmailAlreadyExistsError(ce)) {
              results.push({
                row: i + 2,
                email,
                ok: false,
                code: REJECTION.requiresInvitation,
                error: EXISTING_ACCOUNT_SAFE_ERROR,
              });
              continue;
            }
            throw new Error(ce?.message || "createUser failed");
          }
          if (!createdUser.user) throw new Error("createUser failed");
          const newUid = createdUser.user.id;
          byEmail[email] = newUid;

          const { error: pe } = await admin.from("profiles").upsert(
            {
              user_id: newUid,
              email,
              full_name,
              phone: phone || null,
              role,
              platform: "courses",
              must_change_password: true,
            },
            { onConflict: "user_id" },
          );
          if (pe) throw new Error(`profile: ${pe.message}`);

          const { error: ure } = await admin.from("user_roles").upsert(
            {
              user_id: newUid,
              role: role as "student" | "lecturer" | "department_head",
              approved: true,
            },
            { onConflict: "user_id,role" },
          );
          if (ure) throw new Error(`role: ${ure.message}`);

          // Department membership (pre-claimed with user_id). Idempotent so a
          // retry of the same row can never create a duplicate membership.
          const { error: dme } = await admin.from("department_members").insert(
            {
              department_id: deptId,
              full_name,
              role,
              invitation_code: genCode(),
              user_id: newUid,
            },
            { onConflict: "department_id,user_id", ignoreDuplicates: true },
          );
          if (dme) throw new Error(`member: ${dme.message}`);

          created++;
          results.push({ row: i + 2, email, ok: true, role, password });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          results.push({ row: i + 2, email, ok: false, error: message });
        }
        continue;
      }

      // ── Existing account: classify WITHOUT mutating anything. ──
      // No profile/user_roles/department_members writes may happen past this
      // point: existing accounts keep their identity, password and roles.
      const faculty = facultyByUid.get(uid);
      const collegeIds = collegeIdsByUid.get(uid);
      const deptIds = deptMembersByUid.get(uid);
      const isSameInstitution =
        (faculty &&
          faculty.institution_id === institutionId &&
          faculty.institution_type === institutionType) ||
        (institutionType === "college" && Boolean(collegeIds?.has(institutionId))) ||
        (Boolean(deptIds) && Array.from(deptIds!).some((d) => callerDeptIds.has(d)));

      if (isSameInstitution) {
        // Idempotent re-upload of the same file: the account already belongs
        // to this institution, so nothing is created or modified.
        already++;
        results.push({ row: i + 2, email, ok: true, code: REJECTION.alreadyMember, already: true });
        continue;
      }

      const belongsToAnother = Boolean(faculty) || (Boolean(collegeIds) && collegeIds!.size > 0);
      if (belongsToAnother) {
        results.push({
          row: i + 2,
          email,
          ok: false,
          code: REJECTION.anotherInstitution,
          error: EXISTING_ACCOUNT_SAFE_ERROR,
        });
        continue;
      }

      const profileRole = profileRoleByUid.get(uid) || "";
      const roles = rolesByUid.get(uid);
      const hasProtectedRole =
        PROTECTED_ROLES.has(profileRole) ||
        (Boolean(roles) && Array.from(roles!).some((roleName) => PROTECTED_ROLES.has(roleName)));
      if (hasProtectedRole) {
        results.push({
          row: i + 2,
          email,
          ok: false,
          code: REJECTION.protectedAccount,
          error: EXISTING_ACCOUNT_SAFE_ERROR,
        });
        continue;
      }

      results.push({
        row: i + 2,
        email,
        ok: false,
        code: REJECTION.requiresInvitation,
        error: EXISTING_ACCOUNT_SAFE_ERROR,
      });
    }

    const failed = rows.length - created - already;
    return json({ success: true, total: rows.length, created, already, failed, results });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: message }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
