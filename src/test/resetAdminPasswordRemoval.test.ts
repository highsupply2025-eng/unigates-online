import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// The reset-admin-password Edge Function was removed as a security fix.
// It was an unused, general-purpose admin password-reset endpoint that:
//   - could reset the password of ANY user, including the protected owner,
//     based on an email supplied by the caller;
//   - previously shipped a hardcoded default password and owner email;
//   - duplicated Supabase's standard, secure password-recovery flow.
// These tests pin down the removal and prove the standard flow still works.

const REMOVED_FN_DIR = "supabase/functions/reset-admin-password";
const THIS_TEST_FILE = "src/test/resetAdminPasswordRemoval.test.ts";

const APP_SOURCE = fs.readFileSync("src/App.tsx", "utf-8");
const FORGOT_PASSWORD_SOURCE = fs.readFileSync(
  "src/pages/ForgotPassword.tsx",
  "utf-8",
);
const RESET_PASSWORD_SOURCE = fs.readFileSync(
  "src/pages/ResetPassword.tsx",
  "utf-8",
);
const CONFIG_TOML_SOURCE = fs.readFileSync("supabase/config.toml", "utf-8");

function collectFiles(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, acc);
    else if (entry.isFile()) acc.push(full.replace(/\\/g, "/"));
  }
  return acc;
}

function findInFiles(files: string[], pattern: RegExp): string[] {
  return files.filter((file) => pattern.test(fs.readFileSync(file, "utf-8")));
}

// Application sources excluding this very test file, which legitimately
// documents the removed function by name.
const appFiles = collectFiles("src").filter((f) => f !== THIS_TEST_FILE);
const functionFiles = collectFiles("supabase/functions");

describe("reset-admin-password Edge Function removed", () => {
  it("the function directory no longer exists (endpoint is gone)", () => {
    expect(fs.existsSync(REMOVED_FN_DIR)).toBe(false);
  });

  it("no frontend source references the removed function", () => {
    expect(findInFiles(appFiles, /reset-admin-password/)).toEqual([]);
  }, 15000);

  it("no other Edge Function references the removed function", () => {
    expect(findInFiles(functionFiles, /reset-admin-password/)).toEqual([]);
  }, 15000);

  it("supabase/config.toml has no configuration for the removed function", () => {
    expect(CONFIG_TOML_SOURCE).not.toContain("reset-admin-password");
  });

  it("removal eliminates the general endpoint that could target the protected owner", () => {
    // The removed function accepted any caller-supplied email and reset its
    // password (even the protected owner account). With it gone, no Edge
    // Function can reset the password of an arbitrary target email.
    const arbitraryTargetReset =
      /updateUserById\(\s*(String\(body\.|body\.)[^)]*,\s*\{\s*password/;
    expect(findInFiles(functionFiles, arbitraryTargetReset)).toEqual([]);
  });
});

describe("no hardcoded credentials remain in Edge Functions", () => {
  it("no function source assigns a literal password value", () => {
    expect(findInFiles(functionFiles, /password\s*[:=]\s*["'][^"']{6,}["']/i))
      .toEqual([]);
  });

  it("no function source falls back to a hardcoded default email or password", () => {
    const fallbackDefault =
      /(email|password)\s*\|\|\s*["'][^"']+["']/i;
    expect(findInFiles(functionFiles, fallbackDefault)).toEqual([]);
  });

  it("no function source contains common default password placeholders", () => {
    const placeholders = /changeme|password123|password@/i;
    expect(findInFiles(functionFiles, placeholders)).toEqual([]);
  });

  it("no function source logs a raw caller-supplied password", () => {
    const riskyLog =
      /console\.(log|warn|error)\([^)]*(body\.(current_password|new_password|password))/i;
    expect(findInFiles(functionFiles, riskyLog)).toEqual([]);
  });
});

describe("standard Supabase password-recovery flow still works", () => {
  it("routes /forgot-password and /reset-password in App.tsx", () => {
    expect(APP_SOURCE).toContain('path="/forgot-password"');
    expect(APP_SOURCE).toContain('path="/reset-password"');
  });

  it("ForgotPassword triggers resetPasswordForEmail", () => {
    expect(FORGOT_PASSWORD_SOURCE).toContain("resetPasswordForEmail");
  });

  it("ForgotPassword redirects to the reset-password page", () => {
    expect(FORGOT_PASSWORD_SOURCE).toContain(
      'getAuthCallbackUrl("/reset-password")',
    );
  });

  it("ResetPassword updates the password via supabase.auth.updateUser", () => {
    expect(RESET_PASSWORD_SOURCE).toContain(
      "supabase.auth.updateUser({ password }",
    );
  });

  it("ResetPassword handles the PASSWORD_RECOVERY event", () => {
    expect(RESET_PASSWORD_SOURCE).toContain("PASSWORD_RECOVERY");
  });

  it("the recovery email template still exists", () => {
    expect(
      fs.existsSync(
        "supabase/functions/_shared/email-templates/recovery.tsx",
      ),
    ).toBe(true);
  });
});
