import { describe, it, expect } from "vitest";

// Pure helper matching the percentage formula used in both
// StudentPillActivityChart and InstitutionDashboard categoryStats.
function safePercentage(count: number, total: number): number {
  if (total === 0 || !Number.isFinite(total)) return 0;
  if (!Number.isFinite(count)) return 0;
  return Math.round((count / total) * 100);
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
  const pct = (count: number) => safePercentage(count, total);

  return {
    faculty: { count: facultyCount, percentage: pct(facultyCount) },
    departments: { count: deptCount, percentage: pct(deptCount) },
    students: { count: studentCount, percentage: pct(studentCount) },
    schedules: { count: scheduleCount, percentage: pct(scheduleCount) },
    results: { count: resultCount, percentage: pct(resultCount) },
    account: { count: accountCount, percentage: pct(accountCount) },
    total,
  };
}

// Mirrors the pill chart percentage computation from StudentPillActivityChart.tsx.
function computePillChartPercentages(counts: number[]) {
  const totalCount = counts.reduce((sum, c) => sum + c, 0);
  return counts.map((c) => (totalCount === 0 ? 0 : Math.round((c / totalCount) * 100)));
}

describe("safePercentage", () => {
  it("returns 0 when total is 0", () => {
    expect(safePercentage(0, 0)).toBe(0);
    expect(safePercentage(5, 0)).toBe(0);
  });

  it("returns 0 when total is NaN", () => {
    expect(safePercentage(1, NaN)).toBe(0);
  });

  it("returns 0 when count is NaN", () => {
    expect(safePercentage(NaN, 10)).toBe(0);
  });

  it("returns 0 when total is Infinity", () => {
    expect(safePercentage(1, Infinity)).toBe(0);
  });

  it("returns 0 when count is Infinity", () => {
    expect(safePercentage(Infinity, 10)).toBe(0);
  });

  it("calculates basic percentages correctly", () => {
    expect(safePercentage(1, 6)).toBe(17); // 1/6 = 16.67%
    expect(safePercentage(3, 6)).toBe(50);
    expect(safePercentage(6, 6)).toBe(100);
  });

  it("rounds to whole numbers", () => {
    expect(safePercentage(1, 3)).toBe(33);  // 33.33%
    expect(safePercentage(2, 3)).toBe(67);  // 66.67%
    expect(safePercentage(1, 7)).toBe(14);  // 14.29%
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

  it("returns all percentages as 0% when all counts are 0 (division by zero safe)", () => {
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

  it("departments = 1 and account data = 1 shows non-zero percentages", () => {
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
    expect(stats.account.count).toBe(1);
    expect(stats.total).toBe(2);
    expect(stats.departments.percentage).toBe(50);
    expect(stats.account.percentage).toBe(50);
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
    expect(stats7.total).toBe(1); // only account

    expect(stats30.departments.count).toBe(1);
    expect(stats30.total).toBe(2); // dept + account
    expect(stats30.departments.percentage).toBe(50);
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
    expect(stats.total).toBe(2); // faculty + account
    expect(stats.faculty.percentage).toBe(50);
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

  it("sum of all percentages equals 100% when total > 0", () => {
    const stats = computeCategoryStats({
      since: now - 30 * 24 * 60 * 60 * 1000,
      facultyTimestamps: [recentISO, recentISO],
      deptTimestamps: [recentISO],
      studentTimestamps: [recentISO, recentISO, recentISO],
      scheduleTimestamps: [recentISO],
      resultTimestamps: [recentISO],
      hasInstitution: true,
    });

    const sumPct =
      stats.faculty.percentage +
      stats.departments.percentage +
      stats.students.percentage +
      stats.schedules.percentage +
      stats.results.percentage +
      stats.account.percentage;

    // Sum of rounded percentages may not be exactly 100, but should be in [99, 101]
    expect(sumPct).toBeGreaterThanOrEqual(99);
    expect(sumPct).toBeLessThanOrEqual(101);
  });
});

describe("computePillChartPercentages", () => {
  it("returns all zeros when all counts are zero", () => {
    expect(computePillChartPercentages([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it("returns empty array for empty input", () => {
    expect(computePillChartPercentages([])).toEqual([]);
  });

  it("returns 100% for single non-zero item", () => {
    expect(computePillChartPercentages([5])).toEqual([100]);
    expect(computePillChartPercentages([1])).toEqual([100]);
  });

  it("distributes percentages proportionally", () => {
    const result = computePillChartPercentages([1, 1, 1, 1, 1, 1]);
    // 6 equal items: each is 1/6 = 16.67% → rounds to 17%
    expect(result).toEqual([17, 17, 17, 17, 17, 17]);
  });

  it("handles departments = 1 and account = 1 with other categories zero", () => {
    // faculty=0, departments=1, students=0, schedules=0, results=0, account=1
    const result = computePillChartPercentages([0, 1, 0, 0, 0, 1]);
    // total=2, each = 1/2 = 50%
    expect(result).toEqual([0, 50, 0, 0, 0, 50]);
  });

  it("handles large disparity without NaN or Infinity", () => {
    const result = computePillChartPercentages([1000, 1, 0, 0, 0, 1]);
    // total=1002
    expect(result[0]).toBe(100); // 1000/1002 = 99.8% → 100%
    expect(result[1]).toBe(0);   // 1/1002 = 0.0998% → 0%
    expect(result[5]).toBe(0);   // 1/1002 = 0.0998% → 0%
    // All should be finite numbers, no NaN/Infinity
    result.forEach((r) => {
      expect(Number.isFinite(r)).toBe(true);
    });
  });
});
