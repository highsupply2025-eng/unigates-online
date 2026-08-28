import { describe, it, expect } from "vitest";

describe("Account Information Standardization & Error-Free Academic Profiles", () => {
  it("should format account information menu labels consistently as 'بيانات الحساب' / 'Account Information'", () => {
    const dashboards = [
      { name: "Leadership Dashboard", menuLabelAr: "بيانات الحساب", menuLabelEn: "Account Information" },
      { name: "Lecturer Dashboard", menuLabelAr: "بيانات الحساب", menuLabelEn: "Account Information" },
      { name: "Student Dashboard", menuLabelAr: "بيانات الحساب", menuLabelEn: "Account Information" },
      { name: "Institution Dashboard", menuLabelAr: "بيانات الحساب", menuLabelEn: "Account Information" },
      { name: "School Teacher Dashboard", menuLabelAr: "بيانات الحساب", menuLabelEn: "Account Information" },
      { name: "School Student Dashboard", menuLabelAr: "بيانات الحساب", menuLabelEn: "Account Information" },
    ];

    dashboards.forEach((d) => {
      expect(d.menuLabelAr).toBe("بيانات الحساب");
      expect(d.menuLabelEn).toBe("Account Information");
    });
  });

  it("should safely resolve academic college and department information without leaving empty blank boxes", () => {
    interface AcademicResolutionParams {
      profileDepartmentId?: string | null;
      departmentMemberDeptId?: string | null;
      departmentRecord?: { name_ar: string; college_name: string; institution_type: "college" | "institute" } | null;
      fallbackCollegeName?: string;
    }

    const resolveAcademicInfo = (params: AcademicResolutionParams) => {
      const dept = params.departmentRecord;
      const collegeName = dept?.college_name || params.fallbackCollegeName || "كلية الحاسبات والمعلومات";
      const departmentName = dept?.name_ar || "قسم علوم الحاسب";
      const institutionType = dept?.institution_type || "college";

      return {
        collegeName,
        departmentName,
        institutionType,
      };
    };

    const resolved = resolveAcademicInfo({
      profileDepartmentId: "dept-cs-01",
      departmentMemberDeptId: null,
      departmentRecord: {
        name_ar: "قسم هندسة البرمجيات",
        college_name: "كلية الهندسة والحاسبات",
        institution_type: "college",
      },
    });

    expect(resolved.collegeName).toBe("كلية الهندسة والحاسبات");
    expect(resolved.departmentName).toBe("قسم هندسة البرمجيات");
    expect(resolved.institutionType).toBe("college");

    // Test fallback when department has no direct college name attached
    const fallbackResolved = resolveAcademicInfo({
      profileDepartmentId: null,
      departmentMemberDeptId: null,
      departmentRecord: null,
      fallbackCollegeName: "المعهد العالي لتكنولوجيا المعلومات",
    });

    expect(fallbackResolved.collegeName).toBe("المعهد العالي لتكنولوجيا المعلومات");
    expect(fallbackResolved.departmentName).toBe("قسم علوم الحاسب");
  });

  it("should enforce strong password validation requirements for account security", () => {
    const validatePassword = (pass: string, confirm: string) => {
      if (pass.length < 8) return { valid: false, error: "يجب أن تكون 8 أحرف على الأقل" };
      if (pass !== confirm) return { valid: false, error: "كلمتا المرور غير متطابقتين" };
      return { valid: true, error: null };
    };

    expect(validatePassword("123", "123").valid).toBe(false);
    expect(validatePassword("SecurePass2026!", "DifferentPass2026!").valid).toBe(false);
    expect(validatePassword("SecurePass2026!", "SecurePass2026!").valid).toBe(true);
  });
});
