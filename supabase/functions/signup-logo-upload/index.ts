import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File) || (kind !== "college" && kind !== "institute")) {
      return new Response(
        JSON.stringify({ error: "Missing file or invalid institution type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (file.size > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "Image must be less than 5MB" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return new Response(
        JSON.stringify({ error: "Invalid image type. Allowed: JPG, PNG, WEBP, GIF" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const bucket = kind === "college" ? "college-logos" : "institute-logos";
    const path = `pending/${crypto.randomUUID()}.${ext}`;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);

    return new Response(
      JSON.stringify({ path, publicUrl: data.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Upload failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});