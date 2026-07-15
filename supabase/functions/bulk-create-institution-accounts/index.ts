// Bulk create institution accounts (students, lecturers, department heads)
// from an Excel upload. Caller must be the institution admin (the email used
// during institution registration). Creates auth users with a shared temporary
// password, profiles, approved user_roles, and department_members linked by user_id.

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

function normRole(v: any): string | null {
  if (!v) return null;
  const k = String(v).trim().toLowerCase();
  if (ROLE_MAP[k]) return ROLE_MAP[k];
  const kk = String(v).trim();
  return ROLE_MAP[kk] || null;
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 8; i++) c += chars[Math.floor(Math.random() * chars.length)];
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
    if (!user?.email) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const institutionType: "college" | "institute" = body.institution_type;
    const institutionId: string = body.institution_id;
    const rows: Row[] = Array.isArray(body.rows) ? body.rows : [];
    if (!institutionType || !institutionId) return json({ error: "Missing institution" }, 400);
    if (rows.length === 0) return json({ error: "Empty file" }, 400);
    if (rows.length > 1000) return json({ error: "Max 1000 rows" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is the approved institution admin
    const table = institutionType === "college" ? "college_registrations" : "institute_registrations";
    const { data: reg } = await admin
      .from(table)
      .select("id, email, status")
      .eq("id", institutionId)
      .maybeSingle();
    if (!reg || reg.email?.toLowerCase() !== user.email.toLowerCase() || reg.status !== "approved") {
      return json({ error: "Forbidden" }, 403);
    }

    // Departments lookup (active only)
    const { data: depts } = await admin
      .from("departments")
      .select("id, department_name, status")
      .eq("institution_id", institutionId)
      .eq("institution_type", institutionType);
    const deptByName = new Map<string, string>();
    for (const d of depts || []) {
      if (d.status === "active") deptByName.set(String(d.department_name).trim().toLowerCase(), d.id);
    }

    // Pre-list users for idempotency
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const byEmail: Record<string, string> = {};
    for (const u of list?.users || []) {
      if (u.email) byEmail[u.email.toLowerCase()] = u.id;
    }

    const password = genPassword();
    const results: any[] = [];

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
      if (role === "lecturer" && !phone) {
        // ok – phone optional for now
      }

      try {
        let uid = byEmail[email] || null;
        if (!uid) {
          const { data: created, error: ce } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, seeded_via: "institution_bulk" },
          });
          if (ce || !created.user) throw new Error(ce?.message || "createUser failed");
          uid = created.user.id;
          byEmail[email] = uid;
        }

        // Upsert profile
        const { error: pe } = await admin.from("profiles").upsert(
          {
            user_id: uid,
            email,
            full_name,
            phone: phone || "+200000000000",
            role,
            platform: "courses",
          },
          { onConflict: "user_id" } as any,
        );
        if (pe) throw new Error(`profile: ${pe.message}`);

        // Approved role
        const { error: ure } = await admin.from("user_roles").upsert(
          { user_id: uid, role: role as any, approved: true },
          { onConflict: "user_id,role" } as any,
        );
        if (ure) throw new Error(`role: ${ure.message}`);

        // Department membership (pre-claimed with user_id)
        const { data: existingMember } = await admin
          .from("department_members")
          .select("id")
          .eq("department_id", deptId)
          .eq("user_id", uid)
          .maybeSingle();
        if (!existingMember) {
          const { error: dme } = await admin.from("department_members").insert({
            department_id: deptId,
            full_name,
            role,
            invitation_code: genCode(),
            user_id: uid,
          });
          if (dme) throw new Error(`member: ${dme.message}`);
        }

        results.push({ row: i + 2, email, ok: true, role });
      } catch (err: any) {
        results.push({ row: i + 2, email, ok: false, error: err?.message || String(err) });
      }
    }

    const ok = results.filter((r) => r.ok).length;
    return json({ success: true, total: rows.length, created: ok, failed: rows.length - ok, password, results });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
