import { describe, it, expect } from "vitest";

// Pure helper matching the percentage formula used in both
// StudentPillActivityChart and InstitutionDashboard categoryStats.
// Formula: Math.min(Math.max(count, 0), 100)
function safePercentage(count: number): number {
  if (!Number.isFinite(count)) return 0;
  return Math.min(Math.max(Math.round(count), 0), 100);
}

// Mirrors the categoryStats computation from InstitutionDashboard.tsx.
function computeCategoryStats(opts: {
  since: number;
  facultyTimestamps: (string | null | undefined)[];
  deptTimestamps: (string | null | undefined)[];
  studentTimestamps: (string | null | undefined)[];
  scheduleTimestamps: (string | null | undefined)[];
  resultTimestamps: (string | null | undefined)[];
  hasInstitution: boolean;
}) {
  const inRange = (ts: string | null | undefined) => {
    if (!ts) return false;
    const t = Date.parse(ts);
    return !isNaN(t) && t >= opts.since;
  };

  const facultyCount = opts.facultyTimestamps.filter(inRange).length;
  const deptCount = opts.deptTimestamps.filter(inRange).length;
  const studentCount = opts.studentTimestamps.filter(inRange).length;
  const scheduleCount = opts.scheduleTimestamps.filter(inRange).length;
  const resultCount = opts.resultTimestamps.filter(inRange).length;
  const accountCount = opts.hasInstitution ? 1 : 0;

  const total = facultyCount + deptCount + studentCount + scheduleCount + resultCount + accountCount;

  return {
    faculty: { count: facultyCount, percentage: safePercentage(facultyCount) },
    departments: { count: deptCount, percentage: safePercentage(deptCount) },
    students: { count: studentCount, percentage: safePercentage(studentCount) },
    schedules: { count: scheduleCount, percentage: safePercentage(scheduleCount) },
    results: { count: resultCount, percentage: safePercentage(resultCount) },
    account: { count: accountCount, percentage: accountCount ? 100 : 0 },
    total,
  };
}

// Mirrors the pill chart percentage computation from StudentPillActivityChart.tsx.
function computePillChartPercentages(counts: number[], fixedPercentages?: (number | undefined)[]) {
  return counts.map((c, i) => {
    const fixed = fixedPercentages?.[i];
    if (fixed != null) {
      if (!Number.isFinite(fixed)) return 0;
      return Math.min(Math.max(fixed, 0), 100);
    }
    if (!Number.isFinite(c)) return 0;
    return Math.min(Math.max(Math.round(c), 0), 100);
  });
}

describe("safePercentage", () => {
  it("returns 0 when count is 0", () => {
    expect(safePercentage(0)).toBe(0);
  });

  it("returns count itself when count is between 1 and 100", () => {
    expect(safePercentage(1)).toBe(1);
    expect(safePercentage(50)).toBe(50);
    expect(safePercentage(99)).toBe(99);
  });

  it("caps at 100 when count is above 100", () => {
    expect(safePercentage(100)).toBe(100);
    expect(safePercentage(150)).toBe(100);
    expect(safePercentage(1000)).toBe(100);
  });

  it("clamps negative counts to 0", () => {
    expect(safePercentage(-1)).toBe(0);
    expect(safePercentage(-100)).toBe(0);
  });

  it("returns 0 when count is NaN", () => {
    expect(safePercentage(NaN)).toBe(0);
  });

  it("returns 0 when count is Infinity", () => {
    expect(safePercentage(Infinity)).toBe(0);
    expect(safePercentage(-Infinity)).toBe(0);
  });

  it("rounds to whole numbers", () => {
    expect(safePercentage(1.4)).toBe(1);
    expect(safePercentage(1.5)).toBe(2);
    expect(safePercentage(2.5)).toBe(3);
  });
});

describe("computeCategoryStats", () => {
  const now = Date.now();
  const recentISO = new Date(now - 1000).toISOString();
  const oldISO = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  it("returns all zeros when no timestamps exist and no institution", () => {
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: [],
      deptTimestamps: [],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: false,
    });

    expect(stats.total).toBe(0);
    expect(stats.faculty.count).toBe(0);
    expect(stats.departments.count).toBe(0);
    expect(stats.students.count).toBe(0);
    expect(stats.schedules.count).toBe(0);
    expect(stats.results.count).toBe(0);
    expect(stats.account.count).toBe(0);
    expect(stats.faculty.percentage).toBe(0);
    expect(stats.account.percentage).toBe(0);
  });

  it("returns all percentages as 0% when all counts are 0", () => {
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: [null, undefined],
      deptTimestamps: [null],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: false,
    });

    expect(stats.total).toBe(0);
    expect(stats.faculty.percentage).toBe(0);
    expect(stats.departments.percentage).toBe(0);
    expect(stats.students.percentage).toBe(0);
    expect(stats.schedules.percentage).toBe(0);
    expect(stats.results.percentage).toBe(0);
    expect(stats.account.percentage).toBe(0);
  });

  it("faculty=1 shows 1%, departments=1 shows 1%, account shows 100%", () => {
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: [recentISO],
      deptTimestamps: [recentISO],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: true,
    });

    expect(stats.faculty.count).toBe(1);
    expect(stats.faculty.percentage).toBe(1);
    expect(stats.departments.count).toBe(1);
    expect(stats.departments.percentage).toBe(1);
    expect(stats.account.count).toBe(1);
    expect(stats.account.percentage).toBe(100);
  });

  it("departments=1 and account data shows 1% and 100% respectively (not 50%/50%)", () => {
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: [],
      deptTimestamps: [recentISO],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: true,
    });

    expect(stats.departments.count).toBe(1);
    expect(stats.departments.percentage).toBe(1);
    expect(stats.account.count).toBe(1);
    expect(stats.account.percentage).toBe(100);
    expect(stats.faculty.percentage).toBe(0);
  });

  it("filters by time range correctly (7 vs 30 days)", () => {
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const twoWeeksAgoISO = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Two-week-old department: within 30 days but NOT within 7 days
    const stats7 = computeCategoryStats({
      since: sevenDaysAgo,
      facultyTimestamps: [],
      deptTimestamps: [twoWeeksAgoISO],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: true,
    });

    const stats30 = computeCategoryStats({
      since: thirtyDaysAgo,
      facultyTimestamps: [],
      deptTimestamps: [twoWeeksAgoISO],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: true,
    });

    expect(stats7.departments.count).toBe(0);
    expect(stats7.departments.percentage).toBe(0);
    expect(stats7.total).toBe(1); // only account

    expect(stats30.departments.count).toBe(1);
    expect(stats30.departments.percentage).toBe(1);
    expect(stats30.total).toBe(2); // dept + account
  });

  it("includes faculty members without a department (timestamp still counted)", () => {
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: [recentISO],
      deptTimestamps: [],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: true,
    });

    expect(stats.faculty.count).toBe(1);
    expect(stats.faculty.percentage).toBe(1);
    expect(stats.total).toBe(2); // faculty + account
  });

  it("handles NaN timestamps gracefully", () => {
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: ["not-a-date", "", null, undefined],
      deptTimestamps: ["invalid"],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: true,
    });

    expect(stats.faculty.count).toBe(0);
    expect(stats.departments.count).toBe(0);
    expect(stats.account.count).toBe(1);
    expect(stats.total).toBe(1);
    expect(stats.account.percentage).toBe(100);
  });

  it("count=0 → 0%", () => {
    expect(safePercentage(0)).toBe(0);
  });

  it("count=1 → 1% for every category", () => {
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: [recentISO],
      deptTimestamps: [recentISO],
      studentTimestamps: [recentISO],
      scheduleTimestamps: [recentISO],
      resultTimestamps: [recentISO],
      hasInstitution: true,
    });

    expect(stats.faculty.percentage).toBe(1);
    expect(stats.departments.percentage).toBe(1);
    expect(stats.students.percentage).toBe(1);
    expect(stats.schedules.percentage).toBe(1);
    expect(stats.results.percentage).toBe(1);
    expect(stats.account.percentage).toBe(100);
  });

  it("count=50 → 50%", () => {
    const timestamps = Array.from({ length: 50 }, () => recentISO);
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: timestamps,
      deptTimestamps: [],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: false,
    });

    expect(stats.faculty.count).toBe(50);
    expect(stats.faculty.percentage).toBe(50);
  });

  it("count=100 → 100%", () => {
    const timestamps = Array.from({ length: 100 }, () => recentISO);
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: timestamps,
      deptTimestamps: [],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: false,
    });

    expect(stats.faculty.count).toBe(100);
    expect(stats.faculty.percentage).toBe(100);
  });

  it("count=150 → capped at 100%", () => {
    const timestamps = Array.from({ length: 150 }, () => recentISO);
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: timestamps,
      deptTimestamps: [],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: false,
    });

    expect(stats.faculty.count).toBe(150);
    expect(stats.faculty.percentage).toBe(100);
  });

  it("account data always shows 100% when institution exists", () => {
    const stats = computeCategoryStats({
      since: now - 7 * 24 * 60 * 60 * 1000,
      facultyTimestamps: [],
      deptTimestamps: [],
      studentTimestamps: [],
      scheduleTimestamps: [],
      resultTimestamps: [],
      hasInstitution: true,
    });

    expect(stats.account.count).toBe(1);
    expect(stats.account.percentage).toBe(100);
  });
});

describe("computePillChartPercentages", () => {
  it("returns all zeros when all counts are zero", () => {
    expect(computePillChartPercentages([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("returns empty array for empty input", () => {
    expect(computePillChartPercentages([])).toEqual([]);
  });

  it("each count maps directly to its percentage, capped at 100", () => {
    const result = computePillChartPercentages([1, 1, 1, 1, 1, 1]);
    expect(result).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("uses fixedPercentage when provided", () => {
    const result = computePillChartPercentages([1, 1], [undefined, 100]);
    expect(result).toEqual([1, 100]);
  });

  it("handles departments = 1 and account = 1 with fixed percentage for account", () => {
    // faculty=0, departments=1, students=0, schedules=0, results=0, account=1 (fixed 100)
    const result = computePillChartPercentages([0, 1, 0, 0, 0, 1], [undefined, undefined, undefined, undefined, undefined, 100]);
    expect(result).toEqual([0, 1, 0, 0, 0, 100]);
  });

  it("caps large counts at 100", () => {
    const result = computePillChartPercentages([1000, 1, 0, 0, 0, 1]);
    expect(result[0]).toBe(100);
    expect(result[1]).toBe(1);
    expect(result[5]).toBe(1);
    result.forEach((r) => {
      expect(Number.isFinite(r)).toBe(true);
    });
  });

  it("never returns NaN or Infinity", () => {
    const result = computePillChartPercentages([NaN, Infinity, -5, 0, 101]);
    result.forEach((r) => {
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(100);
    });
  });
});
