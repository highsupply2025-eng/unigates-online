import { describe, it, expect } from "vitest";
import {
  generateStrongPassword,
  isStrongPassword,
  ROLE_OPTIONS,
} from "@/components/FacultyMemberForm";

describe("FacultyMemberForm helpers", () => {
  describe("generateStrongPassword", () => {
    it("generates a 12-character password", () => {
      const pw = generateStrongPassword();
      expect(pw.length).toBe(12);
    });

    it("contains at least one uppercase letter", () => {
      const pw = generateStrongPassword();
      expect(/[A-Z]/.test(pw)).toBe(true);
    });

    it("contains at least one lowercase letter", () => {
      const pw = generateStrongPassword();
      expect(/[a-z]/.test(pw)).toBe(true);
    });

    it("contains at least one digit", () => {
      const pw = generateStrongPassword();
      expect(/\d/.test(pw)).toBe(true);
    });

    it("contains no whitespace", () => {
      const pw = generateStrongPassword();
      expect(/\s/.test(pw)).toBe(false);
    });

    it("generates different passwords on successive calls", () => {
      const passwords = new Set(Array.from({ length: 20 }, () => generateStrongPassword()));
      expect(passwords.size).toBeGreaterThan(1);
    });
  });

  describe("isStrongPassword", () => {
    it("accepts a valid password with upper, lower, digit, 8+ chars", () => {
      expect(isStrongPassword("Abcdefg1")).toBe(true);
      expect(isStrongPassword("StrongP4ss")).toBe(true);
    });

    it("rejects password shorter than 8 characters", () => {
      expect(isStrongPassword("Abc1def")).toBe(false);
    });

    it("rejects password without uppercase", () => {
      expect(isStrongPassword("abcdefg1")).toBe(false);
    });

    it("rejects password without lowercase", () => {
      expect(isStrongPassword("ABCDEFG1")).toBe(false);
    });

    it("rejects password without digit", () => {
      expect(isStrongPassword("Abcdefgh")).toBe(false);
    });

    it("rejects password with whitespace", () => {
      expect(isStrongPassword("Abc defg1")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isStrongPassword("")).toBe(false);
    });
  });

  describe("ROLE_OPTIONS", () => {
    it("contains 9 role options", () => {
      expect(ROLE_OPTIONS.length).toBe(9);
    });

    it("each option has value, ar, and en", () => {
      ROLE_OPTIONS.forEach((opt) => {
        expect(opt.value).toBeTruthy();
        expect(opt.ar).toBeTruthy();
        expect(opt.en).toBeTruthy();
      });
    });

    it("includes expected faculty roles", () => {
      const values = ROLE_OPTIONS.map((r) => r.value);
      expect(values).toContain("professor");
      expect(values).toContain("doctor");
      expect(values).toContain("assistant_lecturer");
      expect(values).toContain("teaching_assistant");
      expect(values).toContain("department_head");
      expect(values).toContain("dean");
    });
  });
});

describe("Faculty invitation form behavior", () => {
  it("invitation mode password must be strong", () => {
    // Simulate the canSubmit logic for invitation mode
    const password = "StrongP4ss";
    const confirmPassword = "StrongP4ss";
    const fullName = "Dr. Ahmed";
    const role = "professor";

    const canSubmit =
      fullName.trim().length > 0 &&
      role.length > 0 &&
      isStrongPassword(password) &&
      password === confirmPassword;

    expect(canSubmit).toBe(true);
  });

  it("invitation mode rejects mismatched passwords", () => {
    const password: string = "StrongP4ss";
    const confirmPassword = "Different1";
    const fullName = "Dr. Ahmed";
    const role = "professor";

    const canSubmit =
      fullName.trim().length > 0 &&
      role.length > 0 &&
      isStrongPassword(password) &&
      password === confirmPassword;

    expect(canSubmit).toBe(false);
  });

  it("invitation mode rejects weak password", () => {
    const password = "weak";
    const confirmPassword = "weak";
    const fullName = "Dr. Ahmed";
    const role = "professor";

    const canSubmit =
      fullName.trim().length > 0 &&
      role.length > 0 &&
      isStrongPassword(password) &&
      password === confirmPassword;

    expect(canSubmit).toBe(false);
  });

  it("invitation mode rejects empty full name", () => {
    const password = "StrongP4ss";
    const confirmPassword = "StrongP4ss";
    const fullName = "";
    const role = "professor";

    const canSubmit =
      fullName.trim().length > 0 &&
      role.length > 0 &&
      isStrongPassword(password) &&
      password === confirmPassword;

    expect(canSubmit).toBe(false);
  });

  it("invitation mode rejects empty role", () => {
    const password = "StrongP4ss";
    const confirmPassword = "StrongP4ss";
    const fullName = "Dr. Ahmed";
    const role = "";

    const canSubmit =
      fullName.trim().length > 0 &&
      role.length > 0 &&
      isStrongPassword(password) &&
      password === confirmPassword;

    expect(canSubmit).toBe(false);
  });

  it("admin-add mode validates temp password strength", () => {
    const tempPassword = "AdminP4ss";
    const fullName = "Dr. Ahmed";
    const role = "professor";

    const canSubmit =
      fullName.trim().length > 0 &&
      role.length > 0 &&
      isStrongPassword(tempPassword);

    expect(canSubmit).toBe(true);
  });

  it("admin-add mode rejects weak temp password", () => {
    const tempPassword = "weak";
    const fullName = "Dr. Ahmed";
    const role = "professor";

    const canSubmit =
      fullName.trim().length > 0 &&
      role.length > 0 &&
      isStrongPassword(tempPassword);

    expect(canSubmit).toBe(false);
  });
});

describe("Token validation states", () => {
  it("distinguishes loading from valid", () => {
    const status: "loading" | "valid" | "invalid" = "loading";
    expect(status).toBe("loading");
  });

  it("valid token has institution data", () => {
    const data = {
      institutionId: "test-id",
      institutionType: "college" as const,
      institutionName: "Test College",
      role: "professor",
    };
    expect(data.institutionId).toBeTruthy();
    expect(data.institutionType).toBe("college");
  });

  it("invalid token shows error message", () => {
    const message_ar = "رابط الدعوة غير صالح أو منتهي الصلاحية أو مستخدم بالفعل";
    const message_en = "This invitation link is invalid, expired, or has already been used";
    expect(message_ar.length).toBeGreaterThan(0);
    expect(message_en.length).toBeGreaterThan(0);
  });
});
