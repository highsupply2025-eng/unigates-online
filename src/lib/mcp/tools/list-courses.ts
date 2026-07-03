import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "list_courses",
  title: "List courses",
  description:
    "List UNIGATES courses, optionally filtering by a search term matching the Arabic or English title, instructor, or category.",
  inputSchema: {
    search: z.string().trim().optional().describe("Optional search term."),
    limit: z.number().int().min(1).max(50).optional().describe("Max rows (default 20)."),
    freeOnly: z.boolean().optional().describe("Return only free courses."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit, freeOnly }) => {
    const client = sb();
    let query = client
      .from("courses")
      .select(
        "id,title_ar,title_en,instructor_ar,instructor_en,category_ar,category_en,episode_count,is_free,thumbnail_url",
      )
      .limit(limit ?? 20);

    if (freeOnly) query = query.eq("is_free", true);
    if (search && search.length > 0) {
      const s = `%${search}%`;
      query = query.or(
        `title_ar.ilike.${s},title_en.ilike.${s},instructor_ar.ilike.${s},instructor_en.ilike.${s},category_ar.ilike.${s},category_en.ilike.${s}`,
      );
    }

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { courses: data ?? [] },
    };
  },
});
