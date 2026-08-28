import { describe, it, expect } from "vitest";
import fs from "fs";

const MIGRATION = fs.readFileSync(
  "supabase/migrations/20260828170000_quizzes_custom_approval_chain.sql",
  "utf-8",
);

const CREATE_QUIZ_SOURCE = fs.readFileSync(
  "src/components/quizzes/CreateQuizView.tsx",
  "utf-8",
);

const APPROVALS_SOURCE = fs.readFileSync(
  "src/components/quizzes/QuizApprovalsView.tsx",
  "utf-8",
);

const LEADERSHIP_DASHBOARD_SOURCE = fs.readFileSync(
  "src/pages/LeadershipDashboard.tsx",
  "utf-8",
);

describe("Quiz & Exam System - Sequential Approval Chain & Dashboard Customization", () => {
  it("migration adds approval_reviewers column and permissive policies for faculty and leadership", () => {
    expect(MIGRATION).toContain("approval_reviewers JSONB");
    expect(MIGRATION).toContain("CREATE POLICY \"Faculty and leadership can insert quizzes\"");
    expect(MIGRATION).toContain("CREATE POLICY \"Faculty and leadership can update quizzes\"");
    expect(MIGRATION).toContain("create_quiz_with_approval_chain");
  });

  it("CreateQuizView establishes sequential approval chain with Dean as fixed final authority", () => {
    expect(CREATE_QUIZ_SOURCE).toContain("selectedReviewerIds");
    expect(CREATE_QUIZ_SOURCE).toContain("deanTitle");
    expect(CREATE_QUIZ_SOURCE).toContain("is_final_dean: true");
    expect(CREATE_QUIZ_SOURCE).toContain("create_quiz_with_approval_chain");
  });

  it("QuizApprovalsView allows sequential approvals and Dean final publication to students", () => {
    expect(APPROVALS_SOURCE).toContain("canUserActOn");
    expect(APPROVALS_SOURCE).toContain("handleApproveQuiz");
    expect(APPROVALS_SOURCE).toContain("handleRejectQuiz");
    expect(APPROVALS_SOURCE).toContain("is_published = true");
  });

  it("LeadershipDashboard customizes labels: 'اعتماد الاختبارات' for Dean/Vice Deans and 'الاختبارات' with 2 hero subviews for Faculty & Dept Heads", () => {
    expect(LEADERSHIP_DASHBOARD_SOURCE).toContain("isDeanOrViceDean");
    expect(LEADERSHIP_DASHBOARD_SOURCE).toContain('ar: isDeanOrViceDean ? "اعتماد الاختبارات" : "الاختبارات"');
    expect(LEADERSHIP_DASHBOARD_SOURCE).toContain("<CreateQuizView");
    expect(LEADERSHIP_DASHBOARD_SOURCE).toContain("<QuizApprovalsView");
    expect(LEADERSHIP_DASHBOARD_SOURCE).toContain("إنشاء اختبار جديد");
  });
});
