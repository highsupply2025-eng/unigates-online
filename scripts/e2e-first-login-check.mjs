// End-to-end verification of the new-faculty first-login flow.
//
// Prerequisites:
//   - Run AFTER Lovable Publish applies migration 20260824220000.
//   - An approved institution-admin account (email + password).
//
// Usage:
//   $env:UNI_ADMIN_EMAIL="admin@example.com"; $env:UNI_ADMIN_PASSWORD="..."; node scripts/e2e-first-login-check.mjs
//
// What it does:
//   1. Signs in as the institution admin.
//   2. Creates a test faculty member ("professor") with a known temporary
//      password through the same Edge Function used by /institution/faculty/add.
//   3. Signs OUT, then signs IN as that new member with the temporary password
//      and replays the exact queries Login.tsx + LeadershipDashboard perform.
//   4. Asserts: profile loads (no RLS error), must_change_password === true
//      (dialog will appear), role routing resolves to /leadership/dashboard.
//   5. Optionally changes the password via complete-password-change to prove
//      full access unlocks (pass UNI_RUN_PASSWORD_CHANGE=1).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envRaw = fs.readFileSync(".env", "utf8");
function env(name) {
  if (process.env[name]) return process.env[name];
  const m = envRaw.match(new RegExp(`^${name}="?([^"\\r\\n]+)"?`, "m"));
  return m ? m[1] : null;
}
const SUPABASE_URL = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
const ANON = env("VITE_SUPABASE_PUBLISHABLE_KEY") || env("SUPABASE_PUBLISHABLE_KEY");

const ADMIN_EMAIL = process.env.UNI_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.UNI_ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set UNI_ADMIN_EMAIL and UNI_ADMIN_PASSWORD first.");
  process.exit(1);
}

const stamp = Date.now().toString(36);
const MEMBER_EMAIL = `e2e.faculty.${stamp}@unigates.online`;
const TEMP_PASSWORD = `E2eTemp#${stamp}Aa1`;

const results = [];
function record(step, ok, detail) {
  results.push({ step, ok });
  console.log(`${ok ? "PASS" : "FAIL"} — ${step}${detail ? `\n       ${detail}` : ""}`);
}

async function main() {
  const client = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });

  // ── 1. Institution admin signs in ──
  const { data: adminIn, error: adminErr } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (adminErr) throw new Error(`Admin sign-in failed: ${adminErr.message}`);
  record("admin sign-in", true);

  // ── 2. Create the test faculty member ──
  const { data: created, error: fnErr } = await client.functions.invoke("create-faculty-account", {
    body: {
      full_name: `E2E Faculty ${stamp}`,
      email: MEMBER_EMAIL,
      role: "professor",
      temporary_password: TEMP_PASSWORD,
    },
  });
  if (fnErr || !created?.success) {
    throw new Error(`create-faculty-account failed: ${JSON.stringify(fnErr || created)}`);
  }
  record("faculty member created", true, `email=${MEMBER_EMAIL}\n       temp_password=${TEMP_PASSWORD}`);

  // ── 3. Sign out, then sign in AS THE NEW MEMBER with the temp password ──
  await client.auth.signOut();
  const { data: memberIn, error: memberErr } = await client.auth.signInWithPassword({
    email: MEMBER_EMAIL,
    password: TEMP_PASSWORD,
  });
  record("first login with temporary password succeeds (no Unauthorized)", !memberErr, memberErr?.message);
  if (memberErr) throw memberErr;

  const uid = memberIn.user.id;
  const authed = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${memberIn.session.access_token}` } },
    auth: { persistSession: false },
  });

  // ── 4. Replay the exact post-login queries ──
  const college = await authed.rpc("get_college_account_status");
  record("rpc get_college_account_status() works", !college.error, college.error?.message);

  const rolesRes = await authed.from("user_roles").select("role, approved").eq("user_id", uid);
  record("user_roles SELECT works (Login.tsx)", !rolesRes.error, rolesRes.error?.message);

  const profRes = await authed.from("profiles").select("role, platform, must_change_password").eq("user_id", uid).maybeSingle();
  record(
    "profiles SELECT works — previously threw 'infinite recursion' → غير مصرح",
    !profRes.error,
    profRes.error?.message,
  );

  const profile = profRes.data;
  record(
    'must_change_password === true → mandatory dialog will show',
    profile?.must_change_password === true,
    JSON.stringify(profile),
  );
  record("profile.role routes to leadership dashboard", profile?.role === "lecturer", `role=${profile?.role}`);

  const ifm = await authed.from("institution_faculty_members").select("specific_role").eq("user_id", uid).maybeSingle();
  record("institution_faculty_members self-SELECT works", !ifm.error && !!ifm.data, ifm.error?.message);

  const depts = await authed.rpc("get_my_departments");
  record("rpc get_my_departments() works (Create Lecture modal)", !depts.error, depts.error?.message);

  // ── 5. Optional: change password to unlock full access ──
  if (process.env.UNI_RUN_PASSWORD_CHANGE === "1") {
    const NEW_PASS = `E2eNew#${stamp}Bb2`;
    const changed = await authed.functions.invoke("complete-password-change", {
      body: { current_password: TEMP_PASSWORD, new_password: NEW_PASS },
    });
    record(
      "complete-password-change clears the flag (full access granted)",
      changed.data?.success === true && changed.data?.profile?.must_change_password === false,
      JSON.stringify(changed.data || changed.error),
    );
    console.log(`\nMember final credentials: ${MEMBER_EMAIL} / ${NEW_PASS}`);
  }

  console.log("\n════ SUMMARY ════");
  const failed = results.filter((r) => !r.ok);
  console.log(`${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) process.exit(2);
}

main().catch((e) => {
  console.error("E2E ABORTED:", e.message);
  process.exit(1);
});
