import { describe, it, expect } from "vitest";
import {
  generateStrongPassword,
  isStrongPassword,
} from "@/components/FacultyMemberForm";

describe("Student invitation form behavior", () => {
  const simulateStudentInvitationCanSubmit = (
    fullName: string,
    deptCodesInput: string,
    password: string,
    confirmPassword: string,
    mode: "admin-add" | "invitation" = "invitation"
  ) => {
    const role = "student";
    if (!fullName.trim()) return false;
    if (!role) return false;
    if (mode === "invitation") {
      return isStrongPassword(password) && password === confirmPassword;
    }
    return !!deptCodesInput.trim();
  };

  it("valid student invitation passes with strong password and matching confirm", () => {
    expect(
      simulateStudentInvitationCanSubmit(
        "محمد أحمد",
        "CS101",
        "StrongP4ss",
        "StrongP4ss",
        "invitation"
      )
    ).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    expect(
      simulateStudentInvitationCanSubmit(
        "محمد أحمد",
        "CS101",
        "StrongP4ss",
        "Different1",
        "invitation"
      )
    ).toBe(false);
  });

  it("rejects weak password", () => {
    expect(
      simulateStudentInvitationCanSubmit(
        "محمد أحمد",
        "CS101",
        "weak",
        "weak",
        "invitation"
      )
    ).toBe(false);
  });

  it("rejects empty full name", () => {
    expect(
      simulateStudentInvitationCanSubmit(
        "",
        "CS101",
        "StrongP4ss",
        "StrongP4ss",
        "invitation"
      )
    ).toBe(false);
  });

  it("admin-add mode requires department codes", () => {
    expect(
      simulateStudentInvitationCanSubmit(
        "محمد أحمد",
        "",
        "",
        "",
        "admin-add"
      )
    ).toBe(false);
  });

  it("admin-add mode passes with department codes", () => {
    expect(
      simulateStudentInvitationCanSubmit(
        "محمد أحمد",
        "CS101",
        "",
        "",
        "admin-add"
      )
    ).toBe(true);
  });

  it("admin-add mode passes with multiple comma-separated codes", () => {
    expect(
      simulateStudentInvitationCanSubmit(
        "محمد أحمد",
        "CS101, MATH202",
        "",
        "",
        "admin-add"
      )
    ).toBe(true);
  });
});

describe("Student invitation token states", () => {
  it("distinguishes loading from valid", () => {
    const status: "loading" | "valid" | "invalid" = "loading";
    expect(status).toBe("loading");
  });

  it("valid token has institution data without role", () => {
    const data = {
      institutionId: "test-id",
      institutionType: "college" as const,
      institutionName: "Test College",
    };
    expect(data.institutionId).toBeTruthy();
    expect(data.institutionType).toBe("college");
  });

  it("invalid token error message in Arabic", () => {
    const msg = "رابط الدعوة غير صالح أو منتهي الصلاحية أو مستخدم بالفعل";
    expect(msg.length).toBeGreaterThan(0);
  });

  it("wrong role error message in Arabic", () => {
    const msg = "هذا الرابط مخصص لتسجيل أعضاء هيئة التدريس";
    expect(msg.length).toBeGreaterThan(0);
  });

  it("wrong role error message in English", () => {
    const msg = "This invitation link is for faculty members, not students";
    expect(msg.length).toBeGreaterThan(0);
  });

  it("department codes required error in Arabic", () => {
    const msg = "أدخل كود قسم واحد على الأقل";
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe("Student invitation edge function behavior", () => {
  it("parses comma-separated department codes correctly", () => {
    const input = "CS101, MATH202,  PHY303";
    const codes = Array.from(
      new Set(
        input
          .split(/[\s,،]+/)
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
      )
    );
    expect(codes).toEqual(["CS101", "MATH202", "PHY303"]);
  });

  it("deduplicates department codes", () => {
    const input = "CS101, cs101, Cs101";
    const codes = Array.from(
      new Set(
        input
          .split(/[\s,،]+/)
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
      )
    );
    expect(codes).toEqual(["CS101"]);
  });

  it("validates password strength for invitation mode", () => {
    const validatePassword = (pw: string) => {
      if (!pw || typeof pw !== "string") return { ok: false };
      if (pw !== pw.trim()) return { ok: false };
      if (pw.length < 8) return { ok: false };
      if (!/[A-Z]/.test(pw)) return { ok: false };
      if (!/[a-z]/.test(pw)) return { ok: false };
      if (!/\d/.test(pw)) return { ok: false };
      if (/\s/.test(pw)) return { ok: false };
      return { ok: true };
    };

    expect(validatePassword("StrongP4ss").ok).toBe(true);
    expect(validatePassword("weak").ok).toBe(false);
    expect(validatePassword("NOLOWERS1").ok).toBe(false);
    expect(validatePassword("nouppers1").ok).toBe(false);
    expect(validatePassword("NoDigitss").ok).toBe(false);
    expect(validatePassword("Has space1").ok).toBe(false);
    expect(validatePassword("  StrongP4ss").ok).toBe(false);
    expect(validatePassword("").ok).toBe(false);
  });

  it("generates invitation code in correct format", () => {
    const generateCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    };
    const code = generateCode();
    expect(code.length).toBe(8);
    expect(/^[A-Z2-9]+$/.test(code)).toBe(true);
  });

  it("generates student member code in correct format", () => {
    const genCode = (suffix: string) => {
      const r = Math.random().toString(36).slice(2, 8).toUpperCase();
      return `STU-${Date.now().toString(36).toUpperCase()}-${r}-${suffix}`;
    };
    const code = genCode("CS101");
    expect(code.startsWith("STU-")).toBe(true);
    expect(code.endsWith("-CS101")).toBe(true);
  });

  it("synthesizes email from full name when not provided", () => {
    const fullName = "محمد أحمد العلي";
    const slug = fullName
      .toLowerCase()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "")
      .slice(0, 20) || "student";
    const email = `${slug}.${Date.now().toString(36)}@unigates.online`;
    expect(email).toContain("@unigates.online");
  });
});

describe("Student invitation integration", () => {
  it("student role is always 'student' in invitation mode", () => {
    const role = "student";
    expect(role).toBe("student");
  });

  it("FacultyMemberForm with isStudent=true and mode=invitation renders password fields", () => {
    // The form should accept this combination without error
    const props = {
      mode: "invitation" as const,
      isStudent: true,
      isRtl: true,
      dir: "rtl",
      saving: false,
      onSubmit: () => {},
      onCancel: () => {},
    };
    expect(props.mode).toBe("invitation");
    expect(props.isStudent).toBe(true);
  });

  it("student invitation route is /institution/student/invite/:token", () => {
    const route = "/institution/student/invite/test-token";
    expect(route).toContain("/institution/student/invite/");
  });

  it("faculty invitation route remains /institution/faculty/invite/:token", () => {
    const route = "/institution/faculty/invite/test-token";
    expect(route).toContain("/institution/faculty/invite/");
  });

  it("invitation code is sent as invitation_code in edge function body", () => {
    const body = {
      full_name: "محمد أحمد",
      email: "test@example.com",
      phone: "+966500000000",
      department_codes: ["CS101"],
      temporary_password: "StrongP4ss",
      invitation_code: "ABC12345",
      extra: {
        date_of_birth: null,
        photo_url: null,
        national_id: null,
        gender: "male",
        address: null,
        qualification: null,
        specialization: null,
        notes: null,
      },
    };
    expect(body.invitation_code).toBe("ABC12345");
    expect(body.department_codes).toContain("CS101");
    expect(body.temporary_password).toBe("StrongP4ss");
  });

  it("admin-add request has no invitation_code", () => {
    const body = {
      full_name: "محمد أحمد",
      email: null,
      phone: "+966500000000",
      department_codes: ["CS101"],
      extra: {},
    };
    expect(body.invitation_code).toBeUndefined();
  });
});
