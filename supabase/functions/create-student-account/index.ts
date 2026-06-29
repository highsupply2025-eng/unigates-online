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
  return `Tmp${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 9000 + 1000)}`;
}
function genCode(suffix: string) {
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `STU-${Date.now().toString(36).toUpperCase()}-${r}-${suffix}`;
}
function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    const extra = body.extra || {};

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

    // Find or create user
    let uid: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = (list?.users || []).find((u: any) => u.email?.toLowerCase() === email);
    if (existing) {
      uid = existing.id;
      // reset password so admin can hand over fresh credentials
      await admin.auth.admin.updateUserById(uid, { password, email_confirm: true });
    } else {
      const { data: created, error: ce } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, seeded_via: "college_admin" },
      });
      if (ce || !created.user) return json({ error: ce?.message || "createUser failed" }, 500);
      uid = created.user.id;
    }

    // Upsert profile
    const { error: pe } = await admin.from("profiles").upsert(
      {
        user_id: uid,
        email,
        full_name: fullName,
        phone: phone || "+200000000000",
        role: "student",
        platform: "courses",
      },
      { onConflict: "user_id" } as any,
    );
    if (pe) return json({ error: `profile: ${pe.message}` }, 500);

    // Approved role
    await admin.from("user_roles").upsert(
      { user_id: uid, role: "student" as any, approved: true },
      { onConflict: "user_id,role" } as any,
    );

    // Department members (one per dept code, pre-claimed with user_id)
    let joined = 0;
    for (const d of allowedDepts) {
      const { data: existingMember } = await admin
        .from("department_members")
        .select("id")
        .eq("department_id", d.id)
        .eq("user_id", uid)
        .maybeSingle();
      if (existingMember) {
        await admin.from("department_members").update({
          full_name: fullName,
          email,
          phone: phone || null,
          ...extra,
        }).eq("id", existingMember.id);
      } else {
        await admin.from("department_members").insert({
          department_id: d.id,
          full_name: fullName,
          role: "student",
          invitation_code: genCode(d.department_code),
          user_id: uid,
          email,
          phone: phone || null,
          ...extra,
        });
      }
      // College membership (mirrors bulk function)
      if (d.institution_type === "college") {
        await admin.from("college_members").upsert(
          { user_id: uid, college_id: d.institution_id, role: "student" },
          { onConflict: "user_id,college_id" } as any,
        );
      }
      joined++;
    }

    const missing = codes.filter(c => !allowedDepts.some((d: any) => (d.department_code || "").toUpperCase() === c));
    return json({ success: true, email, password, user_id: uid, joined, missing });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
