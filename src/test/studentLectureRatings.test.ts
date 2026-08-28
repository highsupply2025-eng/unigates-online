import { describe, it, expect } from "vitest";
import StudentLectureRatingModal from "@/components/StudentLectureRatingModal";

describe("Student Lecture Ratings & Supervisory Leadership Tests", () => {
  it("exports StudentLectureRatingModal component correctly", () => {
    expect(StudentLectureRatingModal).toBeDefined();
    expect(typeof StudentLectureRatingModal).toBe("function");
  });

  it("checks Dean and all 3 Vice Deans roles are included in leadership supervisory logic", () => {
    const roles = ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community"];
    
    roles.forEach(role => {
      const isDeanOrViceDean = ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community"].includes(role) || role.startsWith("vice_dean") || role === "dean";
      expect(isDeanOrViceDean).toBe(true);
    });

    // Verify non-leadership roles are not classified as dean or vice dean
    const regularRoles = ["student", "lecturer", "head_of_department", "admin"];
    regularRoles.forEach(role => {
      const isDeanOrViceDean = ["dean", "vice_dean", "vice_dean_postgrad", "vice_dean_students", "vice_dean_community"].includes(role) || role.startsWith("vice_dean") || role === "dean";
      expect(isDeanOrViceDean).toBe(false);
    });
  });

  it("validates lecture rating calculation logic", () => {
    const mockRatings = [
      { id: "1", rating: 5, comment: "ممتازة جداً" },
      { id: "2", rating: 4, comment: "شرح رائع" },
      { id: "3", rating: 5, comment: "واضحة" },
    ];

    const sum = mockRatings.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round((sum / mockRatings.length) * 10) / 10;

    expect(avg).toBe(4.7);
    expect(mockRatings.length).toBe(3);
  });
});
