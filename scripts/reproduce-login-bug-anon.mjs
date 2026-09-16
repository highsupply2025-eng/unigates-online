// Same reproduction but using anonymous sign-in (gives role=authenticated).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envRaw = fs.readFileSync(".env", "utf8");
function env(name) {
  const m = envRaw.match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, "m"));
  return m ? m[1] : null;
}
const SUPABASE_URL = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
const ANON = env("VITE_SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_PUBLISHABLE_KEY");

const log = (...a) => console.log(...a);

async function show(label, promise) {
  const { data, error } = await promise;
  log(`\n=== ${label} ===`);
  if (error) {
    log(`ERROR [${error.code || ""}] ${error.message}`);
    if (error.details) log("details:", error.details);
    if (error.hint) log("hint:", error.hint);
  } else {
    log(`OK rows=${Array.isArray(data) ? data.length : data === null ? "null" : 1}`);
    if (data && !Array.isArray(data)) log(JSON.stringify(data).slice(0, 300));
  }
  return { data, error };
}

(async () => {
  const base = createClient(SUPABASE_URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: anonData, error: anonErr } = await base.auth.signInAnonymously();
  if (anonErr) {
    log("ANON SIGN-IN DISABLED OR FAILED:", anonErr.message);
    return;
  }
  const session = anonData.session;
  log("Anonymous session OK. uid:", session.user.id);

  const authed = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const uid = session.user.id;

  // Insert own profile like save_faculty_member_v2 does for new faculty
  await show("INSERT own profile (lecturer, must_change_password=true)",
    authed.from("profiles").insert({ user_id: uid, email: null, full_name: "RLS Diagnostic", role: "lecturer", platform: "university", must_change_password: true }));

  // Login-flow queries
  await show("profiles SELECT * WHERE user_id=me   [LeadershipDashboard.checkAccess]",
    authed.from("profiles").select("*").eq("user_id", uid).maybeSingle());
  await show("user_roles SELECT WHERE user_id=me   [Login.tsx]",
    authed.from("user_roles").select("role, approved").eq("user_id", uid));
  await show("institution_faculty_members me       [Login.tsx]",
    authed.from("institution_faculty_members").select("specific_role").eq("user_id", uid).maybeSingle());

  // Recursion-cycle tables
  await show("departments LIMIT 5                  [cycle A]",
    authed.from("departments").select("id").limit(5));
  await show("department_members LIMIT 5            [cycle B]",
    authed.from("department_members").select("department_id").limit(5));

  // Dashboard RPCs
  await show("rpc get_my_departments()             [LeadershipDashboard]",
    authed.rpc("get_my_departments"));
  await show("rpc get_college_account_status()     [Login.tsx]",
    authed.rpc("get_college_account_status"));

  // Cleanup: delete profile row we created
  await show("CLEANUP: delete diagnostic profile",
    authed.from("profiles").delete().eq("user_id", uid));
})();
