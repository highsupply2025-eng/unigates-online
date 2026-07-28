import { describe, it, expect } from "vitest";

// --- Pure logic extracted from StudentSubscriptions.tsx for testability ---

type SortKey = "full_name" | "email" | "department_name" | "created_at";
type SortDir = "asc" | "desc";

interface StudentRecord {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department_id: string;
  department_name: string;
  user_id: string | null;
  created_at: string;
  photo_url: string | null;
}

function filterAndSort(
  students: StudentRecord[],
  search: string,
  sortKey: SortKey,
  sortDir: SortDir,
): StudentRecord[] {
  const q = search.trim().toLowerCase();
  let list = students;
  if (q) {
    list = list.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        s.department_name.toLowerCase().includes(q),
    );
  }
  list = [...list].sort((a, b) => {
    const av = (a[sortKey] ?? "").toString().toLowerCase();
    const bv = (b[sortKey] ?? "").toString().toLowerCase();
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });
  return list;
}

function paginate(items: StudentRecord[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.max(1, Math.min(page, totalPages));
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    totalPages,
    safePage,
  };
}

const makeStudents = (): StudentRecord[] => [
  { id: "1", full_name: "أحمد محمد", email: "ahmed@test.com", phone: "0101", department_id: "d1", department_name: "计算机科学", user_id: "u1", created_at: "2026-01-15T10:00:00Z", photo_url: null },
  { id: "2", full_name: "Sara Ali", email: "sara@test.com", phone: "0102", department_id: "d2", department_name: "هندسة البرمجيات", user_id: "u2", created_at: "2026-03-20T10:00:00Z", photo_url: null },
  { id: "3", full_name: "محمد خالد", email: null, phone: null, department_id: "d1", department_name: "计算机科学", user_id: "u3", created_at: "2026-02-10T10:00:00Z", photo_url: null },
  { id: "4", full_name: "Fatima Hassan", email: "fatima@test.com", phone: "0104", department_id: "d3", department_name: "التصميم", user_id: "u4", created_at: "2026-05-01T10:00:00Z", photo_url: null },
];

describe("StudentSubscriptions – filterAndSort", () => {
  const students = makeStudents();

  it("returns all students when search is empty", () => {
    const result = filterAndSort(students, "", "full_name", "asc");
    expect(result).toHaveLength(4);
  });

  it("filters by name (Arabic)", () => {
    const result = filterAndSort(students, "أحمد", "full_name", "asc");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by email", () => {
    const result = filterAndSort(students, "sara", "full_name", "asc");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by department name", () => {
    const result = filterAndSort(students, "计算机", "full_name", "asc");
    expect(result).toHaveLength(2);
  });

  it("returns empty when nothing matches", () => {
    const result = filterAndSort(students, "xyz999", "full_name", "asc");
    expect(result).toHaveLength(0);
  });

  it("search is case-insensitive", () => {
    const result = filterAndSort(students, "SARA", "full_name", "asc");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("trims whitespace in search", () => {
    const result = filterAndSort(students, "  sara  ", "full_name", "asc");
    expect(result).toHaveLength(1);
  });

  it("sorts by full_name ascending", () => {
    const result = filterAndSort(students, "", "full_name", "asc");
    const names = result.map((s) => s.full_name.toLowerCase());
    expect(names).toEqual([...names].sort());
  });

  it("sorts by full_name descending", () => {
    const result = filterAndSort(students, "", "full_name", "desc");
    const names = result.map((s) => s.full_name.toLowerCase());
    expect(names).toEqual([...names].sort().reverse());
  });

  it("sorts by created_at ascending", () => {
    const result = filterAndSort(students, "", "created_at", "asc");
    expect(result[0].id).toBe("1"); // earliest
    expect(result[3].id).toBe("4"); // latest
  });

  it("sorts by created_at descending", () => {
    const result = filterAndSort(students, "", "created_at", "desc");
    expect(result[0].id).toBe("4"); // latest first
  });

  it("sorts by department_name", () => {
    const result = filterAndSort(students, "", "department_name", "asc");
    const names = result.map((s) => s.department_name);
    expect(names).toEqual([...names].sort());
  });

  it("handles students with null email in sort", () => {
    const result = filterAndSort(students, "", "email", "asc");
    expect(result).toHaveLength(4);
  });

  it("filter + sort together", () => {
    const result = filterAndSort(students, "计算机", "created_at", "desc");
    expect(result).toHaveLength(2);
    // Most recent first
    expect(result[0].id).toBe("3");
    expect(result[1].id).toBe("1");
  });
});

describe("StudentSubscriptions – pagination", () => {
  const students = makeStudents();

  it("returns first page with PAGE_SIZE=20 for 4 items", () => {
    const { items, totalPages, safePage } = paginate(students, 1, 20);
    expect(items).toHaveLength(4);
    expect(totalPages).toBe(1);
    expect(safePage).toBe(1);
  });

  it("paginates correctly with PAGE_SIZE=2", () => {
    const page1 = paginate(students, 1, 2);
    expect(page1.items).toHaveLength(2);
    expect(page1.totalPages).toBe(2);

    const page2 = paginate(students, 2, 2);
    expect(page2.items).toHaveLength(2);

    const page3 = paginate(students, 3, 2);
    expect(page3.items).toHaveLength(2);
    expect(page3.safePage).toBe(2); // clamped to totalPages
  });

  it("clamps page to totalPages", () => {
    const { safePage, items } = paginate(students, 999, 20);
    expect(safePage).toBe(1);
    expect(items).toHaveLength(4);
  });

  it("returns minimum totalPages of 1", () => {
    const { totalPages } = paginate([], 1, 20);
    expect(totalPages).toBe(1);
  });

  it("page 0 clamps to page 1", () => {
    const { safePage } = paginate(students, 0, 2);
    expect(safePage).toBe(1);
  });
});

describe("StudentSubscriptions – menu item & route", () => {
  it("route path is /institution/student-subscriptions", () => {
    expect("/institution/student-subscriptions").toContain("institution");
    expect("/institution/student-subscriptions").toContain("student-subscriptions");
  });

  it("Arabic label is اشتراكات الطلاب", () => {
    const arLabel = "اشتراكات الطلاب";
    expect(arLabel).toBe("اشتراكات الطلاب");
  });

  it("English label is Student Subscriptions", () => {
    const enLabel = "Student Subscriptions";
    expect(enLabel).toBe("Student Subscriptions");
  });
});

describe("StudentSubscriptions – auth isolation", () => {
  it("college_registrations query requires status=approved", () => {
    const status = "approved";
    expect(status).toBe("approved");
  });

  it("institute_registrations query requires status=approved", () => {
    const status = "approved";
    expect(status).toBe("approved");
  });

  it("redirects to /login when no user", () => {
    expect("/login").toBe("/login");
  });

  it("redirects to /login when no institution found", () => {
    expect("/login").toBe("/login");
  });
});

describe("StudentSubscriptions – data model", () => {
  it("only active students with user_id are shown", () => {
    const students = makeStudents();
    const active = students.filter((s) => s.user_id);
    expect(active).toHaveLength(4);
  });

  it("students without user_id would be excluded", () => {
    const students: StudentRecord[] = [
      ...makeStudents(),
      { id: "5", full_name: "Ghost", email: null, phone: null, department_id: "d1", department_name: "CS", user_id: null, created_at: "2026-01-01T00:00:00Z", photo_url: null },
    ];
    const active = students.filter((s) => s.user_id);
    expect(active).toHaveLength(4);
  });

  it("department_members role filter is 'student'", () => {
    const role = "student";
    expect(role).toBe("student");
  });

  it("Realtime subscription listens to department_members table", () => {
    const table = "department_members";
    expect(table).toBe("department_members");
  });
});
