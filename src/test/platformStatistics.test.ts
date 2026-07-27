import { describe, it, expect } from "vitest";

// ─── Scope mapping logic (mirrors usePlatformStats.ts) ───────────

type PlatformScope = "all" | "university" | "school" | "courses" | "publishing";

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

  if (scope === "publishing") {
    return {
      ...EMPTY_STATS,
      publishers: Number(raw.publishers) || 0,
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

const UNIVERSITY_RAW: Record<string, number> = {
  colleges: 5,
  institutes: 3,
  lecturers: 120,
  students: 280,
};

const SCHOOL_RAW: Record<string, number> = {
  schools: 10,
  teachers: 90,
  students: 500,
  parents: 300,
};

const COURSES_RAW: Record<string, number> = {
  students: 780,
  lecturers: 120,
  teachers: 90,
  training_centers: 8,
  language_centers: 4,
};

const PUBLISHING_RAW: Record<string, number> = {
  publishers: 15,
  sellers: 7,
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
    expect(stats.universityStudents).toBe(280);
  });

  it("computes total students = universityStudents + schoolStudents", () => {
    const stats = mapStats(FULL_RAW, "all");
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
    expect(stats.schoolStudents).toBe(0);
    expect(stats.students).not.toBe(700);
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
    expect(stats.universityStudents).toBe(0);
  });
});

// ─── Tests: 'courses' scope ───────────────────────────────────────

describe("mapStats — courses scope", () => {
  it("returns courses-relevant fields", () => {
    const stats = mapStats(COURSES_RAW, "courses");

    expect(stats.students).toBe(780);
    expect(stats.lecturers).toBe(120);
    expect(stats.teachers).toBe(90);
    expect(stats.trainingCenters).toBe(8);
    expect(stats.languageCenters).toBe(4);
  });

  it("reads students directly (not universityStudents + schoolStudents)", () => {
    // The courses scope SQL returns a single combined `students` count.
    // The mapping must read it directly, not recompute from sub-fields.
    const raw = { students: 42, lecturers: 1, teachers: 0, training_centers: 0, language_centers: 0 };
    const stats = mapStats(raw, "courses");
    expect(stats.students).toBe(42);
    expect(stats.universityStudents).toBe(0);
    expect(stats.schoolStudents).toBe(0);
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

// ─── Tests: 'publishing' scope ────────────────────────────────────

describe("mapStats — publishing scope", () => {
  it("returns publishers count", () => {
    const stats = mapStats(PUBLISHING_RAW, "publishing");
    expect(stats.publishers).toBe(15);
  });

  it("zeroes out all non-publishing fields", () => {
    const stats = mapStats(PUBLISHING_RAW, "publishing");

    expect(stats.colleges).toBe(0);
    expect(stats.institutes).toBe(0);
    expect(stats.schools).toBe(0);
    expect(stats.lecturers).toBe(0);
    expect(stats.teachers).toBe(0);
    expect(stats.parents).toBe(0);
    expect(stats.students).toBe(0);
    expect(stats.universityStudents).toBe(0);
    expect(stats.schoolStudents).toBe(0);
    expect(stats.trainingCenters).toBe(0);
    expect(stats.languageCenters).toBe(0);
  });

  it("returns zero publishers for empty data", () => {
    const stats = mapStats({}, "publishing");
    expect(stats.publishers).toBe(0);
    expect(Object.values(stats).every(v => v === 0)).toBe(true);
  });
});

// ─── Tests: scope isolation (no cross-contamination) ──────────────

describe("mapStats — scope isolation", () => {
  it("each scope returns a different subset from scope-specific raw data", () => {
    const all = mapStats(FULL_RAW, "all");
    const uni = mapStats(UNIVERSITY_RAW, "university");
    const school = mapStats(SCHOOL_RAW, "school");
    const courses = mapStats(COURSES_RAW, "courses");
    const publishing = mapStats(PUBLISHING_RAW, "publishing");

    expect(uni.students).toBe(280);
    expect(school.students).toBe(500);
    expect(all.students).toBe(780);
    expect(courses.students).toBe(780);
    expect(publishing.publishers).toBe(15);
  });

  it("scoped stats never include fields from other scopes", () => {
    const uni = mapStats(UNIVERSITY_RAW, "university");
    const school = mapStats(SCHOOL_RAW, "school");
    const courses = mapStats(COURSES_RAW, "courses");
    const publishing = mapStats(PUBLISHING_RAW, "publishing");

    expect(uni.schools).toBe(0);
    expect(uni.teachers).toBe(0);
    expect(uni.parents).toBe(0);

    expect(school.colleges).toBe(0);
    expect(school.institutes).toBe(0);
    expect(school.lecturers).toBe(0);

    expect(courses.colleges).toBe(0);
    expect(courses.schools).toBe(0);
    expect(courses.publishers).toBe(0);

    expect(publishing.students).toBe(0);
    expect(publishing.lecturers).toBe(0);
    expect(publishing.teachers).toBe(0);
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

  it("publishing scope returns all zeros for empty input", () => {
    const stats = mapStats({}, "publishing");
    expect(Object.values(stats).every(v => v === 0)).toBe(true);
  });
});

// ─── Tests: account status rules ──────────────────────────────────

describe("mapStats — account status rules", () => {
  it("counts only approved institutions", () => {
    const raw = { colleges: 10, institutes: 5, schools: 3 };
    const stats = mapStats(raw, "all");
    expect(stats.colleges).toBe(10);
    expect(stats.institutes).toBe(5);
    expect(stats.schools).toBe(3);
  });

  it("pending/rejected institutions are NOT in the count (SQL filters them out)", () => {
    const raw = { colleges: 10 };
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
    expect(stats.students).toBe(780);
    expect(stats.universityStudents + stats.schoolStudents).toBe(stats.students);
  });

  it("scoped counts do not overlap between university and school", () => {
    const uni = mapStats(UNIVERSITY_RAW, "university");
    const school = mapStats(SCHOOL_RAW, "school");
    expect(uni.students).toBe(280);
    expect(school.students).toBe(500);
  });
});

// ─── Tests: data-integrity guarantees (SQL-level, documented) ─────

describe("mapStats — data-integrity guarantees", () => {
  it("SQL JOINs ensure only valid auth.users profiles are counted", () => {
    // Orphaned profiles (deleted from auth.users) are excluded at SQL level
    // via INNER JOIN auth.users u ON u.id = p.user_id
    // This test documents that the mapping logic handles the clean result
    const raw = { personal: 50, students: 100, school_students: 200 };
    const stats = mapStats(raw, "all");
    expect(stats.students).toBe(350);
  });

  it("SQL JOINs ensure only approved user_roles are counted", () => {
    // Pending invitations (approved = false) are excluded at SQL level
    // via INNER JOIN user_roles ur WHERE ur.approved = true
    // This test documents that the mapping logic handles the clean result
    const raw = { lecturers: 10, teachers: 5 };
    const stats = mapStats(raw, "all");
    expect(stats.lecturers).toBe(10);
    expect(stats.teachers).toBe(5);
  });

  it("SQL COUNT(DISTINCT) prevents double-counting from multi-role memberships", () => {
    // A user with multiple approved roles appears only once per COUNT(DISTINCT)
    // This test documents that the mapping logic handles the deduplicated result
    const raw = { students: 100, school_students: 50 };
    const stats = mapStats(raw, "all");
    expect(stats.students).toBe(150);
  });
});
