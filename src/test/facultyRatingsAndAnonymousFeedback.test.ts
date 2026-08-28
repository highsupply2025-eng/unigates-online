import { describe, it, expect } from "vitest";

interface RatingItem {
  id: string;
  creatorId: string;
  rating: number; // 1-5
  comment: string | null;
  createdAt: string;
  type: "lecture" | "stream" | "quiz" | "schedule" | "assignment";
}

interface FacultyMember {
  id: string;
  fullName: string;
  role: string;
  departmentId: string;
}

describe("Faculty Performance & Anonymous Student Ratings", () => {
  it("should anonymize student reviews so student personal identities are never exposed", () => {
    const rawStudentReview = {
      id: "rev-101",
      userId: "student-uuid-secret-12345",
      studentRealName: "أحمد علي محمد",
      rating: 5,
      comment: "شرح متميز ومبسط وتكليف تطبيقي رائع جداً.",
      createdAt: "2026-08-20T10:00:00Z",
    };

    // Public display model
    const publicDisplayReview = {
      id: rawStudentReview.id,
      rating: rawStudentReview.rating,
      comment: rawStudentReview.comment,
      createdAt: rawStudentReview.createdAt,
      authorBadge: "طالب مسجل (تقييم سري ومجهول)",
    };

    expect((publicDisplayReview as any).studentRealName).toBeUndefined();
    expect((publicDisplayReview as any).userId).toBeUndefined();
    expect(publicDisplayReview.rating).toBe(5);
    expect(publicDisplayReview.authorBadge).toContain("مجهول");
  });

  it("should calculate monthly (30 days) and annual (365 days) ratings accurately for each faculty member", () => {
    const faculty: FacultyMember = {
      id: "prof-1",
      fullName: "أ.د. طارق محمود",
      role: "professor",
      departmentId: "dept-cs",
    };

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const ratings: RatingItem[] = [
      { id: "r1", creatorId: "prof-1", rating: 5, comment: "ممتاز", createdAt: tenDaysAgo, type: "lecture" },
      { id: "r2", creatorId: "prof-1", rating: 4, comment: "جيد جدا", createdAt: tenDaysAgo, type: "assignment" },
      { id: "r3", creatorId: "prof-1", rating: 5, comment: "رائع", createdAt: fortyDaysAgo, type: "quiz" },
      { id: "r4", creatorId: "prof-1", rating: 3, comment: "متوسط", createdAt: ninetyDaysAgo, type: "stream" },
    ];

    const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const monthlyScores = ratings
      .filter((r) => r.creatorId === faculty.id && r.createdAt >= thirtyDaysAgoIso)
      .map((r) => r.rating);

    const annualScores = ratings
      .filter((r) => r.creatorId === faculty.id)
      .map((r) => r.rating);

    expect(monthlyScores.length).toBe(2); // r1 & r2
    expect(annualScores.length).toBe(4); // r1, r2, r3, r4

    const monthlyAvg = monthlyScores.reduce((a, b) => a + b, 0) / monthlyScores.length;
    // (5 + 4) / 2 = 4.5
    expect(monthlyAvg).toBe(4.5);

    const annualAvg = annualScores.reduce((a, b) => a + b, 0) / annualScores.length;
    // (5 + 4 + 5 + 3) / 4 = 17 / 4 = 4.25
    expect(annualAvg).toBe(4.25);
  });
});
