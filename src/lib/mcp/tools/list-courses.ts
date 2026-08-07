import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

type RuntimeGlobals = typeof globalThis & {
  Deno?: { env?: { get?: (name: string) => string | undefined } };
  process?: { env?: Record<string, string | undefined> };
};

function runtimeEnv(name: string): string | undefined {
  const runtime = globalThis as RuntimeGlobals;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}

function firstEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
  return undefined;
}

function publishableKey(): string {
  const direct = firstEnv(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (direct) return direct;
  const keyset = runtimeEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (keyset) {
    try {
      const parsed: unknown = JSON.parse(keyset);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed as Record<string, unknown>;
        const key = [keys.default, ...Object.values(keys)]
          .find((v): v is string => typeof v === "string" && v.trim().startsWith("sb_publishable_"))
          ?.trim();
        if (key) return key;
      }
    } catch {
      // fall through to legacy names
    }
  }
  const legacy = firstEnv(["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]);
  if (legacy) return legacy;
  throw new Error("Supabase publishable key is not configured");
}

function sb() {
  const url = firstEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  if (!url) throw new Error("SUPABASE_URL is not configured");
  return createClient(url, publishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
