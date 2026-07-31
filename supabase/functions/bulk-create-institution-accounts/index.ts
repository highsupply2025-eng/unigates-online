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
//   - Existing auth users are never looked up or reused. createUser is the only
//     account entry point, and duplicate emails are rejected through the
//     invitation flow before any profile, role, or membership write.
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

// Generic message that does not reveal details about an existing account.
const EXISTING_ACCOUNT_SAFE_ERROR =
  "البريد الإلكتروني مستخدم في حساب قائم ولا يمكن إضافته تلقائيًا. استخدم مسار الدعوة أو تواصل مع الدعم.";

const REJECTION = {
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

async function rollbackNewUser(admin: ReturnType<typeof createClient>, uid: string) {
  const tables = ["department_members", "user_roles", "profiles"] as const;
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", uid);
    if (error) console.error(`[bulk-create-institution-accounts] rollback failed for ${table}: ${error.message}`);
  }
  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) console.error(`[bulk-create-institution-accounts] auth rollback failed: ${error.message}`);
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
    for (const d of depts || []) {
      if (d.status === "active") deptByName.set(String(d.department_name).trim().toLowerCase(), d.id);
    }

    const results: BulkRowResult[] = [];
    let created = 0;

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

      // createUser is intentionally the only auth operation for imported
      // emails. Supabase enforces global email uniqueness, so an existing user
      // is rejected before any application-table write can occur.
      const password = genPassword();
      let newUid: string | null = null;
      try {
        const { data: createdUser, error: ce } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name, seeded_via: "institution_bulk", must_reset_password: true },
        });
        if (ce) {
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
          throw new Error(ce.message || "createUser failed");
        }
        if (!createdUser.user) throw new Error("createUser failed");
        newUid = createdUser.user.id;

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
        if (newUid) await rollbackNewUser(admin, newUid);
        const message = err instanceof Error ? err.message : String(err);
        results.push({ row: i + 2, email, ok: false, error: message });
      }
    }

    const failed = rows.length - created;
    return json({ success: true, total: rows.length, created, failed, results });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ error: message }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
