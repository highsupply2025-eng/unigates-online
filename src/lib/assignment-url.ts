// Helpers for descriptive assignment URLs: /assignment/<slug>-<uuid>
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function slugify(input: string): string {
  if (!input) return "assignment";
  return input
    .toString()
    .trim()
    .toLowerCase()
    // keep arabic letters, latin letters, digits; replace others with hyphen
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "assignment";
}

export function buildAssignmentPath(
  id: string,
  titleEn?: string | null,
  titleAr?: string | null,
): string {
  const base = titleEn || titleAr || "assignment";
  const slug = slugify(base);
  return `/assignment/${slug}-${id}`;
}

/** Extract uuid from a slug param like "midterm-essay-<uuid>" or just "<uuid>". */
export function extractAssignmentId(param: string | undefined): string | null {
  if (!param) return null;
  const m = param.match(UUID_RE);
  return m ? m[0] : null;
}
