// Build / parse descriptive URLs for individual schedule pages.
// Pattern: /schedule/<slug>-<uuid>
import { slugify } from "./assignment-url";

export function buildSchedulePath(id: string, titleEn?: string | null, titleAr?: string | null): string {
  const base = titleEn || titleAr || "schedule";
  const slug = slugify(base);
  return `/schedule/${slug}-${id}`;
}

const UUID_RE = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

export function extractScheduleId(slugOrId: string | undefined): string | null {
  if (!slugOrId) return null;
  const m = slugOrId.match(UUID_RE);
  return m ? m[1] : null;
}
