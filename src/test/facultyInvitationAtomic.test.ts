import { describe, it, expect } from "vitest";
import fs from "fs";

const facultySource = fs.readFileSync(
  "supabase/functions/create-faculty-account/index.ts",
  "utf-8",
);

const studentSource = fs.readFileSync(
  "supabase/functions/create-student-account/index.ts",
  "utf-8",
);

const consumeRpcSource = fs.readFileSync(
  "supabase/migrations/20260729000001_secure_student_subscriptions_and_invitations.sql",
  "utf-8",
);

describe("Faculty invitation atomic consumption", () => {
  describe("Vulnerability fix: no more TOCTOU race", () => {
    it("does NOT use non-atomic read-then-update for invitation consumption", () => {
      expect(facultySource).not.toMatch(/used_count\s*\|\|\s*0\)\s*\+\s*1/);
      expect(facultySource).not.toMatch(/newCount\s*=\s*\(invRow\.used_count/);
    });

    it("uses the atomic consume_institution_invitation RPC", () => {
      expect(facultySource).toContain("consume_institution_invitation");
    });

    it("calls consume_institution_invitation via admin.rpc", () => {
      expect(facultySource).toMatch(/admin\.rpc\(\s*["']consume_institution_invitation/);
    });
  });

  describe("RPC exists and is atomic", () => {
    it("consume_institution_invitation uses atomic UPDATE ... WHERE with CTE", () => {
      expect(consumeRpcSource).toContain("consume_institution_invitation");
      expect(consumeRpcSource).toMatch(/WITH\s+updated\s+AS\s*\(\s*UPDATE/);
    });

    it("RPC checks max_uses condition atomically in WHERE clause", () => {
      expect(consumeRpcSource).toContain("ci.max_uses = 0 OR ci.used_count < ci.max_uses");
      expect(consumeRpcSource).toContain("ii.max_uses = 0 OR ii.used_count < ii.max_uses");
    });

    it("RPC returns is_valid boolean for consumption result", () => {
      expect(consumeRpcSource).toContain("is_valid boolean");
    });

    it("RPC returns error_message for failed consumption", () => {
      expect(consumeRpcSource).toContain("error_message text");
    });
  });

  describe("Server-side invitation validation", () => {
    it("validates invitation role is a valid faculty role (not student)", () => {
      expect(facultySource).toContain("invitation_role_invalid");
      expect(facultySource).toContain("This invitation is not for faculty members");
    });

    it("validates institution matches the invitation", () => {
      expect(facultySource).toContain("invitation_institution_mismatch");
      expect(facultySource).toContain("Invitation does not match this institution");
    });

    it("handles invalid/expired/exhausted invitations with rollback", () => {
      expect(facultySource).toContain("invitation_invalid");
      expect(facultySource).toContain("Invalid, expired, or already used invitation");
    });

    it("rolls back the auth user and uploaded photo on invitation failure", () => {
      const consumeBlock = facultySource.slice(
        facultySource.indexOf("Atomically consume invitation"),
        facultySource.indexOf("return json({\n  success: true,"),
      );
      expect(consumeBlock).toContain("rollbackCreatedUser(uid)");
      expect(facultySource).toContain('admin.storage.from("avatars").remove');
      expect(facultySource).toContain("deleteUser(uid)");
    });
  });

  describe("Manual faculty creation preserved", () => {
    it("admin mode still works without invitation_code", () => {
      expect(facultySource).toContain("Admin mode: caller auth required");
    });

    it("consume_institution_invitation is only called inside an if (invitationCode) block", () => {
      const rpcIndex = facultySource.indexOf("consume_institution_invitation");
      expect(rpcIndex).toBeGreaterThan(-1);
      const beforeRpc = facultySource.slice(Math.max(0, rpcIndex - 300), rpcIndex);
      expect(beforeRpc).toContain("if (invitationCode)");
    });
  });

  describe("Student flow unchanged", () => {
    it("student flow still uses consume_institution_invitation", () => {
      expect(studentSource).toContain("consume_institution_invitation");
    });

    it("student flow still validates role is student", () => {
      expect(studentSource).toContain("This invitation is not for students");
    });
  });

  describe("No hardcoded credentials", () => {
    it("create-faculty-account has no hardcoded passwords", () => {
      expect(facultySource).not.toMatch(/password\s*[:=]\s*["'][^"']+["']/);
    });

    it("create-faculty-account has no admin1993 or similar defaults", () => {
      expect(facultySource).not.toContain("admin1993");
      expect(facultySource).not.toContain("changeme");
      expect(facultySource).not.toContain("password123");
    });
  });

  describe("ALLOWED_ROLES gate", () => {
    it("ALLOWED_ROLES set includes expected faculty roles", () => {
      const allowedRoles = [
        "dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community",
        "department_head", "teaching_assistant", "professor", "doctor", "assistant_lecturer",
      ];
      for (const role of allowedRoles) {
        expect(facultySource).toContain(`"${role}"`);
      }
    });

    it("ALLOWED_ROLES does NOT include student", () => {
      const rolesBlock = facultySource.slice(
        facultySource.indexOf("ALLOWED_ROLES"),
        facultySource.indexOf("];", facultySource.indexOf("ALLOWED_ROLES")) + 2,
      );
      expect(rolesBlock).not.toContain('"student"');
    });
  });
});
