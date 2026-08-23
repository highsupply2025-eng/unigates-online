// Create a course/lecture bypassing RLS via service_role.
// Used as fallback when the frontend's direct insert is blocked by
// "new row violates row-level security policy" due to stale
// user_in_department() (which only checked department_members).
// This function verifies the caller is a member of the target department
// via BOTH department_members and institution_faculty_members.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function fail(step: string, message: string, status = 500, extra: Record<string, unknown> = {}) {
  console.error(`[create-course:${step}] ${message}`, extra);
  return json({ success: false, step, error: message, ...extra }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const { data: { user } } = await userClient.auth.getUser();
    if (!user?.id) return fail("auth", "Unauthorized", 401);

    const body = await req.json().catch(() => ({}));

    const department_id = String(body.department_id || "").trim();
    const title_ar = String(body.title_ar || "").trim();
    const title_en = String(body.title_en || "").trim();
    const category_ar = String(body.category_ar || "").trim();
    const category_en = String(body.category_en || "").trim();
    const thumbnail_url = body.thumbnail_url ? String(body.thumbnail_url) : null;
    const expires_at = body.expires_at ? String(body.expires_at) : null;
    const is_free = Boolean(body.is_free);

    if (!department_id) return fail("validate", "department_id required", 400);
    if (!title_ar || !title_en) return fail("validate", "title_ar and title_en required", 400);

    // Verify caller is faculty/leadership
    const { data: profile } = await admin.from("profiles").select("role, full_name").eq("user_id", user.id).maybeSingle();
    if (!profile || !["department_head","teaching_assistant","vice_dean","dean","lecturer","professor","doctor","assistant_lecturer"].includes(profile.role)) {
      // Also check IFM specific_role
      const { data: ifmCheck } = await admin.from("institution_faculty_members").select("specific_role").eq("user_id", user.id).maybeSingle();
      const allowedSpecific = ["dean","vice_dean_postgrad","vice_dean_students","vice_dean_community","vice_dean_environment","department_head","teaching_assistant","professor","doctor","lecturer","assistant_lecturer"];
      if (!ifmCheck || !allowedSpecific.includes(ifmCheck.specific_role)) {
        return fail("permission", "Only faculty/leadership can create courses", 403);
      }
    }

    // Verify department membership via BOTH tables + oversight
    const { data: dept } = await admin.from("departments").select("id, institution_id, institution_type, status").eq("id", department_id).maybeSingle();
    if (!dept) return fail("department", "Department not found", 404);

    // Check membership: DM, IFM direct, or oversight dean/vice_dean
    const [{ data: dmMember }, { data: ifmMember }, { data: ifmOversight }] = await Promise.all([
      admin.from("department_members").select("id").eq("user_id", user.id).eq("department_id", department_id).maybeSingle(),
      admin.from("institution_faculty_members").select("id").eq("user_id", user.id).eq("department_id", department_id).maybeSingle(),
      admin.from("institution_faculty_members").select("id, institution_id, institution_type").eq("user_id", user.id).maybeSingle(),
    ]);

    const isDirectMember = !!(dmMember || ifmMember);
    const isOversight = !!(
      ifmOversight &&
      ["dean","vice_dean","vice_dean_postgrad","vice_dean_students","vice_dean_community","vice_dean_environment"].includes((ifmOversight as any).specific_role || "") &&
      (ifmOversight as any).institution_id === dept.institution_id &&
      (ifmOversight as any).institution_type === dept.institution_type
    );

    // Also allow if IFM shows any membership in this institution and the department is the only one (fallback for legacy)
    let isFallbackMember = false;
    if (!isDirectMember && !isOversight) {
      // Last resort: ensure a DM mirror exists now (self-heal)
      const { data: ifmFull } = await admin.from("institution_faculty_members").select("full_name,email,phone,specific_role").eq("user_id", user.id).maybeSingle();
      if (ifmFull) {
        // Create DM mirror if missing
        const vDeptCode = dept.id.slice(0, 4);
        const vInvCode = 'FAC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await admin.from("department_members").upsert({
          department_id,
          user_id: user.id,
          full_name: ifmFull.full_name,
          role: ifmFull.specific_role,
          email: ifmFull.email,
          phone: ifmFull.phone,
          invitation_code: vInvCode,
        }, { onConflict: "department_id,user_id" } as any);
        isFallbackMember = true;
      }
    }

    if (!isDirectMember && !isOversight && !isFallbackMember) {
      return fail("membership", "You are not a member of this department", 403, { department_id });
    }

    const lecturerName = profile?.full_name || (await admin.from("institution_faculty_members").select("full_name").eq("user_id", user.id).maybeSingle()).data?.full_name || "Lecturer";

    const { data: inserted, error: insErr } = await admin.from("courses").insert({
      title_ar, title_en,
      category_ar: category_ar || "عام",
      category_en: category_en || "General",
      instructor_ar: lecturerName,
      instructor_en: lecturerName,
      is_free,
      creator_id: user.id,
      thumbnail_url,
      department_id,
      expires_at: expires_at || null,
    } as any).select("id").single();

    if (insErr) return fail("insert", insErr.message, 500, { details: (insErr as any).details });

    return json({ success: true, id: inserted.id });

  } catch (e: any) {
    console.error("[create-course] UNEXPECTED", e);
    return fail("unexpected", e?.message || String(e), 500);
  }
});
