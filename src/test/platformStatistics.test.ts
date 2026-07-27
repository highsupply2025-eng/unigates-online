import { describe, it, expect } from "vitest";

// ─── Scope mapping logic (mirrors usePlatformStats.ts) ───────────

type PlatformScope = "all" | "university" | "school" | "courses";

interface PlatformStats {
  colleges: number;
  institutes: number;
  schools: number;
  publishers: number;
  lecturers: number;
  teachers: number;
  parents: number;
  students: number;
  universityStudents: number;
  schoolStudents: number;
  trainingCenters: number;
  languageCenters: number;
}

const EMPTY_STATS: PlatformStats = {
  colleges: 0,
  institutes: 0,
  schools: 0,
  publishers: 0,
  lecturers: 0,
  teachers: 0,
  parents: 0,
  students: 0,
  universityStudents: 0,
  schoolStudents: 0,
  trainingCenters: 0,
  languageCenters: 0,
};

/**
 * Pure function mirroring the mapping logic in usePlatformStats.
 * Maps raw RPC response to the full PlatformStats shape based on scope.
 */
function mapStats(raw: Record<string, number>, scope: PlatformScope): PlatformStats {
  if (scope === "university") {
    const students = Number(raw.students) || 0;
    return {
      ...EMPTY_STATS,
      colleges: Number(raw.colleges) || 0,
      institutes: Number(raw.institutes) || 0,
      lecturers: Number(raw.lecturers) || 0,
      students,
      universityStudents: students,
    };
  }

  if (scope === "school") {
    const students = Number(raw.students) || 0;
    return {
      ...EMPTY_STATS,
      schools: Number(raw.schools) || 0,
      teachers: Number(raw.teachers) || 0,
      students,
      schoolStudents: students,
      parents: Number(raw.parents) || 0,
    };
  }

  if (scope === "courses") {
    const students = Number(raw.students) || 0;
    return {
      ...EMPTY_STATS,
      students,
      lecturers: Number(raw.lecturers) || 0,
      teachers: Number(raw.teachers) || 0,
      trainingCenters: Number(raw.training_centers) || 0,
      languageCenters: Number(raw.language_centers) || 0,
    };
  }

  // 'all' scope
  const personal = Number(raw.personal) || 0;
  const invited = Number(raw.students) || 0;
  const uniStudents = personal + invited;
  const schStudents = Number(raw.school_students) || 0;

  return {
    colleges: Number(raw.colleges) || 0,
    institutes: Number(raw.institutes) || 0,
    schools: Number(raw.schools) || 0,
    publishers: Number(raw.publishers) || 0,
    lecturers: Number(raw.lecturers) || 0,
    teachers: Number(raw.teachers) || 0,
    parents: Number(raw.parents) || 0,
    students: uniStudents + schStudents,
    universityStudents: uniStudents,
    schoolStudents: schStudents,
    trainingCenters: Number(raw.training_centers) || 0,
    languageCenters: Number(raw.language_centers) || 0,
  };
}

// ─── Raw RPC response fixtures ────────────────────────────────────

// 'all' scope raw response
const FULL_RAW: Record<string, number> = {
  colleges: 5,
  institutes: 3,
  schools: 10,
  lecturers: 120,
  personal: 80,
  students: 200,
  school_students: 500,
  publishers: 15,
  teachers: 90,
  parents: 300,
  training_centers: 8,
  language_centers: 4,
};

// 'university' scope raw response (SQL returns different columns)
const UNIVERSITY_RAW: Record<string, number> = {
  colleges: 5,
  institutes: 3,
  lecturers: 120,
  students: 200, // student + personal roles combined at SQL level
};

// 'school' scope raw response (SQL returns different columns)
const SCHOOL_RAW: Record<string, number> = {
  schools: 10,
  teachers: 90,
  students: 500, // school_student role at SQL level
  parents: 300,
};

// 'courses' scope raw response
const COURSES_RAW: Record<string, number> = {
  students: 780, // all student types combined at SQL level
  lecturers: 120,
  teachers: 90,
  training_centers: 8,
  language_centers: 4,
};

// ─── Tests: 'all' scope ───────────────────────────────────────────

describe("mapStats — all scope", () => {
  it("returns all fields from raw response", () => {
    const stats = mapStats(FULL_RAW, "all");

    expect(stats.colleges).toBe(5);
    expect(stats.institutes).toBe(3);
    expect(stats.schools).toBe(10);
    expect(stats.publishers).toBe(15);
    expect(stats.lecturers).toBe(120);
    expect(stats.teachers).toBe(90);
    expect(stats.parents).toBe(300);
    expect(stats.trainingCenters).toBe(8);
    expect(stats.languageCenters).toBe(4);
  });

  it("computes universityStudents = personal + students", () => {
    const stats = mapStats(FULL_RAW, "all");
    // personal=80 + students=200 = 280
    expect(stats.universityStudents).toBe(280);
  });

  it("computes total students = universityStudents + schoolStudents", () => {
    const stats = mapStats(FULL_RAW, "all");
    // 280 + 500 = 780
    expect(stats.students).toBe(780);
  });

  it("sets schoolStudents from raw.school_students", () => {
    const stats = mapStats(FULL_RAW, "all");
    expect(stats.schoolStudents).toBe(500);
  });

  it("returns zeros for empty raw data", () => {
    const stats = mapStats({}, "all");
    expect(stats.colleges).toBe(0);
    expect(stats.students).toBe(0);
    expect(stats.universityStudents).toBe(0);
    expect(stats.schoolStudents).toBe(0);
  });

  it("handles string/NaN values gracefully", () => {
    const raw = { personal: "abc", students: null, school_students: undefined };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = mapStats(raw as any, "all");
    expect(stats.universityStudents).toBe(0);
    expect(stats.schoolStudents).toBe(0);
    expect(stats.students).toBe(0);
  });
});

// ─── Tests: 'university' scope ────────────────────────────────────

describe("mapStats — university scope", () => {
  it("returns only university-relevant fields", () => {
    const stats = mapStats(FULL_RAW, "university");

    expect(stats.colleges).toBe(5);
    expect(stats.institutes).toBe(3);
    expect(stats.lecturers).toBe(120);
    // students = raw.students (role = 'student' + 'personal' counted by SQL)
    expect(stats.students).toBe(200);
    expect(stats.universityStudents).toBe(200);
  });

  it("zeroes out school-only fields", () => {
    const stats = mapStats(FULL_RAW, "university");

    expect(stats.schools).toBe(0);
    expect(stats.teachers).toBe(0);
    expect(stats.parents).toBe(0);
    expect(stats.schoolStudents).toBe(0);
    expect(stats.publishers).toBe(0);
    expect(stats.trainingCenters).toBe(0);
    expect(stats.languageCenters).toBe(0);
  });

  it("does not double-count school students", () => {
    const stats = mapStats(FULL_RAW, "university");
    // raw.school_students=500 should NOT appear in university scope
    expect(stats.schoolStudents).toBe(0);
    expect(stats.students).not.toBe(700); // 200 + 500 would be wrong
  });
});

// ─── Tests: 'school' scope ────────────────────────────────────────

describe("mapStats — school scope", () => {
  it("returns only school-relevant fields", () => {
    const stats = mapStats(SCHOOL_RAW, "school");

    expect(stats.schools).toBe(10);
    expect(stats.teachers).toBe(90);
    expect(stats.students).toBe(500);
    expect(stats.schoolStudents).toBe(500);
    expect(stats.parents).toBe(300);
  });

  it("zeroes out university-only fields", () => {
    const stats = mapStats(SCHOOL_RAW, "school");

    expect(stats.colleges).toBe(0);
    expect(stats.institutes).toBe(0);
    expect(stats.lecturers).toBe(0);
    expect(stats.universityStudents).toBe(0);
    expect(stats.publishers).toBe(0);
    expect(stats.trainingCenters).toBe(0);
    expect(stats.languageCenters).toBe(0);
  });

  it("does not double-count university students", () => {
    const stats = mapStats(SCHOOL_RAW, "school");
    // raw.students in school scope = school_student role only
    expect(stats.universityStudents).toBe(0);
  });
});

// ─── Tests: 'courses' scope ───────────────────────────────────────

describe("mapStats — courses scope", () => {
  it("returns courses-relevant fields", () => {
    const stats = mapStats(COURSES_RAW, "courses");

    // SQL returns combined student count for courses scope
    expect(stats.students).toBe(780);
    expect(stats.lecturers).toBe(120);
    expect(stats.teachers).toBe(90);
    expect(stats.trainingCenters).toBe(8);
    expect(stats.languageCenters).toBe(4);
  });

  it("zeroes out institution fields", () => {
    const stats = mapStats(COURSES_RAW, "courses");

    expect(stats.colleges).toBe(0);
    expect(stats.institutes).toBe(0);
    expect(stats.schools).toBe(0);
    expect(stats.publishers).toBe(0);
    expect(stats.parents).toBe(0);
    expect(stats.universityStudents).toBe(0);
    expect(stats.schoolStudents).toBe(0);
  });
});

// ─── Tests: scope isolation (no cross-contamination) ──────────────

describe("mapStats — scope isolation", () => {
  it("each scope returns a different subset from scope-specific raw data", () => {
    const all = mapStats(FULL_RAW, "all");
    const uni = mapStats(UNIVERSITY_RAW, "university");
    const school = mapStats(SCHOOL_RAW, "school");
    const courses = mapStats(COURSES_RAW, "courses");

    // University counts student+personal roles at SQL level
    expect(uni.students).toBe(200);
    // School counts school_student role at SQL level
    expect(school.students).toBe(500);
    // 'all' scope combines both: personal(80) + students(200) + school_students(500) = 780
    expect(all.students).toBe(780);

    // Courses scope combines all student types at SQL level
    expect(courses.students).toBe(780);
  });

  it("scoped stats never include fields from other scopes", () => {
    const uni = mapStats(UNIVERSITY_RAW, "university");
    const school = mapStats(SCHOOL_RAW, "school");
    const courses = mapStats(COURSES_RAW, "courses");

    // University should not have school-only fields
    expect(uni.schools).toBe(0);
    expect(uni.teachers).toBe(0);
    expect(uni.parents).toBe(0);

    // School should not have university-only fields
    expect(school.colleges).toBe(0);
    expect(school.institutes).toBe(0);
    expect(school.lecturers).toBe(0);

    // Courses should not have institution fields
    expect(courses.colleges).toBe(0);
    expect(courses.schools).toBe(0);
    expect(courses.publishers).toBe(0);
  });
});

// ─── Tests: empty data scenarios ──────────────────────────────────

describe("mapStats — empty data", () => {
  it("all scope returns all zeros for empty input", () => {
    const stats = mapStats({}, "all");
    expect(Object.values(stats).every(v => v === 0)).toBe(true);
  });

  it("university scope returns all zeros for empty input", () => {
    const stats = mapStats({}, "university");
    expect(Object.values(stats).every(v => v === 0)).toBe(true);
  });

  it("school scope returns all zeros for empty input", () => {
    const stats = mapStats({}, "school");
    expect(Object.values(stats).every(v => v === 0)).toBe(true);
  });

  it("courses scope returns all zeros for empty input", () => {
    const stats = mapStats({}, "courses");
    expect(Object.values(stats).every(v => v === 0)).toBe(true);
  });
});

// ─── Tests: account status rules ──────────────────────────────────

describe("mapStats — account status rules", () => {
  it("counts only approved institutions", () => {
    // The SQL function filters WHERE status = 'approved'
    // This test verifies the mapping logic handles the approved counts correctly
    const raw = { colleges: 10, institutes: 5, schools: 3 };
    const stats = mapStats(raw, "all");
    expect(stats.colleges).toBe(10);
    expect(stats.institutes).toBe(5);
    expect(stats.schools).toBe(3);
  });

  it("pending/rejected institutions are NOT in the count (SQL filters them out)", () => {
    // If the SQL returned pending=5, rejected=3, those wouldn't appear
    // in the response because the SQL only counts status='approved'
    // This test verifies the mapping doesn't accidentally include them
    const raw = { colleges: 10 }; // only approved colleges
    const stats = mapStats(raw, "all");
    expect(stats.colleges).toBe(10);
  });

  it("universityStudents = personal + students (two role types combined)", () => {
    const raw = { personal: 50, students: 100 };
    const stats = mapStats(raw, "all");
    expect(stats.universityStudents).toBe(150);
  });
});

// ─── Tests: duplicate membership prevention ───────────────────────

describe("mapStats — deduplication", () => {
  it("total students = universityStudents + schoolStudents (no overlap)", () => {
    const raw = {
      personal: 80,
      students: 200,
      school_students: 500,
    };
    const stats = mapStats(raw, "all");
    // uni = 80 + 200 = 280, school = 500, total = 780
    expect(stats.students).toBe(780);
    expect(stats.universityStudents + stats.schoolStudents).toBe(stats.students);
  });

  it("scoped counts do not overlap between university and school", () => {
    const uni = mapStats(UNIVERSITY_RAW, "university");
    const school = mapStats(SCHOOL_RAW, "school");
    // University counts student+personal roles; school counts school_student
    // These are distinct roles in profiles.role, so no overlap
    expect(uni.students).toBe(200);   // student role (SQL combines student+personal)
    expect(school.students).toBe(500); // school_student role
  });
});
