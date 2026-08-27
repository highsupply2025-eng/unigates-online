// Create a course/lecture bypassing RLS via service_role.
// Used as fallback when the frontend's direct insert is blocked by
// RLS policies.
// Strictly enforces tenant isolation: ensures the caller has valid faculty/leadership
// rights in the specific target department's institution.

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

    // 1. Fetch Target Department & its Institution
    let dept = (await admin.from("departments").select("id, institution_id, institution_type, status").eq("id", department_id).maybeSingle()).data;
    if (!dept) {
      dept = (await admin.from("academic_departments").select("id, institution_id, institution_type, status").eq("id", department_id).maybeSingle()).data;
    }
    if (!dept) return fail("department", "Department not found", 404);

    // 2. Fetch User Profile
    const { data: profile } = await admin.from("profiles").select("role, full_name").eq("user_id", user.id).maybeSingle();
    const isGlobalAdmin = profile?.role === "admin";

    // 3. Fetch User's Faculty Record STRICTLY in the TARGET Department's Institution (Tenant Isolation)
    const { data: ifmInTargetInst } = await admin
      .from("institution_faculty_members")
      .select("id, full_name, email, phone, specific_role, institution_id, institution_type, department_id")
      .eq("user_id", user.id)
      .eq("institution_id", dept.institution_id)
      .eq("institution_type", dept.institution_type)
      .maybeSingle();

    const isFacultyRole = profile && ["department_head", "teaching_assistant", "vice_dean", "dean", "lecturer", "professor", "doctor", "assistant_lecturer"].includes(profile.role);
    const isIfmRole = ifmInTargetInst && ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "vice_dean_environment", "department_head", "teaching_assistant", "professor", "doctor", "lecturer", "assistant_lecturer", "admin", "institution_admin"].includes(ifmInTargetInst.specific_role);

    if (!isGlobalAdmin && !isFacultyRole && !isIfmRole) {
      return fail("permission", "Only faculty/leadership can create courses", 403);
    }

    // 4. Verify Membership / Authorization within the target department & institution
    // A. Direct Department Member in department_members table
    const { data: dmMember } = await admin
      .from("department_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("department_id", department_id)
      .maybeSingle();

    // B. Direct IFM Member explicitly assigned to this department
    const isDirectIfmMember = !!(ifmInTargetInst && ifmInTargetInst.department_id === department_id);
    const isDirectMember = !!(dmMember || isDirectIfmMember);

    // C. Department Head check
    const { data: deptHeadCheck } = await admin
      .from("academic_departments")
      .select("id")
      .eq("id", department_id)
      .eq("head_id", user.id)
      .maybeSingle();
    const isDeptHead = !!deptHeadCheck;

    // D. Institution Oversight (Dean / Vice Dean / Institution Admin of this specific institution)
    const isOversight = !!(
      ifmInTargetInst &&
      ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "vice_dean_environment", "admin", "institution_admin", "college_admin", "institute_admin"].includes(ifmInTargetInst.specific_role || "")
    );

    // E. Tenant-scoped self-heal fallback:
    // ONLY IF the user is an active faculty member of the SAME institution (ifmInTargetInst),
    // and not from another tenant, we can safely link them into department_members.
    let isFallbackMember = false;
    if (!isGlobalAdmin && !isDirectMember && !isDeptHead && !isOversight) {
      if (ifmInTargetInst && ifmInTargetInst.institution_id === dept.institution_id && ifmInTargetInst.institution_type === dept.institution_type) {
        const vInvCode = 'FAC-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await admin.from("department_members").upsert({
          department_id,
          user_id: user.id,
          full_name: ifmInTargetInst.full_name || profile?.full_name || "Faculty Member",
          role: ifmInTargetInst.specific_role || profile?.role || "lecturer",
          email: ifmInTargetInst.email || user.email || "",
          phone: ifmInTargetInst.phone || "",
          invitation_code: vInvCode,
        }, { onConflict: "department_id,user_id" } as any);
        isFallbackMember = true;
      }
    }

    if (!isGlobalAdmin && !isDirectMember && !isDeptHead && !isOversight && !isFallbackMember) {
      return fail("membership", "You are not authorized to create courses in this department", 403, {
        department_id,
        institution_id: dept.institution_id
      });
    }

    // 5. Determine Lecturer Display Name
    const lecturerName = profile?.full_name || ifmInTargetInst?.full_name || "Lecturer";

    // 6. Insert Course
    const { data: inserted, error: insErr } = await admin.from("courses").insert({
      title_ar,
      title_en,
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
