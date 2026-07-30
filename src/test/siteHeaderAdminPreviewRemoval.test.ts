import { describe, it, expect } from "vitest";
import fs from "fs";

const siteHeaderSource = fs.readFileSync(
  "src/components/SiteHeader.tsx",
  "utf-8",
);

describe("SiteHeader — admin preview removed", () => {
  it("does not render the Arabic text معاينة", () => {
    expect(siteHeaderSource).not.toContain("معاينة");
  });

  it("does not render the Arabic text افتح لوحة بحساب الأدمن", () => {
    expect(siteHeaderSource).not.toContain("افتح لوحة بحساب الأدمن");
  });

  it("does not import Shield icon", () => {
    expect(siteHeaderSource).not.toMatch(/import.*Shield.*from/);
  });

  it("does not import ExternalLink icon", () => {
    expect(siteHeaderSource).not.toMatch(/import.*ExternalLink.*from/);
  });

  it("does not reference isAdmin state", () => {
    expect(siteHeaderSource).not.toContain("isAdmin");
  });

  it("does not reference previewItems", () => {
    expect(siteHeaderSource).not.toContain("previewItems");
  });

  it("does not import supabase client", () => {
    expect(siteHeaderSource).not.toMatch(/import.*supabase.*from/);
  });

  it("still contains the main navigation items", () => {
    expect(siteHeaderSource).toContain("university-platform");
    expect(siteHeaderSource).toContain("school-platform");
    expect(siteHeaderSource).toContain("courses");
    expect(siteHeaderSource).toContain("book-store");
  });

  it("still contains the language toggle", () => {
    expect(siteHeaderSource).toContain("toggleLanguage");
    expect(siteHeaderSource).toContain("langSwitch");
  });

  it("still links to the brand home", () => {
    expect(siteHeaderSource).toContain('to="/"');
  });
});

describe("Admin dashboard route still available", () => {
  it("App.tsx still defines /admin/dashboard route", () => {
    const appSource = fs.readFileSync("src/App.tsx", "utf-8");
    expect(appSource).toContain("/admin/dashboard");
  });

  it("AdminPreviewLinks component still exists for admin dashboard internal use", () => {
    const exists = fs.existsSync("src/components/AdminPreviewLinks.tsx");
    expect(exists).toBe(true);
  });

  it("AdminDashboard still imports AdminPreviewLinks", () => {
    const adminDashSource = fs.readFileSync(
      "src/pages/AdminDashboard.tsx",
      "utf-8",
    );
    expect(adminDashSource).toContain("AdminPreviewLinks");
  });
});
