import { auth, defineMcp } from "@lovable.dev/mcp-js";
import pingTool from "./tools/ping";
import listCoursesTool from "./tools/list-courses";

// The OAuth issuer MUST be the direct Supabase host (RFC 8414 §3.3). Build it
// from VITE_SUPABASE_PROJECT_ID (Vite inlines it at build time, so this stays
// import-safe). Fallback keeps the string well-formed during manifest extract.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "unigates-mcp",
  title: "UNIGATES MCP",
  version: "0.2.0",
  instructions:
    "Tools for the UNIGATES education platform (courses, bookstore, schools). Use `ping` to verify connectivity and `list_courses` to browse or search the course catalog.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [pingTool, listCoursesTool],
});
