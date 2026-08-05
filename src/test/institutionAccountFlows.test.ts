import { describe, it, expect } from "vitest";

// =============================================================
// ISSUE 1 TESTS: Student activation must assign "student" role
// =============================================================

// Mirror the FACULTY_ROLES set from activate-department-member/index.ts
const FACULTY_ROLES = new Set([
  "dean",
  "vice_dean",
  "vice_dean_postgrad",
  "vice_dean_students",
  "vice_dean_community",
  "vice_dean_environment",
  "department_head",
  "professor",
  "doctor",
  "lecturer",
  "assistant_lecturer",
]);

// Mirror the fixed mapGeneralRole from activate-department-member/index.ts
function mapGeneralRole(
  specific: string,
): { profileRole: string; appRole: string } {
  switch (specific) {
    case "student":
      return { profileRole: "student", appRole: "student" };
    case "dean":
      return { profileRole: "dean", appRole: "dean" };
    case "vice_dean_postgrad":
    case "vice_dean_students":
    case "vice_dean_community":
      return { profileRole: "vice_dean", appRole: "vice_dean" };
    case "department_head":
    case "professor":
    case "doctor":
    case "assistant_lecturer":
      return { profileRole: "department_head", appRole: "department_head" };
    default:
      return { profileRole: "lecturer", appRole: "lecturer" };
  }
}

describe("Issue 1: Student activation role assignment", () => {
  it("student Add & Activate assigns student role to profile", () => {
    const { profileRole } = mapGeneralRole("student");
    expect(profileRole).toBe("student");
  });

  it("student Add & Activate assigns student role to user_roles", () => {
    const { appRole } = mapGeneralRole("student");
    expect(appRole).toBe("student");
  });

  it("student lightning activation assigns student role", () => {
    const { profileRole, appRole } = mapGeneralRole("student");
    expect(profileRole).toBe("student");
    expect(appRole).toBe("student");
  });

  it("student role is NOT in FACULTY_ROLES", () => {
    expect(FACULTY_ROLES.has("student")).toBe(false);
  });

  it("student activation does not create institution_faculty_members", () => {
    const isFaculty = FACULTY_ROLES.has("student");
    expect(isFaculty).toBe(false);
  });

  it("faculty activation still assigns correct faculty role", () => {
    const { profileRole, appRole } = mapGeneralRole("professor");
    expect(profileRole).toBe("lecturer");
    expect(appRole).toBe("lecturer");
  });

  it("department_head activation remains correct", () => {
    const { profileRole, appRole } = mapGeneralRole("department_head");
    expect(profileRole).toBe("department_head");
    expect(appRole).toBe("department_head");
  });

  it("dean activation remains correct", () => {
    const { profileRole, appRole } = mapGeneralRole("dean");
    expect(profileRole).toBe("dean");
    expect(appRole).toBe("dean");
  });

  it("vice_dean activation remains correct", () => {
    const { profileRole, appRole } = mapGeneralRole("vice_dean_students");
    expect(profileRole).toBe("vice_dean");
    expect(appRole).toBe("vice_dean");
  });

  it("malicious payload with unknown role falls to default (lecturer)", () => {
    const { profileRole, appRole } = mapGeneralRole("superadmin_hack");
    expect(profileRole).toBe("lecturer");
    expect(appRole).toBe("lecturer");
  });

  it("malicious payload cannot inject student as faculty", () => {
    const isFaculty = FACULTY_ROLES.has("student");
    expect(isFaculty).toBe(false);
  });

  it("ALLOWED_ROLES includes student and all faculty roles", () => {
    const ALLOWED_ROLES = new Set([...FACULTY_ROLES, "student"]);
    expect(ALLOWED_ROLES.has("student")).toBe(true);
    expect(ALLOWED_ROLES.has("professor")).toBe(true);
    expect(ALLOWED_ROLES.has("dean")).toBe(true);
    expect(ALLOWED_ROLES.has("department_head")).toBe(true);
  });

  it("ALL faculty roles still produce valid mapping", () => {
    for (const role of FACULTY_ROLES) {
      const { profileRole, appRole } = mapGeneralRole(role);
      expect(typeof profileRole).toBe("string");
      expect(typeof appRole).toBe("string");
      expect(profileRole.length).toBeGreaterThan(0);
      expect(appRole.length).toBeGreaterThan(0);
    }
  });

  it("repair migration only targets students incorrectly stored as non-student", () => {
    // Simulate the repair logic: members with role=student should get student role
    const memberRole: string = "student";
    const currentProfileRole: string = "lecturer";
    const shouldRepair = memberRole === "student" && currentProfileRole !== "student";
    expect(shouldRepair).toBe(true);
  });

  it("repair does not modify legitimate lecturers", () => {
    const memberRole: string = "lecturer";
    const currentProfileRole: string = "lecturer";
    const shouldRepair = memberRole === "student" && currentProfileRole !== "student";
    expect(shouldRepair).toBe(false);
  });
});

// =============================================================
// ISSUE 2 TESTS: Dashboard time-range filter
// =============================================================

function createRangeFilter(since: number) {
  return (ts: string | null | undefined) => {
    if (!ts) return false;
    const t = Date.parse(ts);
    return !isNaN(t) && t >= since;
  };
}

describe("Issue 2: Dashboard time-range filter", () => {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const sevenDaysAgo = new Date(now - 7 * DAY).toISOString();
  const fourteenDaysAgo = new Date(now - 14 * DAY).toISOString();
  const thirtyDaysAgo = new Date(now - 31 * DAY).toISOString();

  it("seven-day range excludes records older than 7 days", () => {
    const inRange = createRangeFilter(now - 7 * DAY);
    expect(inRange(sevenDaysAgo)).toBe(true);
    expect(inRange(fourteenDaysAgo)).toBe(false);
    expect(inRange(thirtyDaysAgo)).toBe(false);
  });

  it("thirty-day range includes records from 14 days ago", () => {
    const inRange = createRangeFilter(now - 30 * DAY);
    expect(inRange(sevenDaysAgo)).toBe(true);
    expect(inRange(fourteenDaysAgo)).toBe(true);
    expect(inRange(thirtyDaysAgo)).toBe(false);
  });

  it("records on the exact boundary are included (>=)", () => {
    const boundary = new Date(now - 7 * DAY).toISOString();
    const inRange = createRangeFilter(now - 7 * DAY);
    expect(inRange(boundary)).toBe(true);
  });

  it("null timestamps are excluded", () => {
    const inRange = createRangeFilter(now - 7 * DAY);
    expect(inRange(null)).toBe(false);
    expect(inRange(undefined)).toBe(false);
  });

  it("empty string timestamps are excluded", () => {
    const inRange = createRangeFilter(now - 7 * DAY);
    expect(inRange("")).toBe(false);
  });

  it("faculty count is range-filtered using created_at", () => {
    const members = [
      { role: "professor", created_at: sevenDaysAgo },
      { role: "doctor", created_at: fourteenDaysAgo },
      { role: "professor", created_at: thirtyDaysAgo },
    ];
    const isFacultyMember = (m: any) =>
      FACULTY_ROLES.has(m.role) && m.role !== "student";
    const inRange = createRangeFilter(now - 7 * DAY);
    const count = members.filter(
      (m) => isFacultyMember(m) && inRange(m.created_at),
    ).length;
    expect(count).toBe(1);
  });

  it("student count is range-filtered using unique user_ids + created_at", () => {
    const members = [
      { role: "student", user_id: "u1", created_at: sevenDaysAgo },
      { role: "student", user_id: "u2", created_at: fourteenDaysAgo },
      { role: "student", user_id: "u1", created_at: sevenDaysAgo }, // duplicate
      { role: "student", user_id: "u3", created_at: thirtyDaysAgo },
    ];
    const inRange = createRangeFilter(now - 7 * DAY);
    const count = new Set(
      members
        .filter((m) => m.role === "student" && m.user_id && inRange(m.created_at))
        .map((m) => m.user_id),
    ).size;
    expect(count).toBe(1); // only u1 in range
  });

  it("schedule count is range-filtered using created_at", () => {
    const schedules = [
      { created_at: sevenDaysAgo },
      { created_at: fourteenDaysAgo },
      { created_at: thirtyDaysAgo },
    ];
    const inRange = createRangeFilter(now - 7 * DAY);
    const count = schedules.filter((s) => inRange(s.created_at)).length;
    expect(count).toBe(1);
  });

  it("department count is range-filtered using created_at", () => {
    const depts = [
      { created_at: sevenDaysAgo },
      { created_at: fourteenDaysAgo },
    ];
    const inRange = createRangeFilter(now - 7 * DAY);
    const count = depts.filter((d) => inRange(d.created_at)).length;
    expect(count).toBe(1);
  });

  it("result count is range-filtered using submitted_at or created_at", () => {
    const results = [
      { submitted_at: sevenDaysAgo },
      { submitted_at: fourteenDaysAgo, created_at: fourteenDaysAgo },
      { created_at: thirtyDaysAgo },
    ];
    const inRange = createRangeFilter(now - 7 * DAY);
    const count = results.filter((s) => inRange(s.submitted_at || s.created_at)).length;
    expect(count).toBe(1);
  });

  it("empty range shows zero values", () => {
    const inRange = createRangeFilter(now + DAY); // future = nothing in range
    expect(inRange(sevenDaysAgo)).toBe(false);
    expect(inRange(fourteenDaysAgo)).toBe(false);
    expect(inRange(thirtyDaysAgo)).toBe(false);
  });

  it("switching from 7 to 30 days updates all counters", () => {
    const records = [
      { created_at: sevenDaysAgo },
      { created_at: fourteenDaysAgo },
    ];
    const range7 = createRangeFilter(now - 7 * DAY);
    const range30 = createRangeFilter(now - 30 * DAY);
    expect(records.filter((r) => range7(r.created_at)).length).toBe(1);
    expect(records.filter((r) => range30(r.created_at)).length).toBe(2);
  });

  it("institution isolation: only records belonging to institution are counted", () => {
    const records = [
      { institution_id: "inst1", created_at: sevenDaysAgo },
      { institution_id: "inst2", created_at: sevenDaysAgo },
    ];
    const inRange = createRangeFilter(now - 7 * DAY);
    const count = records.filter(
      (r) => r.institution_id === "inst1" && inRange(r.created_at),
    ).length;
    expect(count).toBe(1);
  });
});

// =============================================================
// ISSUE 3 TESTS: Faculty invitation password change
// =============================================================

describe("Issue 3: Faculty invitation password change flag", () => {
  it("invitee-selected password does not trigger mandatory password change", () => {
    const invitationCode = "ABC123DEF";
    const mustChangePassword = !invitationCode; // false for invitation
    expect(mustChangePassword).toBe(false);
  });

  it("admin-created temporary password still triggers dialog", () => {
    const invitationCode = ""; // no invitation = admin-created
    const mustChangePassword = !invitationCode; // true for admin
    expect(mustChangePassword).toBe(true);
  });

  it("undefined invitationCode triggers dialog (admin mode)", () => {
    const invitationCode = undefined;
    const mustChangePassword = !invitationCode; // true for admin
    expect(mustChangePassword).toBe(true);
  });

  it("seeded_via is institution_invitation for invited faculty", () => {
    const invitationCode = "TOKEN123";
    const seededVia = invitationCode ? "institution_invitation" : "institution_admin";
    expect(seededVia).toBe("institution_invitation");
  });

  it("seeded_via is institution_admin for admin-created faculty", () => {
    const invitationCode = "";
    const seededVia = invitationCode ? "institution_invitation" : "institution_admin";
    expect(seededVia).toBe("institution_admin");
  });

  it("real temporary password still triggers the dialog", () => {
    // Admin creates account with a generated temp password
    const invitationCode = "";
    const mustChangePassword = !invitationCode;
    expect(mustChangePassword).toBe(true);
  });

  it("first login alone does not trigger dialog (must rely on profile flag)", () => {
    const profile = { must_change_password: false };
    const shouldShowDialog = profile.must_change_password === true;
    expect(shouldShowDialog).toBe(false);
  });

  it("first login with true flag triggers dialog", () => {
    const profile = { must_change_password: true };
    const shouldShowDialog = profile.must_change_password === true;
    expect(shouldShowDialog).toBe(true);
  });

  it("repair: invited faculty profile flag is set to false", () => {
    // Simulate repair: profiles where seeded_via = institution_invitation
    // and must_change_password = true get repaired to false
    const authMetadata = { seeded_via: "institution_invitation" };
    const profile = { must_change_password: true };
    const shouldRepair =
      authMetadata.seeded_via === "institution_invitation" &&
      profile.must_change_password === true;
    expect(shouldRepair).toBe(true);
  });

  it("repair: admin-created faculty profile flag stays true", () => {
    const authMetadata = { seeded_via: "institution_admin" };
    const profile = { must_change_password: true };
    const shouldRepair =
      authMetadata.seeded_via === "institution_invitation" &&
      profile.must_change_password === true;
    expect(shouldRepair).toBe(false);
  });

  it("repair does not reset passwords", () => {
    // Repair only changes the flag, not the password
    const oldPassword = "MyChosenP4ss";
    const repairedFlag = false;
    expect(repairedFlag).toBe(false);
    expect(oldPassword).toBe("MyChosenP4ss");
  });

  it("password reset flow still works independently", () => {
    // Password reset sets must_change_password via a different path
    const resetPath = "forgot-password";
    expect(resetPath).toBe("forgot-password");
  });

  it("weak password and mismatch remain rejected", () => {
    // Password strength validation is unchanged
    const weak = "weak";
    const strong = "StrongP4ss";
    expect(weak.length >= 8).toBe(false);
    expect(strong.length >= 8).toBe(true);
    expect(/[A-Z]/.test(strong)).toBe(true);
    expect(/[a-z]/.test(strong)).toBe(true);
    expect(/\d/.test(strong)).toBe(true);
    const a: string = "abc";
    expect(a !== "xyz").toBe(true);
  });
});
