// Reproduce the exact login-time queries of a freshly created faculty member
// using a REAL authenticated session against production.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envRaw = fs.readFileSync(".env", "utf8");
function env(name) {
  const m = envRaw.match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, "m"));
  return m ? m[1] : null;
}
const SUPABASE_URL = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
const ANON = env("VITE_SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_PUBLISHABLE_KEY");

const TEST_EMAIL = `rlsdiag.${Date.now().toString(36)}@unigates.online`;
const TEST_PASS = "Diag#Temp9X";

const supabase = createClient(SUPABASE_URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
  // 1) Sign up a throwaway user (mirrors a brand-new account)
  const { data: su, error: suErr } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASS,
  });
  if (suErr) {
    log("SIGNUP ERROR:", suErr.message);
    return;
  }
  log("Signed up:", TEST_EMAIL);
  log("Session returned:", !!su.session, "| email_confirmed:", su.user?.email_confirmed_at !== null);

  // If no session (email confirmation required), try signing in explicitly
  let session = su.session;
  if (!session) {
    const si = await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASS });
    if (si.error) {
      log("SIGNIN ERROR:", si.error.message);
      return;
    }
    session = si.data.session;
    log("Signed in with password.");
  }

  // Re-create client bound to the authenticated session (RLS now applies)
  const authed = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const uid = session.user.id;
  log("uid:", uid);

  // 2) Insert own profile row exactly like save_faculty_member_v2 does
  //    (policy "Users can insert own profile" permits this)
  await show("INSERT own profile (lecturer, must_change_password=true)",
    authed.from("profiles").insert({ user_id: uid, email: TEST_EMAIL, full_name: "RLS Diagnostic", role: "lecturer", platform: "university", must_change_password: true }));

  // 3) THE LOGIN-FLOW QUERIES (same as Login.tsx / LeadershipDashboard.checkAccess)
  await show("profiles SELECT * WHERE user_id=me   [LeadershipDashboard.checkAccess]",
    authed.from("profiles").select("*").eq("user_id", uid).maybeSingle());
  await show("user_roles SELECT WHERE user_id=me    [Login.tsx]",
    authed.from("user_roles").select("role, approved").eq("user_id", uid));
  await show("institution_faculty_members WHERE user_id=me [Login.tsx specific-role lookup]",
    authed.from("institution_faculty_members").select("specific_role").eq("user_id", uid).maybeSingle());

  // 4) The tables inside the suspected recursion cycle
  await show("departments SELECT id LIMIT 5         [cycle A]",
    authed.from("departments").select("id").limit(5));
  await show("department_members SELECT LIMIT 5      [cycle B]",
    authed.from("department_members").select("department_id").limit(5));

  // 5) RPCs used by dashboards
  await show("rpc get_my_departments()              [LeadershipDashboard]",
    authed.rpc("get_my_departments"));
  await show("rpc get_college_account_status()      [Login.tsx]",
    authed.rpc("get_college_account_status"));

  log("\nDONE — test user:", TEST_EMAIL);
})();
