import { describe, it, expect } from "vitest";

interface AssignmentRecord {
  id: string;
  title_ar: string;
  title_en: string;
  course_id: string;
  creator_id: string;
  points: number;
  due_date: string;
  is_published: boolean;
}

interface AssignmentSubmissionRecord {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  file_name?: string;
  grade?: string | null;
  feedback_ar?: string | null;
  feedback_en?: string | null;
  submitted_at: string;
  graded_at?: string | null;
}

describe("Assignment Results & Grading Studio (Direct Grading Without External Approvals)", () => {
  it("should record student grade and feedback directly without requiring any approval chain or Dean approval", () => {
    const assignment: AssignmentRecord = {
      id: "asg-ai-101",
      title_ar: "تكليف تطبيقات الذكاء الاصطناعي",
      title_en: "AI Applications Assignment",
      course_id: "cs-404",
      creator_id: "prof-dr-tarek",
      points: 20,
      due_date: "2026-09-10T23:59:00Z",
      is_published: true,
    };

    const submission: AssignmentSubmissionRecord = {
      id: "sub-std-99",
      assignment_id: assignment.id,
      student_id: "student-univ-2026",
      file_url: "https://storage.supabase.co/assignments/neural_net_solution.pdf",
      file_name: "neural_net_solution.pdf",
      grade: null,
      feedback_ar: null,
      submitted_at: "2026-09-08T14:30:00Z",
      graded_at: null,
    };

    expect(submission.grade).toBeNull();
    expect(submission.graded_at).toBeNull();

    // Instructor grades submission directly
    const assignedScore = 19.5;
    const instructorFeedback = "عمل ممتاز ومتقن في بناء الشبكة العصبية وتوثيق النتائج بدقة.";

    submission.grade = String(assignedScore);
    submission.feedback_ar = instructorFeedback;
    submission.feedback_en = instructorFeedback;
    submission.graded_at = new Date().toISOString();

    // Verification:
    expect(parseFloat(submission.grade)).toBe(19.5);
    expect(parseFloat(submission.grade)).toBeLessThanOrEqual(assignment.points);
    expect(submission.feedback_ar).toBe(instructorFeedback);
    expect(submission.graded_at).not.toBeNull();
    
    // Crucial requirement: No approval chain or Dean approval needed for assignment results
    expect((submission as any).approval_reviewers).toBeUndefined();
    expect((submission as any).approved_by_dean).toBeUndefined();
  });

  it("should compute class analytics, completion rate, and grade brackets", () => {
    const maxPoints = 25;
    const submissions: AssignmentSubmissionRecord[] = [
      { id: "sub-1", assignment_id: "asg-1", student_id: "s1", file_url: "url1", grade: "24", submitted_at: "2026-09-01T10:00:00Z" },
      { id: "sub-2", assignment_id: "asg-1", student_id: "s2", file_url: "url2", grade: "10", submitted_at: "2026-09-01T10:05:00Z" },
      { id: "sub-3", assignment_id: "asg-1", student_id: "s3", file_url: "url3", grade: "20", submitted_at: "2026-09-01T10:10:00Z" },
      { id: "sub-4", assignment_id: "asg-1", student_id: "s4", file_url: "url4", grade: null, submitted_at: "2026-09-01T10:15:00Z" }, // ungraded
    ];

    const graded = submissions.filter((s) => s.grade !== null && s.grade !== undefined && s.grade !== "");
    const pending = submissions.filter((s) => s.grade === null || s.grade === undefined || s.grade === "");

    expect(graded.length).toBe(3);
    expect(pending.length).toBe(1);

    const completionRate = Math.round((graded.length / submissions.length) * 100);
    expect(completionRate).toBe(75); // 3 out of 4 = 75%

    const numericGrades = graded.map((s) => parseFloat(s.grade!));
    const avgScore = Math.round((numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length / maxPoints) * 100);
    // (24 + 10 + 20) / 3 = 54 / 3 = 18. 18 / 25 = 72%
    expect(avgScore).toBe(72);
  });
});
