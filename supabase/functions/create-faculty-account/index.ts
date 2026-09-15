// Create a faculty member (non-student) auth account instantly.
// v3: accepts department_ids (array). The first ID becomes the primary
// department on institution_faculty_members; every valid ID gets a
// department_members junction row so the member appears in each department.
// v2: department is OPTIONAL at creation. Faculty are stored at the
// institution level in `institution_faculty_members`. A department can be
// assigned later via the edit page.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
  console.error("CREATE FACULTY ACCOUNT FAILED", { step, message, ...extra });
  return json({ success: false, step, error: message, ...extra }, status);
}

const ALLOWED_ROLES = new Set([
  "dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community", "vice_dean_environment",
  "department_head", "teacher", "teaching_assistant", "professor", "doctor", "lecturer", "assistant_lecturer",
  "college_secretary", "library_manager",
]);

function mapGeneralRole(specific: string): { profileRole: string; appRole: string } {
  switch (specific) {
    case "dean":
      return { profileRole: "dean", appRole: "dean" };
    case "vice_dean":
    case "vice_dean_postgrad":
    case "vice_dean_students":
    case "vice_dean_community":
    case "vice_dean_environment":
      return { profileRole: "vice_dean", appRole: "vice_dean" };
    case "teaching_assistant":
      return { profileRole: "lecturer", appRole: "lecturer" };
    case "department_head":
      return { profileRole: "department_head", appRole: "department_head" };
    case "teacher":
      return { profileRole: "teacher", appRole: "teacher" };
    case "college_secretary":
      return { profileRole: "vice_dean", appRole: "vice_dean" };
    case "library_manager":
      return { profileRole: "lecturer", appRole: "lecturer" };
    case "professor":
    case "doctor":
    case "lecturer":
    case "assistant_lecturer":
    default:
      return { profileRole: "lecturer", appRole: "lecturer" };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMPORTED_PHOTO_BYTES = 1_500_000;
const IMPORTED_PHOTO_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

function readImportedPhotoDimensions(
  bytes: Uint8Array,
  contentType: keyof typeof IMPORTED_PHOTO_TYPES,
): { width: number; height: number } | null {
  if (contentType === "image/png") {
    if (bytes.length < 24) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = bytes[offset + 1];
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segmentLength < 2 || offset + segmentLength + 2 > bytes.length) return null;
    if (
      marker === 0xc0 || marker === 0xc1 || marker === 0xc2 || marker === 0xc3
      || marker === 0xc5 || marker === 0xc6 || marker === 0xc7
      || marker === 0xc9 || marker === 0xca || marker === 0xcb
      || marker === 0xcd || marker === 0xce || marker === 0xcf
    ) {
      return {
        height: (bytes[offset + 5] << 8) | bytes[offset + 6],
        width: (bytes[offset + 7] << 8) | bytes[offset + 8],
      };
    }
    offset += segmentLength + 2;
  }
  return null;
}

function decodeImportedPhoto(value: unknown): {
  bytes: Uint8Array;
  contentType: keyof typeof IMPORTED_PHOTO_TYPES;
  extension: string;
} | null {
  if (value == null) return null;
  if (!value || typeof value !== "object") throw new Error("Invalid faculty photo payload");

  const payload = value as Record<string, unknown>;
  const contentType = String(payload.content_type || "") as keyof typeof IMPORTED_PHOTO_TYPES;
  const encoded = String(payload.data_base64 || "");
  const extension = IMPORTED_PHOTO_TYPES[contentType];
  if (!extension || !encoded || encoded.length > MAX_IMPORTED_PHOTO_BYTES * 2) {
    throw new Error("Faculty photo must be a JPG or PNG no larger than 1.5MB");
  }

  let bytes: Uint8Array;
  try {
    const decoded = atob(encoded);
    bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    throw new Error("Invalid faculty photo encoding");
  }
  if (!bytes.length || bytes.length > MAX_IMPORTED_PHOTO_BYTES) {
    throw new Error("Faculty photo must be a JPG or PNG no larger than 1.5MB");
  }

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if ((contentType === "image/jpeg" && !isJpeg) || (contentType === "image/png" && !isPng)) {
    throw new Error("Faculty photo content does not match its file type");
  }
  const dimensions = readImportedPhotoDimensions(bytes, contentType);
  if (!dimensions || dimensions.width !== 400 || dimensions.height !== 600) {
    throw new Error("Faculty photo must be resized to 400x600 pixels");
  }

  return { bytes, contentType, extension };
}

async function findAuthUserByEmail(admin: any, email: string): Promise<any | null> {
  const target = email.trim().toLowerCase();
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1, filter: `email.eq.${target}` } as any);
    const hit = (data?.users || []).find((u: any) => u.email?.toLowerCase() === target);
    if (hit) return hit;
  } catch (_) { /* fallthrough */ }

  const perPage = 1000;
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const hit = users.find((u: any) => u.email?.toLowerCase() === target);
    if (hit) return hit;
    if (users.length < perPage) return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  let createdUid: string | null = null;
  let uploadedPhotoPath: string | null = null;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rollbackCreatedUser = async (uid: string) => {
    if (uploadedPhotoPath) {
      const { error } = await admin.storage.from("avatars").remove([uploadedPhotoPath]);
      if (error) {
        console.error("rollback: failed to remove faculty photo", { message: error.message });
      } else {
        uploadedPhotoPath = null;
      }
    }
    try {
      const { error } = await admin.auth.admin.deleteUser(uid);
      if (error) console.error("rollback: failed to delete auth user", { message: error.message });
    } catch (error) {
      console.error("rollback: failed to delete auth user", error);
    }
  };

  try {
    // ---- Payload ----
    const body = await req.json().catch(() => ({}));

    const invitationCode = String(body.invitation_code || "").trim();
    let institutionId: string | null = null;
    let institutionType: "college" | "institute" | null = null;

    if (invitationCode) {
      // ---- Invitation mode: resolve institution from invitation token ----
      const { data: invRows } = await admin.rpc("verify_institution_invitation" as any, { _code: invitationCode });
      const inv = invRows?.[0];
      if (!inv || !inv.is_valid) {
        return fail("invitation_invalid", "Invalid or expired invitation code", 403);
      }
      institutionId = inv.institution_id;
      institutionType = inv.kind === "college" ? "college" : "institute";
    } else {
      // ---- Admin mode: caller auth required ----
      const authHeader = req.headers.get("Authorization") || "";
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user?.email) return fail("caller_auth", "Unauthorized", 401);
      const callerEmail = user.email.toLowerCase();

      const { data: college } = await admin.from("college_registrations")
        .select("id, email, status").eq("email", callerEmail).eq("status", "approved").maybeSingle();
      if (college) { institutionId = college.id; institutionType = "college"; }
      else {
        const { data: inst } = await admin.from("institute_registrations")
          .select("id, email, status").eq("email", callerEmail).eq("status", "approved").maybeSingle();
        if (inst) { institutionId = inst.id; institutionType = "institute"; }
      }
      if (!institutionId || !institutionType) {
        return fail("caller_permission", "Caller is not an approved institution admin", 403);
      }
    }
    const fullName = String(body.full_name || "").trim();
    const role = String(body.role || "").trim();
    let email = String(body.email || "").trim().toLowerCase();
    const phoneRaw = String(body.phone || "").trim();
    const phone = phoneRaw.length > 0 ? phoneRaw : null;
    const requestedDeptIds: string[] = Array.from(
      new Set(
        ((Array.isArray(body.department_ids) ? body.department_ids : [body.department_id]) as unknown[])
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim()),
      ),
    );

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
    let importedPhoto: ReturnType<typeof decodeImportedPhoto>;
    try {
      importedPhoto = decodeImportedPhoto(body.photo);
    } catch (error) {
      return fail("validate_photo", error instanceof Error ? error.message : "Invalid faculty photo", 400);
    }

    if (!fullName) return fail("validate", "Missing full_name", 400);
    if (!ALLOWED_ROLES.has(role)) return fail("validate", `Invalid role: ${role}`, 400);

    if (!email) {
      const slug = fullName.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "").slice(0, 20) || "faculty";
      email = `${slug}.${Date.now().toString(36)}@unigates.online`;
    }
    if (!EMAIL_RE.test(email)) return fail("validate", "Invalid email", 400);

    // ---- Reject an existing faculty row in the same institution ----
    // This protects against duplicate rows even if Auth lookup and DB writes race.
    const { data: existingFacultyRows, error: existingFacultyError } = await admin
      .from("institution_faculty_members")
      .select("id, user_id, email")
      .eq("institution_id", institutionId)
      .eq("institution_type", institutionType)
      .ilike("email", email)
      .limit(2);

    if (existingFacultyError) {
      return fail("faculty_lookup", existingFacultyError.message);
    }

    if ((existingFacultyRows || []).length > 0) {
      return fail(
        "faculty_email_exists",
        "A faculty member with this email already exists in this institution",
        409,
      );
    }

    // ---- Reject existing auth email ----
    let existing: any = null;
    try { existing = await findAuthUserByEmail(admin, email); }
    catch (e: any) { return fail("auth_lookup", e?.message || "Auth lookup failed"); }
    if (existing) return fail("auth_email_exists", "An account with this email already exists", 409);

   // ---- Validate temporary password ----
const temporaryPassword =
  typeof body.temporary_password === "string"
    ? body.temporary_password
    : "";

if (!temporaryPassword) {
  return fail(
    "validate_password",
    "Temporary password is required",
    400,
  );
}

if (temporaryPassword !== temporaryPassword.trim()) {
  return fail(
    "validate_password",
    "Temporary password must not start or end with spaces",
    400,
  );
}

if (temporaryPassword.length < 8) {
  return fail(
    "validate_password",
    "Temporary password must contain at least 8 characters",
    400,
  );
}

if (!/[A-Z]/.test(temporaryPassword)) {
  return fail(
    "validate_password",
    "Temporary password must contain at least one uppercase letter",
    400,
  );
}

if (!/[a-z]/.test(temporaryPassword)) {
  return fail(
    "validate_password",
    "Temporary password must contain at least one lowercase letter",
    400,
  );
}

if (!/\d/.test(temporaryPassword)) {
  return fail(
    "validate_password",
    "Temporary password must contain at least one number",
    400,
  );
}

if (/\s/.test(temporaryPassword)) {
  return fail(
    "validate_password",
    "Temporary password must not contain spaces",
    400,
  );
}
    const { data: created, error: ce } = await admin.auth.admin.createUser({
  email,
  password: temporaryPassword,
  email_confirm: true,
  user_metadata: {
    full_name: fullName,
    seeded_via: "institution_admin",
    must_change_password: !invitationCode,
  },
});
    if (ce || !created?.user) return fail("auth_create", ce?.message || "createUser failed");
    const uid = created.user.id;
    createdUid = uid;

    if (importedPhoto) {
      uploadedPhotoPath = `${uid}/faculty/${crypto.randomUUID()}.${importedPhoto.extension}`;
      const { error: photoError } = await admin.storage.from("avatars").upload(
        uploadedPhotoPath,
        importedPhoto.bytes,
        { contentType: importedPhoto.contentType, upsert: false, cacheControl: "31536000" },
      );
      if (photoError) {
        await rollbackCreatedUser(uid);
        return fail("photo_upload", photoError.message, 500);
      }
      const { data: photoUrl } = admin.storage.from("avatars").getPublicUrl(uploadedPhotoPath);
      extra.photo_url = photoUrl.publicUrl;
    }

    const { profileRole, appRole } = mapGeneralRole(role);

    // ---- Transactional save (no department at creation) ----
    const { error: txErr } = await admin.rpc("save_faculty_member_v2", {
      p_user_id: uid,
      p_email: email,
      p_full_name: fullName,
      p_phone: phone,
      p_profile_role: profileRole,
      p_app_role: appRole,
      p_specific_role: role,
      p_institution_type: institutionType,
      p_institution_id: institutionId,
      p_extra: extra,
    });
    if (txErr) {
      await rollbackCreatedUser(uid);
      return fail("database_transaction", txErr.message, 500, {
        code: (txErr as any).code, details: (txErr as any).details,
      });
    }

    // ---- Post-save verification ----
    const [{ data: prof }, { data: uroles }, { data: ifm }, cmRes] = await Promise.all([
      admin.from("profiles").select("user_id, role").eq("user_id", uid).maybeSingle(),
      admin.from("user_roles").select("role, approved").eq("user_id", uid),
      admin.from("institution_faculty_members").select("user_id, specific_role, institution_id")
        .eq("user_id", uid).maybeSingle(),
      institutionType === "college"
        ? admin.from("college_members").select("user_id, role").eq("user_id", uid).eq("college_id", institutionId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const problems: string[] = [];
    if (!prof || prof.user_id !== uid) problems.push("profiles missing");
    else if (prof.role !== profileRole) problems.push(`profiles.role=${prof.role}!=${profileRole}`);
    if (!uroles?.some((r: any) => r.role === appRole && r.approved === true))
      problems.push(`user_roles missing approved ${appRole}`);
    if (!ifm || ifm.user_id !== uid) problems.push("institution_faculty_members missing");
    else if (ifm.specific_role !== role) problems.push(`ifm.specific_role=${ifm.specific_role}!=${role}`);
    if (institutionType === "college") {
      const cm = (cmRes as any).data;
      if (!cm || cm.user_id !== uid) problems.push("college_members missing");
      else if (cm.role !== profileRole) problems.push(`college_members.role=${cm.role}!=${profileRole}`);
    }

    if (problems.length > 0) {
      await rollbackCreatedUser(uid);
      return fail("verification", `Post-save verification failed: ${problems.join("; ")}`, 500);
    }

    // ---- Assign departments if requested ----
    if (requestedDeptIds.length > 0) {
      // Verify every department belongs to this institution
      const { data: validDepts, error: deptCheckErr } = await admin
        .from("departments")
        .select("id, department_code")
        .eq("institution_id", institutionId!)
        .eq("institution_type", institutionType!)
        .in("id", requestedDeptIds);
      if (deptCheckErr) {
        console.error("department lookup failed (non-fatal)", { message: deptCheckErr.message });
      }
      const validIds = (validDepts || []).map((d: any) => d.id as string);
      const skippedCount = requestedDeptIds.length - validIds.length;
      if (skippedCount > 0) {
        console.warn("some requested departments are invalid and were skipped", {
          requested: requestedDeptIds.length,
          valid: validIds.length,
        });
      }

      if (validIds.length > 0) {
        const primaryDeptId = validIds[0];
        const { error: deptErr } = await admin.rpc("assign_faculty_department" as any, {
          p_user_id: uid,
          p_new_department_id: primaryDeptId,
          p_specific_role: role,
          p_full_name: fullName,
          p_email: email,
          p_phone: phone,
        });
        if (deptErr) {
          console.error("primary department assignment failed (non-fatal)", { message: deptErr.message });
        }

        // Additional departments: add a junction row each so the member shows
        // up inside every selected department. The canonical faculty record
        // keeps the primary department only.
        const extraDeptIds = validIds.slice(1);
        if (extraDeptIds.length > 0 && !deptErr) {
          const rows = extraDeptIds.map((deptId: string) => {
            const deptCode = (validDepts || []).find((d: any) => d.id === deptId)?.department_code || "GEN";
            return {
              department_id: deptId,
              user_id: uid,
              full_name: fullName,
              role,
              email,
              phone,
              invitation_code:
                "FAC-" +
                crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase() +
                "-" +
                deptCode,
            };
          });
          const { error: extraErr } = await admin.from("department_members").insert(rows);
          if (extraErr) {
            console.error("additional department assignments failed (non-fatal)", { message: extraErr.message });
          }
        }
      }
    }

    // ---- Atomically consume invitation (if invitation mode) ----
    // Uses the same atomic RPC as the student flow to prevent TOCTOU races.
    if (invitationCode) {
      const { data: consumeRows, error: consumeErr } = await admin.rpc(
        "consume_institution_invitation" as any,
        { _code: invitationCode },
      );
      if (consumeErr) {
        console.error("faculty invitation consume rpc error", { message: consumeErr.message });
        await rollbackCreatedUser(uid);
        return fail("invitation_consume", "Failed to process invitation", 500);
      }
      const inv = consumeRows?.[0];
      if (!inv || !inv.is_valid) {
        await rollbackCreatedUser(uid);
        return fail(
          "invitation_invalid",
          inv?.error_message || "Invalid, expired, or already used invitation",
          403,
        );
      }
      // Verify institution matches
      if (inv.institution_id !== institutionId) {
        await rollbackCreatedUser(uid);
        return fail("invitation_institution_mismatch", "Invitation does not match this institution", 403);
      }
      // Verify invitation role is a valid faculty role (not student)
      const invRole = (inv.role || "").toLowerCase();
      if (!ALLOWED_ROLES.has(invRole)) {
        await rollbackCreatedUser(uid);
        return fail(
          "invitation_role_invalid",
          "This invitation is not for faculty members",
          403,
        );
      }

      // The invitee chose their own password, so no forced reset on first sign-in.
      const { error: mcpErr } = await admin
        .from("profiles")
        .update({ must_change_password: false })
        .eq("user_id", uid);
      if (mcpErr) {
        console.error("failed to clear must_change_password", { message: mcpErr.message });
      }
    }


   return json({
  success: true,
  email,
  user_id: uid,
});
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("CREATE FACULTY ACCOUNT UNEXPECTED", { message, createdUid });
    if (createdUid) {
      await rollbackCreatedUser(createdUid);
    }
    return fail("rollback", message, 500);
  }
});
