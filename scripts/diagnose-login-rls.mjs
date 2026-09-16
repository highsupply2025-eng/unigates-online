// Diagnostic: probe production RLS health for the exact queries the login
// flow performs. Uses ONLY the anon key — no credentials needed.
// A healthy setup returns HTTP 200 (possibly empty arrays).
// The suspected bug returns HTTP 500 "infinite recursion detected in policy".
import fs from "node:fs";

const envRaw = fs.readFileSync(".env", "utf8");
function env(name) {
  const m = envRaw.match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, "m"));
  return m ? m[1] : null;
}
const URL_BASE = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
const ANON = env("VITE_SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_PUBLISHABLE_KEY");

async function probe(label, path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
      Accept: "application/json",
    },
  });
  const text = await res.text();
  let body = text;
  try { body = JSON.stringify(JSON.parse(text)); } catch {}
  console.log(`\n[${label}] GET ${path}`);
  console.log(`  HTTP ${res.status}`);
  console.log(`  ${body.slice(0, 400)}`);
  return res.status;
}

(async () => {
  console.log("Project:", URL_BASE);
  // 1) The exact table whose failure produces the "غير مصرح" toast
  await probe("profiles (login step)", "profiles?select=user_id,role,must_change_password&limit=1");
  // 2) Roles lookup done right after sign-in
  await probe("user_roles (login step)", "user_roles?select=role,approved&limit=1");
  // 3) Tables inside the suspected recursion cycle
  await probe("departments (cycle A)", "departments?select=id&limit=1");
  await probe("department_members (cycle B)", "department_members?select=department_id&limit=1");
  await probe("institution_faculty_members", "institution_faculty_members?select=user_id&limit=1");
})();
