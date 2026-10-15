import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Admin Login Redirection & Role Resolution Guardrails", () => {
  const loginSource = fs.readFileSync("src/pages/Login.tsx", "utf-8");
  const coursesLoginSource = fs.readFileSync("src/pages/CoursesLogin.tsx", "utf-8");
  const adminDashboardSource = fs.readFileSync("src/pages/AdminDashboard.tsx", "utf-8");
  const adminOverviewSource = fs.readFileSync("src/pages/AdminOverview.tsx", "utf-8");
  const adminPaymentSettingsSource = fs.readFileSync("src/pages/AdminPaymentSettings.tsx", "utf-8");

  it("Login.tsx directly queries the profiles table for role and platform metadata", () => {
    expect(loginSource).toContain('.from("profiles")');
    expect(loginSource).toContain('select("role, platform, verification_status');
  });

  it("Login.tsx recognizes darobaid@unigates.online as primary platform admin", () => {
    expect(loginSource).toContain('"darobaid@unigates.online"');
  });

  it("Login.tsx sets unigates_admin_session in localStorage on successful admin authentication", () => {
    expect(loginSource).toContain('localStorage.setItem("unigates_admin_session", "true")');
  });

  it("Login.tsx routes admin users to /admin/dashboard immediately", () => {
    expect(loginSource).toContain('goNext("/admin/dashboard")');
  });

  it("Login.tsx handles delayed session establishment with retry and safe fallback", () => {
    expect(loginSource).toContain("retryProfile");
    expect(loginSource).toContain('goNext("/courses")');
  });

  it("CoursesLogin.tsx queries profiles table and routes admin to /admin/dashboard", () => {
    expect(coursesLoginSource).toContain('.from("profiles")');
    expect(coursesLoginSource).toContain('"darobaid@unigates.online"');
    expect(coursesLoginSource).toContain('navigate("/admin/dashboard")');
  });

  it("AdminDashboard.tsx verifies admin role via profiles table and darobaid@unigates.online", () => {
    expect(adminDashboardSource).toContain('.from("profiles")');
    expect(adminDashboardSource).toContain('"darobaid@unigates.online"');
    expect(adminDashboardSource).toContain('localStorage.getItem("unigates_admin_session")');
  });

  it("AdminOverview.tsx and AdminPaymentSettings.tsx support profiles table and admin session", () => {
    expect(adminOverviewSource).toContain('.from("profiles")');
    expect(adminOverviewSource).toContain('"darobaid@unigates.online"');
    expect(adminPaymentSettingsSource).toContain('.from("profiles")');
    expect(adminPaymentSettingsSource).toContain('"darobaid@unigates.online"');
  });
});
