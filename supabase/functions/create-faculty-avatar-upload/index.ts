import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function fail(message: string, status = 400, step = "unknown") {
  console.error("FACULTY AVATAR UPLOAD ERROR", {
    step,
    message,
  });

  return respond(
    {
      success: false,
      error: message,
      step,
    },
    status,
  );
}

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const allowedExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return fail("Method not allowed", 405, "method");
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return fail(
        "Missing Supabase environment variables",
        500,
        "environment",
      );
    }

    const authorization = req.headers.get("Authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return fail("Unauthorized", 401, "authorization");
    }

    /*
     * عميل المستخدم: لمعرفة هوية المستخدم الحقيقية.
     */
    const userClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user?.id || !user.email) {
      return fail("Unauthorized", 401, "caller_auth");
    }

    /*
     * عميل إداري: لإنشاء رابط الرفع المؤقت بعد التحقق.
     */
    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const body = await req.json().catch(() => ({}));

    const memberId = String(body.member_id || "").trim();
    const contentType = String(body.content_type || "")
      .trim()
      .toLowerCase();
    const fileSize = Number(body.file_size || 0);

    if (!memberId) {
      return fail(
        "Missing member_id",
        400,
        "validation",
      );
    }

    if (!allowedTypes.has(contentType)) {
      return fail(
        "Unsupported image type. Use JPG, PNG or WebP.",
        400,
        "validation",
      );
    }

    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_FILE_SIZE
    ) {
      return fail(
        "Image size must not exceed 5MB.",
        400,
        "validation",
      );
    }

    /*
     * تحميل بيانات عضو هيئة التدريس.
     */
    const {
      data: member,
      error: memberError,
    } = await admin
      .from("institution_faculty_members")
      .select(
        "id, user_id, institution_id, institution_type",
      )
      .eq("id", memberId)
      .maybeSingle();

    if (memberError) {
      return fail(
        memberError.message,
        500,
        "load_member",
      );
    }

    if (!member) {
      return fail(
        "Faculty member not found",
        404,
        "load_member",
      );
    }

    if (!member.user_id) {
      return fail(
        "Faculty member has no linked account",
        400,
        "load_member",
      );
    }

    if (
      member.institution_type !== "college" &&
      member.institution_type !== "institute"
    ) {
      return fail(
        "Invalid institution type",
        400,
        "load_member",
      );
    }

    const registrationTable =
      member.institution_type === "college"
        ? "college_registrations"
        : "institute_registrations";

    /*
     * التأكد أن المستخدم الحالي مسؤول المؤسسة نفسها.
     */
    const {
      data: institution,
      error: institutionError,
    } = await admin
      .from(registrationTable)
      .select("id, email, status")
      .eq("id", member.institution_id)
      .maybeSingle();

    if (institutionError) {
      return fail(
        institutionError.message,
        500,
        "load_institution",
      );
    }

    const callerEmail = user.email
      .trim()
      .toLowerCase();

    const institutionEmail = String(
      institution?.email || "",
    )
      .trim()
      .toLowerCase();

    if (
      !institution ||
      institution.status !== "approved" ||
      institutionEmail !== callerEmail
    ) {
      return fail(
        "You are not allowed to update this faculty member.",
        403,
        "permission",
      );
    }

    const extension = allowedExtensions[contentType];
    const uniqueName = crypto.randomUUID();

    const path =
      `${member.user_id}/faculty/${uniqueName}.${extension}`;

    /*
     * إنشاء رابط رفع مؤقت.
     * هذا الرابط يسمح برفع ملف واحد فقط إلى المسار المحدد.
     */
    const {
      data: signedUpload,
      error: signedUploadError,
    } = await admin.storage
      .from("avatars")
      .createSignedUploadUrl(path, {
        upsert: true,
      });

    if (signedUploadError || !signedUpload) {
      return fail(
        signedUploadError?.message ||
          "Unable to create upload URL",
        500,
        "create_signed_upload",
      );
    }

    const {
      data: publicUrlData,
    } = admin.storage
      .from("avatars")
      .getPublicUrl(path);

    return respond({
      success: true,
      bucket: "avatars",
      path,
      token: signedUpload.token,
      public_url: publicUrlData.publicUrl,
    });
  } catch {
    return fail(
      "Upload failed",
      500,
      "unexpected",
    );
  }
});
